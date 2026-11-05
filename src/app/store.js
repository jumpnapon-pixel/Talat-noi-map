// Map storage: where the published visitor map, the editors' shared draft and uploaded
// photos live. The app talks only to this interface:
//
//   store.kind                      "artifact" | "local" | "static"
//   store.label                     short description shown in the editor
//   store.permissions()             -> { canEdit, canUploadPhotos }
//   store.watchPublished(onEdition, onError) -> unsubscribe
//   store.loadDraft(fallbackEdition) -> edition (+ exists)
//   store.saveDraft({ places, structures, baseRevision, force }) -> saved draft edition
//   store.publish({ revision })     -> { draft, published }
//   store.uploadPhoto(blob)         -> photo URL to keep in place.photoUrl
//
// An "edition" is { places, structures, revision, publishedRevision, updatedAt, publishedAt }.
// The draft and the published map are kept separately: visitors only ever read the
// published edition, and Publish copies the approved places of a saved draft into it.

const EDITION_FORMAT = "talat-noi-edition-v3";
const MAX_DOCUMENT_BYTES = 240 * 1024;
const LOCK_TTL_MS = 8000;

class StoreError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code;
    Object.assign(this, details);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nowIso = () => new Date().toISOString();
const tabHolder = `tab-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

function normaliseEdition(raw, fallback) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    places: Array.isArray(source.places) ? source.places : fallback?.places ?? [],
    structures: Array.isArray(source.structures) ? source.structures : fallback?.structures ?? [],
    revision: Number.isFinite(source.revision) ? source.revision : fallback?.revision ?? 0,
    publishedRevision: Number.isFinite(source.publishedRevision)
      ? source.publishedRevision
      : fallback?.publishedRevision ?? fallback?.revision ?? 0,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : fallback?.updatedAt ?? null,
    publishedAt: typeof source.publishedAt === "string" ? source.publishedAt : fallback?.publishedAt ?? null,
  };
}

function checkDocumentSize(body) {
  const bytes = new Blob([JSON.stringify(body)]).size;
  if (bytes > MAX_DOCUMENT_BYTES)
    throw new StoreError(
      "too_large",
      `The map is too large to save (${Math.round(bytes / 1024)} KB). Shorten some long stories, or remove places you no longer need.`,
    );
}

function describeDbError(error, action) {
  const code = error?.code;
  if (error instanceof StoreError) return error;
  if (code === "invalid_argument")
    return new StoreError("forbidden", `Your account can't ${action} this map. Ask the map owner for Editor access.`);
  if (code === "quota_exceeded")
    return new StoreError("quota", "The map's storage is full. Remove unused photos or places, then try again.");
  if (code === "resource_exhausted" || code === "rate_limited")
    return new StoreError("busy", "Too many saves in a short time. Wait a few seconds and try again.");
  if (code === "revoked" || code === "not_granted")
    return new StoreError("forbidden", "Editing access for this map has ended. Reload the page to continue.");
  return new StoreError("offline", `The map could not ${action}. Check your connection and try again.`);
}

// ---------------------------------------------------------------------------------------
// Artifact store: the claude.ai artifact's shared database and durable asset store.
// db rules (declared at publish): map/published is readable by every viewer, map/draft
// only by Editors and the Owner; both are written by Editors and the Owner only.
// ---------------------------------------------------------------------------------------
class ArtifactMapStore {
  constructor({ db, assets, user }) {
    this.kind = "artifact";
    this.label = "Shared draft, saved with this map";
    this.db = db;
    this.assets = assets;
    this.user = user;
    this.draftRef = db.doc("map/draft");
    this.publishedRef = db.doc("map/published");
    this.lockRef = db.doc("map/lock");
  }

  async permissions() {
    const canEdit = this.user ? await this.user.canEdit() : false;
    return { canEdit: !!canEdit, canUploadPhotos: !!canEdit && !!this.assets };
  }

  watchPublished(onEdition, onError) {
    let settled = false;
    const timer = setTimeout(() => {
      settled || onError?.(new StoreError("slow", "The latest map edition is taking a while to load."));
    }, 10000);
    const stop = this.publishedRef.onSnapshot(
      (snap) => {
        if (!snap.metadata.fromCache) ((settled = true), clearTimeout(timer));
        onEdition(snap.exists ? normaliseEdition(snap.data()) : null, { fromCache: snap.metadata.fromCache });
      },
      (error) => {
        ((settled = true), clearTimeout(timer), onError?.(describeDbError(error, "load")));
      },
    );
    return () => (clearTimeout(timer), stop());
  }

  async userId() {
    try {
      return (await this.user?.id?.()) ?? null;
    } catch {
      return null;
    }
  }

  async readDraft() {
    const snap = await this.draftRef.get();
    return snap.exists ? snap.data() : null;
  }

  async loadDraft(fallbackEdition) {
    try {
      const draft = await this.readDraft();
      return draft
        ? { ...normaliseEdition(draft, fallbackEdition), exists: true }
        : { ...normaliseEdition(fallbackEdition), exists: false };
    } catch (error) {
      throw describeDbError(error, "load the shared draft of");
    }
  }

  // A short cooperative lease so that two editors saving at the same moment cannot
  // overwrite each other between the revision check and the write.
  async withLock(task) {
    let acquired = false;
    for (let attempt = 0; attempt < 5 && !acquired; attempt++) {
      try {
        const result = await this.lockRef.acquire({ holder: tabHolder, ttlMs: LOCK_TTL_MS });
        acquired = !!result?.acquired;
      } catch (error) {
        if (["capability_removed", "capability_disabled", "transform_error"].includes(error?.code)) {
          acquired = true; // older runtime without leases: fall back to the revision check alone
          break;
        }
        throw error;
      }
      if (!acquired) await sleep(500 + attempt * 500);
    }
    if (!acquired)
      throw new StoreError("busy", "Another editor is saving right now. Try again in a few seconds.");
    return task();
  }

  async write(ref, body) {
    try {
      await ref.set(body);
    } catch (error) {
      if (error?.code === "unavailable") {
        await sleep(400 + Math.random() * 600);
        await ref.set(body);
        return;
      }
      throw error;
    }
  }

  async saveDraft({ places, structures, baseRevision, force = false, fallbackEdition }) {
    try {
      return await this.withLock(async () => {
        const current = await this.readDraft();
        const currentEdition = normaliseEdition(current, fallbackEdition);
        if (!force && currentEdition.revision !== baseRevision)
          throw new StoreError(
            "conflict",
            "Someone else saved a newer draft while you were editing. Your changes are still here.",
            { current: { ...currentEdition, exists: !!current } },
          );
        const body = {
          format: EDITION_FORMAT,
          places,
          structures,
          revision: Math.max(currentEdition.revision, baseRevision) + 1,
          publishedRevision: currentEdition.publishedRevision,
          updatedAt: nowIso(),
          updatedBy: await this.userId(),
          publishedAt: currentEdition.publishedAt,
        };
        checkDocumentSize(body);
        await this.write(this.draftRef, body);
        return { ...normaliseEdition(body), exists: true };
      });
    } catch (error) {
      throw describeDbError(error, "save");
    }
  }

  async publish({ revision, fallbackEdition }) {
    try {
      return await this.withLock(async () => {
        const current = await this.readDraft();
        if (!current) throw new StoreError("not_saved", "Save the draft before publishing.");
        const draft = normaliseEdition(current, fallbackEdition);
        if (draft.revision !== revision)
          throw new StoreError(
            "conflict",
            "The shared draft changed since you opened it. Reload the draft and check it before publishing.",
            { current: { ...draft, exists: true } },
          );
        const publishedAt = nowIso();
        const published = {
          format: EDITION_FORMAT,
          places: draft.places.filter((place) => place.approved),
          structures: draft.structures,
          revision: draft.revision,
          publishedRevision: draft.revision,
          publishedAt,
          publishedBy: await this.userId(),
          updatedAt: draft.updatedAt,
        };
        checkDocumentSize(published);
        await this.write(this.publishedRef, published);
        const nextDraft = { ...current, publishedRevision: draft.revision, publishedAt };
        await this.write(this.draftRef, nextDraft);
        return { draft: { ...normaliseEdition(nextDraft), exists: true }, published: normaliseEdition(published) };
      });
    } catch (error) {
      throw describeDbError(error, "publish");
    }
  }

  async uploadPhoto(blob) {
    if (!this.assets) throw new StoreError("forbidden", "Only map editors can upload photos.");
    try {
      const result = await this.assets.upload(blob, { type: blob.type || "image/jpeg" });
      return `/_blob/${result.id}`;
    } catch (error) {
      const code = error?.code;
      if (code === "too_large") throw new StoreError(code, "This photo is too large. Choose a smaller photo.");
      if (code === "quota_or_state")
        throw new StoreError(code, "The map's photo storage is full. Remove unused photos and try again.");
      if (code === "rate_limited") throw new StoreError(code, "Too many uploads at once. Wait a moment and try again.");
      if (code === "unsupported_type") throw new StoreError(code, "Choose a JPG, PNG or WebP photo.");
      throw new StoreError("offline", "The photo could not be uploaded. Check your connection and try again.");
    }
  }
}

// ---------------------------------------------------------------------------------------
// Local preview store: for running the map from a local web server (npm run serve).
// Everything stays in this browser: editions in localStorage, photos in IndexedDB.
// ---------------------------------------------------------------------------------------
const LOCAL_KEYS = { draft: "talat-noi-local:draft", published: "talat-noi-local:published" };
const LOCAL_PHOTO_PREFIX = "local-photo:";

function openPhotoDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("talat-noi-local-photos", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

class LocalMapStore {
  constructor() {
    this.kind = "local";
    this.label = "Local preview, saved in this browser only";
    this.photoUrls = new Map(); // local-photo:<id> -> blob: URL
    this.photoIds = new Map(); // blob: URL -> local-photo:<id>
    this.listeners = new Set();
  }

  async permissions() {
    return { canEdit: true, canUploadPhotos: typeof indexedDB !== "undefined" };
  }

  readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  }

  writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      throw new StoreError("quota", "This browser's storage is full. Export a backup, then clear old data.");
    }
  }

  async photoDb() {
    this.db ??= openPhotoDatabase();
    return this.db;
  }

  async resolvePhotos(places) {
    const resolved = [];
    for (const place of places) {
      if (!place.photoUrl?.startsWith(LOCAL_PHOTO_PREFIX)) {
        resolved.push(place);
        continue;
      }
      let url = this.photoUrls.get(place.photoUrl);
      if (!url) {
        const id = place.photoUrl.slice(LOCAL_PHOTO_PREFIX.length);
        const db = await this.photoDb();
        const blob = await new Promise((resolve) => {
          const request = db.transaction("photos").objectStore("photos").get(id);
          request.onsuccess = () => resolve(request.result ?? null);
          request.onerror = () => resolve(null);
        });
        if (blob) {
          url = URL.createObjectURL(blob);
          this.photoUrls.set(place.photoUrl, url);
          this.photoIds.set(url, place.photoUrl);
        }
      }
      resolved.push(url ? { ...place, photoUrl: url } : place);
    }
    return resolved;
  }

  storePhotos(places) {
    return places.map((place) =>
      this.photoIds.has(place.photoUrl) ? { ...place, photoUrl: this.photoIds.get(place.photoUrl) } : place,
    );
  }

  async edition(key, fallback) {
    const raw = this.readJson(key);
    if (!raw) return null;
    const edition = normaliseEdition(raw, fallback);
    return { ...edition, places: await this.resolvePhotos(edition.places) };
  }

  watchPublished(onEdition) {
    const emit = () => this.edition(LOCAL_KEYS.published).then((edition) => onEdition(edition, { fromCache: false }));
    const onStorage = (event) => event.key === LOCAL_KEYS.published && emit();
    window.addEventListener("storage", onStorage);
    this.listeners.add(emit);
    emit();
    return () => (window.removeEventListener("storage", onStorage), this.listeners.delete(emit));
  }

  async loadDraft(fallbackEdition) {
    const draft = await this.edition(LOCAL_KEYS.draft, fallbackEdition);
    return draft ? { ...draft, exists: true } : { ...normaliseEdition(fallbackEdition), exists: false };
  }

  async saveDraft({ places, structures, baseRevision, force = false, fallbackEdition }) {
    const current = normaliseEdition(this.readJson(LOCAL_KEYS.draft), fallbackEdition);
    if (!force && current.revision !== baseRevision)
      throw new StoreError(
        "conflict",
        "A newer draft was saved in another tab while you were editing. Your changes are still here.",
        { current: { ...current, places: await this.resolvePhotos(current.places), exists: true } },
      );
    const body = {
      format: EDITION_FORMAT,
      places: this.storePhotos(places),
      structures,
      revision: Math.max(current.revision, baseRevision) + 1,
      publishedRevision: current.publishedRevision,
      updatedAt: nowIso(),
      publishedAt: current.publishedAt,
    };
    checkDocumentSize(body);
    this.writeJson(LOCAL_KEYS.draft, body);
    return { ...normaliseEdition(body), places, exists: true };
  }

  async publish({ revision, fallbackEdition }) {
    const raw = this.readJson(LOCAL_KEYS.draft);
    if (!raw) throw new StoreError("not_saved", "Save the draft before publishing.");
    const draft = normaliseEdition(raw, fallbackEdition);
    if (draft.revision !== revision)
      throw new StoreError("conflict", "The draft changed in another tab. Reload it before publishing.", {
        current: { ...draft, places: await this.resolvePhotos(draft.places), exists: true },
      });
    const publishedAt = nowIso();
    const published = {
      format: EDITION_FORMAT,
      places: draft.places.filter((place) => place.approved),
      structures: draft.structures,
      revision: draft.revision,
      publishedRevision: draft.revision,
      publishedAt,
      updatedAt: draft.updatedAt,
    };
    this.writeJson(LOCAL_KEYS.published, published);
    const nextDraft = { ...raw, publishedRevision: draft.revision, publishedAt };
    this.writeJson(LOCAL_KEYS.draft, nextDraft);
    this.listeners.forEach((emit) => emit());
    return {
      draft: { ...normaliseEdition(nextDraft), places: await this.resolvePhotos(draft.places), exists: true },
      published: { ...normaliseEdition(published), places: await this.resolvePhotos(published.places) },
    };
  }

  async uploadPhoto(blob) {
    const id = crypto.randomUUID();
    const db = await this.photoDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("photos", "readwrite");
      tx.objectStore("photos").put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new StoreError("quota", "This browser could not keep the photo."));
    });
    const key = `${LOCAL_PHOTO_PREFIX}${id}`;
    const url = URL.createObjectURL(blob);
    this.photoUrls.set(key, url);
    this.photoIds.set(url, key);
    return url;
  }
}

// ---------------------------------------------------------------------------------------
// Static store: a copy of the map without storage (for example a plain web host).
// Visitors see the edition built into the page; there is no editor.
// ---------------------------------------------------------------------------------------
class StaticMapStore {
  constructor() {
    this.kind = "static";
    this.label = "Read-only copy";
  }
  async permissions() {
    return { canEdit: false, canUploadPhotos: false };
  }
  watchPublished(onEdition) {
    onEdition(null, { fromCache: false });
    return () => {};
  }
}

// Recovery copy of unsaved edits, kept on this device until they are saved or discarded.
const RECOVERY_KEY = (kind) => `talat-noi-editor-recovery:${kind}`;
const Recovery = {
  read(kind) {
    try {
      const value = JSON.parse(localStorage.getItem(RECOVERY_KEY(kind)) || "null");
      return value && Array.isArray(value.places) ? value : null;
    } catch {
      return null;
    }
  },
  write(kind, value) {
    try {
      localStorage.setItem(RECOVERY_KEY(kind), JSON.stringify({ ...value, savedAt: nowIso() }));
      return true;
    } catch {
      return false;
    }
  },
  clear(kind) {
    try {
      localStorage.removeItem(RECOVERY_KEY(kind));
    } catch {}
  },
};

const isLocalHost = () => ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

// Picks the store for this page view. Never blocks the first paint: the visitor map renders
// from the built-in edition while this resolves.
async function createMapStore() {
  const runtime = window.claude;
  if (runtime && typeof runtime.use === "function") {
    try {
      const [db, assets, user] = await Promise.all([
        runtime.use("db"),
        runtime.use("assets").catch(() => null),
        runtime.use("user").catch(() => null),
      ]);
      if (db) return new ArtifactMapStore({ db, assets, user });
    } catch {}
  }
  if (isLocalHost() && typeof localStorage !== "undefined") return new LocalMapStore();
  return new StaticMapStore();
}

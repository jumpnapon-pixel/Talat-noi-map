// End-to-end checks for the map editor, run in Chromium with Playwright.
//
//   npm run build && npm test            (tests index.html)
//   node tests/editor.e2e.mjs dev.html   (tests another build)
//
// The claude.ai artifact runtime (db, assets, user) is replaced by an in-browser fake that
// keeps data in localStorage, so saving, refreshing, publishing, permissions and conflicts
// run through the same code path as the published artifact.
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
const root = fileURLToPath(new URL("..", import.meta.url));
const page = process.argv.slice(2).find((arg) => !arg.startsWith("--")) ?? "index.html";
const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7).split(",") ?? ["visitor", "desktop", "mobile"];
const shots = join(root, "test-results");
mkdirSync(shots, { recursive: true });

// ---- static server -------------------------------------------------------------------------
const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png" };
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^[/\\]+/, "");
  const file = join(root, path || "index.html");
  try {
    if (!file.startsWith(root) || !statSync(file).isFile()) throw new Error();
    res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404).end("not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
// "localhost" would switch the app to its local-preview store; 127.0.0.1 is used with the fake runtime.
const base = `http://127.0.0.1:${server.address().port}/${page}`;

// ---- fake artifact runtime -------------------------------------------------------------------
function installFakeRuntime({ role }) {
  const key = (path) => `fake-db:${path}`;
  const read = (path) => JSON.parse(localStorage.getItem(key(path)) || "null");
  const write = (path, value) => localStorage.setItem(key(path), JSON.stringify(value));
  const listeners = new Map();
  const admin = role === "editor";
  const readable = (path) => path === "map/published" || admin;
  const error = (code) => Object.assign(new Error(code), { code });
  const snapshot = (path) => {
    const data = readable(path) ? read(path) : null;
    return { id: path.split("/").pop(), exists: !!data, data: () => (data ? structuredClone(data) : undefined), metadata: { fromCache: false, hasPendingWrites: false } };
  };
  const notify = (path) => (listeners.get(path) ?? []).forEach((listener) => listener());
  const checkWrite = () => {
    if (!admin) throw error("invalid_argument");
    const fail = localStorage.getItem("fake-fail");
    if (fail === "always") throw error("unavailable");
  };
  window.__fakeWrites = 0;
  const db = {
    doc(path) {
      return {
        id: path.split("/").pop(),
        path,
        get: async () => snapshot(path),
        set: async (data) => (checkWrite(), write(path, structuredClone(data)), window.__fakeWrites++, notify(path)),
        update: async (data) => (checkWrite(), write(path, { ...read(path), ...data }), notify(path)),
        delete: async () => (checkWrite(), localStorage.removeItem(key(path)), notify(path)),
        acquire: async ({ holder, ttlMs }) => {
          if (!admin) throw error("invalid_argument");
          const lock = read(`lock/${path}`);
          if (lock && lock.expires > Date.now() && lock.holder !== holder) return { acquired: false };
          write(`lock/${path}`, { holder, expires: Date.now() + ttlMs });
          return { acquired: true, version: 1 };
        },
        onSnapshot(next) {
          const listener = () => next(snapshot(path));
          listeners.set(path, [...(listeners.get(path) ?? []), listener]);
          setTimeout(listener, 20);
          return () => listeners.set(path, (listeners.get(path) ?? []).filter((item) => item !== listener));
        },
      };
    },
  };
  const assets = admin
    ? {
        async upload(blob) {
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
          let binary = "";
          for (const b of bytes) binary += String.fromCharCode(b);
          await window.__storeAsset(id, btoa(binary), blob.type);
          return { id, url: `/_blob/${id}`, sizeBytes: bytes.length, contentType: blob.type };
        },
      }
    : null;
  const user = {
    canEdit: async () => admin,
    isOwner: async () => admin,
    id: async () => `u_${role}`,
    can: async () => null,
  };
  window.claude = { use: async (name) => ({ db, assets, user })[name] ?? null };
}

// ---- helpers ---------------------------------------------------------------------------------
const results = [];
const check = (ok, label, detail = "") => {
  results.push({ ok: !!ok, label });
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
};
const assets = new Map();

async function openPage(browser, { role = "editor", device = null, fresh = false } = {}) {
  const context = await browser.newContext(device ? { ...devices[device] } : { viewport: { width: 1366, height: 860 } });
  await context.exposeBinding("__storeAsset", (_source, id, b64, type) => assets.set(id, { body: Buffer.from(b64, "base64"), type }));
  await context.route("**/_blob/*", (route) => {
    const asset = assets.get(route.request().url().split("/_blob/")[1]);
    return asset ? route.fulfill({ body: asset.body, contentType: asset.type }) : route.fulfill({ status: 404 });
  });
  await context.addInitScript(installFakeRuntime, { role });
  const tab = await context.newPage();
  const errors = [];
  tab.on("pageerror", (error) => errors.push(error.message));
  tab.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await tab.goto(base, { waitUntil: "networkidle" });
  if (fresh) {
    await tab.evaluate(() => localStorage.clear());
    await tab.reload({ waitUntil: "networkidle" });
  }
  await waitForMap(tab);
  return { context, tab, errors };
}

async function waitForMap(tab) {
  await tab.waitForSelector(".map-marker[data-place-id]", { timeout: 30000 });
  await tab.waitForTimeout(500);
}

const fakeDb = (tab, path) => tab.evaluate((p) => JSON.parse(localStorage.getItem(`fake-db:${p}`) || "null"), path);
const saveState = (tab) => tab.locator("[data-testid=save-status]").getAttribute("data-state");
const marker = (tab, id) => tab.locator(`.map-marker[data-place-id="${id}"]`);
const realLocation = (tab) => tab.locator("[data-testid=real-location]").innerText();
const illustrationPosition = (tab) => tab.locator("[data-testid=illustration-position]").innerText();
const closePanel = (tab) => tab.click("[data-testid=place-panel] [aria-label='Close place panel']");

async function enterEditor(tab) {
  await tab.click("[data-testid=edit-map]");
  await tab.waitForSelector("[data-testid=editor-toolbar]");
  await tab.waitForTimeout(600);
}

async function selectPin(tab, id, { touch = false } = {}) {
  const box = await marker(tab, id).boundingBox();
  touch ? await tab.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2) : await marker(tab, id).click();
  await tab.waitForSelector("[data-testid=place-panel]", { timeout: 5000 });
}

// A point on the illustration, as fractions of the visible part of the map.
async function illustrationPoint(tab, fx, fy) {
  const view = await tab.locator(".map-viewport").boundingBox();
  const art = await tab.locator(".map-canvas").boundingBox();
  const left = Math.max(view.x, art.x);
  const top = Math.max(view.y, art.y);
  const right = Math.min(view.x + view.width, art.x + art.width);
  const bottom = Math.min(view.y + view.height, art.y + art.height);
  return { x: left + (right - left) * fx, y: top + (bottom - top) * fy };
}

async function tapIllustration(tab, fx, fy, { touch = false } = {}) {
  const point = await illustrationPoint(tab, fx, fy);
  touch ? await tab.touchscreen.tap(point.x, point.y) : await tab.mouse.click(point.x, point.y);
  await tab.waitForTimeout(300);
}

async function waitSaved(tab) {
  await tab.waitForFunction(() => document.querySelector("[data-testid=save-status]")?.dataset.state !== "saving", null, { timeout: 15000 });
  return saveState(tab);
}

function tinyPng() {
  // 2x2 PNG
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP4z8DAwMDAxMDAwMDAAAAMAAH3tnYQAAAAAElFTkSuQmCC",
    "base64",
  );
}

// ---- scenarios --------------------------------------------------------------------------------
const browser = await chromium.launch();
try {
  // 1. Visitors: the illustrated map, no 3D view, no editing controls.
  if (only.includes("visitor")) {
    const { context, tab, errors } = await openPage(browser, { role: "viewer", fresh: true });
    check((await tab.locator(".map-marker[data-place-id]").count()) >= 10, "visitor map shows the place pins on the illustration");
    check((await tab.locator(".filter-bar .view-switch button[aria-pressed=true]").innerText()).trim() === "Illustrated", "the map opens on the Illustrated view");
    const views = (await tab.locator(".filter-bar .view-switch button").allInnerTexts()).map((text) => text.trim());
    check(!views.some((text) => /3D/.test(text)) && (await tab.locator("canvas").count()) === 0, "there is no 3D view", views.join(", "));
    check((await tab.locator("[data-testid=edit-map]").count()) === 0, "viewers do not get an Edit map button");
    const draftVisible = await tab.evaluate(async () => (await (await window.claude.use("db")).doc("map/draft").get()).exists);
    check(!draftVisible, "the draft is not readable by viewers");
    const denied = await tab.evaluate(async () => {
      try {
        await (await window.claude.use("db")).doc("map/published").set({ places: [] });
        return false;
      } catch (error) {
        return error.code === "invalid_argument";
      }
    });
    check(denied, "viewers cannot write the published map");
    await marker(tab, "so-heng-tai").click();
    await tab.waitForTimeout(500);
    check((await tab.locator(".map-marker.is-selected").count()) === 1, "visitors can open a place from its pin");
    check(errors.length === 0, "no page errors for visitors", errors.join(" | "));
    await tab.screenshot({ path: join(shots, "01-visitor.png") });
    await context.close();
  }

  // 2. Editor on desktop.
  if (only.includes("desktop")) {
  const { context, tab, errors } = await openPage(browser, { role: "editor", fresh: true });
  check(await tab.locator("[data-testid=edit-map]").isVisible(), "editors see a clearly labelled Edit map button");
  await enterEditor(tab);
  check(await tab.locator("[data-testid=editor-toolbar]").isVisible(), "editing toolbar is shown");
  for (const [id, label] of [["tool-add-pin", "Add pin"], ["tool-move-pin", "Move pin"], ["tool-undo", "Undo"], ["tool-redo", "Redo"], ["tool-save", "Save draft"], ["tool-preview", "Preview"], ["tool-publish", "Publish"]])
    check((await tab.locator(`[data-testid=${id}]`).innerText()).includes(label), `toolbar has ${label}`);
  await tab.click("[data-testid=more-tools]");
  check((await tab.getByText("3D structures").count()) === 0, "the 3D structures tool is gone");
  await tab.keyboard.press("Escape");
  check((await saveState(tab)) === "saved", "starts in the Saved state");
  await tab.screenshot({ path: join(shots, "02-editor.png") });

  // Select and highlight a pin.
  await selectPin(tab, "so-heng-tai");
  check(await marker(tab, "so-heng-tai").evaluate((el) => el.classList.contains("is-selected")), "clicking a pin selects and highlights it");
  check((await tab.locator("[data-testid=place-panel] h2").innerText()).includes("So Heng Tai"), "the editing panel opens for that place");
  const startLocation = await realLocation(tab);
  const startIllustration = await illustrationPosition(tab);

  // Move the pin: Move pin → tap the illustration.
  await tab.click("[data-testid=panel-move-pin]");
  await tab.waitForSelector("[data-testid=placement-banner]");
  check((await tab.locator("[data-testid=place-panel]").count()) === 0, "Move pin hides the panel and asks for a tap");
  await tab.screenshot({ path: join(shots, "03-move-pin.png") });
  await tapIllustration(tab, 0.3, 0.7);
  await tab.waitForSelector("[data-testid=place-panel]");
  const moved = await illustrationPosition(tab);
  check(moved !== startIllustration, "tapping the illustration moves the pin", `${startIllustration} -> ${moved}`);
  check((await realLocation(tab)) === startLocation, "moving the pin does not change the real location");
  check((await saveState(tab)) === "unsaved", "status shows Unsaved changes");

  // Cancel a move.
  await closePanel(tab);
  await selectPin(tab, "rong-kueak");
  const rongBefore = await illustrationPosition(tab);
  await tab.click("[data-testid=tool-move-pin]");
  await tab.waitForSelector("[data-testid=placement-banner]");
  await tab.click("[data-testid=placement-cancel]");
  await tab.waitForSelector("[data-testid=place-panel]");
  check((await illustrationPosition(tab)) === rongBefore, "Cancel keeps the original position", rongBefore);
  await tab.click("[data-testid=panel-move-pin]");
  await tab.keyboard.press("Escape");
  await tab.waitForSelector("[data-testid=place-panel]");
  check((await tab.locator("[data-testid=placement-banner]").count()) === 0, "Escape also cancels a move");

  // Move, then undo / redo.
  await tab.click("[data-testid=panel-move-pin]");
  await tapIllustration(tab, 0.62, 0.35);
  await tab.waitForSelector("[data-testid=place-panel]");
  const rongMoved = await illustrationPosition(tab);
  check(rongMoved !== rongBefore, "Move pin → tap moves the pin");
  await tab.click("[data-testid=tool-undo]");
  await tab.waitForTimeout(200);
  check((await illustrationPosition(tab)) === rongBefore, "Undo restores the previous position");
  await tab.click("[data-testid=tool-redo]");
  await tab.waitForTimeout(200);
  check((await illustrationPosition(tab)) === rongMoved, "Redo re-applies the move");

  // Real location from the navigation map.
  const rongLocation = await realLocation(tab);
  await tab.click("[data-testid=panel-set-location]");
  await tab.waitForSelector(".navigation-map-canvas svg", { timeout: 15000 });
  await tab.waitForTimeout(500);
  const nav = await tab.locator(".navigation-map-canvas").boundingBox();
  await tab.mouse.click(nav.x + nav.width * 0.5, nav.y + nav.height * 0.5);
  await tab.waitForSelector("[data-testid=place-panel]");
  await tab.waitForTimeout(300);
  const rongNewLocation = await realLocation(tab);
  check(rongNewLocation !== rongLocation && /^\d+\.\d+, \d+\.\d+$/.test(rongNewLocation), "the navigation map sets the real location", `${rongLocation} -> ${rongNewLocation}`);
  check((await illustrationPosition(tab)) === rongMoved, "setting the real location keeps the pin on the illustration");

  // Edit details (grouped into one undo step).
  const nameInput = tab.locator("[data-testid=place-panel] input[name=nameEn]");
  await nameInput.fill("Rong Kueak Shrine");
  await nameInput.fill("Rong Kueak Shrine (Shoe Shrine)");
  await tab.locator("[data-testid=place-panel] textarea[name=storyEn]").fill("Edited story for the test.");
  check((await tab.locator('.stop[data-place-id="rong-kueak"] strong').innerText()).includes("Shoe Shrine"), "editing the name updates the list");

  // Photo: upload, preview, caption/alt/credit.
  await tab.locator("[data-testid=photo-section] input[type=file]").setInputFiles({ name: "shrine.png", mimeType: "image/png", buffer: tinyPng() });
  await tab.waitForSelector("[data-testid=photo-section] img.place-photo[src*='/_blob/']", { timeout: 15000 });
  check(true, "uploaded photo appears immediately in the panel");
  await tab.locator("[data-testid=place-panel] input[name=photoCaption]").fill("Shrine gate at dusk");
  await tab.locator("[data-testid=place-panel] input[name=photoAlt]").fill("Red shrine gate with lanterns");
  await tab.locator("[data-testid=place-panel] input[name=photoCredit]").fill("Photo by Test");
  await tab.screenshot({ path: join(shots, "04-panel-photo.png") });

  // Save draft.
  await tab.click("[data-testid=tool-save]");
  check((await waitSaved(tab)) === "saved", "Save draft reaches the Saved state");
  let draft = await fakeDb(tab, "map/draft");
  const savedRong = draft.places.find((place) => place.id === "rong-kueak");
  check(draft.revision === 10, "draft revision increases from the published edition", String(draft.revision));
  check(savedRong.nameEn === "Rong Kueak Shrine (Shoe Shrine)" && savedRong.photoCaption === "Shrine gate at dusk" && /^\/_blob\//.test(savedRong.photoUrl), "draft keeps text, caption and the durable photo URL");
  check(draft.places.length === 15 && new Set(draft.places.map((place) => place.id)).size === 15, "existing place IDs are kept without duplicates");
  check((await fakeDb(tab, "map/published")) === null, "saving a draft does not change the visitor map");

  // Refresh: the pin and photo come back from the saved draft.
  await tab.reload({ waitUntil: "networkidle" });
  await waitForMap(tab);
  await enterEditor(tab);
  await selectPin(tab, "rong-kueak");
  check((await illustrationPosition(tab)) === rongMoved, "after refresh the pin is at its saved position", await illustrationPosition(tab));
  check((await realLocation(tab)) === rongNewLocation, "after refresh the real location is kept");
  check(await tab.locator("[data-testid=photo-section] img.place-photo[src*='/_blob/']").isVisible(), "after refresh the uploaded photo is shown");
  await closePanel(tab);

  // Add a pin.
  await tab.click("[data-testid=tool-add-pin]");
  await tab.waitForSelector("[data-testid=placement-banner]");
  check((await tab.locator("[data-testid=add-place-form]").count()) === 0, "Add pin waits for a tap on the illustration");
  await tapIllustration(tab, 0.45, 0.55);
  await tab.waitForSelector("[data-testid=add-place-form]");
  check(await tab.locator("[data-testid=new-pin-preview]").isVisible(), "a preview pin shows where the new place goes");
  await tab.click("[data-testid=add-place-submit]");
  check(await tab.locator("[data-testid=add-place-form] .ed-error").isVisible(), "the short form asks for a name");
  await tab.locator("[data-testid=add-place-form] input[name=nameEn]").fill("Test Noodle Shop");
  await tab.locator("[data-testid=add-place-form] label:has-text('Food & drink')").click();
  await tab.screenshot({ path: join(shots, "05-add-form.png") });
  await tab.click("[data-testid=add-place-submit]");
  check((await waitSaved(tab)) === "saved", "Add place saves the draft (also right after a reload)");
  draft = await fakeDb(tab, "map/draft");
  const added = draft.places.find((place) => place.id === "test-noodle-shop");
  check(
    !!added && added.category === "Food & drink" && Number.isFinite(added.x) && added.illustrationEstimated === false && added.lat === null,
    "new place is stored at the tapped spot with a readable ID, real location still to set",
    added && `${added.x}, ${added.y}`,
  );
  check(await tab.locator('.stop[data-place-id="test-noodle-shop"]').isVisible(), "new place appears in the searchable list");
  check(await marker(tab, "test-noodle-shop").isVisible(), "new place has a pin on the illustration");
  check((await tab.locator("[data-testid=place-panel] .ed-note", { hasText: "navigation map and directions" }).count()) === 1, "the panel says the real location is not set yet");

  // Search the list and select a pin from it.
  await tab.locator("[data-testid=list-search]").fill("holy");
  check((await tab.locator(".stop-list .stop").count()) === 1, "the place list can be searched");
  await tab.locator('.stop[data-place-id="holy-rosary"]').click();
  await tab.waitForTimeout(300);
  check(await marker(tab, "holy-rosary").evaluate((el) => el.classList.contains("is-selected")), "choosing a list entry highlights its pin");
  await tab.locator("[data-testid=list-search]").fill("");

  // Delete with confirmation, undo.
  await tab.locator('.stop[data-place-id="test-noodle-shop"]').click();
  await tab.click("[data-testid=delete-place]");
  check(await tab.locator("[data-testid=delete-dialog]").isVisible(), "deleting asks for confirmation");
  await tab.click("[data-testid=delete-confirm]");
  await tab.waitForTimeout(200);
  check((await tab.locator('.stop[data-place-id="test-noodle-shop"]').count()) === 0, "confirmed delete removes the place");
  await tab.click("[data-testid=tool-undo]");
  await tab.waitForTimeout(200);
  check((await tab.locator('.stop[data-place-id="test-noodle-shop"]').count()) === 1, "Undo brings a deleted place back");

  // Pins on the same spot are spread apart; clicking the selected pin does not start a move.
  const holyBox = await marker(tab, "holy-rosary").boundingBox();
  await tab.locator('.stop[data-place-id="old-bank"]').click();
  await tab.click("[data-testid=panel-move-pin]");
  await tab.mouse.click(holyBox.x + holyBox.width / 2, holyBox.y + holyBox.height / 2);
  await tab.waitForSelector("[data-testid=place-panel]");
  await tab.waitForTimeout(300);
  const spread = await tab.evaluate(() => ["old-bank", "holy-rosary"].some((id) => document.querySelector(`.map-marker[data-place-id="${id}"]`).classList.contains("moved")));
  check(spread, "pins on the same spot are spread apart with a leader line");
  await tab.screenshot({ path: join(shots, "06-overlap.png") });
  await closePanel(tab);
  await marker(tab, "old-bank").click();
  await tab.waitForSelector("[data-testid=place-panel]");
  await marker(tab, "old-bank").click({ force: true });
  await tab.waitForTimeout(300);
  check((await tab.locator("[data-testid=placement-banner]").count()) === 0, "clicking the selected pin does not start a move");
  await closePanel(tab);
  await tab.click("[data-testid=tool-undo]"); // undo the overlap move
  await tab.waitForTimeout(200);

  // Save failure keeps edits and offers Retry.
  await tab.locator('.stop[data-place-id="holy-rosary"]').click();
  await tab.locator("[data-testid=place-panel] input[name=hours]").fill("Daily 06:00–18:00");
  await tab.evaluate(() => localStorage.setItem("fake-fail", "always"));
  await tab.click("[data-testid=tool-save]");
  check((await waitSaved(tab)) === "failed", "a failed save shows Save failed");
  check(await tab.locator("[data-testid=retry-save]").isVisible(), "a Retry button is offered");
  check((await tab.locator("[data-testid=place-panel] input[name=hours]").inputValue()) === "Daily 06:00–18:00", "unsaved edits are kept after a failed save");
  await tab.screenshot({ path: join(shots, "07-save-failed.png") });
  await tab.evaluate(() => localStorage.removeItem("fake-fail"));
  await tab.click("[data-testid=retry-save]");
  check((await waitSaved(tab)) === "saved", "Retry saves the draft");

  // Conflicting update from another editor is not overwritten.
  await tab.evaluate(() => {
    const draft = JSON.parse(localStorage.getItem("fake-db:map/draft"));
    draft.revision += 1;
    draft.updatedAt = new Date().toISOString();
    draft.places[0].nameEn = "Changed by another editor";
    localStorage.setItem("fake-db:map/draft", JSON.stringify(draft));
  });
  await tab.locator("[data-testid=place-panel] input[name=price]").fill("Free");
  await tab.click("[data-testid=tool-save]");
  await tab.waitForSelector("[data-testid=conflict-dialog]", { timeout: 10000 });
  draft = await fakeDb(tab, "map/draft");
  check(draft.places[0].nameEn === "Changed by another editor", "a conflicting save does not overwrite the other editor's draft");
  await tab.screenshot({ path: join(shots, "08-conflict.png") });
  await tab.getByRole("button", { name: "Replace theirs with mine" }).click();
  check((await waitSaved(tab)) === "saved", "after confirming, your version can replace theirs");

  // Preview, then publish.
  await tab.click("[data-testid=tool-preview]");
  await tab.waitForSelector("[data-testid=preview-banner]");
  check((await tab.locator("[data-testid=editor-toolbar]").count()) === 0, "Preview shows the visitor experience without editing tools");
  await tab.screenshot({ path: join(shots, "09-preview.png") });
  await tab.click("[data-testid=preview-back]");
  await tab.waitForSelector("[data-testid=editor-toolbar]");
  await tab.click("[data-testid=tool-publish]");
  await tab.waitForSelector("[data-testid=publish-dialog]");
  check((await tab.locator("[data-testid=publish-dialog] .publish-summary").innerText()).match(/moved|edited|new/), "publishing shows what will change");
  await tab.screenshot({ path: join(shots, "10-publish.png") });
  await tab.click("[data-testid=publish-confirm]");
  await tab.waitForSelector("[data-testid=publish-dialog]", { state: "detached", timeout: 15000 });
  const published = await fakeDb(tab, "map/published");
  draft = await fakeDb(tab, "map/draft");
  check(published && published.revision === draft.revision && draft.publishedRevision === draft.revision, "Publish copies the saved draft to the visitor map");
  check(published.places.every((place) => place.approved), "only places marked for visitors are published");
  await tab.click("[data-testid=tool-exit]");
  await tab.waitForTimeout(500);
  check((await tab.locator("[data-testid=edit-map]").count()) === 1, "Exit editing returns to the visitor map");
  check((await tab.locator('.stop[data-place-id="test-noodle-shop"]').count()) === 1, "visitors see the newly published place");

  // Unsaved edits survive a refresh (recovery copy).
  await enterEditor(tab);
  await tab.locator('.stop[data-place-id="holy-rosary"]').click();
  await tab.locator("[data-testid=place-panel] input[name=hours]").fill("Recovered hours");
  await tab.waitForTimeout(700);
  await tab.reload({ waitUntil: "networkidle" });
  await waitForMap(tab);
  await enterEditor(tab);
  check(await tab.locator("[data-testid=recovery-banner]").isVisible(), "unsaved edits are offered back after a refresh");
  await tab.click("[data-testid=recovery-restore]");
  await tab.locator('.stop[data-place-id="holy-rosary"]').click();
  check((await tab.locator("[data-testid=place-panel] input[name=hours]").inputValue()) === "Recovered hours", "restored edits are back in the panel");
  check(errors.length === 0, "no page errors in the editor", errors.join(" | "));
  await context.close();
  }

  // 3. Mobile editor (touch).
  if (only.includes("mobile")) {
    const { context, tab, errors } = await openPage(browser, { role: "editor", device: "iPhone 13", fresh: true });
    await tab.locator("[data-testid=edit-map]").tap();
    await tab.waitForSelector("[data-testid=editor-toolbar]");
    await tab.waitForTimeout(600);
    const toolbarHeight = (await tab.locator("[data-testid=editor-toolbar]").boundingBox()).height;
    check(toolbarHeight <= 110, "the editing toolbar stays compact on a phone", `${Math.round(toolbarHeight)} px`);
    await tab.screenshot({ path: join(shots, "11-mobile-editor.png") });
    await selectPin(tab, "so-heng-tai", { touch: true });
    check(true, "tapping a pin on a phone opens the panel");
    const before = await illustrationPosition(tab);
    await tab.screenshot({ path: join(shots, "12-mobile-panel.png") });
    await tab.locator("[data-testid=panel-move-pin]").tap();
    await tab.waitForSelector("[data-testid=placement-banner]");
    await tab.screenshot({ path: join(shots, "13-mobile-move.png") });
    await tapIllustration(tab, 0.5, 0.75, { touch: true });
    await tab.waitForSelector("[data-testid=place-panel]");
    check((await illustrationPosition(tab)) !== before, "moving a pin by tapping works on a phone");
    await tab.locator("[data-testid=panel-save]").tap();
    check((await waitSaved(tab)) === "saved", "saving works on a phone");
    check(errors.length === 0, "no page errors on mobile", errors.join(" | "));
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots: test-results/`);
process.exit(failed.length ? 1 : 0);

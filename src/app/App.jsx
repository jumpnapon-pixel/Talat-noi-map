// The Talat Noi map application: the visitor map and, for people who may edit it, the
// map editor. Replaces the recovered bundle's minified app shell (formerly `yE`) and reuses
// its map views and place components (see src/app/internals.js).

const t2 = (lang) => (en, th) => (lang === "en" ? en : th);

function editionFromSeed() {
  return {
    places: SEED_EDITION.places,
    structures: SEED_EDITION.structures.map(normaliseStructure),
    revision: SEED_EDITION.revision,
    publishedRevision: SEED_EDITION.publishedRevision,
    publishedAt: SEED_EDITION.publishedAt ?? null,
    updatedAt: SEED_EDITION.updatedAt ?? null,
  };
}

function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// New places get a readable id from their English name; existing ids are never changed.
function uniquePlaceId(name, places) {
  const root = slugify(name) || `place-${crypto.randomUUID().slice(0, 8)}`;
  const ids = new Set(places.map((place) => place.id));
  let id = root;
  for (let n = 2; ids.has(id); n++) id = `${root}-${n}`;
  return id;
}

const updatePlaceIn = (doc, id, patch) => ({
  ...doc,
  places: doc.places.map((place) => (place.id === id ? { ...place, ...patch } : place)),
});

function collectIssues(places) {
  const result = PlacesSchema.safeParse(places);
  if (result.success) return { ok: true, data: result.data, byPlace: {}, first: null };
  const byPlace = {};
  let first = null;
  for (const issue of result.error.issues) {
    const [index, field] = issue.path;
    const place = typeof index === "number" ? places[index] : null;
    if (!place) {
      first ??= { placeId: null, message: issue.message };
      continue;
    }
    const entry = (byPlace[place.id] ??= {});
    entry[field ?? "general"] ??= issue.message;
    first ??= { placeId: place.id, message: `${place.nameEn || "A place"}: ${issue.message}` };
  }
  return { ok: false, byPlace, first };
}

async function offerDownload(filename, text) {
  try {
    const downloads = await window.claude?.use?.("downloads");
    if (downloads) {
      await downloads.save({ filename, data: text });
      return true;
    }
  } catch (error) {
    if (error?.code !== "unavailable") return false;
  }
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  ((link.href = url), (link.download = filename), link.click());
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

function TalatNoiApp({ storePromise }) {
  const location = useLiveLocation();
  const [store, setStore] = useState(null);
  const [permissions, setPermissions] = useState({ canEdit: false, canUploadPhotos: false });
  const [published, setPublished] = useState(editionFromSeed);
  const [mode, setMode] = useState("visitor"); // "visitor" | "editor" | "preview"
  const editing = mode === "editor";
  const previewing = mode === "preview";

  // Editor working copy, its saved state and the shared draft it is based on.
  const history = useEditHistory({ places: [], structures: [] });
  const doc = history.doc;
  const [draft, setDraft] = useState(null);
  const [baseRevision, setBaseRevision] = useState(0);
  const [savedJson, setSavedJson] = useState(null);
  const [save, setSave] = useState({ state: "saved", savedAt: null, message: "" });
  const [showIssues, setShowIssues] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [recoveryOffer, setRecoveryOffer] = useState(null);
  const [openingEditor, setOpeningEditor] = useState(false);
  const [publishDialog, setPublishDialog] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exitDialog, setExitDialog] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Shared map UI.
  const [selectedId, setSelectedId] = useState(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState("immersive");
  const [centerRequest, setCenterRequest] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [workspace, setWorkspace] = useState("places"); // "places" | "photos" | "structures"

  // Pin placement.
  const [placement, setPlacement] = useState(null); // { kind: "add" | "move", id?, category?, fromPhoto? }
  const [pickToMove, setPickToMove] = useState(false);
  const [placementInfo, setPlacementInfo] = useState(null);
  const [nudgeStep, setNudgeStep] = useState(1);
  const [topView, setTopView] = useState(false);
  const [addForm, setAddForm] = useState(null); // { lat, lng, fromPhoto? }
  const [flatPlacing, setFlatPlacing] = useState(null); // { id }
  const [navPlacing, setNavPlacing] = useState(null); // { kind: "place" | "structure" | "photo", id?, photo? }

  // 3D structures and the fieldwork photo queue.
  const [selectedStructureId, setSelectedStructureId] = useState(null);
  const [structurePanelOpen, setStructurePanelOpen] = useState(false);
  const [structurePlacing, setStructurePlacing] = useState(false);
  const [queuePhotoId, setQueuePhotoId] = useState(null);
  const [queueStage, setQueueStage] = useState(null);
  const [queueError, setQueueError] = useState("");

  const mapApi = useRef(null);
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);
  const importRef = useRef(null);
  const lastPublishedRevision = useRef(published.revision);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const langRef = useRef("en");
  const panZoom = usePanZoom(viewportRef, canvasRef, view === "original" ? 3209 / 2161 : 1536 / 1024);
  const tr = t2(lang);
  langRef.current = lang;

  const places = editing ? doc.places : previewing ? doc.places.filter((place) => place.approved) : published.places;
  const structures = editing || previewing ? doc.structures : published.structures;
  const selected = places.find((place) => place.id === selectedId) ?? null;
  const publishedById = useMemo(() => new Map(published.places.map((place) => [place.id, place])), [published.places]);
  const visiblePlaces = places.filter(
    (place) =>
      (placement?.kind === "move" && placement.id === place.id) ||
      ((category === "All" || place.category === category) &&
        `${place.nameEn} ${place.nameTh} ${place.category}`.toLowerCase().includes(query.toLowerCase())),
  );
  const dirty = (editing || previewing) && savedJson !== null && JSON.stringify(doc) !== savedJson;
  const issues = useMemo(() => (editing ? collectIssues(doc.places) : null), [editing, doc.places]);
  const saveView =
    save.state === "saving"
      ? save
      : save.state === "failed" && dirty
        ? save
        : dirty
          ? { ...save, state: "unsaved" }
          : { ...save, state: "saved" };
  const busy = openingEditor || publishing || saveView.state === "saving";
  const placing = !!placement;
  const queuePhoto = FIELDWORK_PHOTOS.find((photo) => photo.id === queuePhotoId) ?? null;
  const queue = fieldworkQueue(doc.places);
  const queuedCount = queue.filter((item) => !item.place).length;
  const selectedStructure = doc.structures.find((structure) => structure.id === selectedStructureId) ?? null;

  // ----- Store, permissions and the published edition ---------------------------------
  useEffect(() => {
    let alive = true;
    storePromise.then(async (resolved) => {
      if (!alive) return;
      setStore(resolved);
      const granted = await resolved.permissions().catch(() => ({ canEdit: false, canUploadPhotos: false }));
      alive && setPermissions(granted);
    });
    return () => {
      alive = false;
    };
  }, [storePromise]);

  useEffect(() => {
    if (!store) return;
    return store.watchPublished(
      (edition) => {
        if (!edition) return;
        const next = { ...edition, structures: edition.structures.map(normaliseStructure) };
        setPublished(next);
        if (lastPublishedRevision.current && lastPublishedRevision.current !== next.revision && modeRef.current === "visitor")
          toast(
            t2(langRef.current)(
              "A new map edition is available. You are viewing the latest places.",
              "มีแผนที่ฉบับใหม่ คุณกำลังดูสถานที่ล่าสุด",
            ),
          );
        lastPublishedRevision.current = next.revision;
      },
      (error) => error.code !== "slow" && toast.error(error.message),
    );
  }, [store]);

  // Photos uploaded from the place panel go to the active store.
  useEffect(() => {
    activePhotoUploader = store && permissions.canUploadPhotos ? (blob) => store.uploadPhoto(blob) : null;
  }, [store, permissions.canUploadPhotos]);

  // ----- Layout ------------------------------------------------------------------------
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 760px)");
    const update = () => setIsMobile(mobile.matches);
    update();
    mobile.addEventListener("change", update);
    setListOpen(window.matchMedia(editing ? "(min-width: 761px)" : "(min-width: 1100px)").matches);
    return () => mobile.removeEventListener("change", update);
  }, [editing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => setCanvasSize({ w: canvas.clientWidth, h: canvas.clientHeight }));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dirty && !photoUploading) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, photoUploading]);

  // Unsaved edits are copied to this device so a crash, refresh or failed save loses nothing.
  useEffect(() => {
    if (!editing || !store || recoveryOffer) return;
    if (!dirty) return void Recovery.clear(store.kind);
    const timer = setTimeout(
      () => Recovery.write(store.kind, { baseRevision, places: doc.places, structures: doc.structures }),
      400,
    );
    return () => clearTimeout(timer);
  }, [doc, dirty, editing, store, baseRevision, recoveryOffer]);

  // Lets AI assistants in supporting browsers read the published places (visitor map only).
  useEffect(() => {
    if (mode !== "visitor") return;
    const modelContext = document.modelContext;
    if (!modelContext?.registerTool) return;
    const controller = new AbortController();
    try {
      Promise.resolve(
        modelContext.registerTool(
          {
            name: "list_talat_noi_places",
            description: "Read the currently published Talat Noi places and their verification status.",
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute(input) {
              if (!input || typeof input !== "object" || Object.keys(input).length)
                throw new Error("No arguments are accepted.");
              return published.places.map((place) => ({
                id: place.id,
                nameEn: place.nameEn,
                nameTh: place.nameTh,
                category: place.category,
                verification: place.verification,
              }));
            },
          },
          { signal: controller.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => controller.abort();
  }, [published.places, mode]);

  // ----- Selection -----------------------------------------------------------------------
  const selectPlace = (id, { focus = false } = {}) => {
    if (pickToMove && editing) {
      setPickToMove(false);
      startMove(id);
      return;
    }
    setSelectedId(id);
    setCardOpen(true);
    setNavPlacing(null);
    if (focus) mapApi.current?.focus(id);
  };
  const closeCard = useCallback(() => {
    setCardOpen(false);
    setTimeout(
      () =>
        document
          .querySelector(".three-marker.selected:not([hidden]),.map-marker.is-selected")
          ?.focus({ preventScroll: true }),
      0,
    );
  }, []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // ----- Editor: open, save, publish, exit ----------------------------------------------
  const applyDraft = (edition, { keepWorkingCopy = false } = {}) => {
    const nextDoc = { places: edition.places, structures: edition.structures.map(normaliseStructure) };
    setDraft(edition);
    setBaseRevision(edition.revision);
    if (!keepWorkingCopy) {
      history.reset(nextDoc);
      setSavedJson(JSON.stringify(nextDoc));
    }
    setSave({ state: "saved", savedAt: edition.updatedAt, message: "" });
    return nextDoc;
  };

  async function enterEditor() {
    if (!store || !permissions.canEdit || openingEditor) return;
    setOpeningEditor(true);
    try {
      const edition = await store.loadDraft(published);
      const loadedDoc = applyDraft(edition);
      setMode("editor");
      setCardOpen(false);
      setWorkspace("places");
      mapApi.current?.stopTour();
      const recovery = Recovery.read(store.kind);
      if (
        recovery &&
        JSON.stringify({ places: recovery.places, structures: recovery.structures }) !== JSON.stringify(loadedDoc)
      )
        setRecoveryOffer(recovery);
    } catch (error) {
      toast.error(error.message || "The editor could not be opened.");
    } finally {
      setOpeningEditor(false);
    }
  }

  async function saveDraft({ force = false, docToSave = doc } = {}) {
    if (!store || saveView.state === "saving") return false;
    const checked = collectIssues(docToSave.places);
    if (!checked.ok) {
      setShowIssues(true);
      setSave({ state: "failed", savedAt: save.savedAt, message: checked.first?.message ?? "Some details need fixing." });
      if (checked.first?.placeId) {
        setWorkspace("places");
        setSelectedId(checked.first.placeId);
        setCardOpen(true);
      }
      toast.error(checked.first?.message ?? "Some details need fixing before saving.");
      return false;
    }
    let structuresToSave;
    try {
      structuresToSave = StructuresSchema.parse(docToSave.structures);
    } catch (error) {
      setSave({ state: "failed", savedAt: save.savedAt, message: "A 3D structure has an invalid value." });
      return false;
    }
    setSave((current) => ({ ...current, state: "saving", message: "" }));
    try {
      const saved = await store.saveDraft({
        places: checked.data,
        structures: structuresToSave,
        baseRevision,
        force,
        fallbackEdition: published,
      });
      setDraft(saved);
      setBaseRevision(saved.revision);
      setSavedJson(JSON.stringify(docToSave));
      setSave({ state: "saved", savedAt: saved.updatedAt, message: "" });
      setShowIssues(false);
      Recovery.clear(store.kind);
      return true;
    } catch (error) {
      if (error.code === "conflict") setConflict({ current: error.current, message: error.message });
      setSave((current) => ({ ...current, state: "failed", message: error.message }));
      toast.error(error.message, { duration: 9000 });
      return false;
    }
  }

  async function openPublish() {
    if (dirty || !draft?.exists) {
      const ok = await saveDraft();
      if (!ok) return;
    }
    setPublishDialog({
      summary: describeChanges(comparePublished(published.places, doc.places.filter((place) => place.approved))),
    });
  }

  async function confirmPublish() {
    if (!store) return;
    setPublishing(true);
    try {
      const result = await store.publish({ revision: baseRevision, fallbackEdition: published });
      setDraft(result.draft);
      setPublished({ ...result.published, structures: result.published.structures.map(normaliseStructure) });
      lastPublishedRevision.current = result.published.revision;
      setPublishDialog(null);
      toast.success("Published. Visitors now see the updated map.");
    } catch (error) {
      if (error.code === "conflict") setConflict({ current: error.current, message: error.message });
      toast.error(error.message, { duration: 9000 });
    } finally {
      setPublishing(false);
    }
  }

  function leaveEditor() {
    endPlacement();
    setMode("visitor");
    setSelectedId(null);
    setCardOpen(false);
    setExitDialog(false);
    setWorkspace("places");
    setShowIssues(false);
    setFlatPlacing(null);
    setNavPlacing(null);
  }

  async function exportBackup() {
    const text = JSON.stringify(
      { format: "talat-noi-shared-v2", exportedAt: new Date().toISOString(), places: doc.places, structures: doc.structures },
      null,
      2,
    );
    const ok = await offerDownload(`talat-noi-draft-${new Date().toISOString().slice(0, 10)}.json`, text);
    ok || toast.error("The backup could not be downloaded.");
  }

  async function importBackup(file) {
    try {
      if (file.size > 9e5) throw new Error("Map file is too large.");
      const data = JSON.parse(await file.text());
      const incoming = PlacesSchema.parse(data.places);
      const incomingStructures = data.structures === undefined ? [] : StructuresSchema.parse(data.structures);
      const placeIds = new Set(doc.places.map((place) => place.id));
      const structureIds = new Set(doc.structures.map((structure) => structure.id));
      const newPlaces = incoming.filter((place) => !placeIds.has(place.id)).map((place) => ({ ...place, approved: false }));
      const newStructures = incomingStructures.filter((structure) => !structureIds.has(structure.id));
      if (!newPlaces.length && !newStructures.length)
        throw new Error("No new places to import. Existing places are kept to protect your draft.");
      history.change(
        (current) => ({ places: [...current.places, ...newPlaces], structures: [...current.structures, ...newStructures] }),
        { label: "Import places" },
      );
      toast.success(`${newPlaces.length} places and ${newStructures.length} structures added. Review, save and publish when ready.`);
    } catch (error) {
      toast.error(error.message || "That file could not be imported.");
    }
  }

  // ----- Editor: editing places ------------------------------------------------------------
  const changeSelected = (patch, group) => {
    if (!selected) return;
    const name = selected.nameEn || "place";
    history.change((current) => updatePlaceIn(current, selected.id, patch), {
      label: `Edit “${name}”`,
      group: group ?? undefined,
    });
  };

  function deletePlace(id) {
    const place = doc.places.find((item) => item.id === id);
    if (!place) return;
    history.change((current) => ({ ...current, places: current.places.filter((item) => item.id !== id) }), {
      label: `Delete “${place.nameEn}”`,
    });
    setDeleteTarget(null);
    setCardOpen(false);
    setSelectedId(null);
    toast.success(`“${place.nameEn}” deleted from the draft. Use Undo to bring it back.`);
  }

  // ----- Editor: pin placement on the 3D map -------------------------------------------------
  function endPlacement() {
    if (topView) mapApi.current?.restoreView();
    setTopView(false);
    setPlacement(null);
    setPlacementInfo(null);
    setPickToMove(false);
    setAddForm(null);
  }

  function startAddPin(fromPhoto = null) {
    if (!editing) return;
    setWorkspace("places");
    setView("immersive");
    setCardOpen(false);
    setFlatPlacing(null);
    setPickToMove(false);
    setAddForm(null);
    setPlacementInfo(null);
    setQueuePhotoId(null);
    setPlacement({ kind: "add", category: fromPhoto?.category ?? "Community", fromPhoto });
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function startMove(id) {
    if (!editing) return;
    if (!id) {
      setPickToMove(true);
      setView("immersive");
      setCardOpen(false);
      toast(tr("Tap the pin you want to move.", "แตะหมุดที่ต้องการย้าย"));
      return;
    }
    setWorkspace("places");
    setSelectedId(id);
    setView("immersive");
    setCardOpen(false);
    setFlatPlacing(null);
    setPickToMove(false);
    setPlacementInfo(null);
    setPlacement({ kind: "move", id });
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // The 3D map asks for a move when a selected pin is dragged directly.
  const requestMove = (id) => {
    setSelectedId(id);
    setCardOpen(false);
    setPickToMove(false);
    setPlacement((current) => (current?.kind === "move" && current.id === id ? current : { kind: "move", id }));
  };

  function confirmPlacement() {
    const info = mapApi.current?.placementInfo() ?? placementInfo;
    if (!placement || !info) return;
    if (placement.kind === "add") {
      setAddForm({ lat: info.lat, lng: info.lng, fromPhoto: placement.fromPhoto ?? null });
      return;
    }
    if (!info.moved) return;
    const place = doc.places.find((item) => item.id === placement.id);
    if (!place) return endPlacement();
    const patch = { lat: info.lat, lng: info.lng };
    const wasChecked = place.verification === "checked";
    if (wasChecked) Object.assign(patch, { verification: "pending", lastChecked: "" });
    history.change((current) => updatePlaceIn(current, place.id, patch), { label: `Move “${place.nameEn}”` });
    endPlacement();
    setSelectedId(place.id);
    setCardOpen(true);
    toast.success(
      wasChecked
        ? "Pin moved and marked “Needs verification”. Save the draft to keep it."
        : "Pin moved. Save the draft to keep it.",
    );
  }

  function cancelPlacement() {
    const reopen = placement?.kind === "move" ? placement.id : null;
    endPlacement();
    if (reopen) (setSelectedId(reopen), setCardOpen(true));
  }

  async function submitNewPlace(fields) {
    if (!addForm) return;
    const photo = addForm.fromPhoto;
    const base = photo
      ? placeFromFieldworkPhoto(photo, fields.photoUrl || photo.asset, {})
      : createPlaceRecord(uniquePlaceId(fields.nameEn, doc.places));
    const illustration = Geo.estimateIllustration(doc.places, addForm);
    const place = {
      ...base,
      id: photo ? uniquePlaceId(base.id, doc.places) : base.id,
      nameEn: fields.nameEn,
      nameTh: fields.nameTh,
      category: fields.category,
      storyEn: fields.storyEn,
      photoUrl: fields.photoUrl,
      photoAlt: fields.photoUrl ? fields.photoAlt || fields.nameEn : "",
      photoCredit: fields.photoUrl ? fields.photoCredit : "",
      photoSource: fields.photoUrl ? fields.photoSource : "",
      lat: addForm.lat,
      lng: addForm.lng,
      x: illustration.x,
      y: illustration.y,
      illustrationEstimated: true,
      approved: fields.approved,
      verification: "pending",
      verificationNotes: "New pin added in the map editor. The name, details and exact position need a community check.",
    };
    const nextDoc = { ...doc, places: [...doc.places, place] };
    history.change(() => nextDoc, { label: `Add “${place.nameEn}”` });
    endPlacement();
    setSelectedId(place.id);
    setCardOpen(true);
    const ok = await saveDraft({ docToSave: nextDoc });
    ok && toast.success(`“${place.nameEn}” added and the draft is saved.`);
  }

  function placeOnIllustration(id) {
    endPlacement();
    setFlatPlacing({ id });
    setView("digital");
    setCardOpen(false);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleFlatMapClick(event) {
    if (!flatPlacing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clamp = (value) => Math.round(Math.max(2, Math.min(98, value)) * 10) / 10;
    const x = clamp((100 * (event.clientX - rect.left)) / rect.width);
    const y = clamp((100 * (event.clientY - rect.top)) / rect.height);
    const place = doc.places.find((item) => item.id === flatPlacing.id);
    if (place)
      history.change((current) => updatePlaceIn(current, place.id, { x, y, illustrationEstimated: false }), {
        label: `Place “${place.nameEn}” on the illustration`,
      });
    setFlatPlacing(null);
    setSelectedId(flatPlacing.id);
    setCardOpen(true);
    toast.success("Illustration position updated. Save the draft to keep it.");
  }

  function placeFromNavigation(latLng) {
    setNavOpen(false);
    const target = navPlacing;
    setNavPlacing(null);
    if (!target) return;
    if (target.kind === "place") {
      const place = doc.places.find((item) => item.id === target.id);
      if (!place) return;
      const patch = { lat: Geo.roundCoordinate(latLng.lat), lng: Geo.roundCoordinate(latLng.lng) };
      if (place.verification === "checked") Object.assign(patch, { verification: "pending", lastChecked: "" });
      history.change((current) => updatePlaceIn(current, place.id, patch), { label: `Move “${place.nameEn}”` });
      setSelectedId(place.id);
      setCardOpen(true);
      toast.success("Coordinates updated. Check the entrance before marking the place as checked.");
    } else if (target.kind === "structure") {
      history.change(
        (current) => ({
          ...current,
          structures: current.structures.map((structure) =>
            structure.id === target.id ? { ...structure, geoPosition: latLng, hidden: false } : structure,
          ),
        }),
        { label: "Set structure location" },
      );
      setStructurePanelOpen(true);
      toast.success("Location reference saved. The illustrated model stays in place.");
    } else if (target.kind === "photo") {
      setAddForm({
        lat: Geo.roundCoordinate(latLng.lat),
        lng: Geo.roundCoordinate(latLng.lng),
        fromPhoto: target.photo,
      });
    }
  }

  // ----- Editor: 3D structures and the photo queue --------------------------------------------
  const changeStructure = (patch) =>
    history.change(
      (current) => ({
        ...current,
        structures: current.structures.map((structure) =>
          structure.id === selectedStructureId ? { ...structure, ...patch } : structure,
        ),
      }),
      { label: "Edit 3D structure", group: `structure:${selectedStructureId}:${Object.keys(patch).join(",")}` },
    );

  async function attachQueuePhoto(photo, placeId) {
    setQueueError("");
    try {
      const url = await fieldworkPhotoUrl(photo.asset, photo.filename, { onStage: setQueueStage });
      history.change((current) => updatePlaceIn(current, placeId, fieldworkPhotoFields(photo, url)), {
        label: `Attach photo ${photo.id}`,
      });
      setQueuePhotoId(null);
      setWorkspace("places");
      setSelectedId(placeId);
      setCardOpen(true);
      toast.success(`${photo.id} attached. Check the place, then save the draft.`);
    } catch (error) {
      setQueueError(error.message || "The photo could not be attached. Please try again.");
    } finally {
      setQueueStage(null);
    }
  }

  const switchWorkspace = (next) => {
    endPlacement();
    setWorkspace(next);
    setCardOpen(false);
    setStructurePanelOpen(false);
    setStructurePlacing(false);
    setListOpen(true);
    if (next === "structures") setView("immersive");
  };

  // ----- Keyboard shortcuts ----------------------------------------------------------------
  useEffect(() => {
    if (!editing) return;
    const onKey = (event) => {
      const target = event.target;
      const typing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!placing) saveDraft();
        return;
      }
      if (typing) return;
      if (placement && !addForm) {
        const onScene = target instanceof Element && target.closest(".three-surface");
        if (event.key === "Escape") return void (event.preventDefault(), cancelPlacement());
        if (event.key === "Enter" && !(target instanceof HTMLButtonElement))
          return void (event.preventDefault(), confirmPlacement());
        const arrows = { ArrowUp: [1, 0], ArrowDown: [-1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
        if (arrows[event.key] && !onScene) {
          event.preventDefault();
          mapApi.current?.nudge(...arrows[event.key], event.shiftKey ? 5 : nudgeStep);
        }
        return;
      }
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        event.shiftKey ? history.redo() : history.undo();
      } else if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        history.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ----- Rendering -------------------------------------------------------------------------
  const spread = canvasSize.w
    ? spreadMarkers(
        visiblePlaces.map((place) => ({ id: place.id, x: (place.x / 100) * canvasSize.w, y: (place.y / 100) * canvasSize.h })),
        { minDistance: 52 },
      )
    : new Map();

  const viewSwitch = (
    <>
      <button aria-pressed={view === "immersive"} onClick={() => (setView("immersive"), closeMenu())}>
        <Icon.Layers size={16} />
        {tr("Illustrated 3D", "ภาพประกอบ 3 มิติ")}
      </button>
      <button aria-pressed={view === "digital"} onClick={() => (setStructurePlacing(false), setView("digital"), closeMenu())}>
        {tr("Illustrated", "ภาพประกอบ")}
      </button>
      <button aria-pressed={view === "original"} onClick={() => (setStructurePlacing(false), setView("original"), closeMenu())}>
        {tr("Original", "ต้นฉบับ")}
      </button>
      <button onClick={() => (setNavOpen(true), closeMenu())}>
        <Icon.Locate size={15} />
        {tr("Navigation", "นำทาง")}
      </button>
      {!editing && (
        <button aria-pressed={view === "street"} onClick={() => (setView("street"), closeMenu())}>
          <Icon.MapPin size={15} />
          {tr("Street map", "แผนที่ถนน")}
        </button>
      )}
    </>
  );

  const moreItems = [
    {
      label: "Places",
      hint: "Edit place pins and details",
      icon: Icon.MapPin,
      onSelect: () => switchWorkspace("places"),
      disabled: workspace === "places",
    },
    {
      label: `Fieldwork photo queue${queuedCount ? ` (${queuedCount})` : ""}`,
      hint: "Attach field photos to places",
      icon: Icon.Image,
      onSelect: () => switchWorkspace("photos"),
      disabled: workspace === "photos",
    },
    {
      label: "3D structures",
      hint: "Move or hide the illustrated landmark models",
      icon: Icon.Layers,
      onSelect: () => switchWorkspace("structures"),
      disabled: workspace === "structures",
    },
    { label: "Download a backup", hint: "Your current working copy as a file", icon: Icon.Download, onSelect: exportBackup },
    { label: "Import places from a file", hint: "Adds new places only", icon: Icon.Upload, onSelect: () => importRef.current?.click() },
  ];

  const panelFooter = (
    <footer className="ed-panel-footer">
      <span className={`ed-footer-status is-${saveView.state}`}>
        {saveView.state === "saving"
          ? "Saving…"
          : saveView.state === "failed"
            ? "Save failed"
            : saveView.state === "unsaved"
              ? "Unsaved changes"
              : "All changes saved"}
      </span>
      <Button onClick={() => saveDraft()} disabled={busy || saveView.state === "saved"} data-testid="panel-save">
        <Icon.Save /> Save draft
      </Button>
    </footer>
  );

  const showPanel = editing && workspace === "places" && ((cardOpen && selected && !placing) || (addForm && placement));

  return (
    <main
      className={`map-app ${editing ? "editing is-editor-mode" : "visiting"} ${previewing ? "is-preview-mode" : ""} ${showPanel ? "has-editor-panel" : ""}`}
    >
      <header className="topbar">
        <a
          href="#"
          className="brand"
          aria-label="Talat Noi story map"
          onClick={(event) => {
            event.preventDefault();
            setSelectedId(null);
            setCardOpen(false);
          }}
        >
          <span className="brand-mark">
            <Icon.Compass />
          </span>
          <span className="brand-name">
            ตลาดน้อย
            <small>TALAT NOI · STORY MAP</small>
          </span>
        </a>
        <label className="search-field">
          <Icon.Search size={18} />
          <input
            aria-label="Search places"
            placeholder={tr("Find a place or story…", "ค้นหาสถานที่…")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              event.target.value && setListOpen(true);
            }}
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery("")}>
              <Icon.X size={16} />
            </button>
          )}
        </label>
        <div className="top-actions">
          {mode === "visitor" && permissions.canEdit && (
            <Button className="edit-map-button" onClick={enterEditor} disabled={openingEditor} data-testid="edit-map">
              {openingEditor ? <Icon.Loader className="ed-spin" /> : <Icon.Pencil />} Edit map
            </Button>
          )}
          <Button
            variant="ghost"
            className="language-button"
            onClick={() => setLang(lang === "en" ? "th" : "en")}
            aria-label="Switch language"
          >
            {lang === "en" ? "ไทย" : "EN"}
          </Button>
          <button
            className="menu-button"
            aria-expanded={menuOpen}
            aria-controls="tour-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon.Menu size={20} />
            <span>{tr("Menu", "เมนู")}</span>
          </button>
        </div>
      </header>

      {editing && (
        <EditorToolbar
          tool={placement?.kind ?? (pickToMove ? "pick-move" : null)}
          busy={busy}
          hasSelection={!!selected}
          history={history}
          save={saveView}
          draft={draft}
          storeLabel={store?.label ?? ""}
          moreItems={moreItems}
          onAddPin={() => (placement?.kind === "add" ? cancelPlacement() : startAddPin())}
          onMovePin={() => (placement?.kind === "move" || pickToMove ? cancelPlacement() : startMove(selected?.id ?? null))}
          onSave={() => saveDraft()}
          onRetry={() => saveDraft()}
          onPreview={() => (endPlacement(), setCardOpen(false), setMode("preview"))}
          onPublish={openPublish}
          onExit={() => (dirty ? setExitDialog(true) : leaveEditor())}
        />
      )}

      {previewing && (
        <div className="ed-preview-banner" role="status" data-testid="preview-banner">
          <Icon.Eye size={18} />
          <p>
            <strong>Preview of your draft.</strong> This is what visitors will see after you publish
            {dirty ? " (including unsaved changes)" : ""}. Places hidden from visitors are not shown.
          </p>
          <Button variant="outline" size="sm" onClick={() => (setCardOpen(false), setMode("editor"))} data-testid="preview-back">
            <Icon.Pencil /> Back to editing
          </Button>
          <Button size="sm" onClick={() => (setCardOpen(false), setMode("editor"), openPublish())}>
            <Icon.Earth /> Publish
          </Button>
        </div>
      )}

      {editing && recoveryOffer && (
        <div className="ed-recovery-banner" role="alert" data-testid="recovery-banner">
          <Icon.Info size={18} />
          <p>
            <strong>Unsaved changes found on this device</strong> from{" "}
            {new Date(recoveryOffer.savedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.
            {recoveryOffer.baseRevision !== draft?.revision &&
              " The shared draft has changed since then; you'll be asked before anything is replaced."}
          </p>
          <Button
            size="sm"
            onClick={() => {
              history.change(() => ({ places: recoveryOffer.places, structures: recoveryOffer.structures }), {
                label: "Restore unsaved changes",
              });
              setBaseRevision(recoveryOffer.baseRevision);
              setRecoveryOffer(null);
            }}
            data-testid="recovery-restore"
          >
            Restore them
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => (store && Recovery.clear(store.kind), setRecoveryOffer(null))}
          >
            Discard
          </Button>
        </div>
      )}

      <div className="filter-bar">
        <button className="list-toggle" aria-expanded={listOpen} aria-controls="place-list" onClick={() => setListOpen(!listOpen)}>
          <Icon.List size={18} />
          {editing && workspace === "photos" ? (
            "Photo queue"
          ) : editing && workspace === "structures" ? (
            "Structures"
          ) : (
            <>
              {visiblePlaces.length} {tr(visiblePlaces.length === 1 ? "place" : "places", "สถานที่")}
            </>
          )}
        </button>
        {(!editing || workspace === "places") && (
          <div className="filter-row" aria-label="Categories">
            {["All", ...CATEGORIES.filter((item) => places.some((place) => place.category === item))].map((item) => {
              const style = item === "All" ? null : CATEGORY_STYLE[item];
              return (
                <button
                  key={item}
                  aria-pressed={category === item}
                  className={category === item ? "active" : ""}
                  style={style ? { "--chip-tint": style.tint, "--chip-text": style.text } : undefined}
                  onClick={() => setCategory(item)}
                >
                  {item !== "All" && <CategoryIcon category={item} />}
                  {item === "All" ? tr("All", "ทั้งหมด") : categoryLabel(item, lang)}
                </button>
              );
            })}
          </div>
        )}
        <div className="view-switch">{viewSwitch}</div>
      </div>

      <div className="workspace" data-list={listOpen ? "open" : "closed"}>
        <aside className="explorer" id="place-list" aria-label={tr("Places", "สถานที่")}>
          <div className="explorer-head">
            <strong>
              {editing && workspace === "photos" ? (
                "Fieldwork photo queue"
              ) : editing && workspace === "structures" ? (
                "3D structures"
              ) : (
                <>
                  {visiblePlaces.length}{" "}
                  {editing
                    ? visiblePlaces.length === 1
                      ? "place"
                      : "places"
                    : tr(visiblePlaces.length === 1 ? "place to discover" : "places to discover", "สถานที่")}
                </>
              )}
            </strong>
            {editing && workspace === "places" && (
              <Button size="sm" onClick={() => startAddPin()} disabled={busy || placing} data-testid="list-add-pin">
                <Icon.PinPlus /> Add pin
              </Button>
            )}
            <button className="explorer-close" aria-label={tr("Close list", "ปิดรายการ")} onClick={() => setListOpen(false)}>
              <Icon.X size={18} />
            </button>
          </div>
          {editing && workspace === "places" && (
            <label className="ed-list-search">
              <Icon.Search size={16} />
              <input
                aria-label="Search places in the list"
                placeholder="Search places"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                data-testid="list-search"
              />
            </label>
          )}
          {editing && workspace === "structures" ? (
            <>
              <div className="intro">
                <p>Move, turn, resize, hide or replace each illustrated object.</p>
              </div>
              <StructureList
                structures={doc.structures}
                selectedId={selectedStructureId}
                onSelect={(id) => (setView("immersive"), setSelectedStructureId(id), setStructurePanelOpen(true), setStructurePlacing(false))}
              />
            </>
          ) : editing && workspace === "photos" ? (
            <PhotoQueueList places={doc.places} selectedId={queuePhotoId} onOpen={(id) => (setQueueError(""), setQueuePhotoId(id))} />
          ) : (
            <div className="stop-list" data-testid="place-list">
              {visiblePlaces.map((place) => {
                const publishedPlace = publishedById.get(place.id);
                const status = editing ? placeStatus(place, publishedPlace) : null;
                const placeIssues = editing && showIssues ? issues?.byPlace[place.id] : null;
                return (
                  <button
                    key={place.id}
                    className={`stop ${selectedId === place.id ? "selected" : ""} ${placeIssues ? "has-issues" : ""}`}
                    data-place-id={place.id}
                    onClick={() => selectPlace(place.id, { focus: editing || view === "immersive" })}
                  >
                    <PlacePhoto place={place} small />
                    <span className="stop-copy">
                      <CategoryChip category={place.category} lang={lang} />
                      <strong>{lang === "en" ? place.nameEn : place.nameTh}</strong>
                      {place.nameEn !== place.nameTh && (
                        <span className="second-name" lang={lang === "en" ? "th" : "en"}>
                          {lang === "en" ? place.nameTh : place.nameEn}
                        </span>
                      )}
                      {editing ? (
                        <span className={`ed-list-status is-${status.key} ${place.approved ? "" : "is-hidden"}`}>
                          {placeIssues ? "Needs a fix before saving" : !place.approved ? "Hidden from visitors" : status.label}
                        </span>
                      ) : (
                        <span className={place.verification === "checked" ? "ready-label" : "review-label"}>
                          {place.verification === "checked" ? tr("Checked", "ตรวจสอบแล้ว") : tr("Needs verification", "รอการตรวจสอบ")}
                        </span>
                      )}
                    </span>
                    <Icon.ChevronRight className="stop-arrow" size={18} />
                  </button>
                );
              })}
              {!visiblePlaces.length && (
                <div className="empty-state">
                  <Icon.Search />
                  <h2>{tr("No matching places", "ไม่พบสถานที่")}</h2>
                  <p>{tr("Try another name or category.", "ลองชื่อหรือหมวดหมู่อื่น")}</p>
                  <Button variant="outline" onClick={() => (setQuery(""), setCategory("All"))}>
                    {tr("Reset filters", "ล้างตัวกรอง")}
                  </Button>
                </div>
              )}
            </div>
          )}
          <footer className="explorer-footer">
            <span className="live-dot" />
            {tr("Community map · prototype edition", "แผนที่ชุมชน · ฉบับต้นแบบ")}
            <small>{tr("Respect the people behind the places.", "เคารพผู้คนและพื้นที่ของชุมชน")}</small>
          </footer>
        </aside>

        <section ref={sectionRef} className="map-section" aria-label="Interactive Talat Noi map">
          {openingEditor && (
            <p className="map-state" role="status">
              <span className="scene-loader" />
              Opening the shared draft…
            </p>
          )}
          {!visiblePlaces.length && !listOpen && (
            <div className="map-state" role="status">
              <p>{tr("No places match this search.", "ไม่พบสถานที่ที่ตรงกับการค้นหา")}</p>
              <Button variant="outline" onClick={() => (setQuery(""), setCategory("All"))}>
                {tr("Reset filters", "ล้างตัวกรอง")}
              </Button>
            </div>
          )}
          {flatPlacing && (
            <div className="placement-banner" role="status">
              Tap the illustration where “{doc.places.find((place) => place.id === flatPlacing.id)?.nameEn}” is.
              <Button variant="outline" size="sm" onClick={() => (setFlatPlacing(null), setCardOpen(true))}>
                Cancel
              </Button>
            </div>
          )}
          {pickToMove && (
            <div className="placement-banner" role="status">
              Tap the pin you want to move.
              <Button variant="outline" size="sm" onClick={() => setPickToMove(false)}>
                Cancel
              </Button>
            </div>
          )}
          {structurePlacing && selectedStructure && (
            <div className="placement-banner" role="status">
              Tap the ground to move “{selectedStructure.label}”.
              <Button variant="outline" size="sm" onClick={() => (setStructurePlacing(false), setStructurePanelOpen(true))}>
                Cancel
              </Button>
            </div>
          )}
          {view === "immersive" && (
            <Illustrated3DMap
              location={location}
              onOpenNavigation={() => (setNavOpen(true), location.usableFix && setCenterRequest((value) => value + 1))}
              structures={structures}
              structureEditing={editing && workspace === "structures"}
              selectedStructureId={selectedStructureId}
              onSelectStructure={(id) => (setSelectedStructureId(id), setStructurePanelOpen(true), setStructurePlacing(false))}
              places={places}
              visibleIds={visiblePlaces.map((place) => place.id)}
              selectedId={selectedId}
              lang={lang}
              placing={structurePlacing}
              keepExpanded={!editing}
              onSelect={(id) => selectPlace(id)}
              onPlace={(position) => {
                if (!structurePlacing || !selectedStructure) return;
                changeStructure({ ...position, hidden: false });
                setStructurePlacing(false);
                setStructurePanelOpen(true);
                toast.success("Structure moved in your draft.");
              }}
              onFallback={() => setView("digital")}
              editing={editing}
              placement={placement}
              onPlacementChange={setPlacementInfo}
              onRequestMove={requestMove}
              apiRef={mapApi}
            />
          )}
          {(view === "digital" || view === "original") && (
            <p id="map-gesture-hint" className="map-gesture-hint">
              {tr("Drag to move · Pinch to zoom", "ลากเพื่อเลื่อน · จีบหรือกางนิ้วเพื่อซูม")}
              <span>{Math.round(panZoom.zoom * 100)}%</span>
            </p>
          )}
          <div
            className={`map-viewport ${flatPlacing ? "placing" : ""}`}
            ref={viewportRef}
            style={view === "street" || view === "immersive" ? { display: "none" } : undefined}
            tabIndex={0}
            role="region"
            aria-label={tr("Map canvas", "พื้นที่แผนที่")}
            aria-describedby="map-gesture-hint"
          >
            <div className="map-canvas" ref={canvasRef} onClick={handleFlatMapClick}>
              <img
                className="base-map"
                src={view === "digital" ? "assets/talat-noi-full-3d-map.webp" : "assets/talat-noi-map.webp"}
                alt="Illustrated Talat Noi neighbourhood. Marker positions are schematic and need verification."
                draggable={false}
              />
              {visiblePlaces.map((place) => {
                const offset = spread.get(place.id) ?? { dx: 0, dy: 0 };
                const leader = leaderLine(offset);
                const model = place.icon !== "pin";
                return (
                  <button
                    key={place.id}
                    className={`map-marker ${model ? "" : "has-pin"} ${selectedId === place.id ? "is-selected" : ""} ${offset.dx || offset.dy ? "moved" : ""} ${place.y < 30 ? "flip" : ""}`}
                    style={{
                      left: `calc(${place.x}% + ${offset.dx}px)`,
                      top: `calc(${place.y}% + ${offset.dy}px)`,
                      "--marker-size": `${place.size * 0.6}px`,
                      "--marker-rotation": `${place.rotation || 0}deg`,
                      "--leader": `${leader.length}px`,
                      "--leader-angle": `${leader.angle}deg`,
                    }}
                    aria-label={pinAriaLabel(place, lang)}
                    onClick={(event) => {
                      if (flatPlacing) return;
                      event.stopPropagation();
                      selectPlace(place.id);
                    }}
                  >
                    {model ? (
                      <>
                        <span
                          className="model-art"
                          style={{
                            backgroundPosition: `${(Number(place.icon.slice(5)) % 5) * 25}% ${Math.floor(Number(place.icon.slice(5)) / 5) * 100}%`,
                            width: place.size * 0.72,
                            height: place.size * 0.9,
                          }}
                        />
                        <span className="marker-name">{lang === "en" ? place.nameEn : place.nameTh}</span>
                      </>
                    ) : (
                      <PinArt place={place} lang={lang} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {view === "street" && (
            <GoogleStreetMap places={visiblePlaces} fix={location.usableFix} selectedId={selectedId} onSelect={(id) => selectPlace(id)} lang={lang} />
          )}
          {(view === "digital" || view === "original") && (
            <div className="map-bottom">
              <p>
                <Icon.Info size={16} />
                {tr("Illustrated map · locations need verification", "แผนที่ภาพประกอบ · ตำแหน่งรอการตรวจสอบ")}
              </p>
              <div className="zoom-controls">
                <button aria-label="Zoom out" disabled={panZoom.zoom <= 1.001} onClick={() => panZoom.zoomBy(-0.25)}>
                  <Icon.Minus />
                </button>
                <button aria-label="Fit whole map" title={tr("Fit whole map", "ดูแผนที่ทั้งหมด")} onClick={panZoom.reset}>
                  {tr("Fit", "พอดี")}
                </button>
                <button
                  aria-label="Zoom in"
                  disabled={panZoom.zoom >= panZoom.maxZoom - 0.001}
                  onClick={() => panZoom.zoomBy(0.25)}
                >
                  <Icon.Plus />
                </button>
              </div>
            </div>
          )}
          {!editing && !cardOpen && selected && (
            <div className="reopen-chip">
              <button onClick={() => setCardOpen(true)}>
                <PlacePhoto place={selected} small />
                <span>{lang === "en" ? selected.nameEn : selected.nameTh}</span>
              </button>
              <button aria-label={tr("Clear selection", "ล้างการเลือก")} onClick={() => setSelectedId(null)}>
                <Icon.X size={16} />
              </button>
            </div>
          )}
          {editing && placement && !addForm && (
            <PlacementBar
              placement={placement}
              placeName={doc.places.find((place) => place.id === placement.id)?.nameEn ?? ""}
              info={placementInfo}
              step={nudgeStep}
              topView={topView}
              onStepChange={setNudgeStep}
              onNudge={(forward, right) => mapApi.current?.nudge(forward, right, nudgeStep)}
              onTopView={() => {
                topView ? mapApi.current?.restoreView() : mapApi.current?.topView();
                setTopView(!topView);
              }}
              onConfirm={confirmPlacement}
              onCancel={cancelPlacement}
            />
          )}
        </section>

        {showPanel && (
          <aside className="ed-panel" aria-label="Place editor">
            {addForm ? (
              <AddPlaceForm
                key={`${addForm.lat},${addForm.lng},${addForm.fromPhoto?.id ?? ""}`}
                lang={lang}
                canUploadPhotos={permissions.canUploadPhotos}
                saving={saveView.state === "saving"}
                positionLabel={`${addForm.lat.toFixed(6)}, ${addForm.lng.toFixed(6)}`}
                initial={
                  addForm.fromPhoto
                    ? {
                        nameEn: addForm.fromPhoto.title,
                        category: addForm.fromPhoto.category,
                        photoUrl: addForm.fromPhoto.asset,
                        photoAlt: addForm.fromPhoto.alt,
                        photoSource: addForm.fromPhoto.asset,
                      }
                    : { category: placement?.category }
                }
                onUploadingChange={setPhotoUploading}
                onCategoryChange={(value) => setPlacement((current) => (current ? { ...current, category: value } : current))}
                onSubmit={submitNewPlace}
                onCancel={cancelPlacement}
              />
            ) : (
              <PlacePanel
                key={selected.id}
                place={selected}
                publishedPlace={publishedById.get(selected.id)}
                lang={lang}
                canUploadPhotos={permissions.canUploadPhotos}
                issues={showIssues ? issues?.byPlace[selected.id] ?? {} : {}}
                onChange={changeSelected}
                onMove={() => startMove(selected.id)}
                onFocus={() => (setView("immersive"), mapApi.current?.focus(selected.id))}
                onPlaceOnIllustration={() => placeOnIllustration(selected.id)}
                onSetOnNavigationMap={() => (setNavPlacing({ kind: "place", id: selected.id }), setNavOpen(true))}
                onDelete={() => setDeleteTarget(selected.id)}
                onClose={closeCard}
                onUploadingChange={setPhotoUploading}
                footer={panelFooter}
              />
            )}
          </aside>
        )}
      </div>

      <MenuDrawer open={menuOpen} title={tr("Menu", "เมนู")} closeLabel={tr("Close menu", "ปิดเมนู")} onClose={closeMenu}>
        <div className="menu-views">
          <span className="eyebrow">{tr("MAP VIEW", "มุมมองแผนที่")}</span>
          <div className="view-switch">{viewSwitch}</div>
        </div>
        {mode === "visitor" && permissions.canEdit && (
          <Button className="menu-edit-button" onClick={() => (closeMenu(), enterEditor())}>
            <Icon.Pencil /> Edit map
          </Button>
        )}
        {!editing && (
          <DirectionsList
            location={location}
            places={places}
            selectedId={selectedId}
            onSelect={setSelectedId}
            lang={lang}
            onCenter={() => (setNavOpen(true), setCenterRequest((value) => value + 1))}
          />
        )}
        <details className="geographic-notes">
          <summary>{tr("Street layout, buildings & field checks", "ผังถนน อาคาร และจุดที่ต้องตรวจ")}</summary>
          <p>
            {tr(
              "Illustrated 3D model · connected street ground · approximate architecture",
              "แบบจำลอง 3 มิติ · พื้นถนนเชื่อมต่อกัน · สถาปัตยกรรมโดยประมาณ",
            )}
          </p>
          <p>
            Roads, shared alleys, footways and steps use mapped centerlines and shared junction nodes inside the red
            district boundary. Neutral paving is part of the 3D ground. Ordinary buildings follow mapped footprints,
            with space reserved for the separate illustrated landmark models.
          </p>
          <p>
            Widths without mapped measurements, building heights, roofs, frontage details and fitted visual landmark
            positions remain approximate. Restricted, covered, unconfirmed and conflicting passages are excluded from
            walking directions. Saved visitor coordinates stay separate from 3D building objects.
          </p>
        </details>
        <ArchitectureNotes lang={lang} />
      </MenuDrawer>

      {!editing && cardOpen && selected && (
        <VisitorPlaceCard
          key={selected.id}
          place={selected}
          sequence={visiblePlaces}
          places={places}
          fix={location.usableFix}
          lang={lang}
          onClose={closeCard}
          onSelect={(id) => selectPlace(id)}
        />
      )}

      {editing && (
        <Sheet open={structurePanelOpen && !!selectedStructure} onOpenChange={setStructurePanelOpen}>
          <SheetContent side={isMobile ? "bottom" : "right"} showCloseButton={false} className="place-sheet editor-sheet">
            <div className="sheet-close">
              <Button variant="outline" size="icon" aria-label="Close structure editor" onClick={() => setStructurePanelOpen(false)}>
                <Icon.X />
              </Button>
            </div>
            <SheetTitle className="sr-only">{selectedStructure?.label || "3D structure"}</SheetTitle>
            <SheetDescription className="sr-only">Edit this separate 3D structure in the shared draft.</SheetDescription>
            {selectedStructure && (
              <>
                <StructureEditor
                  structure={selectedStructure}
                  onChange={changeStructure}
                  busy={busy}
                  onPlaceGeographic={() => (setNavPlacing({ kind: "structure", id: selectedStructure.id }), setNavOpen(true), setStructurePanelOpen(false))}
                  onPlace={() => (setView("immersive"), setStructurePlacing(true), setStructurePanelOpen(false))}
                />
                <div className="structure-save">
                  <Button onClick={() => saveDraft()} disabled={busy || saveView.state === "saved"}>
                    Save draft
                  </Button>
                  <span>{saveView.state === "saved" ? "Draft saved" : "Unsaved changes"}</span>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      )}

      {editing && (
        <Sheet open={!!queuePhoto} onOpenChange={(open) => open || setQueuePhotoId(null)}>
          <SheetContent side={isMobile ? "bottom" : "right"} showCloseButton={false} className="place-sheet editor-sheet">
            <div className="sheet-close">
              <Button variant="outline" size="icon" aria-label="Close photo review" onClick={() => setQueuePhotoId(null)}>
                <Icon.X />
              </Button>
            </div>
            <SheetTitle className="sr-only">{queuePhoto?.title || "Fieldwork photo"}</SheetTitle>
            <SheetDescription className="sr-only">Match this photo to a saved place or a confirmed map position.</SheetDescription>
            {queuePhoto && (
              <PhotoQueueReview
                key={queuePhoto.id}
                photo={queuePhoto}
                place={doc.places.find((place) => place.photoSource === queuePhoto.asset) ?? null}
                places={doc.places}
                stage={queueStage}
                error={queueError}
                onAttach={(placeId) => void attachQueuePhoto(queuePhoto, placeId)}
                onPlace3D={() => startAddPin(queuePhoto)}
                onPlaceNavigation={() => (setNavPlacing({ kind: "photo", photo: queuePhoto }), setQueuePhotoId(null), setNavOpen(true))}
                onOpenPlace={(id) => (setQueuePhotoId(null), setWorkspace("places"), selectPlace(id))}
              />
            )}
          </SheetContent>
        </Sheet>
      )}

      <Sheet open={navOpen} onOpenChange={(open) => (open ? setNavOpen(true) : (setNavOpen(false), setNavPlacing(null)))}>
        <SheetContent side={isMobile ? "bottom" : "right"} showCloseButton={false} className="navigation-sheet">
          <div className="sheet-close">
            <Button variant="outline" size="icon" aria-label="Close navigation" onClick={() => (setNavOpen(false), setNavPlacing(null))}>
              <Icon.X />
            </Button>
          </div>
          <SheetTitle>{navPlacing ? "Tap the map to set the location" : tr("Talat Noi navigation", "นำทางตลาดน้อย")}</SheetTitle>
          <SheetDescription>
            {navPlacing
              ? "Tap the exact entrance on the navigation map. This sets real-world coordinates."
              : tr("Local streets, geographic labels and your private live position.", "ถนน ชื่อสถานที่ และตำแหน่งสดส่วนตัวของคุณ")}
          </SheetDescription>
          <NavigationMap
            location={location}
            places={visiblePlaces}
            selectedId={selectedId}
            lang={lang}
            centerRequest={centerRequest}
            placing={!!navPlacing}
            onSelect={(id) => (setNavOpen(false), selectPlace(id))}
            onPlaceCoordinates={placeFromNavigation}
          />
          <DirectionsList
            location={location}
            places={places}
            selectedId={selectedId}
            onSelect={setSelectedId}
            lang={lang}
            onCenter={() => setCenterRequest((value) => value + 1)}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!publishDialog} onOpenChange={(open) => open || setPublishDialog(null)}>
        <AlertDialogContent data-testid="publish-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Publish {doc.places.filter((place) => place.approved).length} places to visitors?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces the visitor map for everyone. Places hidden from visitors stay in the draft.{" "}
              {doc.places.filter((place) => place.approved && place.verification === "pending").length} published places
              still show a “Needs verification” label.
            </AlertDialogDescription>
            <div className="publish-summary" role="status">
              {publishDialog?.summary?.length ? (
                <ul>
                  {publishDialog.summary.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                "No visible changes since the last publish."
              )}
              {doc.places.some((place) => !place.approved) && (
                <p>{doc.places.filter((place) => !place.approved).length} hidden places stay in the draft.</p>
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishing}>Keep editing</AlertDialogCancel>
            <Button onClick={() => (setPublishDialog(null), setMode("preview"))} variant="outline" disabled={publishing}>
              <Icon.Eye /> Preview first
            </Button>
            <AlertDialogAction
              onClick={(event) => (event.preventDefault(), confirmPublish())}
              disabled={publishing}
              data-testid="publish-confirm"
            >
              {publishing ? <Icon.Loader className="ed-spin" /> : <Icon.Earth />} Publish now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => open || setDeleteTarget(null)}>
        <AlertDialogContent data-testid="delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{doc.places.find((place) => place.id === deleteTarget)?.nameEn}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The place and its pin are removed from the draft. Visitors keep seeing it until you save and publish. You
              can undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep place</AlertDialogCancel>
            <AlertDialogAction
              className="ed-destructive"
              onClick={() => deletePlace(deleteTarget)}
              data-testid="delete-confirm"
            >
              <Icon.Trash /> Delete place
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={exitDialog} onOpenChange={setExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save your changes before leaving?</AlertDialogTitle>
            <AlertDialogDescription>
              You have changes that are not saved to the shared draft yet. A copy stays on this device either way.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <Button variant="outline" onClick={leaveEditor}>
              Leave without saving
            </Button>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                (await saveDraft()) ? leaveEditor() : setExitDialog(false);
              }}
            >
              <Icon.Save /> Save and leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!conflict} onOpenChange={(open) => open || setConflict(null)}>
        <AlertDialogContent data-testid="conflict-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>The shared draft was changed by someone else</AlertDialogTitle>
            <AlertDialogDescription>
              {conflict?.message} Their version was saved
              {conflict?.current?.updatedAt
                ? ` ${new Date(conflict.current.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`
                : " recently"}
              . Nothing has been overwritten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="ed-conflict-options">
            <Button variant="outline" onClick={exportBackup}>
              <Icon.Download /> Download my changes
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!conflict?.current) return;
                applyDraft(conflict.current);
                setConflict(null);
                store && Recovery.clear(store.kind);
                toast("Loaded the newer draft. Your changes were discarded.");
              }}
            >
              Load their version (discard mine)
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setConflict(null);
                const ok = await saveDraft({ force: true });
                ok && toast.success("Your version replaced the shared draft.");
              }}
            >
              Replace theirs with mine
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <input
        ref={importRef}
        hidden
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          file && importBackup(file);
          event.target.value = "";
        }}
      />
      <Toaster position="top-center" richColors />
    </main>
  );
}

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
  await tab.waitForSelector(".three-marker:not([hidden])", { timeout: 30000 });
  await tab.waitForTimeout(800);
  return { context, tab, errors };
}

const fakeDb = (tab, path) => tab.evaluate((p) => JSON.parse(localStorage.getItem(`fake-db:${p}`) || "null"), path);
const saveState = (tab) => tab.locator("[data-testid=save-status]").getAttribute("data-state");
const compass = (tab) => tab.locator(".scene-compass").innerText();
const markerBox = (tab, id) => tab.locator(`.three-marker[data-place-id="${id}"]`).boundingBox();
const realLocation = (tab) => tab.locator("[data-testid=real-location]").innerText();

async function enterEditor(tab) {
  await tab.click("[data-testid=edit-map]");
  await tab.waitForSelector("[data-testid=editor-toolbar]");
  await tab.waitForTimeout(600);
}

async function selectPin(tab, id) {
  const box = await markerBox(tab, id);
  await tab.mouse.click(box.x + box.width / 2, box.y + 22);
  await tab.waitForSelector("[data-testid=place-panel]", { timeout: 5000 });
}

async function waitSaved(tab) {
  await tab.waitForFunction(() => document.querySelector("[data-testid=save-status]")?.dataset.state !== "saving", null, { timeout: 15000 });
  return saveState(tab);
}

// Pointer drag dispatched as real input (mouse) or as touch pointer events.
async function dragPin(tab, from, to, { touch = false } = {}) {
  if (!touch) {
    await tab.mouse.move(from.x, from.y);
    await tab.mouse.down();
    for (let i = 1; i <= 12; i++) await tab.mouse.move(from.x + ((to.x - from.x) * i) / 12, from.y + ((to.y - from.y) * i) / 12);
    await tab.mouse.up();
    return;
  }
  await tab.evaluate(
    async ({ from, to }) => {
      const target = document.elementFromPoint(from.x, from.y);
      const fire = (el, type, x, y) =>
        el.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: "touch", isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, button: 0 }));
      fire(target, "pointerdown", from.x, from.y);
      for (let i = 1; i <= 12; i++) {
        fire(target, "pointermove", from.x + ((to.x - from.x) * i) / 12, from.y + ((to.y - from.y) * i) / 12);
        await new Promise((r) => requestAnimationFrame(r));
      }
      fire(target, "pointerup", to.x, to.y);
    },
    { from, to },
  );
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
  // 1. Visitors: no editing controls, published map intact.
  if (only.includes("visitor")) {
    const { context, tab, errors } = await openPage(browser, { role: "viewer", fresh: true });
    check((await tab.locator(".three-marker:not([hidden])").count()) >= 10, "visitor map shows the illustrated 3D pins");
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
  check((await saveState(tab)) === "saved", "starts in the Saved state");
  await tab.screenshot({ path: join(shots, "02-editor.png") });

  // Select and highlight a pin.
  await selectPin(tab, "so-heng-tai");
  check(await tab.locator('.three-marker[data-place-id="so-heng-tai"]').evaluate((el) => el.classList.contains("selected")), "clicking a pin selects and highlights it");
  check((await tab.locator("[data-testid=place-panel] h2").innerText()).includes("So Heng Tai"), "the editing panel opens for that place");
  const startLocation = await realLocation(tab);
  const illustrationBefore = await tab.locator(".ed-position-card").nth(1).locator(".ed-position-value").innerText();

  // Drag the selected pin: camera stays still during the drag.
  const angleBefore = await compass(tab);
  await tab.click("[data-testid=panel-move-pin]");
  await tab.waitForSelector("[data-testid=placement-bar]");
  let box = await markerBox(tab, "so-heng-tai");
  await dragPin(tab, { x: box.x + box.width / 2, y: box.y + 22 }, { x: box.x + box.width / 2 + 70, y: box.y + 22 + 30 });
  await tab.waitForTimeout(400);
  check((await compass(tab)) === angleBefore, "camera does not rotate while a pin is dragged", `${angleBefore} -> ${await compass(tab)}`);
  const dragged = await tab.locator("[data-testid=pending-coordinates]").innerText();
  check(!startLocation.startsWith(dragged.slice(0, 9)) || dragged !== startLocation, "dragging shows a live placement preview", dragged);
  check(await tab.locator("[data-testid=placement-confirm]").isEnabled(), "Confirm position is available after dragging");
  await tab.screenshot({ path: join(shots, "03-dragging.png") });

  // Nudge and top-down view.
  await tab.click("[data-testid=top-view]");
  await tab.waitForTimeout(500);
  const beforeNudge = await tab.locator("[data-testid=pending-coordinates]").innerText();
  await tab.click('button[aria-label="Nudge right by 1 m"]');
  await tab.click('button[aria-label="Nudge right by 1 m"]');
  await tab.waitForTimeout(200);
  check((await tab.locator("[data-testid=pending-coordinates]").innerText()) !== beforeNudge, "arrow buttons nudge the pin");
  await tab.screenshot({ path: join(shots, "04-top-down.png") });
  await tab.click("[data-testid=placement-confirm]");
  await tab.waitForSelector("[data-testid=place-panel]");
  const moved = await realLocation(tab);
  check(moved !== startLocation, "Confirm saves the new real location", `${startLocation} -> ${moved}`);
  check((await tab.locator(".ed-position-card").nth(1).locator(".ed-position-value").innerText()) === illustrationBefore, "the flat-illustration position is not changed by a 3D move");
  check((await saveState(tab)) === "unsaved", "status shows Unsaved changes");

  // Normal camera controls are back after the move.
  const surface = await tab.locator(".three-surface").boundingBox();
  await tab.click("[data-testid=place-panel] [aria-label='Close place panel']");
  const angle1 = await compass(tab);
  await tab.mouse.move(surface.x + 120, surface.y + surface.height - 140);
  await tab.mouse.down();
  for (let i = 1; i <= 10; i++) await tab.mouse.move(surface.x + 120 + i * 25, surface.y + surface.height - 140);
  await tab.mouse.up();
  await tab.waitForTimeout(500);
  check((await compass(tab)) !== angle1, "map rotation works again after moving a pin", `${angle1} -> ${await compass(tab)}`);
  await tab.click('[aria-label="Reset 3D view"]');
  await tab.waitForTimeout(500);

  // Cancel a move: Move pin → tap destination → Cancel.
  await selectPin(tab, "rong-kueak");
  const rongBefore = await realLocation(tab);
  await tab.click("[data-testid=tool-move-pin]");
  await tab.waitForSelector("[data-testid=placement-bar]");
  box = await markerBox(tab, "rong-kueak");
  await tab.mouse.click(box.x + box.width / 2 - 60, box.y + 80);
  await tab.waitForTimeout(300);
  check((await tab.locator("[data-testid=pending-coordinates]").count()) === 1, "tapping the destination places a preview");
  await tab.click("[data-testid=placement-cancel]");
  await tab.waitForSelector("[data-testid=place-panel]");
  check((await realLocation(tab)) === rongBefore, "Cancel keeps the original position", rongBefore);

  // Tap-to-place + confirm, then undo / redo.
  await tab.click("[data-testid=panel-move-pin]");
  box = await markerBox(tab, "rong-kueak");
  await tab.mouse.click(box.x + box.width / 2 + 50, box.y + 90);
  await tab.waitForTimeout(300);
  await tab.click("[data-testid=placement-confirm]");
  await tab.waitForSelector("[data-testid=place-panel]");
  const rongMoved = await realLocation(tab);
  check(rongMoved !== rongBefore, "Move pin → tap → Confirm position moves the pin");
  await tab.click("[data-testid=tool-undo]");
  await tab.waitForTimeout(200);
  check((await realLocation(tab)) === rongBefore, "Undo restores the previous position");
  await tab.click("[data-testid=tool-redo]");
  await tab.waitForTimeout(200);
  check((await realLocation(tab)) === rongMoved, "Redo re-applies the move");

  // Edit details (grouped into one undo step).
  const nameInput = tab.locator("[data-testid=place-panel] input[name=nameEn]");
  await nameInput.fill("Rong Kueak Shrine");
  await nameInput.fill("Rong Kueak Shrine (Shoe Shrine)");
  await tab.locator("[data-testid=place-panel] textarea[name=storyEn]").fill("Edited story for the test.");
  check((await tab.locator('.stop[data-place-id="rong-kueak"] strong').innerText()).includes("Shoe Shrine"), "editing the name updates the list");
  await tab.locator("body").click({ position: { x: 5, y: 5 } }).catch(() => {});

  // Photo: upload, preview, caption/alt/credit.
  await tab.locator("[data-testid=photo-section] input[type=file]").setInputFiles({ name: "shrine.png", mimeType: "image/png", buffer: tinyPng() });
  await tab.waitForSelector("[data-testid=photo-section] img.place-photo[src*='/_blob/']", { timeout: 15000 });
  check(true, "uploaded photo appears immediately in the panel");
  await tab.locator("[data-testid=place-panel] input[name=photoCaption]").fill("Shrine gate at dusk");
  await tab.locator("[data-testid=place-panel] input[name=photoAlt]").fill("Red shrine gate with lanterns");
  await tab.locator("[data-testid=place-panel] input[name=photoCredit]").fill("Photo by Test");
  await tab.screenshot({ path: join(shots, "05-panel-photo.png") });

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
  await tab.waitForSelector(".three-marker:not([hidden])");
  await enterEditor(tab);
  await selectPin(tab, "rong-kueak");
  check((await realLocation(tab)) === rongMoved, "after refresh the pin is at its saved position", await realLocation(tab));
  check(await tab.locator("[data-testid=photo-section] img.place-photo[src*='/_blob/']").isVisible(), "after refresh the uploaded photo is shown");
  await tab.click("[data-testid=place-panel] [aria-label='Close place panel']");

  // Add a pin.
  await tab.click("[data-testid=tool-add-pin]");
  await tab.waitForSelector("[data-testid=placement-bar]");
  check(!(await tab.locator("[data-testid=placement-confirm]").isEnabled()), "Add pin waits for a tap on the map");
  await tab.mouse.click(surface.x + surface.width * 0.52, surface.y + surface.height * 0.48);
  await tab.waitForTimeout(400);
  check(await tab.locator(".three-ghost-pin:not([hidden])").isVisible(), "a preview pin shows where the new place goes");
  await tab.screenshot({ path: join(shots, "06-add-pin.png") });
  await tab.click("[data-testid=placement-confirm]");
  await tab.waitForSelector("[data-testid=add-place-form]");
  await tab.click("[data-testid=add-place-submit]");
  check(await tab.locator("[data-testid=add-place-form] .ed-error").isVisible(), "the short form asks for a name");
  await tab.locator("[data-testid=add-place-form] input[name=nameEn]").fill("Test Noodle Shop");
  await tab.locator("[data-testid=add-place-form] label:has-text('Food & drink')").click();
  await tab.screenshot({ path: join(shots, "07-add-form.png") });
  await tab.click("[data-testid=add-place-submit]");
  check((await waitSaved(tab)) === "saved", "Add place saves the draft");
  draft = await fakeDb(tab, "map/draft");
  const added = draft.places.find((place) => place.id === "test-noodle-shop");
  check(!!added && added.category === "Food & drink" && Number.isFinite(added.lat) && added.illustrationEstimated === true, "new place is stored with coordinates and a readable ID", added && `${added.lat}, ${added.lng}`);
  check(await tab.locator('.stop[data-place-id="test-noodle-shop"]').isVisible(), "new place appears in the searchable list");

  // Search the list and focus a pin from it.
  await tab.locator("[data-testid=list-search]").fill("holy");
  check((await tab.locator(".stop-list .stop").count()) === 1, "the place list can be searched");
  await tab.locator('.stop[data-place-id="holy-rosary"]').click();
  await tab.waitForTimeout(700);
  check(await tab.locator('.three-marker[data-place-id="holy-rosary"]').evaluate((el) => el.classList.contains("selected")), "choosing a list entry highlights its pin");
  await tab.locator("[data-testid=list-search]").fill("");

  // Delete with confirmation, undo, delete again.
  await tab.locator('.stop[data-place-id="test-noodle-shop"]').click();
  await tab.click("[data-testid=delete-place]");
  check(await tab.locator("[data-testid=delete-dialog]").isVisible(), "deleting asks for confirmation");
  await tab.click("[data-testid=delete-confirm]");
  await tab.waitForTimeout(200);
  check((await tab.locator('.stop[data-place-id="test-noodle-shop"]').count()) === 0, "confirmed delete removes the place");
  await tab.click("[data-testid=tool-undo]");
  await tab.waitForTimeout(200);
  check((await tab.locator('.stop[data-place-id="test-noodle-shop"]').count()) === 1, "Undo brings a deleted place back");

  // Overlapping pins: put two places on the same spot.
  await tab.locator('.stop[data-place-id="old-bank"]').click();
  await tab.locator("[data-testid=position-section] summary").click();
  await tab.locator("[data-testid=place-panel] input[name=lat]").fill("13.73555");
  await tab.locator("[data-testid=place-panel] input[name=lng]").fill("100.51418");
  await tab.click("[data-testid=place-panel] [aria-label='Close place panel']");
  await tab.locator('.stop[data-place-id="holy-rosary"]').click(); // focuses the shared spot
  await tab.click("[data-testid=place-panel] [aria-label='Close place panel']");
  await tab.waitForTimeout(800);
  // Tap the ground just below the shared spot, where both pins' ground points are.
  const spot = await tab.evaluate(() => {
    const surface = document.querySelector(".three-surface").getBoundingClientRect();
    const markers = ["old-bank", "holy-rosary"].map((id) => document.querySelector(`.three-marker[data-place-id="${id}"]`));
    const still = markers.find((el) => !el.classList.contains("moved")) ?? markers[0];
    return { x: surface.left + parseFloat(still.style.left), y: surface.top + parseFloat(still.style.top), spread: markers.some((el) => el.classList.contains("moved")) };
  });
  check(spot.spread, "pins on the same spot are spread apart with a leader line");
  await tab.mouse.click(spot.x, spot.y + 22);
  await tab.waitForTimeout(300);
  const chooser = await tab.locator(".pin-chooser").count();
  check(chooser === 1, "overlapping pins offer a list to pick one");
  if (chooser) {
    await tab.screenshot({ path: join(shots, "08-overlap-chooser.png") });
    await tab.locator(".pin-chooser button", { hasText: "Old Commercial Quarter" }).click();
    await tab.waitForSelector("[data-testid=place-panel]");
    check((await tab.locator("[data-testid=place-panel] h2").innerText()).includes("Old Commercial"), "choosing from the list selects that pin");
  }
  // A plain click on the selected pin keeps it selected and does not start a move.
  const oldBank = await markerBox(tab, "old-bank");
  await tab.click("[data-testid=place-panel] [aria-label='Close place panel']");
  await tab.mouse.click(oldBank.x + oldBank.width / 2, oldBank.y + 22);
  await tab.waitForTimeout(300);
  check((await tab.locator("[data-testid=placement-bar]").count()) === 0, "clicking the selected pin does not start a move");
  await tab.locator("[data-testid=place-panel] [aria-label='Close place panel']").click().catch(() => {});
  await tab.click("[data-testid=tool-undo]"); // undo longitude
  await tab.click("[data-testid=tool-undo]"); // undo latitude
  await tab.waitForTimeout(200);

  // Save failure keeps edits and offers Retry.
  await tab.locator('.stop[data-place-id="holy-rosary"]').click();
  await tab.locator("[data-testid=place-panel] input[name=hours]").fill("Daily 06:00–18:00");
  await tab.evaluate(() => localStorage.setItem("fake-fail", "always"));
  await tab.click("[data-testid=tool-save]");
  check((await waitSaved(tab)) === "failed", "a failed save shows Save failed");
  check(await tab.locator("[data-testid=retry-save]").isVisible(), "a Retry button is offered");
  check((await tab.locator("[data-testid=place-panel] input[name=hours]").inputValue()) === "Daily 06:00–18:00", "unsaved edits are kept after a failed save");
  await tab.screenshot({ path: join(shots, "09-save-failed.png") });
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
  await tab.screenshot({ path: join(shots, "10-conflict.png") });
  await tab.getByRole("button", { name: "Replace theirs with mine" }).click();
  check((await waitSaved(tab)) === "saved", "after confirming, your version can replace theirs");

  // Preview, then publish.
  await tab.click("[data-testid=tool-preview]");
  await tab.waitForSelector("[data-testid=preview-banner]");
  check((await tab.locator("[data-testid=editor-toolbar]").count()) === 0, "Preview shows the visitor experience without editing tools");
  await tab.screenshot({ path: join(shots, "11-preview.png") });
  await tab.click("[data-testid=preview-back]");
  await tab.waitForSelector("[data-testid=editor-toolbar]");
  await tab.click("[data-testid=tool-publish]");
  await tab.waitForSelector("[data-testid=publish-dialog]");
  check((await tab.locator("[data-testid=publish-dialog] .publish-summary").innerText()).match(/moved|edited|new/), "publishing shows what will change");
  await tab.screenshot({ path: join(shots, "12-publish.png") });
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
  await tab.waitForSelector(".three-marker:not([hidden])");
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
    await tab.screenshot({ path: join(shots, "13-mobile-editor.png") });
    let box = await markerBox(tab, "so-heng-tai");
    await tab.touchscreen.tap(box.x + box.width / 2, box.y + 22);
    await tab.waitForSelector("[data-testid=place-panel]", { timeout: 5000 });
    check(true, "tapping a pin on a phone opens the panel");
    const before = await realLocation(tab);
    await tab.screenshot({ path: join(shots, "14-mobile-panel.png") });
    await tab.locator("[data-testid=panel-move-pin]").tap();
    await tab.waitForSelector("[data-testid=placement-bar]");
    box = await markerBox(tab, "so-heng-tai");
    await tab.touchscreen.tap(box.x + box.width / 2 + 40, box.y + 70);
    await tab.waitForTimeout(400);
    check((await tab.locator("[data-testid=pending-coordinates]").count()) === 1, "tap the destination works on a phone");
    box = await markerBox(tab, "so-heng-tai");
    const angle = await compass(tab);
    await dragPin(tab, { x: box.x + box.width / 2, y: box.y + 22 }, { x: box.x + box.width / 2 - 40, y: box.y + 50 }, { touch: true });
    await tab.waitForTimeout(300);
    check((await compass(tab)) === angle, "touch-dragging a pin does not rotate the camera");
    await tab.screenshot({ path: join(shots, "15-mobile-placement.png") });
    await tab.locator("[data-testid=placement-confirm]").tap();
    await tab.waitForSelector("[data-testid=place-panel]");
    check((await realLocation(tab)) !== before, "Confirm position works on a phone");
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

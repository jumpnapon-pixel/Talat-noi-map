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
const { PNG } = require("pngjs");
const jsQRModule = require("jsqr");
const jsQR = jsQRModule.default ?? jsQRModule;
const root = fileURLToPath(new URL("..", import.meta.url));
const page = process.argv.slice(2).find((arg) => !arg.startsWith("--")) ?? "index.html";
const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7).split(",") ?? ["visitor", "guide", "launch", "desktop", "mobile"];
const shots = join(root, "test-results");
const seed = JSON.parse(readFileSync(join(root, "src/data/published-seed.json"), "utf8"));
const SHARE_URL = readFileSync(join(root, "src/app/share.jsx"), "utf8").match(/const SHARE_URL = "([^"]+)"/)[1];
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

async function openPage(browser, { role = "editor", device = null, fresh = false, options = {}, time = null, url = base, guest = false, init = null } = {}) {
  const context = await browser.newContext({ ...(device ? { ...devices[device] } : { viewport: { width: 1366, height: 860 } }), ...options });
  await context.exposeBinding("__storeAsset", (_source, id, b64, type) => assets.set(id, { body: Buffer.from(b64, "base64"), type }));
  await context.route("**/_blob/*", (route) => {
    const asset = assets.get(route.request().url().split("/_blob/")[1]);
    return asset ? route.fulfill({ body: asset.body, contentType: asset.type }) : route.fulfill({ status: 404 });
  });
  if (!guest) await context.addInitScript(installFakeRuntime, { role });
  if (init) await context.addInitScript(init);
  const tab = await context.newPage();
  if (time) await tab.clock.setFixedTime(new Date(time));
  const errors = [];
  tab.on("pageerror", (error) => errors.push(error.message));
  tab.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await tab.goto(url, { waitUntil: "networkidle" });
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

async function selectPin(tab, id, { touch = false, panel = "[data-testid=place-panel]" } = {}) {
  const box = await marker(tab, id).boundingBox();
  touch ? await tab.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2) : await marker(tab, id).click();
  await tab.waitForSelector(panel, { timeout: 5000 });
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
const browser = await chromium.launch({ args: ["--host-resolver-rules=MAP guest.test 127.0.0.1"] });

async function decodeQr(locator) {
  const png = PNG.sync.read(await locator.screenshot());
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data ?? null;
}
try {
  // 1. Visitors: the illustrated map, no 3D view, no editing controls.
  if (only.includes("visitor")) {
    const { context, tab, errors } = await openPage(browser, { role: "viewer", fresh: true });
    check((await tab.locator(".map-marker[data-place-id]").count()) >= 10, "visitor map shows the place pins on the illustration");
    check((await tab.locator(".filter-bar .view-switch button[aria-pressed=true]").innerText()).trim() === "Illustrated", "the map opens on the Illustrated view");
    const views = (await tab.locator(".filter-bar .view-switch button").allInnerTexts()).map((text) => text.trim());
    check(!views.some((text) => /3D/.test(text)) && (await tab.locator("canvas").count()) === 0, "there is no 3D view", views.join(", "));
    check((await tab.locator("[data-testid=edit-map]").count()) === 0, "viewers do not get an Edit map button");
    check((await tab.locator(".map-marker[data-place-id]").count()) === seed.places.filter((place) => place.approved).length, "every published place has a pin");
    check(await marker(tab, "32bar-x-chocolate").isVisible(), "32Bar X has a pin on the map");
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

  // 1b. The visitor guide (research brief of 11 Nov 2026).
  if (only.includes("guide")) {
    const { context, tab, errors } = await openPage(browser, { role: "viewer", fresh: true });
    const BRIEF_IDS = ["holy-rosary", "old-bank", "so-heng-tai", "rong-kueak", "street-art-lane", "chow-sue-kong", "fieldwork-p01", "fieldwork-p02", "fieldwork-p03", "fieldwork-p04", "fieldwork-p05", "fieldwork-p07", "fieldwork-p08", "fieldwork-p09", "fieldwork-p10"];
    const PHOTOS = { "holy-rosary": "153419", "fieldwork-p01": "155403", "fieldwork-p02": "153940", "fieldwork-p03": "154919", "fieldwork-p04": "154539", "fieldwork-p05": "152613", "fieldwork-p07": "153358", "fieldwork-p08": "152829", "fieldwork-p09": "152547", "fieldwork-p10": "150559" };
    const briefPlaces = seed.places.filter((place) => BRIEF_IDS.includes(place.id));
    check(briefPlaces.length === 15 && briefPlaces.every((place) => place.previewEn && place.previewTh && place.storyEn && place.storyTh && place.tipEn && place.tipTh), "all 15 places have English and Thai preview, story and visit note");
    check(briefPlaces.every((place) => !/\[(S|P)\d\d\]/.test(`${place.storyEn}${place.storyTh}${place.tipEn}${place.previewEn}`)), "no evidence keys like [S03] in visitor text");
    check(Object.entries(PHOTOS).every(([id, file]) => seed.places.find((place) => place.id === id).photoUrl.includes(file)), "the ten field photos are on the intended places");
    check(seed.places.find((place) => place.id === "holy-rosary").photoUrl !== seed.places.find((place) => place.id === "fieldwork-p07").photoUrl, "the church and Bumblebee keep separate photos");

    // Old titles and Thai aliases still find renamed places.
    const search = tab.locator(".search-field input");
    for (const [term, id] of [["Local snack shop", "fieldwork-p03"], ["Yellow robot sculpture", "fieldwork-p07"], ["บัมเบิ้ลบี", "fieldwork-p07"], ["Outdoor photography display", "fieldwork-p08"], ["Mother Roaster entrance", "fieldwork-p09"], ["Som tam", "fieldwork-p05"], ["coffee", "fieldwork-p09"], ["กาแฟ", "fieldwork-p09"], ["chocolate", "32bar-x-chocolate"]]) {
      await search.fill(term);
      await tab.waitForTimeout(150);
      check((await tab.locator(`.stop[data-place-id="${id}"]`).count()) === 1, `searching “${term}” finds ${id}`);
    }
    await search.fill("rosary");
    await tab.waitForTimeout(150);
    check((await tab.locator(".stop[data-place-id]").first().getAttribute("data-place-id")) === "holy-rosary", "name matches come first in search results");
    await search.fill("");
    check(
      (await tab.evaluate(() => [...document.querySelectorAll("button")].some((button) => button.textContent.includes("Street map")))) === false,
      "the unavailable Street map view is gone",
    );

    // Card structure: preview first, story behind Read the story, sources, labels.
    await marker(tab, "holy-rosary").click();
    await tab.waitForSelector("[data-testid=place-card]");
    check((await tab.locator("[data-testid=card-preview]").innerText()).startsWith("Look for the gate"), "the card opens with the one-sentence preview");
    check(!(await tab.locator("[data-testid=read-story]").evaluate((el) => el.open)), "the full story waits behind Read the story");
    await tab.locator("[data-testid=read-story] summary").click();
    check((await tab.locator("[data-testid=read-story]").innerText()).includes("Kalawar"), "Read the story opens the full history");
    check((await tab.locator("[data-testid=sources] a").count()) === 4, "Holy Rosary Church lists its 4 sources as links");
    check(await tab.locator("[data-testid=label-to-confirm]").isVisible(), "unconfirmed places say Location to confirm");
    check((await tab.locator("[data-testid=place-card] .walking-button").count()) === 0 && (await tab.locator("[data-testid=no-directions]").isVisible()), "no Directions for an unconfirmed entrance");
    await tab.screenshot({ path: join(shots, "03-guide-card.png") });
    // Related stop opens that place.
    await tab.locator('[data-testid=related-stops] [data-related-id="fieldwork-p07"]').click();
    await tab.waitForSelector('[data-testid=place-card][data-place-id="fieldwork-p07"]');
    check(true, "a related stop opens its own card");
    await tab.locator("[data-testid=place-card] .panel-close").click();

    // Area guide and field note.
    await marker(tab, "old-bank").click();
    await tab.waitForSelector('[data-testid=place-card][data-place-id="old-bank"]');
    check(await tab.locator("[data-testid=label-area-guide]").isVisible(), "the neighbourhood entry is labelled Area guide");
    check((await tab.locator("[data-testid=label-to-confirm]").count()) === 0 && (await tab.locator("[data-testid=place-card] .walking-button").count()) === 0, "an area guide does not route anywhere");
    await tab.locator("[data-testid=place-card] .panel-close").click();
    await marker(tab, "fieldwork-p02").click();
    await tab.waitForSelector('[data-testid=place-card][data-place-id="fieldwork-p02"]');
    check(await tab.locator("[data-testid=label-field-note]").isVisible(), "the unnamed cart is a Field note");
    check((await tab.locator("[data-testid=place-card] .walking-button").count()) === 0, "the unnamed cart cannot launch directions");
    await tab.locator("[data-testid=place-card] .panel-close").click();

    // Navigation menu offers directions only to confirmed places.
    await tab.locator(".menu-button").click();
    await tab.waitForTimeout(300);
    await tab.locator("#tour-menu #walking-destination").click();
    await tab.waitForSelector("[role=option]");
    const destinations = await tab.locator("[role=option]").allInnerTexts();
    const confirmed = seed.places.filter((place) => place.entranceConfirmed && place.kind !== "area-guide" && place.lat !== null).map((place) => place.nameEn);
    check(destinations.length === confirmed.length && destinations.every((name) => confirmed.includes(name.trim())), "the navigation menu lists only confirmed destinations", destinations.join(", ") || "none");
    await tab.keyboard.press("Escape");
    await tab.keyboard.press("Escape");
    await tab.waitForTimeout(200);

    // Plan your walk keeps search, filter and map position.
    await tab.locator(".filter-row button", { hasText: "Food & drink" }).click();
    await search.fill("o");
    await tab.locator(".zoom-controls button[aria-label='Zoom in']").click();
    await tab.waitForTimeout(300);
    const zoomBefore = await tab.locator(".map-gesture-hint span").innerText();
    await tab.locator("[data-testid=plan-walk]").click();
    await tab.waitForSelector("[data-testid=walk-guide]");
    await tab.locator('[data-chapter="lanes"] .walk-chapter-head').click();
    await tab.locator('[data-chapter="lanes"] [data-walk-stop="rong-kueak"]').click();
    await tab.waitForSelector('[data-testid=place-card][data-place-id="rong-kueak"]');
    check(true, "a walk chapter opens a place card");
    await tab.screenshot({ path: join(shots, "04-walk.png") });
    await tab.locator("[data-testid=place-card] .panel-close").click();
    await tab.waitForTimeout(200);
    check(await tab.locator("[data-testid=walk-guide]").isVisible(), "closing the card returns to the walk");
    check(
      (await search.inputValue()) === "o" &&
        (await tab.locator(".filter-row button[aria-pressed=true]").innerText()).includes("Food") &&
        (await tab.locator(".map-gesture-hint span").innerText()) === zoomBefore,
      "search, filter and map zoom are unchanged after visiting a stop",
    );
    check(errors.length === 0, "no page errors in the guide", errors.join(" | "));
    await context.close();

    // Thai on a phone: the card wraps without sideways scrolling.
    const phone = await openPage(browser, { role: "viewer", device: "iPhone 13", fresh: true });
    await phone.tab.locator(".language-button").tap();
    await selectPin(phone.tab, "chow-sue-kong", { touch: true, panel: "[data-testid=place-card]" });
    await phone.tab.locator("[data-testid=read-story] summary").tap();
    await phone.tab.locator("[data-testid=sources] summary").tap();
    await phone.tab.waitForTimeout(300);
    const overflow = await phone.tab.locator("[data-testid=place-card] .panel-scroll").evaluate((el) => el.scrollWidth - el.clientWidth);
    check(overflow <= 1 && (await phone.tab.locator("[data-testid=read-story]").innerText()).includes("ศาลเจ้า"), "Thai story wraps on a phone", `overflow ${overflow}px`);
    await phone.tab.screenshot({ path: join(shots, "05-guide-thai-phone.png") });
    check(phone.errors.length === 0, "no page errors in Thai on a phone", phone.errors.join(" | "));
    await phone.context.close();
  }

  // 1c. Soft launch: researched hours, phone layout, sharing, guests.
  if (only.includes("launch")) {
    const NEVER_STATUS = ["holy-rosary", "old-bank", "rong-kueak", "street-art-lane", "fieldwork-p01", "fieldwork-p02", "fieldwork-p04", "fieldwork-p05", "fieldwork-p07", "fieldwork-p08", "fieldwork-p09", "fieldwork-p10"];
    const BRIEF = ["holy-rosary", "old-bank", "so-heng-tai", "rong-kueak", "street-art-lane", "chow-sue-kong", "fieldwork-p01", "fieldwork-p02", "fieldwork-p03", "fieldwork-p04", "fieldwork-p05", "fieldwork-p07", "fieldwork-p08", "fieldwork-p09", "fieldwork-p10"];
    const briefPlaces = seed.places.filter((place) => BRIEF.includes(place.id));
    check(briefPlaces.length === 15 && briefPlaces.every((place) => place.hoursStatus && (place.hoursNoteEn || place.hoursLabelEn) && place.hoursNoteTh && place.hoursReviewedOn === "2026-11-11"), "all 15 places have an hours or access note in English and Thai, reviewed 11 Nov 2026");
    check(briefPlaces.filter((place) => place.id !== "fieldwork-p02").every((place) => place.hoursSources.length > 0), "every place with a listing keeps its hours sources (the unnamed cart has none)");
    check(seed.places.filter((place) => ["published", "listed"].includes(place.hoursStatus)).map((place) => place.id).sort().join() === ["32bar-x-chocolate", "chow-sue-kong", "fieldwork-p03", "so-heng-tai"].sort().join(), "only Chow Sue Kong, Khun Pu, So Heng Tai (listed) and 32Bar X carry an Open/Closed schedule");

    // Status at fixed Bangkok times, seen from a device set to Los Angeles time.
    const statusAt = async (time) => {
      const { context, tab, errors } = await openPage(browser, { role: "viewer", fresh: true, time, options: { timezoneId: "America/Los_Angeles" } });
      await tab.locator(".list-toggle").click();
      const chips = await tab.evaluate(() =>
        Object.fromEntries([...document.querySelectorAll(".stop[data-place-id]")].map((row) => [row.dataset.placeId, row.querySelector("[data-testid=hours-chip]")?.textContent ?? ""])),
      );
      return { context, tab, errors, chips };
    };
    const times = {
      "Sun 10:00": "2026-11-15T03:00:00Z",
      "Mon 11:00": "2026-11-16T04:00:00Z",
      "Thu 05:30": "2026-11-11T22:30:00Z",
      "Thu 07:30": "2026-11-12T00:30:00Z",
      "Thu 10:00": "2026-11-12T03:00:00Z",
      "Thu 16:30": "2026-11-12T09:30:00Z",
    };
    const seen = {};
    for (const [label, time] of Object.entries(times)) {
      const run = await statusAt(time);
      seen[label] = run.chips;
      if (label !== "Thu 10:00") await run.context.close();
      else seen.page = run;
    }
    check(seen["Sun 10:00"]["fieldwork-p03"] === "Closed by schedule", "Khun Pu on a Sunday: Closed by schedule", seen["Sun 10:00"]["fieldwork-p03"]);
    check(seen["Sun 10:00"]["chow-sue-kong"] === "Open by schedule", "Chow Sue Kong on a Sunday morning: open for worship (office hours do not count)");
    check(seen["Mon 11:00"]["so-heng-tai"] === "Closed by schedule", "So Heng Tai on a Monday: Closed by schedule", seen["Mon 11:00"]["so-heng-tai"]);
    check(seen["Thu 05:30"]["chow-sue-kong"] === "Closed by schedule" && seen["Thu 10:00"]["chow-sue-kong"] === "Open by schedule" && seen["Thu 16:30"]["chow-sue-kong"] === "Closed by schedule", "Chow Sue Kong before opening, during and after closing");
    check(seen["Thu 07:30"]["fieldwork-p03"] === "Open by schedule", "Bangkok time is used on a device in another time zone (Thu 07:30 Bangkok is Wed 16:30 in Los Angeles)");
    const falseStatus = Object.entries(seen).filter(([key]) => key !== "page").flatMap(([label, chips]) => NEVER_STATUS.filter((id) => /by schedule/.test(chips[id] ?? "")).map((id) => `${label} ${id}`));
    check(falseStatus.length === 0, "Mother Roaster, Rong Kueak, Soraya, the barber, the church and unverified or outdoor stops never show Open or Closed", falseStatus.join(", "));

    // Card details: Mass and office kept separate; disagreements shown as listings.
    {
      const { context, tab, errors } = seen.page;
      await tab.locator(".map-marker[data-place-id=holy-rosary]").click();
      await tab.waitForSelector('[data-testid=place-card][data-place-id="holy-rosary"]');
      check((await tab.locator("[data-testid=hours-badge]").innerText()) === "Check before going", "Holy Rosary Church shows Check before going");
      await tab.locator("[data-testid=today-hours] summary").click();
      check((await tab.locator("[data-testid=other-times]").innerText()).includes("Mass") && (await tab.locator("[data-testid=hours-reports] li").count()) === 2, "Mass times and the two visiting listings appear separately in the hours detail");
      await tab.locator("[data-testid=place-card] .panel-close").click();
      await tab.locator(".map-marker[data-place-id=chow-sue-kong]").click();
      await tab.waitForSelector('[data-testid=place-card][data-place-id="chow-sue-kong"]');
      await tab.locator("[data-testid=today-hours] summary").click();
      check(
        (await tab.locator("[data-testid=hours-badge]").innerText()) === "Open by schedule" &&
          (await tab.locator("[data-testid=today-hours-time]").innerText()).includes("06:00–16:00") &&
          (await tab.locator("[data-testid=other-times]").innerText()).toLowerCase().includes("office"),
        "Chow Sue Kong shows today’s worship hours with the office hours kept apart",
      );
      await tab.screenshot({ path: join(shots, "06-hours-detail.png") });
      check(errors.length === 0, "no page errors in the hours views", errors.join(" | "));
      await context.close();
    }

    // Special date and an overnight close, set in the editor and seen in Preview.
    {
      const { context, tab, errors } = await openPage(browser, { role: "editor", fresh: true, time: times["Thu 10:00"], options: { timezoneId: "Asia/Bangkok" } });
      await enterEditor(tab);
      await tab.locator('.stop[data-place-id="fieldwork-p03"]').click();
      await tab.waitForSelector("[data-testid=place-panel]");
      await tab.locator("[data-testid=hours-section] > summary").click();
      await tab.locator("[data-testid=hours-section] button", { hasText: "Add date" }).click();
      const row = tab.locator("[data-testid=hours-section] .ed-rows").filter({ hasText: "Special dates" }).locator(".ed-row").first();
      await row.locator("input").nth(0).fill("2026-11-12");
      await row.locator("input").nth(1).fill("closed");
      await row.locator("input").nth(2).fill("Family event");
      await tab.click("[data-testid=place-panel] [aria-label='Close place panel']");
      await tab.locator('.stop[data-place-id="fieldwork-p05"]').click();
      await tab.waitForSelector("[data-testid=place-panel]");
      await tab.locator("[data-testid=hours-section] > summary").click();
      await tab.getByRole("combobox", { name: "Hours status" }).click();
      await tab.getByRole("option", { name: /^Published schedule/ }).click();
      await tab.click("[data-testid=place-panel] [aria-label='Close place panel']");
      await tab.click("[data-testid=tool-preview]");
      await tab.waitForSelector("[data-testid=preview-banner]");
      await marker(tab, "fieldwork-p03").click();
      await tab.waitForSelector('[data-testid=place-card][data-place-id="fieldwork-p03"]');
      await tab.locator("[data-testid=today-hours] summary").click();
      check(
        (await tab.locator("[data-testid=hours-badge]").innerText()) === "Closed by schedule" && (await tab.locator("[data-testid=today-hours]").innerText()).includes("Family event"),
        "a special date overrides the weekly schedule (Khun Pu closed on a Thursday)",
      );
      await tab.locator("[data-testid=place-card] .panel-close").click();
      await tab.clock.setFixedTime(new Date("2026-11-13T17:30:00Z")); // Sat 00:30 Bangkok
      await marker(tab, "fieldwork-p05").click();
      await tab.waitForSelector('[data-testid=place-card][data-place-id="fieldwork-p05"]');
      const overnight = await tab.locator("[data-testid=hours-badge]").innerText();
      await tab.locator("[data-testid=place-card] .panel-close").click();
      await tab.clock.setFixedTime(new Date("2026-11-13T18:30:00Z")); // Sat 01:30 Bangkok
      await marker(tab, "fieldwork-p05").click();
      await tab.waitForSelector('[data-testid=place-card][data-place-id="fieldwork-p05"]');
      const afterOvernight = await tab.locator("[data-testid=hours-badge]").innerText();
      check(overnight === "Open by schedule" && afterOvernight === "Closed by schedule", "a Friday close at 01:00 runs past midnight once confirmed (open 00:30, closed 01:30 Saturday)", `${overnight} / ${afterOvernight}`);
      check(errors.length === 0, "no page errors while editing hours", errors.join(" | "));
      await context.close();
    }

    // Phone widths and landscape: no sideways scroll, comfortable controls.
    for (const [label, device, viewport] of [
      ["360 px", "Pixel 7", { width: 360, height: 780 }],
      ["390 px", "iPhone 13", { width: 390, height: 844 }],
      ["430 px", "iPhone 13", { width: 430, height: 932 }],
      ["landscape", "iPhone 13", { width: 844, height: 390 }],
    ]) {
      const { context, tab, errors } = await openPage(browser, { role: "viewer", device, fresh: true, options: { viewport } });
      const overflow = await tab.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      const small = await tab.evaluate(() =>
        [...document.querySelectorAll("[data-testid=filter-button], [data-testid=share-map], .language-button, .menu-button, .dock-toggle button, .dock-walk, .zoom-controls button")]
          .filter((el) => el.offsetParent)
          .filter((el) => {
            const box = el.getBoundingClientRect();
            return box.height < 43.5 || box.width < 43.5;
          })
          .map((el) => el.dataset.testid || el.className || el.textContent),
      );
      const labels = await tab.locator(".map-marker:not(.is-selected) .pin-label").evaluateAll((els) => els.filter((el) => el.offsetParent).length);
      const offscreen = await tab.evaluate(() => {
        const view = document.querySelector(".map-viewport").getBoundingClientRect();
        return [...document.querySelectorAll(".map-marker[data-place-id] .pin-head")]
          .map((el) => el.getBoundingClientRect())
          .filter((b) => b.left < view.left || b.right > view.right || b.top < view.top || b.bottom > view.bottom).length;
      });
      check(offscreen === 0, `${label}: every pin is on screen when the map opens`, `${offscreen} off screen`);
      await tab.locator(".map-marker[data-place-id=fieldwork-p09]").tap();
      await tab.waitForSelector("[data-testid=place-card]");
      await tab.waitForTimeout(400);
      const actions = await tab.locator("[data-testid=place-card] .panel-actions").boundingBox();
      const closeBox = await tab.locator("[data-testid=place-card] .panel-close").boundingBox();
      check(
        overflow <= 0 && small.length === 0 && labels === 0 && actions.y + actions.height <= viewport.height + 1 && closeBox.y >= 0,
        `${label}: no sideways scroll, 44 px controls, only the selected pin labelled, card actions and close visible`,
        `overflow ${overflow}, small ${small.join(",")}, labels ${labels}`,
      );
      await tab.screenshot({ path: join(shots, `07-phone-${label.replace(" ", "")}.png`) });
      check(errors.length === 0, `${label}: no page errors`, errors.join(" | "));
      await context.close();
    }

    // The full phone path: open, search, tap, hours, story, back to the same map, filter, share.
    {
      const shared = [];
      const { context, tab, errors } = await openPage(browser, {
        role: "viewer",
        device: "iPhone 13",
        fresh: true,
        time: times["Thu 10:00"],
        options: { timezoneId: "Asia/Bangkok", permissions: ["clipboard-read", "clipboard-write"] },
        init: () => {
          window.__shared = [];
          navigator.share = async (data) => void window.__shared.push(data);
        },
      });
      check(await tab.locator("[data-testid=welcome]").isVisible(), "the landing view shows the short welcome line");
      await tab.locator("[data-testid=welcome-dismiss]").tap();
      await tab.locator(".zoom-controls button[aria-label='Zoom in']").tap();
      await tab.waitForTimeout(300);
      const zoom = await tab.locator(".map-gesture-hint span").textContent();
      await tab.locator(".search-field input").fill("กะหรี่ปั๊บ");
      await tab.waitForTimeout(200);
      check((await tab.locator(".stop[data-place-id]").count()) === 1 && (await tab.locator('.stop[data-place-id="fieldwork-p03"]').count()) === 1, "Thai search finds Khun Pu’s Curry Puffs");
      await tab.locator('.stop[data-place-id="fieldwork-p03"]').tap();
      await tab.waitForSelector("[data-testid=place-card]");
      check((await tab.locator("[data-testid=hours-badge]").innerText()) === "Open by schedule" && (await tab.locator("[data-testid=today-hours-time]").innerText()).includes("07:00–14:00"), "the card shows today’s hours under the name");
      await tab.locator("[data-testid=read-story-action]").tap();
      await tab.waitForTimeout(600);
      check(await tab.locator("[data-testid=read-story]").evaluate((el) => el.open), "Read the story opens the story from the sheet’s main button");
      await tab.locator("[data-testid=place-card] .panel-close").tap();
      await tab.locator("[data-testid=dock-map]").tap();
      await tab.waitForTimeout(300);
      check(
        (await tab.locator(".search-field input").inputValue()) === "กะหรี่ปั๊บ" &&
          (await tab.locator(".map-gesture-hint span").textContent()) === zoom &&
          (await tab.locator('.map-marker.is-selected[data-place-id="fieldwork-p03"]').count()) === 1,
        "back on the map: same search, zoom and selected pin",
      );
      await tab.locator(".search-field button[aria-label='Clear search']").tap();
      await tab.locator("[data-testid=dock-list]").tap();
      await tab.locator("[data-testid=dock-map]").tap();
      check((await tab.locator(".map-gesture-hint span").textContent()) === zoom, "switching Map and List keeps the map camera");
      await tab.locator("[data-testid=filter-button]").tap();
      await tab.locator('[data-filter-category="Food & drink"]').tap();
      await tab.locator("[data-testid=filter-done]").tap();
      await tab.waitForTimeout(300);
      check(await tab.locator("[data-testid=active-filters]").isVisible(), "an active filter shows a visible reset");
      await tab.locator("[data-testid=filter-button]").tap();
      await tab.locator("[data-testid=filter-sheet] .view-switch button", { hasText: "Original" }).tap();
      await tab.waitForTimeout(400);
      check((await tab.locator("[data-testid=filter-sheet]").count()) === 0, "picking a map view closes the filter sheet");
      await tab.locator("[data-testid=filter-button]").tap();
      await tab.locator("[data-testid=filter-sheet] .view-switch button", { hasText: "Illustrated" }).tap();
      await tab.waitForTimeout(400);
      await tab.locator("[data-testid=reset-filters]").tap();
      check((await tab.locator("[data-testid=active-filters]").count()) === 0 && (await tab.locator(".map-marker[data-place-id]").count()) === seed.places.length, "Reset filters brings every place back");
      check((await tab.locator("[data-testid=open-now]").isVisible()) === false && (await tab.locator(".map-marker[data-place-id=fieldwork-p08]").count()) === 1, "no Open now filter is on by default; outdoor art stays on the map");

      await tab.locator("[data-testid=share-map]").tap();
      await tab.waitForSelector("[data-testid=share-sheet]");
      await tab.waitForTimeout(400);
      check((await tab.locator("[data-testid=share-link]").inputValue()) === SHARE_URL.replace(/^https:\/\//, "").replace(/#.*$/, ""), "the readable link is shown beside the QR");
      check((await decodeQr(tab.locator("[data-testid=share-qr]"))) === SHARE_URL, "the QR code decodes to the share link", SHARE_URL);
      await tab.locator("[data-testid=share-copy]").tap();
      await tab.waitForTimeout(200);
      check((await tab.evaluate(() => navigator.clipboard.readText())) === SHARE_URL, "Copy link copies the visitor link");
      await tab.locator("[data-testid=share-native]").tap();
      await tab.waitForTimeout(200);
      const native = await tab.evaluate(() => window.__shared);
      check(native.length === 1 && native[0].url === SHARE_URL, "the phone share sheet receives the same link");
      const [download] = await Promise.all([tab.waitForEvent("download"), tab.locator("[data-testid=share-download]").tap()]);
      const qrFile = join(shots, "share-qr.png");
      await download.saveAs(qrFile);
      const qrPng = PNG.sync.read(readFileSync(qrFile));
      const decoded = jsQR(new Uint8ClampedArray(qrPng.data), qrPng.width, qrPng.height)?.data;
      check(qrPng.width >= 1000 && decoded === SHARE_URL && download.suggestedFilename() === "talat-noi-map-qr.png", "Download QR gives a printable PNG of the same link", `${qrPng.width} px`);
      await tab.screenshot({ path: join(shots, "08-share.png") });
      check(errors.length === 0, "no page errors on the phone path", errors.join(" | "));
      await context.close();
    }

    // Slow and failed map image, and a missing photo.
    {
      const context = await browser.newContext({ ...devices["iPhone 13"] });
      await context.addInitScript(installFakeRuntime, { role: "viewer" });
      let release;
      const gate = new Promise((resolve) => (release = resolve));
      await context.route("**/assets/talat-noi-full-3d-map.webp", async (route) => (await gate, route.continue()));
      const tab = await context.newPage();
      await tab.goto(base, { waitUntil: "domcontentloaded" });
      await tab.waitForSelector(".map-marker[data-place-id]");
      check((await tab.locator("[data-testid=map-loading]").innerText()).includes("Loading"), "a slow illustration shows a loading message while pins stay usable");
      release();
      await tab.waitForSelector("[data-testid=map-loading]", { state: "detached", timeout: 10000 });
      check(true, "the loading message goes once the illustration arrives");
      await context.close();

      const broken = await browser.newContext({ ...devices["iPhone 13"] });
      await broken.addInitScript(installFakeRuntime, { role: "viewer" });
      await broken.route("**/assets/talat-noi-full-3d-map.webp", (route) => route.abort());
      await broken.route(/20261104_154919\.(jpg|webp)/, (route) => route.abort());
      const page2 = await broken.newPage();
      await page2.goto(base, { waitUntil: "networkidle" });
      await page2.waitForSelector("[data-testid=map-loading].is-error");
      await page2.locator("[data-testid=map-loading] button", { hasText: "Open the list" }).tap();
      await page2.waitForTimeout(300);
      check(await page2.locator('.stop[data-place-id="fieldwork-p03"]').isVisible(), "if the illustration fails, the list still works");
      await page2.locator('.stop[data-place-id="fieldwork-p03"]').tap();
      await page2.waitForSelector("[data-testid=place-card]");
      check((await page2.locator("[data-testid=place-card] .card-photo").innerText()).includes("Photo unavailable") && (await page2.locator("[data-testid=today-hours]").isVisible()), "a missing photo shows a placeholder and the card still has its hours");
      await page2.screenshot({ path: join(shots, "09-map-failed.png") });
      await broken.close();
    }

    // A guest without a claude.ai account: the read-only built-in edition.
    {
      const { context, tab, errors } = await openPage(browser, { guest: true, fresh: true, device: "iPhone 13", url: base.replace("127.0.0.1", "guest.test") });
      check((await tab.locator("[data-testid=edit-map]").count()) === 0, "guests get the read-only map");
      await tab.locator(".map-marker[data-place-id=chow-sue-kong]").tap();
      await tab.waitForSelector("[data-testid=place-card]");
      const photoOk = await tab.locator("[data-testid=place-card] img.place-photo").evaluate((img) => img.complete && img.naturalWidth > 0);
      await tab.locator("[data-testid=today-hours] summary").tap();
      check(photoOk && (await tab.locator("[data-testid=today-hours] .hours-sources a").count()) === 3, "guests see photos, hours and their sources");
      await tab.locator("[data-testid=place-card] .panel-close").tap();
      await tab.locator("[data-testid=dock-walk]").tap();
      check(await tab.locator("[data-testid=walk-guide]").isVisible(), "guests can open Plan your walk");
      await tab.locator('[data-walk-stop="holy-rosary"]').tap();
      await tab.waitForSelector("[data-testid=walk-strip]");
      check((await tab.locator("[data-testid=walk-next]").innerText()).includes("Old Commercial Quarter") && (await tab.locator("[data-testid=place-card] .walking-button").count()) === 0, "a walk stop offers the next stop and nearby alternatives, but no directions to an unconfirmed spot");
      await tab.locator("[data-testid=walk-next]").tap();
      await tab.waitForSelector('[data-testid=place-card][data-place-id="old-bank"]');
      check(true, "Next stop opens the next place in the chapter");
      check(errors.length === 0, "no page errors for guests", errors.join(" | "));
      await context.close();
    }
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
  check(draft.revision === seed.revision + 1, "draft revision increases from the published edition", String(draft.revision));
  check(savedRong.nameEn === "Rong Kueak Shrine (Shoe Shrine)" && savedRong.photoCaption === "Shrine gate at dusk" && /^\/_blob\//.test(savedRong.photoUrl), "draft keeps text, caption and the durable photo URL");
  check(draft.places.length === seed.places.length && new Set(draft.places.map((place) => place.id)).size === seed.places.length, "existing place IDs are kept without duplicates");
  check((await fakeDb(tab, "map/published")) === null, "saving a draft does not change the visitor map");
  const savedHoly = draft.places.find((place) => place.id === "holy-rosary");
  const savedPuffs = draft.places.find((place) => place.id === "fieldwork-p03");
  check(
    savedHoly.sources.length === 4 && savedHoly.previewEn.startsWith("Look for the gate") && savedHoly.related.includes("fieldwork-p07") && savedPuffs.aliases.includes("Local snack shop") && savedHoly.editorNotes.includes("Editorial check"),
    "saving keeps previews, sources, related stops, aliases and editor notes",
  );

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
  check(
    (await tab.locator(".stop-list .stop").count()) === 2 && (await tab.locator('.stop[data-place-id="fieldwork-p07"]').count()) === 1,
    "the place list can be searched (Holy Rosary Church and Bumblebee near it)",
  );
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

  // Confirming an entrance turns on directions for visitors.
  await tab.locator('.stop[data-place-id="so-heng-tai"]').click();
  await tab.waitForSelector("[data-testid=place-panel]");
  await tab.locator("[data-testid=directions-confirm] input[name=entranceConfirmed]").check();
  await tab.click("[data-testid=place-panel] [aria-label='Close place panel']");

  // Preview, then publish.
  await tab.click("[data-testid=tool-preview]");
  await tab.waitForSelector("[data-testid=preview-banner]");
  check((await tab.locator("[data-testid=editor-toolbar]").count()) === 0, "Preview shows the visitor experience without editing tools");
  await marker(tab, "so-heng-tai").click();
  await tab.waitForSelector('[data-testid=place-card][data-place-id="so-heng-tai"]');
  check(await tab.locator("[data-testid=place-card] .walking-button").isVisible(), "a confirmed entrance shows Directions in the preview");
  check((await tab.locator("[data-testid=label-to-confirm]").count()) === 0, "a confirmed place drops the Location to confirm label");
  await tab.locator("[data-testid=place-card] .panel-close").click();
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

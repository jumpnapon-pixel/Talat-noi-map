// The visitor guide: card labels, bilingual interface copy and the "Plan your walk" chapters
// (research brief of 11 Nov 2026). Place stories themselves live in the edition data.

const GUIDE_TEXT = {
  readStory: ["Read the story", "อ่านเรื่องราว"],
  whenVisit: ["When you visit", "เมื่อไปเยือน"],
  related: ["Related stops", "จุดแวะที่เกี่ยวข้อง"],
  sources: ["Sources", "แหล่งข้อมูล"],
  fieldNote: ["Field note", "บันทึกภาคสนาม"],
  areaGuide: ["Area guide", "เรื่องราวของย่าน"],
  toConfirm: ["Location to confirm", "รอยืนยันตำแหน่ง"],
  uncertain: ["This story is ready to read. We’re still checking the exact spot.", "อ่านเรื่องราวได้แล้ว กำลังตรวจสอบตำแหน่งที่แน่นอน"],
  dayChange: [
    "Check the sign when you arrive. You can keep walking and come back to this stop later.",
    "ดูป้ายหน้าร้านหรือทางเข้าเมื่อมาถึง แล้วค่อยเลือกว่าจะแวะตอนนี้หรือกลับมาทีหลัง",
  ],
  hoursAccess: ["Hours and access", "เวลาเปิดและการเข้าชม"],
  hours: ["Hours", "เวลาเปิด"],
  price: ["Price", "ราคา"],
  checkBefore: ["Check before visiting", "ตรวจสอบก่อนไปเยือน"],
  noDirections: ["Directions open once the exact spot is confirmed.", "เส้นทางจะเปิดให้ใช้เมื่อยืนยันตำแหน่งแล้ว"],
  areaNoDirections: ["An area to explore on foot, with no single entrance.", "เป็นย่านให้เดินชม ไม่มีทางเข้าเดียว"],
  researchReviewed: ["Research reviewed", "ทบทวนข้อมูลเมื่อ"],
  siteConfirmed: ["Location confirmed on site", "ยืนยันตำแหน่งในพื้นที่"],
  notYet: ["not yet", "ยังไม่ยืนยัน"],
  backToMap: ["Back to map", "กลับไปที่แผนที่"],
  close: ["Close place card", "ปิดการ์ดสถานที่"],
  expand: ["Expand place card", "ขยายการ์ดสถานที่"],
  collapse: ["Collapse place card", "ย่อการ์ดสถานที่"],
  fullPhoto: ["View full photo", "ดูภาพเต็ม"],
  photo: ["Photo", "ภาพ"],
  opensNewTab: ["opens in a new tab", "เปิดในแท็บใหม่"],
  planWalk: ["Plan your walk", "วางแผนเดินเที่ยว"],
  placesTab: ["Places", "สถานที่"],
  chapter: ["Chapter", "ช่วงที่"],
  alsoHere: ["Also along the way", "แวะดูเพิ่มระหว่างทาง"],
  nextStop: ["Next stop", "จุดต่อไป"],
  alternatives: ["Nearby alternatives", "ทางเลือกใกล้เคียง"],
  walkNote: [
    "Directions appear only for stops whose entrance has been confirmed. Other stops are ready to read.",
    "เส้นทางจะแสดงเฉพาะจุดที่ยืนยันทางเข้าแล้ว จุดอื่นเปิดอ่านเรื่องราวได้เลย",
  ],
};

const tGuide = (lang, key) => GUIDE_TEXT[key][lang === "th" ? 1 : 0];

// Labels shown on cards and list rows. Area guides never get "Location to confirm": they
// have no single entrance to confirm.
function guideLabels(place) {
  const labels = [];
  if (place.kind === "area-guide") labels.push({ key: "area-guide", text: "areaGuide" });
  if (place.kind === "field-note") labels.push({ key: "field-note", text: "fieldNote" });
  if (place.kind !== "area-guide" && !canRoute(place)) labels.push({ key: "to-confirm", text: "toConfirm" });
  return labels;
}

// Search: 3 = a name matches, 2 = an old title, alias or category, 1 = the preview, story,
// visit note or address mentions it (so "coffee" finds Mother Roaster), 0 = no match.
function searchScore(place, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return 1;
  const has = (text) => !!text && text.toLowerCase().includes(q);
  if (has(place.nameEn) || has(place.nameTh)) return 3;
  if ((place.aliases ?? []).some(has) || has(place.category) || has(categoryLabel(place.category, "th"))) return 2;
  if ([place.previewEn, place.previewTh, place.storyEn, place.storyTh, place.tipEn, place.tipTh, place.location].some(has)) return 1;
  return 0;
}

function formatGuideDate(iso, lang) {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Plain text with blank-line paragraphs and *italic* words, rendered without HTML injection.
function GuideText({ text, lang, className }) {
  const paragraphs = (text || "").split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  return paragraphs.map((paragraph, index) => (
    <p key={index} className={className} lang={lang}>
      {paragraph.split(/(\*[^*\n]+\*)/).map((piece, i) =>
        /^\*[^*\n]+\*$/.test(piece) ? <em key={i}>{piece.slice(1, -1)}</em> : piece,
      )}
    </p>
  ));
}

const WALK = {
  welcome: [
    "Start by the river, turn into a lane and see what catches your eye. This guide brings together places to pause, things to taste and stories you can read as you go. Pick a few stops or follow the whole walk at your own pace.",
    "เริ่มจากริมแม่น้ำ แล้วค่อยเลี้ยวเข้าตรอกที่ชวนให้หยุดดู เลือกจุดที่อยากแวะชิม แวะชม หรือกดอ่านเรื่องราวระหว่างทาง เดินตามจังหวะของตัวเองได้เลย",
  ],
  chapters: [
    {
      id: "river",
      title: ["Start by the river", "เริ่มจากริมแม่น้ำ"],
      copy: [
        "Begin at the church gate and look for the signs in three languages. Then open the old quarter story to see why so much of Talat Noi grew up facing the water.",
        "เริ่มจากซุ้มประตูโบสถ์ที่มีป้ายสามภาษา แล้วเปิดเรื่องราวย่านการค้าเก่าเพื่อดูว่าแม่น้ำมีส่วนสร้างย่านนี้อย่างไร",
      ],
      stops: ["holy-rosary", "old-bank"],
      ordered: true,
      also: ["fieldwork-p07"],
    },
    {
      id: "bite",
      title: ["Find a bite and a story", "แวะชิมแล้วค่อยเดินต่อ"],
      copy: [
        "On the Soi 22 side, look for the teal curry-puff doors, the green Isan stall or the yellow doorway at Mother Roaster. Pick one break that fits your walk and what is open.",
        "แถวซอยเจริญกรุง 22 ลองเลือกแวะซื้อกะหรี่ปั๊บ ชิมอาหารอีสาน หรือพักจิบกาแฟตามร้านที่เปิดในวันนั้น",
      ],
      stops: ["fieldwork-p03", "fieldwork-p05", "fieldwork-p09"],
      ordered: false,
      also: ["fieldwork-p04", "fieldwork-p02", "32bar-x-chocolate"],
    },
    {
      id: "lanes",
      title: ["Read the lanes slowly", "อ่านเรื่องราวในตรอก"],
      copy: [
        "Look for a print, a painted noodle bowl and traces of metalwork. Pause at the Hakka shrine, pass the courtyard house if accessible, and finish with the Hokkien shrine’s river-facing story.",
        "ลองมองหาภาพถ่าย ชามก๋วยเตี๋ยวบนกำแพง และร่องรอยงานช่าง แวะอ่านเรื่องศาลเจ้าโรงเกือก บ้านโซวเฮงไถ่ และศาลเจ้าโจวซือกง",
      ],
      stops: ["street-art-lane", "rong-kueak", "so-heng-tai", "chow-sue-kong"],
      ordered: true,
      also: ["fieldwork-p08", "fieldwork-p10", "fieldwork-p01"],
    },
  ],
  shortVisit: [
    "Short on time? Choose one riverside landmark, one snack or coffee stop, and one lane story.",
    "มีเวลาไม่มาก? เลือกแลนด์มาร์กริมแม่น้ำหนึ่งแห่ง ร้านขนมหรือกาแฟหนึ่งร้าน และเรื่องราวในตรอกอีกหนึ่งเรื่อง",
  ],
  longVisit: [
    "Have longer? Follow all three chapters with a flexible food break. Read the stories in order or choose what is nearby.",
    "มีเวลามากขึ้น? เดินครบทั้งสามช่วง แวะพักกินระหว่างทางตามสะดวก จะอ่านเรื่องราวตามลำดับหรือเลือกจุดที่อยู่ใกล้ก็ได้",
  ],
};

// ----- Opening hours (Bangkok time) ----------------------------------------------------------
// Only "published" and "listed" schedules can say Open/Closed by schedule, and only while the
// review is recent. Everything else shows its visit label; no status is ever a live check.
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_NAMES = {
  en: { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" },
  th: { mon: "จ.", tue: "อ.", wed: "พ.", thu: "พฤ.", fri: "ศ.", sat: "ส.", sun: "อา." },
};
const HOURS_STALE_DAYS = 183;
const HOURS_TEXT = {
  today: ["Today’s hours", "วันนี้เปิดกี่โมง"],
  open: ["Open by schedule", "เปิดตามเวลาที่แจ้ง"],
  closed: ["Closed by schedule", "ปิดตามเวลาที่แจ้ง"],
  check: ["Check before going", "ควรเช็กก่อนไป"],
  unknown: ["Hours not confirmed", "ยังไม่ยืนยันเวลาเปิดปิด"],
  outdoor: ["Outdoor stop", "จุดชมกลางแจ้ง"],
  area: ["Area guide", "เรื่องราวของย่าน"],
  closedDay: ["Closed", "ปิด"],
  notListed: ["Not listed", "ไม่ระบุ"],
  nextDay: ["next day", "วันถัดไป"],
  week: ["This week (Bangkok time)", "ตลอดสัปดาห์ (เวลากรุงเทพฯ)"],
  exceptions: ["Special dates", "วันพิเศษ"],
  otherListings: ["Other published listings (indicative)", "เวลาตามแหล่งอื่น (ใช้อ้างอิง)"],
  reviewed: ["Listings reviewed", "ตรวจสอบรายการเมื่อ"],
  stale: ["These hours were reviewed a while ago. Check before going.", "ข้อมูลเวลานี้ตรวจสอบมานานแล้ว ควรเช็กก่อนไป"],
  notToday: ["No hours listed for today. Check before going.", "ไม่มีเวลาที่ระบุสำหรับวันนี้ ควรเช็กก่อนไป"],
  scheduleNote: ["Based on the published schedule, not a live check.", "อ้างอิงเวลาที่เผยแพร่ ไม่ใช่การตรวจสอบสด"],
  hoursSources: ["Hours sources", "แหล่งข้อมูลเวลาเปิดปิด"],
  openNow: ["Open by schedule now", "เปิดตามเวลาที่แจ้งตอนนี้"],
};
const tHours = (lang, key) => HOURS_TEXT[key][lang === "th" ? 1 : 0];

const toMinutes = (text) => {
  const [h, m] = text.split(":").map(Number);
  return h * 60 + m;
};
// "" -> unknown, "closed" -> closed, "09:00-18:00, 19:00-01:00" -> ranges (overnight past 1440).
function parseHours(text) {
  const value = (text || "").trim().toLowerCase();
  if (!value) return { kind: "unknown" };
  if (value === "closed") return { kind: "closed" };
  const ranges = value.split(",").map((part) => {
    const [open, close] = part.split(/[-–]/).map((piece) => toMinutes(piece.trim()));
    return { open, close: close <= open ? close + 1440 : close };
  });
  return { kind: "open", ranges };
}

// The calendar date, weekday and minutes in Bangkok, whatever the device's time zone.
function bangkokClock(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    day: parts.weekday.slice(0, 3).toLowerCase(),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}
function shiftDate(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
const dayKeyOf = (iso) => DAY_KEYS[(new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7];

function hoursOn(place, iso) {
  const exception = (place.hoursExceptions ?? []).find((item) => item.date === iso);
  const text = exception ? exception.hours : (place.weeklyHours ?? {})[dayKeyOf(iso)] ?? "";
  return { ...parseHours(text), exception };
}

function hasSchedule(place) {
  return DAY_KEYS.some((day) => (place.weeklyHours ?? {})[day]);
}

// { kind: "open" | "closed" | "check" | "unknown" | "outdoor" | "area", today, reason }
function scheduleState(place, now = new Date()) {
  const status = place.hoursStatus || (place.kind === "area-guide" ? "area" : "");
  const clock = bangkokClock(now);
  const today = hoursOn(place, clock.date);
  if (status === "area" || status === "outdoor" || status === "unknown") return { kind: status, today, clock };
  if (status === "check" || !status) return { kind: status ? "check" : "unknown", today, clock };
  // published or listed
  if (!hasSchedule(place)) return { kind: "check", today, clock, reason: "no-schedule" };
  const reviewed = place.hoursReviewedOn ? Date.parse(`${place.hoursReviewedOn}T00:00:00Z`) : NaN;
  if (!Number.isFinite(reviewed) || now.getTime() - reviewed > HOURS_STALE_DAYS * 864e5)
    return { kind: "check", today, clock, reason: "stale" };
  const yesterday = hoursOn(place, shiftDate(clock.date, -1));
  const inToday = today.kind === "open" && today.ranges.some((r) => clock.minutes >= r.open && clock.minutes < r.close);
  const spill =
    yesterday.kind === "open" && yesterday.ranges.some((r) => r.close > 1440 && clock.minutes < r.close - 1440);
  if (inToday || spill) return { kind: "open", today, clock };
  if (today.kind === "unknown") return { kind: "check", today, clock, reason: "not-today" };
  return { kind: "closed", today, clock };
}

const pad = (minutes) => {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
function formatDayHours(parsed, lang) {
  if (parsed.kind === "closed") return tHours(lang, "closedDay");
  if (parsed.kind === "unknown") return tHours(lang, "notListed");
  return parsed.ranges
    .map((r) => `${pad(r.open)}–${pad(r.close)}${r.close > 1440 ? ` (${tHours(lang, "nextDay")})` : ""}`)
    .join(", ");
}

// The visit label shown when a place has no Open/Closed status.
function hoursLabel(place, state, lang) {
  const own = lang === "th" ? place.hoursLabelTh || place.hoursLabelEn : place.hoursLabelEn;
  if (state.kind === "open" || state.kind === "closed") return tHours(lang, state.kind);
  if (state.reason === "stale" || state.reason === "not-today") return tHours(lang, "check");
  return own || tHours(lang, state.kind === "check" ? "check" : state.kind);
}

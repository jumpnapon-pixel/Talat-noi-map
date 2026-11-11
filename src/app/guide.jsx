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

// Every name a place can be searched by, including titles it had before the brief.
const searchText = (place) =>
  [place.nameEn, place.nameTh, place.category, ...(place.aliases ?? [])].join(" ").toLowerCase();

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

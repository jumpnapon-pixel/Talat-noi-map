"""Apply the 11 Nov 2026 research brief to a Talat Noi edition.

usage: python3 -I apply_guide.py BRIEF.md PARSED.json BASE_EDITION.json OUT.json
BASE_EDITION is a draft/published document ({places, structures, ...}).
"""
import json, re, sys

brief_path, parsed_path, base_path, out_path = sys.argv[1:5]
brief = open(brief_path, encoding="utf-8").read()
E = json.load(open(parsed_path, encoding="utf-8"))
base = json.load(open(base_path, encoding="utf-8"))
base = base.get("data", base)
places = {p["id"]: p for p in base["places"]}

IDS = {"01": "holy-rosary", "02": "old-bank", "03": "so-heng-tai", "04": "rong-kueak",
       "05": "street-art-lane", "06": "chow-sue-kong", "07": "fieldwork-p01", "08": "fieldwork-p02",
       "09": "fieldwork-p03", "10": "fieldwork-p04", "11": "fieldwork-p05", "12": "fieldwork-p07",
       "13": "fieldwork-p08", "14": "fieldwork-p09", "15": "fieldwork-p10"}
KIND = {"02": "area-guide", "05": "area-guide", "07": "field-note", "08": "field-note",
        "10": "field-note", "15": "field-note"}
# Where the Thai "story and visit note" block turns into visit advice.
TH_VISIT_STARTS = {"01": "หากเปิดให้เข้าชม", "02": "ค่อย ๆ เดินดูประตูไม้", "03": "เมื่อมาถึงซอยดวงตะวัน",
    "04": "หากเข้าไปด้านใน", "05": "ลองเดินช้า ๆ", "06": "หากมีพิธีอยู่", "07": "หากเดินเจอ",
    "08": "หากเดินผ่านแล้วร้านกำลังขาย", "09": "หากร้านเปิด", "10": "หากอยากตัดผม", "11": "ถ้ามากันหลายคน",
    "12": "ลองชมจากทางเท้า", "13": "หากยังมีภาพแขวนอยู่", "14": "ลองมองหาเลข 1172", "15": "ลองหาชามก๋วยเตี๋ยวกับค้อน"}
# Visitor-facing address line; the full location reference stays in the editor notes.
LOCATION = {"01": "987 Soi Wanit 2, Talat Noi",
    "02": "Around Soi Wanit 2 and Charoen Krung Soi 22, Talat Noi, Samphanthawong",
    "03": "282 Soi Duang Tawan, off Soi Wanit 2, Talat Noi",
    "04": "Trok San Chao Rong Kueak, off Soi Wanit 2, beside the Chao Phraya",
    "05": "Public lanes around Trok San Chao Rong Kueak and Soi Duang Tawan, near Soi Wanit 2",
    "06": "758 Soi Phanu Rangsi (ภาณุรังษี), Talat Noi", "07": "", "08": "",
    "09": "24 Charoen Krung Soi 22, Talat Noi", "10": "Charoen Krung Soi 22, Talat Noi",
    "11": "1172/8 Talat Noi, near the Marine Department lane",
    "12": "By the Holy Rosary Church street gateway, Talat Noi",
    "13": "Trok San Chao Rong Kueak, Talat Noi",
    "14": "1172, Charoen Krung Soi 22 / Trok San Chao Rong Kueak area, Talat Noi",
    "15": "Soi Duang Tawan, near So Heng Tai Mansion"}
EXTRA_SOURCES = {"04": ["S13"]}
FIELD_CHECKS = {}
fc = brief.split("## Editor field checks before enabling directions", 1)[1].split("## Acceptance checks", 1)[0]
for line in fc.strip().splitlines():
    m = re.match(r"- \*\*(.+?):\*\* (.+)", line.strip())
    if m: FIELD_CHECKS[m.group(1)] = m.group(2)
def field_check(num):
    p = {"07": "P01", "08": "P02", "09": "P03", "10": "P04", "11": "P05", "12": "P07", "13": "P08", "14": "P09", "15": "P10"}.get(num)
    out = []
    for key, text in FIELD_CHECKS.items():
        if (p and p in key) or (num in ("01", "03", "04", "06") and key.startswith("Church")):
            out.append(text)
    out.append(FIELD_CHECKS["Every location"])
    return " ".join(out)

# Source register.
REG = {}
for row in re.findall(r"^\| (S\d\d) \| \[([^\]]+)\]\((https://[^)\s]+)\)", brief, re.M):
    REG[row[0]] = {"id": row[0], "title": row[1], "url": row[2]}
assert len(REG) == 35, len(REG)

# Photo assignments table.
TABLE = {}
for m in re.finditer(r"^\| (\d\d) \| ([^|]+?) \| ([^|]+?) \| ([^|]+?) \| ([^|]+?) \| ([^|]+?) \|$", brief, re.M):
    TABLE[m.group(1)] = {"current": m.group(2).strip(), "display": m.group(3).strip(),
                         "category": m.group(4).strip(), "photo": m.group(5).strip()}
assert len(TABLE) == 15

KEY = re.compile(r"\s*\[(?:S|P)\d\d\](?:\s*\[(?:S|P)\d\d\])*")
keys = lambda text: re.findall(r"\[(S\d\d)\]", text or "")
clean = lambda text: KEY.sub("", text or "").strip()
title_to_id = {e["titleEn"]: IDS[e["num"]] for e in E}

report = []
for e in E:
    num, pid = e["num"], IDS[e["num"]]
    p = places[pid]
    row = TABLE[num]
    assert p["nameEn"] == row["current"], (num, p["nameEn"], row["current"])
    assert e["titleEn"] == row["display"], (num, e["titleEn"], row["display"])
    photo = re.search(r"(\d{8}_\d{6}\.jpg)", row["photo"])
    if photo:
        assert p["photoUrl"].endswith(photo.group(1)), (num, p["photoUrl"], photo.group(1))
        p["photoCredit"] = "Photo by Jump"
    old_names = [p["nameEn"], p["nameTh"]]
    th = e["storyVisitTh"].replace("Jumpมี", "Jump มี")
    cut = th.index(TH_VISIT_STARTS[num])
    story_th, visit_th = th[:cut].rstrip(), th[cut:].strip()
    aliases = [a.strip() for a in e.get("aliases", "").rstrip(".").split(";") if a.strip()]
    for old in old_names:
        if old and old not in (e["titleEn"], e["titleTh"]) and old not in aliases:
            aliases.append(old)
    related = [title_to_id[t.strip()] for t in e["related"].rstrip(".").split(";")]
    src_keys = []
    for k in keys(e["storyEn"]) + keys(e["location"]) + EXTRA_SOURCES.get(num, []):
        if k not in src_keys: src_keys.append(k)
    src_keys.sort()
    editor_only = [k for k in keys(e["editorial"]) if k not in src_keys]
    notes = [f"Location reference: {clean(e['location']) if False else e['location']}",
             f"Editorial check: {e['editorial']}",
             f"Field check before enabling directions: {field_check(num)}"]
    if editor_only:
        notes.append("Editor-only leads: " + "; ".join(f"{k} {REG[k]['title']} {REG[k]['url']}" for k in editor_only))
    notes.append("Research brief: Talat Noi Claude Map Content Prompt, research review 11 Nov 2026.")
    p.update({
        "nameEn": e["titleEn"], "nameTh": e["titleTh"], "category": row["category"],
        "previewEn": clean(e["previewEn"]), "previewTh": clean(e["previewTh"]),
        "storyEn": clean(e["storyEn"]), "storyTh": story_th, "tipEn": clean(e["visitEn"]), "tipTh": visit_th,
        "location": LOCATION[num], "kind": KIND.get(num, "place"), "aliases": aliases, "related": related,
        "sources": [REG[k] for k in src_keys], "entranceConfirmed": False, "entranceConfirmedOn": "",
        "entranceNote": "", "researchReviewedOn": "2026-11-11", "editorNotes": "\n\n".join(notes),
        "source": "Talat Noi research brief, review of 11 Nov 2026. Sources are listed on the card.",
    })
    if e.get("alt"): p["photoAlt"] = e["alt"]
    for field in ("storyEn", "storyTh", "tipEn", "tipTh", "previewEn", "previewTh"):
        assert "[S" not in p[field] and "[P" not in p[field], (num, field)
        assert len(p[field]) <= 2000, (num, field, len(p[field]))
    report.append((num, pid, e["titleEn"], p["kind"], [s["id"] for s in p["sources"]], related, aliases))

# 32Bar X joins the guide format with a one-line preview; its location came from Jump.
bar = places.get("32bar-x-chocolate")
if bar:
    bar.update({
        "previewEn": "Award-winning chocolate made right here in Talat Noi, in a shop with the magic of a Willy Wonka sweet shop.",
        "previewTh": "ช็อกโกแลตคว้ารางวัลที่ผลิตเองในตลาดน้อย ในร้านที่มีบรรยากาศมหัศจรรย์ราวกับร้านขนมของวิลลี่ วองก้า",
        "kind": "place", "aliases": ["X32", "32Bar", "32 บาร์", "chocolate"], "related": [], "sources": [],
        "entranceConfirmed": True, "entranceConfirmedOn": "",
        "entranceNote": "Location supplied by Jump: Google Maps plus code PGM7+F53 (13.733639, 100.5129327), 10 Nov 2026.",
        "researchReviewedOn": "", "editorNotes": "Added from Jump's visit and photo, 10 Nov 2026. Award details not independently confirmed.",
    })

out = dict(base)
out["places"] = list(places.values())
json.dump(out, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
for r in report: print(*r, sep=" | ")

"""Apply the opening-hours research (soft-launch brief, 11 Nov 2026) to a Talat Noi edition.

usage: python3 -I scripts/guide/apply_hours.py BASE.json OUT.json

Every schedule is Bangkok time. weeklyHours values: "" = not listed, "closed", or ranges
such as "07:00-11:00, 16:30-18:00" (a close earlier than the open runs past midnight).
Only "published" and "listed" schedules can show Open/Closed by schedule; everything
else shows its visit label and the compared listings.
"""
import json, sys

base_path, out_path = sys.argv[1:3]
REVIEWED = "2026-11-11"
H = {
    "H01": ("Catholic directory (catholic.or.th): Holy Rosary Church, Mass times", "https://www.catholic.or.th/main/index.php?Itemid=341&catid=101&id=553%3A%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B9%81%E0%B8%A1%E0%B9%88%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%A5%E0%B8%B9%E0%B8%81%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%84%E0%B8%B3-%E0%B8%81%E0%B8%B2%E0%B8%A5%E0%B8%AB%E0%B8%A7%E0%B9%88%E0%B8%B2%E0%B8%A3%E0%B9%8C&option=com_content&view=article"),
    "H02": ("Local Thailand: Holy Rosary Church listing", "https://localthailand.net/thurakit/wat-mae-phra-lukprakham-kanwa-samphanthawong"),
    "H03": ("Phuket 101: The Holy Rosary Church visitor guide", "https://www.phuket101.net/bangkok/the-holy-rosary-church/"),
    "H04": ("Tourism Authority of Thailand: ตลาดน้อย", "https://thai.tourismthailand.org/Attraction/%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%A2"),
    "H05": ("Tourism Authority of Thailand: 1 day in Talat Noi", "https://www.tourismthailand.org/Articles/1-day-in-talat-noi"),
    "H06": ("Local Thailand: So Heng Tai, 282 Wanit 2", "https://localthailand.net/thurakit/ban-soohengthai-samphanthawong"),
    "H07": ("iDiscover: The So Heng Tai Mansion", "https://i-discoverasia.com/walks/talad-noi/locations/the-so-heng-tai-mansion/"),
    "H08": ("Tourism Authority of Thailand: 1 วัน ย่านตลาดน้อย", "https://thai.tourismthailand.org/Articles/1-%E0%B8%A7%E0%B8%B1%E0%B8%99-%E0%B8%A2%E0%B9%88%E0%B8%B2%E0%B8%99%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%A2"),
    "H09": ("Tourism Authority of Thailand, Japan office: Rong Kuek Shrine", "https://www.thailandtravel.or.jp/rong-kuek-shrine/"),
    "H10": ("Thairath: Rong Kueak Shrine", "https://www.thairath.co.th/lifestyle/life/2914402"),
    "H11": ("MThai Travel: Rong Kueak Shrine", "https://mthai.com/travel/bangkok/419755.html"),
    "H12": ("Visit Bangkok (Bangkok city): Charoen Krung street art", "https://visit.bangkok.go.th/th/place/2782"),
    "H13": ("Thailand Tourism Directory: Street art at Trok Rong Kuek Shrine", "https://www.thailandtourismdirectory.go.th/en/attraction/103461"),
    "H14": ("Chow Sue Kong Shrine foundation notice, 18 June 2026 (republished by FindGlocal)", "https://www.findglocal.com/TH/Bangkok/670965572992461/%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B8%99%E0%B8%B4%E0%B8%98%E0%B8%B4%E0%B8%A8%E0%B8%B2%E0%B8%A5%E0%B9%80%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B9%82%E0%B8%88%E0%B8%8B%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B8%87-%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%A2-Chowsuekong-TJK"),
    "H15": ("Waze: Chow Sue Kong Shrine, 758 Soi Phanu Rangsi", "https://www.waze.com/live-map/directions/th/krung-thep-maha-nakhon/%E0%B8%A8%E0%B8%B2%E0%B8%A5%E0%B9%80%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B9%82%E0%B8%88%E0%B8%A7%E0%B8%8B%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B8%87-%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%A2?to=place.ChIJf4RfXTaZ4jARTaVnsogpboA"),
    "H16": ("Phuket 101: Talat Noi walking guide", "https://www.phuket101.net/bangkok/talat-noi-in-bangkok/"),
    "H17": ("Local Thailand: Megatron (possible match only)", "https://localthailand.net/en/thurakit/megatron-samphanthawong"),
    "H18": ("Creative Economy Agency: Made in Charoenkrung Year 1, Khun Pu’s Curry Puffs", "https://creativecity.cea.or.th/th/district-projects/made-in-charoenkrung-year-1"),
    "H19": ("Wongnai: Khun Pu’s Curry Puffs, Talat Noi", "https://www.wongnai.com/restaurants/203984lw"),
    "H20": ("Local Thailand: Karipap Khun Pu, No. 24", "https://localthailand.net/thurakit/karipap-khunpu-samphanthawong"),
    "H21": ("Local Thailand: 22 Barber & Hair Studio, 16 Soi Charoen Krung 22", "https://localthailand.net/thurakit/22-barber-hair-studio-private-one-on-one-service-samphanthawong"),
    "H22": ("Bangkok.biz: 22 Barber & Hair Studio", "https://bangkok.biz/business/22-barber-and-hair-studio-private-one-on-one-service"),
    "H23": ("Wongnai: Soraya Larb 101 (1172/8)", "https://www.wongnai.com/restaurants/431692fq-%E0%B9%82%E0%B8%AA%E0%B8%A3%E0%B8%A2%E0%B8%B2-%E0%B8%A5%E0%B8%B2%E0%B8%9A-101-%E0%B9%80%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B9%80%E0%B8%81%E0%B9%88%E0%B8%B2-%E0%B8%95%E0%B8%B3%E0%B9%81%E0%B8%8A%E0%B9%88%E0%B8%9A%E0%B8%99%E0%B8%B1%E0%B8%A7%E0%B9%80%E0%B8%A2%E0%B8%B2%E0%B8%A7%E0%B8%A3%E0%B8%B2%E0%B8%8A"),
    "H24": ("Local Thailand: Bumblebee directory entry", "https://localthailand.net/thurakit/bumblebee-samphanthawong"),
    "H25": ("Cultural Heritage Studies Vienna: robot sculptures and heritage in Talat Noi", "https://hexagon-impala-fsmz.squarespace.com/gloco-blog/what-does-a-statue-of-optimus-prime-have-to-do-with-heritage-in-bangkok"),
    "H26": ("Creative Economy Agency: Portrait of Charoenkrung", "https://creativecity.cea.or.th/th/district-projects/portrait-of-charoenkrung"),
    "H27": ("Wongnai: Mother Roaster Talat Noi (1172)", "https://www.wongnai.com/restaurants/389051aw-mother-roaster-%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%A2-talat-noi"),
    "H28": ("bkkbrew: Mother Roaster Talat Noi", "https://www.bkkbrew.com/shop/mother-roaster-taladnoi"),
    "H29": ("Filter Notes: Mother Roaster", "https://www.filternotes.com/bangkok/mother-roaster"),
    "H30": ("Tourism Authority of Thailand, Japan office: Mother Roaster", "https://www.thailandtravel.or.jp/mother-roaster/"),
    "H31": ("BK Magazine: Talat Noi murals", "https://www.bkmagazine.com/city-living/these-murals-highlight-talad-nois-rise-bangkoks-hub-street-art/"),
}
src = lambda *keys: [{"id": k, "title": H[k][0], "url": H[k][1]} for k in keys]
rep = lambda key, text, text_th: {"source": H[key][0], "url": H[key][1], "text": text, "textTh": text_th}
DAILY = lambda r: {d: r for d in ("mon", "tue", "wed", "thu", "fri", "sat", "sun")}

HOURS = {
    "holy-rosary": dict(
        hoursStatus="check", hoursScope="visitor",
        hoursLabelEn="Check before going", hoursLabelTh="ควรเช็กก่อนไป",
        hoursNoteEn="Interior access varies. Check with the parish before visiting.",
        hoursNoteTh="เวลาเข้าชมภายในอาจเปลี่ยนแปลง โปรดสอบถามทางวัดก่อนเดินทาง",
        hoursReports=[
            rep("H03", "Mon–Sat 16:30–18:00; Sun 07:00–11:00 and 16:30–18:00", "จ.–ส. 16:30–18:00; อา. 07:00–11:00 และ 16:30–18:00"),
            rep("H02", "Mon–Sat 16:30–18:30; Sun 07:00–11:00 and 16:30–18:30 (later evening close)", "จ.–ส. 16:30–18:30; อา. 07:00–11:00 และ 16:30–18:30 (ปิดช่วงเย็นช้ากว่า)"),
        ],
        otherTimes=[{"labelEn": "Mass (service times, not visiting hours)", "labelTh": "เวลามิสซา (เวลาพิธี ไม่ใช่เวลาเข้าชม)",
                     "textEn": "Mon–Sat 19:30 · Sun 08:00, 10:00 and 19:30 (Catholic directory)",
                     "textTh": "จ.–ส. 19:30 · อา. 08:00, 10:00 และ 19:30 (ทำเนียบคาทอลิก)"}],
        hoursSources=src("H01", "H02", "H03"),
        hoursEditorNotes="Visiting windows differ in the evening close (18:00 Phuket 101 vs 18:30 Local Thailand). Mass times are services, kept separate from visiting status. Confirm interior access with the parish.",
    ),
    "old-bank": dict(
        hoursStatus="area", hoursLabelEn="Area guide · no set hours", hoursLabelTh="เรื่องราวของย่าน · ไม่มีเวลาเปิดปิดรวม",
        hoursNoteEn="Best explored in daylight. Each shop and shrine keeps its own hours; check their cards.",
        hoursNoteTh="เดินชมช่วงกลางวันดีที่สุด ร้านค้าและศาลเจ้าแต่ละแห่งมีเวลาของตัวเอง ดูได้ในการ์ดของแต่ละจุด",
        hoursSources=src("H04"),
        hoursEditorNotes="Area card: no single venue schedule applies.",
    ),
    "so-heng-tai": dict(
        hoursStatus="listed", hoursScope="visitor",
        weeklyHours={"mon": "closed", **{d: "09:00-18:00" for d in ("tue", "wed", "thu", "fri", "sat", "sun")}},
        hoursLabelEn="Listed hours", hoursLabelTh="เวลาตามที่ประกาศ",
        hoursNoteEn="Check the gate before entering. This is a private home: visitor access follows the family’s rules. Confirm special dates at the gate.",
        hoursNoteTh="ดูป้ายที่ประตูก่อนเข้า บ้านหลังนี้เป็นบ้านส่วนตัว การเข้าชมเป็นไปตามกติกาของครอบครัว วันพิเศษโปรดสอบถามที่ประตู",
        hoursReports=[rep("H07", "Daily 10:00–18:00 (a different listing)", "ทุกวัน 10:00–18:00 (อีกแหล่งหนึ่ง)")],
        hoursSources=src("H05", "H06", "H07"),
        hoursEditorNotes="TAT and the matched 282 Wanit 2 directory agree on Tue–Sun 09:00–18:00, Mon closed; iDiscover says daily 10:00–18:00. TAT Maps link for cross-checking: https://maps.app.goo.gl/DCu5h3ktirccR7rU9",
    ),
    "rong-kueak": dict(
        hoursStatus="check", hoursScope="worship",
        hoursLabelEn="Check before going", hoursLabelTh="ควรเช็กเวลาก่อนไป",
        hoursNoteEn="Published hours differ; check the shrine’s entrance sign. Daytime is a better plan.",
        hoursNoteTh="เวลาที่เผยแพร่ไม่ตรงกัน โปรดดูป้ายหน้าศาลเจ้า แนะนำให้ไปช่วงกลางวัน",
        hoursReports=[
            rep("H08", "Daily 07:00–17:00", "ทุกวัน 07:00–17:00"),
            rep("H09", "08:00–20:00", "08:00–20:00"),
            rep("H10", "06:00–18:00 (also MThai)", "06:00–18:00 (MThai ระบุเช่นกัน)"),
        ],
        hoursSources=src("H08", "H09", "H10", "H11"),
        hoursEditorNotes="Four sources, three different schedules (07–17 TAT TH, 08–20 TAT JP, 06–18 Thairath and MThai for the 1192 shrine). TAT shrine Maps link: https://maps.app.goo.gl/zXNQDY92MSWGd6z26",
    ),
    "street-art-lane": dict(
        hoursStatus="outdoor", hoursLabelEn="Outdoor walk · best in daylight", hoursLabelTh="เดินชมกลางแจ้ง · แนะนำช่วงกลางวัน",
        hoursNoteEn="These are public lanes. Workshops and private displays are places of work with their own hours.",
        hoursNoteTh="เป็นตรอกสาธารณะ ส่วนร้านช่างและงานจัดแสดงส่วนตัวเป็นสถานที่ทำงานที่มีเวลาของตัวเอง",
        hoursSources=src("H12", "H13"),
        hoursEditorNotes="VisitBangkok lists 24-hour access for the broader Charoen Krung street-art area; this is lane access, not workshop hours.",
    ),
    "chow-sue-kong": dict(
        hoursStatus="published", hoursScope="worship", weeklyHours=DAILY("06:00-16:00"),
        hoursLabelEn="Published schedule · worship area", hoursLabelTh="เวลาตามประกาศ · พื้นที่สักการะ",
        hoursNoteEn="Hours for the worship area, from the shrine foundation’s notice of 18 June 2026.",
        hoursNoteTh="เวลาของพื้นที่สักการะ ตามประกาศของมูลนิธิศาลเจ้าเมื่อ 18 มิ.ย. 2569",
        hoursReports=[rep("H05", "07:00–16:00 (older guide)", "07:00–16:00 (คู่มือฉบับเก่า)")],
        otherTimes=[{"labelEn": "Shrine office (not the worship area)", "labelTh": "สำนักงานศาลเจ้า (ไม่ใช่พื้นที่สักการะ)",
                     "textEn": "Mon–Sat 08:30–16:00 · closed Sun and public holidays",
                     "textTh": "จ.–ส. 08:30–16:00 · ปิดวันอาทิตย์และวันหยุดนักขัตฤกษ์"}],
        hoursSources=src("H14", "H15", "H05"),
        hoursEditorNotes="Foundation notice (18 Jun 2026) and Waze agree on 06:00–16:00 daily for worship. Office times kept separate. TAT shrine Maps link: https://maps.app.goo.gl/DnJNSozKPpQ8H6Ka7",
    ),
    "fieldwork-p01": dict(
        hoursStatus="outdoor", hoursLabelEn="Outdoor display · exact spot to confirm", hoursLabelTh="จุดชมงานกลางแจ้ง · รอยืนยันตำแหน่ง",
        hoursNoteEn="No fixed hours. View it from the public side; there is no access inside the workshop.",
        hoursNoteTh="ไม่มีเวลาเปิดปิดตายตัว ชมจากทางสาธารณะ ไม่มีการเข้าไปด้านในร้าน",
        hoursSources=src("H16", "H17"),
        hoursEditorNotes="Phuket 101 documents a robot shopfront nearby; the Megatron directory entry has no hours and is only a possible match for P01.",
    ),
    "fieldwork-p02": dict(
        hoursStatus="unknown", hoursLabelEn="Hours not confirmed", hoursLabelTh="ยังไม่ยืนยันเวลาเปิดปิด",
        hoursNoteEn="If it’s serving when you pass, ask what’s available.",
        hoursNoteTh="ถ้าเดินผ่านแล้วร้านกำลังขาย ลองถามว่ามีอะไรบ้าง",
        hoursEditorNotes="No vendor name or schedule matched to P02.",
    ),
    "fieldwork-p03": dict(
        hoursStatus="published", hoursScope="shop",
        weeklyHours={**{d: "07:00-14:00" for d in ("mon", "tue", "wed", "thu", "fri", "sat")}, "sun": "closed"},
        hoursLabelEn="Published schedule · shop", hoursLabelTh="เวลาตามประกาศ · ร้าน",
        hoursNoteEn="Go earlier if you’re looking for a particular filling.",
        hoursNoteTh="ถ้าอยากได้ไส้ที่ชอบ ไปแต่เช้าจะดีกว่า",
        hoursSources=src("H18", "H19", "H20"),
        hoursEditorNotes="CEA, Wongnai (Talat Noi merchant) and the No. 24 directory agree: Mon–Sat 07:00–14:00, Sun closed. Stock is separate from hours.",
    ),
    "fieldwork-p04": dict(
        hoursStatus="check", hoursScope="shop",
        hoursLabelEn="Hours vary · ask about a slot", hoursLabelTh="เวลาต่างกันตามวัน · สอบถามคิวกับร้าน",
        hoursNoteEn="Listings disagree on Wednesday and Friday. Ask the studio about a slot.",
        hoursNoteTh="แต่ละแหล่งระบุเวลาวันพุธและวันศุกร์ไม่ตรงกัน สอบถามคิวกับร้านก่อน",
        hoursReports=[
            rep("H21", "09:00–18:00; Fri 09:00–19:00", "09:00–18:00; ศ. 09:00–19:00"),
            rep("H22", "09:00–18:00; Wed 09:00–15:00", "09:00–18:00; พ. 09:00–15:00"),
        ],
        hoursSources=src("H21", "H22"),
        hoursEditorNotes="Both listings are for 16 Soi Charoen Krung 22. Confirm Wed/Fri hours and how to book directly before using a status badge.",
    ),
    "fieldwork-p05": dict(
        hoursStatus="check", hoursScope="shop",
        weeklyHours={**{d: "13:00-23:59" for d in ("mon", "tue", "wed", "thu", "sun")}, "fri": "12:30-01:00", "sat": "11:00-23:59"},
        hoursLabelEn="Check with the stall", hoursLabelTh="สอบถามเวลาที่ร้าน",
        hoursNoteEn="Wongnai-listed hours; walk-up times to confirm.",
        hoursNoteTh="เวลาตามที่ลงใน Wongnai เวลาขายหน้าร้านยังต้องยืนยัน",
        hoursReports=[rep("H23", "Mon–Thu 13:00–23:59; Fri 12:30–01:00 (next day); Sat 11:00–23:59; Sun 13:00–23:59", "จ.–พฤ. 13:00–23:59; ศ. 12:30–01:00 (วันถัดไป); ส. 11:00–23:59; อา. 13:00–23:59")],
        hoursSources=src("H23"),
        hoursEditorNotes="Wongnai shop-hours section, stored as the weekly schedule but not used for status until the owner confirms walk-up times (late closes, Friday past midnight). The listing also has separate delivery windows.",
    ),
    "fieldwork-p07": dict(
        hoursStatus="outdoor", hoursLabelEn="Outdoor photo stop · view from the pavement", hoursLabelTh="จุดถ่ายรูปกลางแจ้ง · ชมจากทางเท้า",
        hoursNoteEn="No opening schedule, and separate from church admission.",
        hoursNoteTh="ไม่มีเวลาเปิดปิด และไม่เกี่ยวกับการเข้าชมโบสถ์",
        hoursSources=src("H25", "H24"),
        hoursEditorNotes="The Bumblebee directory entry lists 24-hour access at a Soi 22 address; it does not confirm the island/viewpoint in P07. Check current placement and the public viewing point.",
    ),
    "fieldwork-p08": dict(
        hoursStatus="outdoor", hoursLabelEn="Outdoor display · photos may change", hoursLabelTh="งานจัดแสดงกลางแจ้ง · ภาพอาจเปลี่ยนได้",
        hoursNoteEn="Best in daylight, if the prints are still up.",
        hoursNoteTh="ถ้ายังมีภาพแขวนอยู่ แนะนำให้ชมช่วงกลางวัน",
        hoursSources=src("H26", "H13"),
        hoursEditorNotes="Neither source confirms current display or that the 2020 prints are still installed.",
    ),
    "fieldwork-p09": dict(
        hoursStatus="check", hoursScope="shop",
        hoursLabelEn="Check hours, especially Sunday", hoursLabelTh="เช็กเวลาเปิดปิด โดยเฉพาะวันอาทิตย์",
        hoursNoteEn="If it’s open, this is a good coffee break.",
        hoursNoteTh="ถ้าร้านเปิด เป็นจุดพักจิบกาแฟที่ดี",
        hoursReports=[
            rep("H27", "Daily 10:00–17:00", "ทุกวัน 10:00–17:00"),
            rep("H28", "Mon–Sat 09:30–17:30; Sun closed", "จ.–ส. 09:30–17:30; ปิดวันอาทิตย์"),
            rep("H30", "10:00–18:00; irregular days off", "10:00–18:00; มีวันหยุดไม่แน่นอน"),
        ],
        hoursSources=src("H27", "H28", "H29", "H30"),
        hoursEditorNotes="Match the 1172 branch. Filter Notes reports a Sunday disagreement with Google Maps. Leave Sunday unresolved until the branch confirms.",
    ),
    "fieldwork-p10": dict(
        hoursStatus="outdoor", hoursLabelEn="Outdoor artwork · best in daylight", hoursLabelTh="งานศิลปะกลางแจ้ง · แนะนำช่วงกลางวัน",
        hoursNoteEn="View it from public space. The scene may change.",
        hoursNoteTh="ชมจากพื้นที่สาธารณะ ภาพอาจเปลี่ยนแปลงได้",
        hoursSources=src("H31"),
        hoursEditorNotes="No venue hours for the exact wall.",
    ),
    "32bar-x-chocolate": dict(
        hoursStatus="published", hoursScope="shop", weeklyHours=DAILY("09:30-19:00"), hoursReviewedOn="2026-11-10",
        hoursLabelEn="Published schedule · shop", hoursLabelTh="เวลาตามประกาศ · ร้าน",
        hoursNoteEn="From the sign on the shop window.",
        hoursNoteTh="ตามป้ายที่หน้าร้าน",
        hoursEditorNotes="OPEN DAILY 09:30 AM – 7:00 PM on the shop window in Jump’s photo (10 Nov 2026).",
    ),
}

DAY = {"mon": "Mon", "tue": "Tue", "wed": "Wed", "thu": "Thu", "fri": "Fri", "sat": "Sat", "sun": "Sun"}
def summary(weekly):
    if not weekly: return ""
    parts = [f"{DAY[d]} {weekly[d].replace('-', '–')}" for d in DAY if weekly.get(d)]
    return "; ".join(parts)

base = json.load(open(base_path, encoding="utf-8"))
doc = base.get("data", base)
EMPTY = dict(hoursStatus="", hoursScope="", weeklyHours={}, hoursExceptions=[], hoursLabelEn="", hoursLabelTh="",
             hoursNoteEn="", hoursNoteTh="", hoursReports=[], otherTimes=[], hoursSources=[],
             hoursReviewedOn=REVIEWED, hoursEditorNotes="")
for place in doc["places"]:
    data = HOURS.get(place["id"])
    if data is None:
        continue
    place.update({**EMPTY, **data})
    if place["hoursStatus"] in ("published", "listed"):
        place["hours"] = summary(place["weeklyHours"])
    else:
        place["hours"] = ""
missing = [pid for pid in HOURS if pid not in {p["id"] for p in doc["places"]}]
assert not missing, missing
json.dump(base, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("hours applied to", len(HOURS), "places")

# Talat Noi Story Map — mobile soft launch
## Implementation prompt for Claude Code

**Hours research reviewed:** 11 November 2026, Bangkok time  
**Companion content:** Talat-Noi-Claude-Map-Content-Prompt.md  
**Current share preview:** [Talat Noi Story Map](https://claude.ai/artifact/L11qJxFD2DWdfMLXjzZyd4#no_universal_links)  
**Supplied QR image:** Talat-Noi-Map-QR.png, which opens the current preview.

---

## 1. What to build

Work in my existing Talat Noi Story Map project. Make it easy to use while walking with a phone, add the opening information below to the existing 15 place cards, and give me a working preview ready to review for a soft launch. Keep the bilingual stories and three walk chapters from the companion brief. Keep the illustrated map, fieldwork photos, photo credits, place IDs, search aliases, categories, saved records and editor workflow.

The main visitor flow is **open the map → find a place → read today’s visit information → open its story or get directions**. A visitor should understand the next action without learning the interface. Start from the current code and data, implement the changes, and test the preview. Keep launch changes in a draft or preview for my review.

## 2. Opening and closing research: all 15 entries

These are **published schedules and access notes**, reviewed online on the date above. Hours are local to Bangkok. A published schedule does not guarantee a door is open on a holiday or on the day of a visit. The table records disagreements so we know exactly what to confirm.

**How the comparison was made:** Use venue notices or merchant pages where available, official tourism and city websites, map listings such as Waze, and directories or guides that reference Google Maps. The Google Maps pages tested did not expose their hours directly in the accessible research results. Attribute any Google hours below to the named intermediary, and keep the linked Maps destinations as editor cross-checks. Do not describe this as a live Google Maps feed or two independent confirmations if two sites repeat the same listing.

| # | Existing place | Website or venue evidence | Map/listing or comparison | Use in the launch preview |
|---|---|---|---|---|
| 01 | **Holy Rosary Church** | The [Catholic directory][H01] lists Mass at **19:30 Mon–Sat**, and **08:00, 10:00 and 19:30 Sun**. These are service times. The [Phuket 101 visitor guide][H03] lists Mon–Sat **16:30–18:00**, Sun **07:00–11:00 and 16:30–18:00**. | [Local Thailand][H02] lists Mon–Sat **16:30–18:30**, Sun **07:00–11:00 and 16:30–18:30**. The evening close differs. | **Check before going.** “Interior access varies. Check with the parish before visiting.” Thai: “เวลาเข้าชมภายในอาจเปลี่ยนแปลง โปรดสอบถามทางวัดก่อนเดินทาง” Show the listing windows in expanded hours as indicative, with the evening discrepancy. Keep Mass in a separate field. |
| 02 | **Old Commercial Quarter** | [TAT][H04] describes the historic neighborhood around Wanit 2 and Charoen Krung Soi 22. It is an area, with individual businesses and shrines. | No single venue schedule applies to the area card. | **Area guide · no set hours / เรื่องราวของย่าน · ไม่มีเวลาเปิดปิดรวม**. Suggest daylight and show individual venue hours on their own cards. |
| 03 | **So Heng Tai Mansion** | [TAT][H05] lists **Tue–Sun 09:00–18:00; Mon closed**. | The [matched 282 Wanit 2 directory listing][H06] agrees. [iDiscover][H07] says **daily 10:00–18:00**, so a different listing exists. TAT supplies this [Maps link](https://maps.app.goo.gl/DCu5h3ktirccR7rU9). | **Listed hours: Tue–Sun 09:00–18:00; Mon closed / เวลาตามประกาศ อ.–อา. 09:00–18:00 ปิดวันจันทร์**. Show “Check the gate before entering.” This is a private home with visitor access subject to the family’s rules. Confirm special dates at the gate. |
| 04 | **Rong Kueak Shrine** | [TAT Thailand][H08] lists **daily 07:00–17:00**; [TAT Japan][H09] gives **08:00–20:00**. | [Thairath][H10] and [MThai][H11] both give **06:00–18:00** for the 1192 shrine. TAT links the [shrine listing](https://maps.app.goo.gl/zXNQDY92MSWGd6z26). | **Check before going / ควรเช็กเวลาก่อนไป**. “Published hours differ; check the shrine’s entrance sign. Daytime is a better plan.” Display the compared schedules in Sources, rather than a firm open/closed badge. |
| 05 | **Street Art & Workshop Lanes** | [VisitBangkok][H12] lists 24-hour access for the broader Charoen Krung street art area; the [Tourism Directory][H13] documents the Trok Rong Kueak art walk. | This evidence is for public lanes, not the opening hours of workshops or private displays. | **Outdoor walk · best in daylight / เดินชมกลางแจ้ง · แนะนำช่วงกลางวัน**. No venue hours. Keep private workshops separate. |
| 06 | **Chow Sue Kong Shrine** | The [shrine foundation’s 18 June 2026 notice, republished by FindGlocal][H14], gives **06:00–16:00** for worship. [TAT’s older guide][H05] gives **07:00–16:00**. | [Waze, 758 Soi Phanu Rangsi][H15], lists **06:00–16:00 daily**. TAT links the [shrine listing](https://maps.app.goo.gl/DnJNSozKPpQ8H6Ka7). | **Daily 06:00–16:00 (worship area) / เปิดสักการะทุกวัน 06:00–16:00**. Use the dated foundation notice and matching map listing. The **office** schedule in the notice is separate: Mon–Sat 08:30–16:00, closed Sun and public holidays. Keep office times out of visitor open status. |
| 07 | **Robot sculpture display** | [Phuket 101][H16] documents a robot shopfront in the neighborhood. It does not establish hours for the exact photographed display P01. | The [Megatron directory entry][H17] has no published hours and is only a possible match for this display. | **Outdoor display · exact spot to confirm / จุดชมงานกลางแจ้ง · รอยืนยันตำแหน่ง**. No fixed hours. Do not promise access inside a workshop or route to a guessed spot. |
| 08 | **Local street-food stall** | P02 shows a glass-sided food cart, with no reliably matched vendor name. | No independently matched map/business schedule. | **Hours not confirmed / ยังไม่ยืนยันเวลาเปิดปิด**. “If it’s serving when you pass, ask what’s available.” No fixed hours, closure badge, or directions. |
| 09 | **Khun Pu’s Curry Puffs** | [Creative Economy Agency][H18] and the [Wongnai Talat Noi merchant listing][H19] both show **Mon–Sat 07:00–14:00**. | The [No. 24 Google/public-profile directory][H20] confirms **Mon–Sat 07:00–14:00; Sun closed**. This is the Talat Noi shop, not another branch. | **Mon–Sat 07:00–14:00; Sun closed / จ.–ส. 07:00–14:00 ปิดวันอาทิตย์**. “Go earlier if you’re looking for a particular filling.” Treat stock as separate from hours. |
| 10 | **22 Barber & Hair Studio** | The [Local Thailand listing][H21] at **16 Soi Charoen Krung 22** gives **09:00–18:00**, with **Friday 09:00–19:00**. | [Bangkok.biz][H22], same studio and address, gives **09:00–18:00 except Wed 09:00–15:00**, with Fri ending at 18:00. No current studio notice was verified. | **Hours vary · ask about a slot / เวลาต่างกันตามวัน · สอบถามคิวกับร้าน**. Put the two schedules under Sources. Confirm Wed/Fri hours and how to book directly with the studio before using a status badge. |
| 11 | **Soraya Larb 101** | The [matched Wongnai merchant page][H23] at **1172/8** lists **Mon–Thu 13:00–23:59; Fri 12:30–01:00 Sat; Sat 11:00–23:59; Sun 13:00–23:59** in the shop-hours section. | The listing separately reports delivery windows. No independent current walk-up schedule was verified. Its late closing times need an owner check. | **Check with the stall / สอบถามเวลาที่ร้าน**. Show the above as “Wongnai-listed hours; walk-up times to confirm” in the details, with Fri close marked **next day**. Keep out of the “Open by schedule” filter until confirmed. |
| 12 | **Bumblebee near Holy Rosary Church** | [Cultural Heritage Studies Vienna][H25] documents the sculpture outside the church. It is an outdoor photo stop, separate from church admission. | A [Bumblebee directory entry][H24] lists 24-hour access at a Soi 22 address; it does not confirm access to the exact island/viewpoint in P07. | **Outdoor photo stop · view from the pavement / จุดถ่ายรูปกลางแจ้ง · ชมจากทางเท้า**. No opening schedule. Check current placement and the public viewing point before routing. |
| 13 | **Portrait of Charoenkrung: Photo Wall** | [CEA][H26] documents the 2020 project; the [Tourism Directory][H13] locates the exhibition in the shrine lane. Neither confirms current display hours or continued installation. | No independent listing verifies that the specific prints are still up. Public lane access and exhibition presence are separate. | **Outdoor display · photos may change / งานจัดแสดงกลางแจ้ง · ภาพอาจเปลี่ยนได้**. Recommend daylight if the prints are up. No “open all day” exhibit claim. |
| 14 | **Mother Roaster · Talat Noi** | The [Wongnai Talat Noi merchant page][H27] at **1172** gives **daily 10:00–17:00**. [TAT Japan][H30] gives **10:00–18:00**, with irregular days off. | [bkkbrew][H28] gives **Mon–Sat 09:30–17:30; Sun closed**. [Filter Notes][H29] explicitly reports a Sunday disagreement with Google Maps. Match the 1172 branch, rather than another Mother Roaster branch. | **Check hours, especially Sunday / เช็กเวลาเปิดปิด โดยเฉพาะวันอาทิตย์**. Show both main schedules in the expanded detail. Use “If open, this is a good coffee break.” Leave Sunday unresolved until the branch confirms it. |
| 15 | **Talat Noi community-life mural** | [BK Magazine][H31] documents the rickshaw mural along Soi Duang Tawan. P10 shows the photographed wall. | No dedicated venue hours or confirmed access schedule for the exact wall. The scene may change. | **Outdoor artwork · best in daylight / งานศิลปะกลางแจ้ง · แนะนำช่วงกลางวัน**. View from public space; avoid a business-style open/closed badge. |

### How to store and display the hours

- Attach the hours to the existing place records. Keep a compact Bangkok-time weekly schedule, a status, public note in EN/TH, source URLs, date reviewed, and any date-specific exceptions. Adapt the fields to the current schema. Store the editor’s confirmation of the actual entrance independently from the hours review.
- Use status choices equivalent to **Published schedule**, **Listed hours**, **Check before going**, **Hours unknown**, **Outdoor stop**, and **Area guide**. Record source scope: visitor access, worship, office, shop, delivery or special event. Keep the raw comparison and contact-check notes available to editors.
- Seed numeric weekly hours for Chow Sue Kong Shrine, Khun Pu’s Curry Puffs and the **listed** schedule for So Heng Tai. Show the label and review date beside the hours. Only use **Open by schedule / เปิดตามเวลาที่แจ้ง** for the published, eligible schedules when the current time falls in their Bangkok interval. Outside it, say **Closed by schedule / ปิดตามเวลาที่แจ้ง**. Do not imply live confirmation or stock.
- For Holy Rosary, Rong Kueak, 22 Barber, Soraya and Mother Roaster, preserve the different reports in the detail or source note and use the visit label in the table. Avoid sorting them as open or closed by an unresolved schedule. If a dated operator update is later entered, let the editor replace the schedule and note which source changed.
- Handle Sunday splits, overnight closing and date-specific exceptions. Keep unknown days distinct from confirmed closures. Where hours may be seasonal or stale, downgrade the badge to **Check before going**. Do not turn Google listing values, map cache values, or one-off festival times into a live status claim.
- In visitor view, put **Today’s hours / วันนี้เปิดกี่โมง** just below the place name or photo. Tap to reveal the week, visit note, and **Sources / แหล่งข้อมูล**. Display “Listings reviewed 11 Nov 2026” where it helps. Keep the full evidence comparison out of the map’s first screen.

## 3. Mobile design

Use the existing style and illustration, with a calm palette inspired by the river and shopfronts. On a phone, give the map most of the screen. Use a compact title/language row, a clear search input, and one unobtrusive filter control. Keep labels readable against the map and avoid showing every pin label at once.

### Map, search and place cards

- On first open, show the map, a search field, and a small **Places** button. Start with the desktop sidebar closed on phones. Let the visitor switch between **Map** and **List** with one tap; keep the current search, category, selected pin and map camera when switching.
- Make category filters short and easy to scan. Put extra filters in a small sheet. Keep a visible reset action when filters are active. Do not add a default “Open now” filter that hides outdoor art or unknown stalls.
- Tapping a pin opens a bottom sheet with the place name, category, photo, **Today’s hours**, and the primary action. Provide a clear close button and **Read the story**. Let visitors expand the sheet for the longer bilingual content without losing where they were on the map.
- Make controls comfortable to tap (aim for at least 44 px), space pin hits so neighboring places can be selected, keep zoom and recenter clear, and handle pan and pinch without stealing vertical scrolling from the place sheet. Keep buttons above the phone’s home indicator and clear of the keyboard.
- Search both languages and keep old aliases, so **Local snack shop**, **กะหรี่ปั๊บคุณปุ๊**, and **Khun Pu** still point to the same record. Preserve the English/Thai switch and show the relevant labels, hours notes, and visit tips in the selected language.
- Make the existing three walk chapters easy to reach under **Plan your walk / วางแผนเดินเที่ยว**. Let visitors skip to the next stop or view nearby alternatives. Use only editor-confirmed entrance pins for routing. For a placeholder or area guide, keep the story available and show **Location to confirm**; remove every shortcut that would start directions to that placeholder.

### Sharing, access and speed

- Add a simple **Share map / แชร์แผนที่** control. On a compatible phone, use the native share sheet. Also provide **Copy link**, a QR preview, and **Download QR**. The link and QR must point to the same visitor page.
- Use only the visitor URL in shares. Do not copy an editor link, private project URL, session token, or temporary localhost address.
- Use responsive photo sizes; load offscreen gallery images as needed. Show a useful loading state if the illustrated map takes time, and keep place names, hours and the list usable if the large image cannot load.
- Keep core tasks usable with keyboard focus and screen-reader labels. Avoid a page-wide horizontal scrollbar, hidden close controls, and fixed panels that cover the map after rotating or opening the keyboard.
- Start with the public read-only map. Verify that a guest can see the latest published photos, place details, hours, source links, and walk chapters without a project account. The editor should retain its current permission checks. If a host’s preview limits data for guests, flag it as a launch blocker and use the existing supported public hosting path for the release.

## 4. QR and soft launch handoff

The supplied PNG opens this **current preview**:

https://claude.ai/artifact/L11qJxFD2DWdfMLXjzZyd4#no_universal_links

Use it for sharing the current preview. When I provide or approve a stable public launch URL, generate the final launch QR from that exact HTTPS visitor URL. Keep a clear white margin and high contrast, and use a standard QR encoder. Export a printable PNG (at least 1,000 px) and an SVG if the project supports it. Show the readable link beside the QR as a fallback. Update the in-app sharing URL, printed QR and copy link together when the URL changes.

Prepare the soft launch with a clean landing view, an optional short welcome line, and one clear feedback action if the project already has an approved channel. Avoid inserting an unconfigured form. Offer the public preview and summarize any items that need a call or field check.

**Welcome copy — EN:** “Pick a place to visit, check today’s hours, and take Talat Noi one lane at a time.”  
**Welcome copy — TH:** “เลือกจุดที่อยากแวะ เช็กเวลาเปิดวันนี้ แล้วค่อย ๆ เดินเที่ยวตลาดน้อยทีละตรอก”

## 5. What to test and hand back

1. **Content:** The 15 existing records are still there; ten fieldwork photos and their credits match the original entries. No duplicated pins. Every entry has an hours or access note, with the evidence trace available in Sources.
2. **Hours:** Test a Sunday for Khun Pu, a Monday at the mansion, a pre-opening and post-closing time at Chow Sue Kong, and a schedule exception. Test Bangkok time from a device set to another timezone. Verify Mother Roaster, Rong Kueak, Soraya and unverified stops never get a false “open” badge. Keep Mass and office hours separate.
3. **Mobile:** Check widths around **360, 390 and 430 px**, plus landscape. Test iPhone Safari and Android Chrome if available. Try the complete path: open, search, filter, tap pin, read hours, open story, return to the same map view, and share. Test slower loading and a missing photo.
4. **Guest access and QR:** Open the shared URL signed out or in a private tab. Scan the QR from another device or a print-sized preview and confirm the exact destination, share link, place data and photos. Verify no placeholder pin launches directions.
5. **Deliver:** Run the current project’s build and relevant checks. Give me a working mobile preview, the tested release QR once the release URL is approved, a short change summary, and the remaining hours or entrance checks. Tell me what is ready for sharing and which checks still require an on-site visit.

---

## Source index for the editor

Read the sources linked in the table; keep the source name and URL with the corresponding place. The Google-linked comparison is evidence about the reported listing, and the field photos remain the evidence for the unidentified or outdoor stops.

- **H01–H03:** Catholic directory and Holy Rosary visiting-hour guides.
- **H04–H13:** TAT, matched mansion directory, shrine coverage, Bangkok city and Tourism Directory.
- **H14–H17:** Chow Sue Kong foundation notice, Waze and robot display coverage.
- **H18–H25:** CEA, merchant listings, business directories and researcher documentation.
- **H26–H31:** Photo project archive, Mother Roaster branch comparisons, and mural coverage.

**End of implementation prompt.**

[H01]: https://www.catholic.or.th/main/index.php?Itemid=341&catid=101&id=553%3A%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B9%81%E0%B8%A1%E0%B9%88%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%A5%E0%B8%B9%E0%B8%81%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%84%E0%B8%B3-%E0%B8%81%E0%B8%B2%E0%B8%A5%E0%B8%AB%E0%B8%A7%E0%B9%88%E0%B8%B2%E0%B8%A3%E0%B9%8C&option=com_content&view=article
[H02]: https://localthailand.net/thurakit/wat-mae-phra-lukprakham-kanwa-samphanthawong
[H03]: https://www.phuket101.net/bangkok/the-holy-rosary-church/
[H04]: https://thai.tourismthailand.org/Attraction/%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%A2
[H05]: https://www.tourismthailand.org/Articles/1-day-in-talat-noi
[H06]: https://localthailand.net/thurakit/ban-soohengthai-samphanthawong
[H07]: https://i-discoverasia.com/walks/talad-noi/locations/the-so-heng-tai-mansion/
[H08]: https://thai.tourismthailand.org/Articles/1-%E0%B8%A7%E0%B8%B1%E0%B8%99-%E0%B8%A2%E0%B9%88%E0%B8%B2%E0%B8%99%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%A2
[H09]: https://www.thailandtravel.or.jp/rong-kuek-shrine/
[H10]: https://www.thairath.co.th/lifestyle/life/2914402
[H11]: https://mthai.com/travel/bangkok/419755.html
[H12]: https://visit.bangkok.go.th/th/place/2782
[H13]: https://www.thailandtourismdirectory.go.th/en/attraction/103461
[H14]: https://www.findglocal.com/TH/Bangkok/670965572992461/%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B8%99%E0%B8%B4%E0%B8%98%E0%B8%B4%E0%B8%A8%E0%B8%B2%E0%B8%A5%E0%B9%80%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B9%82%E0%B8%88%E0%B8%8B%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B8%87-%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%A2-Chowsuekong-TJK
[H15]: https://www.waze.com/live-map/directions/th/krung-thep-maha-nakhon/%E0%B8%A8%E0%B8%B2%E0%B8%A5%E0%B9%80%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B9%82%E0%B8%88%E0%B8%A7%E0%B8%8B%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B8%87-%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%A2?to=place.ChIJf4RfXTaZ4jARTaVnsogpboA
[H16]: https://www.phuket101.net/bangkok/talat-noi-in-bangkok/
[H17]: https://localthailand.net/en/thurakit/megatron-samphanthawong
[H18]: https://creativecity.cea.or.th/th/district-projects/made-in-charoenkrung-year-1
[H19]: https://www.wongnai.com/restaurants/203984lw
[H20]: https://localthailand.net/thurakit/karipap-khunpu-samphanthawong
[H21]: https://localthailand.net/thurakit/22-barber-hair-studio-private-one-on-one-service-samphanthawong
[H22]: https://bangkok.biz/business/22-barber-and-hair-studio-private-one-on-one-service
[H23]: https://www.wongnai.com/restaurants/431692fq-%E0%B9%82%E0%B8%AA%E0%B8%A3%E0%B8%A2%E0%B8%B2-%E0%B8%A5%E0%B8%B2%E0%B8%9A-101-%E0%B9%80%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B9%80%E0%B8%81%E0%B9%88%E0%B8%B2-%E0%B8%95%E0%B8%B3%E0%B9%81%E0%B8%8A%E0%B9%88%E0%B8%9A%E0%B8%99%E0%B8%B1%E0%B8%A7%E0%B9%80%E0%B8%A2%E0%B8%B2%E0%B8%A7%E0%B8%A3%E0%B8%B2%E0%B8%8A
[H24]: https://localthailand.net/thurakit/bumblebee-samphanthawong
[H25]: https://hexagon-impala-fsmz.squarespace.com/gloco-blog/what-does-a-statue-of-optimus-prime-have-to-do-with-heritage-in-bangkok
[H26]: https://creativecity.cea.or.th/th/district-projects/portrait-of-charoenkrung
[H27]: https://www.wongnai.com/restaurants/389051aw-mother-roaster-%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%A2-talat-noi
[H28]: https://www.bkkbrew.com/shop/mother-roaster-taladnoi
[H29]: https://www.filternotes.com/bangkok/mother-roaster
[H30]: https://www.thailandtravel.or.jp/mother-roaster/
[H31]: https://www.bkmagazine.com/city-living/these-murals-highlight-talad-nois-rise-bangkoks-hub-street-art/

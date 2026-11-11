# Talat Noi, one lane at a time
## Claude implementation prompt and researched content for all 15 places

**Project:** Talat Noi Story Map  
**Research review:** 11 November 2026 (Bangkok)  
**Photo set:** Jump's ten Talat Noi fieldwork photos, P01–P10, catalogued in the interface redesign brief.

---

## Instructions for Claude Code

Work inside my existing Talat Noi map project. Update the **15 existing entries** with the visitor copy in this brief, and connect them into a guide people can use before and during a walk. Keep the illustrated map, category filters, search, photo credits, saved data and existing editor flow. Deliver the working changes in the current project and a preview I can review.

### What the guide should feel like

Write like someone showing a friend around their neighborhood. Start each pin with a detail visitors can recognize: a doorway, a sound suggested by the scene, a painted figure, a dish, or a view toward the river. Keep the preview brief. Put the fuller history behind **Read the story**. Give the visitor one small thing to notice or do next. The visitor copy below is ready to use. Keep it warm, clear and grounded in the evidence.

### Implement this in the existing app

1. **Match records before editing.** Use existing IDs where available, otherwise match the current displayed title and original image filename. Update in place, including the existing Holy Rosary Church record. Add aliases for renamed entries so old search terms still work. Do not create extra pins for references mentioned in stories.
2. **Build a consistent place card.** Show title, category, the existing hero photo and credit, a one-sentence preview, then **Read the story**, **When you visit**, **Related stops**, and collapsible **Sources**. Use the supplied English and Thai visitor copy. Remove inline evidence keys from the visible prose once the source links are attached to the card. Keep longer copy scrollable on mobile. Preserve current imagery for entries without a new photo, and provide a graceful fallback where there is no image.
3. **Keep editorial evidence separate.** The matching notes, unresolved leads, and source identifiers in this document are for the editor. Store the relevant source title and URL per entry so the visitor can open it. Where an entry relies on the photo, display a small **Field note / บันทึกภาคสนาม** label. Use **Area guide / เรื่องราวของย่าน** for the two neighborhood entries. Use **Location to confirm / รอยืนยันตำแหน่ง** when the entrance or photographed spot still needs checking.
4. **Keep geography honest.** A confirmed name, photo or postal address does not confirm the illustrated pin or its routing coordinates. Preserve separately stored illustrated positions and real-world destinations. Do not geocode from a filename, copy a neighboring pin, or infer a position from capture order. Disable **Directions**, route insertion and turn-by-turn navigation for temporary or unverified destinations, including in the navigation menu. An area story should not route to a guessed building. Enable navigation only when the editor confirms the actual accessible entrance or a documented public viewing point.
5. **Keep the walk flexible.** Add or reuse a compact **Plan your walk** section with the three chapters at the end of this prompt. Use text and place cards for unverified stops; omit them from navigable sequences. Preserve the existing draft/publish workflow. Deliver the changes as a preview or draft for my review.
6. **Keep operational details current.** Read the hours, entrance rules, prices and accessibility fields in the existing project. If they are stale or unsourced, show **Check before visiting** or leave the field empty. Do not turn historic hours, dated menus, exhibition dates, or reviews into current promises. Record research review date and on-site location confirmation date separately.

### Existing records and photo assignments

| # | Current entry to match | Display title to use | Category | Jump photo | Evidence scope |
|---|---|---|---|---|---|
| 01 | Holy Rosary Church | Holy Rosary Church | Belief | P06 · 20261104_153419.jpg | Parish history and street address documented; match entrance |
| 02 | Old Commercial Quarter | Old Commercial Quarter | Heritage | Existing image, if any | Documented neighborhood context; area story |
| 03 | So Heng Tai Mansion | So Heng Tai Mansion | Heritage | Preserve existing image | Documented family house; access changes |
| 04 | Rong Kueak Shrine | Rong Kueak Shrine | Belief | Preserve existing image | Documented shrine, inscriptions and lane |
| 05 | Street Art & Workshop Lanes | Street Art & Workshop Lanes | Art & craft | Preserve existing image | Documented lanes and traditions; area story |
| 06 | Chow Sue Kong Shrine | Chow Sue Kong Shrine | Belief | Preserve existing image | Documented shrine and ritual history |
| 07 | Robot sculpture display | Robot sculpture display | Art & craft | P01 · 20261104_155403.jpg | Field photo and documented neighborhood craft context; exact workshop to confirm |
| 08 | Local street-food stall | Local street-food stall | Food & drink | P02 · 20261104_153940.jpg | Photo only; vendor and location unknown |
| 09 | Local snack shop | Khun Pu’s Curry Puffs | Food & drink | P03 · 20261104_154919.jpg | Door number and photographed storefront match published documentation |
| 10 | 22 Barber & Hair Studio | 22 Barber & Hair Studio | Community | P04 · 20261104_154539.jpg | Sign and public listing match; business history unconfirmed |
| 11 | Som tam, larb & grilled-chicken stall | Soraya Larb 101 | Food & drink | P05 · 20261104_152613.jpg | Name, street number and number on sign match business listing |
| 12 | Yellow robot sculpture | Bumblebee near Holy Rosary Church | Art & craft | P07 · 20261104_153358.jpg | Researcher photo and maker interview identify sculpture; confirm viewing point |
| 13 | Outdoor photography display | Portrait of Charoenkrung: Photo Wall | Art & craft | P08 · 20261104_152829.jpg | Project credit visible; organizer and tourism records corroborate exhibition |
| 14 | Mother Roaster entrance | Mother Roaster · Talat Noi | Food & drink | P09 · 20261104_152547.jpg | Sign, entrance number and published branch information match |
| 15 | Talat Noi community-life mural | Talat Noi community-life mural | Art & craft | P10 · 20261104_150559.jpg | Published imagery and lane references; artist and exact wall position to confirm |

Use **Photo by Jump** for P01–P10. Use the existing image assets or the original JPEG attachments from the companion PDF. Other photos keep their existing author and license. Treat research photos linked in the source list as evidence; use the original fieldwork images for display.

---

## Place content

### 01. Holy Rosary Church

**Thai title:** วัดแม่พระลูกประคำ (กาลหว่าร์)  
**Location reference:** 987 Soi Wanit 2, Talat Noi. P06 shows the signed street gateway; use that gateway as the field reference and check public access.

**Card preview — EN**  
Look for the gate with Thai, Chinese and English lettering. Beyond it is a riverside Catholic church with a story that reaches back to Ayutthaya.

**Read the story — EN**  
After Ayutthaya fell in 1767, Portuguese Catholics travelled down the Chao Phraya to the Bangkok area. A group settled on the east bank, on land later granted for their church in the reign of Rama I. They brought two devotional figures from Ayutthaya: Our Lady of the Rosary and a figure of Christ after the crucifixion. The older name, Kalawar, comes from Calvary, the place associated with the crucifixion. [S03] [S04]

The first church was completed in 1787, after the land grant the previous year. Its successor was consecrated in 1839 and formally dedicated to Our Lady of the Rosary. By then, Chinese Catholics, including Teochew residents, were becoming an important part of parish life. That change is one reason the Thai, Chinese and English lettering at the gate feels at home here. [S04] [S06]

The present church is the third building, completed in 1897. Its pointed arches, tall cross-topped spire and stained glass belong to the Gothic Revival style. Notice that the main front faces the river, a reminder of how much of the old city was approached by water. [S04] [S05]

**When you visit — EN**  
Start at the gate shown in the photo. If visitors are welcome inside, step in quietly and leave worship and school traffic space.

**Card preview — TH**  
มองหาซุ้มประตูที่มีป้ายสามภาษา ด้านในคือโบสถ์คาทอลิกริมเจ้าพระยาที่มีเรื่องราวย้อนไปถึงสมัยอยุธยา

**Read the story and visit note — TH**  
หลังกรุงศรีอยุธยาเสียแก่พม่าใน พ.ศ. 2310 ชาวคาทอลิกเชื้อสายโปรตุเกสกลุ่มหนึ่งล่องลงมาตั้งถิ่นฐานริมเจ้าพระยา ต่อมาได้รับพระราชทานที่ดินในสมัยรัชกาลที่ 1 และสร้างโบสถ์หลังแรกเสร็จใน พ.ศ. 2330 เมื่อเวลาผ่านไป ชาวจีนคาทอลิกในละแวกนี้ก็เข้ามาเป็นส่วนสำคัญของชุมชนวัด

โบสถ์ที่เห็นในปัจจุบันเป็นหลังที่สาม สร้างเสร็จใน พ.ศ. 2440 ลองสังเกตยอดแหลม ซุ้มโค้ง และกระจกสีแบบกอทิกฟื้นฟู ด้านหน้าของโบสถ์หันสู่แม่น้ำ เหมือนชวนให้นึกถึงสมัยที่ผู้คนเดินทางมาทางน้ำ หากเปิดให้เข้าชม ค่อย ๆ เดินเข้าไปและเว้นพื้นที่ให้ผู้มาประกอบพิธี

**Related stops:** Bumblebee near Holy Rosary Church; Rong Kueak Shrine.  
**Editorial check:** Use 1786 for the land grant and 1787 for completion of the first church; do not confuse either with 1897. No published visitor schedule or gate access was confirmed for this prompt.  
**Image alt:** Trilingual Holy Rosary Church entrance sign across a driveway.

### 02. Old Commercial Quarter

**Thai title:** ย่านการค้าเก่าตลาดน้อย  
**Location reference:** Area around Soi Wanit 2 and Charoen Krung Soi 22, in Talat Noi, Samphanthawong. This card introduces the neighborhood.

**Card preview — EN**  
Follow the lanes behind the river. Talat Noi grew as a “little market,” and its shopfronts still tell the story.

**Read the story — EN**  
In early Bangkok, trade spread south from the busy Sampeng market. The smaller market that grew here became known locally as Ta Lak Kia, or Talat Noi: “little market.” The river linked the quarter to the movement of people and goods. Chinese merchants, laborers and artisans put down roots here, with Hokkien, Hakka and Teochew communities among them. The nearby Catholic church and Chinese shrines show how different communities made their lives along the same river. [S01] [S02] [S06]

Commerce here went beyond selling goods. River traffic gave metalworkers a reason to make and repair fittings for boats. The neighborhood later became associated with Xiang Kong, the trade in used machinery and vehicle parts. Look at the small spaces between a home, a storefront and a workshop: each tells you how work and daily life share the same streets. [S01] [S07]

For a deeper introduction, the Treasury Department’s Talat Noi Museum occupies the site of a former lathe workshop. The museum building was designed to recall that workshop. Its neighborhood exhibits give the lanes you have just walked through a little more meaning. [S07]

**When you visit — EN**  
Start with one lane instead of trying to see everything at once. Keep entrances clear, and look up at signs, doors and rooflines as you go.

**Card preview — TH**  
ลองเดินเข้าตรอกหลังแนวแม่น้ำ จากตลาดเล็กที่ขยายมาจากสำเพ็ง สู่ย่านที่ยังอ่านเรื่องราวได้จากหน้าร้าน

**Read the story and visit note — TH**  
ตลาดน้อยเติบโตจากการค้าของสำเพ็งที่ขยายตัวในสมัยต้นกรุงรัตนโกสินทร์ ชื่อที่คนในชุมชนเรียกกันว่า “ตะลัคเกียะ” หมายถึงตลาดเล็ก แม่น้ำเจ้าพระยาเคยเป็นเส้นทางขนสินค้าและพาผู้คนจากหลายถิ่นมาลงหลักปักฐาน ต่อมาย่านนี้เป็นที่รู้จักทั้งงานช่างโลหะและการค้าเครื่องจักรกับอะไหล่มือสองแบบเซียงกง

ค่อย ๆ เดินดูประตูไม้ ป้ายร้าน และพื้นที่หน้าบ้านที่ใช้ทำงานด้วย หากอยากเข้าใจเรื่องราวของย่านเพิ่ม ลองดูข้อมูลการเข้าชมพิพิธตลาดน้อยที่ตั้งอยู่บนพื้นที่โรงกลึงเดิม

**Related stops:** Street Art & Workshop Lanes; So Heng Tai Mansion; Chow Sue Kong Shrine.  
**Editorial check:** The museum is a named contextual reference, not a sixteenth map record. The whole quarter has no single entrance, admission fee or opening time.

### 03. So Heng Tai Mansion

**Thai title:** คฤหาสน์โซวเฮงไถ่  
**Location reference:** No. 282, Soi Duang Tawan, off Soi Wanit 2, Talat Noi.

**Card preview — EN**  
Behind the red doors, a Hokkien-style family home gathers its rooms around an open courtyard.

**Read the story — EN**  
The story of this house is tied to Chao Sua Jat, a Hokkien merchant known by the title Phra Aphai Wanit. Creative Thailand records his involvement in collecting government revenue on edible bird’s nests and links his family to river commerce. Generations of the Posayachinda family have looked after the compound. Think of it as a home shaped by the fortunes and choices of a family over time. [S08] [S09]

The arrangement helps explain how the household worked: the gateway opens into a central yard with rooms around it. The three wings make a U around the courtyard, with the entrance structure closing the fourth side. The house is often described as *si ruean lom lan*, or “four structures around a courtyard.” Architectural research describes Hokkien planning combined with Siamese building elements. [S08] [S09] [S10]

The pool in the courtyard is a later addition made for diving. It is one of the ways the family adapted the old compound to new uses. Researchers who interviewed the family describe the work and cost of looking after a private heritage house. The house still has a life of its own beyond the hours visitors may be able to enter. [S08] [S09]

**When you visit — EN**  
Look for the entrance in Soi Duang Tawan. Check the sign at the gate for access or a fee. If open, stay in the areas the family has made available.

**Card preview — TH**  
หลังประตูสีแดงเป็นบ้านเก่าทรงจีนฮกเกี้ยนที่มีลานเปิดโล่งอยู่กลางบ้าน

**Read the story and visit note — TH**  
โซวเฮงไถ่ผูกกับเรื่องของเจ้าสัวจาด หรือพระอภัยวานิช พ่อค้าชาวจีนฮกเกี้ยน และตระกูลโปษยะจินดาที่ดูแลบ้านต่อกันมาหลายรุ่น ผังบ้านแบบสี่เรือนล้อมลานทำให้เห็นว่าพื้นที่ตรงกลางเชื่อมเรือนแต่ละด้านเข้าด้วยกันอย่างไร ส่วนสระกลางลานเป็นการปรับใช้ในยุคหลังเพื่อการดำน้ำ

เมื่อมาถึงซอยดวงตะวัน ลองสังเกตประตูและผังเรือนจากจุดที่เข้าถึงได้ บ้านนี้ยังเป็นพื้นที่ส่วนตัวของครอบครัว ดูป้ายหน้าบ้านก่อนเข้าชมและเคารพพื้นที่ที่เจ้าของไม่ได้เปิดให้เข้า

**Related stops:** Talat Noi community-life mural; Rong Kueak Shrine.  
**Editorial check:** Sources give different estimated construction periods. Avoid a single building year, a precise age, or a “Bangkok’s oldest” superlative. Do not advertise diving classes, a café service, an entry fee, or daily access as current facts without an owner check.

### 04. Rong Kueak Shrine

**Thai title:** ศาลเจ้าโรงเกือก (ฮ้อนหว่องกุง)  
**Location reference:** Trok San Chao Rong Kueak, off Soi Wanit 2, beside the Chao Phraya.

**Card preview — EN**  
At the riverside end of the shrine lane, pause for carved wood, painted reliefs and a story written in stone.

**Read the story — EN**  
Rong Kueak is a Hakka shrine dedicated to Hon Wong Kung. Stone plaques inside record an older tradition: Hakka merchants brought the image of the deity from China before the present shrine existed. The tourism department’s account describes worshippers outgrowing the original shrine for processions. In the late nineteenth century, the committee raised money to purchase riverside land next to it, making room for the community to gather. [S11] [S12]

Take a closer look at the entrance. Small framed panels combine narrative painting with tile-decorated stucco. Carved wooden panels beside the doorway include dragon and cloud motifs; the tourism directory describes them as part of the shrine’s “dragon and tiger window” design. Inside, the museum also records the presence of Pun Thao Kong, a deity associated with prosperity. [S11] [S12]

The shrine has a different community history from Chow Sue Kong, the Hokkien shrine elsewhere in Talat Noi. Seeing both gives the walk a richer sense of the Chinese communities that settled here. [S06] [S11]

**When you visit — EN**  
Pause at the entrance to notice the details. If you step inside, follow posted instructions and give worshippers space.

**Card preview — TH**  
ปลายตรอกริมแม่น้ำมีศาลเจ้าฮากกาที่ชวนให้หยุดดูไม้ฉลุ ภาพปูนปั้น และเรื่องราวบนแผ่นศิลา

**Read the story and visit note — TH**  
ศาลเจ้าโรงเกือกเป็นศาลเจ้าของชาวจีนฮากกา ประดิษฐานเจ้าพ่อฮ้อนหว่องกุง จารึกภายในเล่าว่าพ่อค้าชาวฮากกาอัญเชิญรูปเคารพมาจากจีนก่อนจะมีศาลหลังปัจจุบัน เมื่อพื้นที่เดิมเริ่มคับแคบสำหรับขบวนแห่ ผู้ศรัทธาจึงร่วมกันซื้อที่ริมแม่น้ำเพิ่มในช่วงปลายคริสต์ศตวรรษที่ 19

ตรงทางเข้า ลองมองหากรอบภาพเล่าเรื่องและลายมังกรบนไม้ฉลุ หากเข้าไปด้านใน ให้เว้นทางสำหรับคนที่มาไหว้เจ้าและทำตามป้ายของศาล

**Related stops:** Portrait of Charoenkrung: Photo Wall; Street Art & Workshop Lanes; Chow Sue Kong Shrine.  
**Editorial check:** Use the Thai tourism directory and Treasury museum for the Hakka attribution. The English TAT itinerary calls the merchants Hokkien; the Thai TAT version agrees with the museum. Published Gregorian conversions for the plaque differ, so use “late nineteenth century” and avoid calling the inscription date the opening date. The name’s association with footwear is a proposed explanation, not a settled origin. [S11] [S12] [S13]

### 05. Street Art & Workshop Lanes

**Thai title:** ตรอกสตรีทอาร์ตและงานช่างตลาดน้อย  
**Location reference:** Public lanes around Trok San Chao Rong Kueak and Soi Duang Tawan, linked to the Wanit 2 area. Treat this as an area guide.

**Card preview — EN**  
In these lanes, painted walls and working shopfronts tell different parts of the same neighborhood story.

**Read the story — EN**  
Start with the work behind the walls. On a river that carried goods and boats, local smiths made and repaired parts such as anchors and chains. In its portrait project, the Creative Economy Agency profiled a Talat Noi smith who learned the work from his father and later took on smaller jobs such as tools for craftspeople. The used-parts trade adds another chapter: one part that is surplus to one repair can be useful to the next. [S01] [S14]

The walls carry stories of their own. In a 2022 interview, a neighborhood tourism organizer recalled gaining permission to paint on a long Marine Department wall. One of the images recalled the red-prowed trading junks once associated with the river. A 2018 community art project included a golden lion by Bonus TMC and a turtle by DR.CAS, drawing on lion dancing, shrine celebrations and ritual food. The street has also displayed photography from the 2020 Bangkok Design Week period. These are documented examples from different years; what you see on any given walk can change. [S15] [S16] [S17]

**When you visit — EN**  
Pick one detail on a wall and one on a storefront. Leave room for residents and deliveries, and ask before photographing someone at work.

**Card preview — TH**  
ตรอกเล็ก ๆ ที่ภาพบนกำแพงและหน้าร้านช่างเล่าเรื่องของย่านเดียวกันคนละมุม

**Read the story and visit note — TH**  
เมื่อเรือยังเข้ามาซ่อมและหาอะไหล่ตามท่าน้ำ ช่างในตลาดน้อยรับทำทั้งสมอ โซ่ และชิ้นส่วนต่าง ๆ งานช่างกับการค้าอะไหล่จึงเป็นส่วนหนึ่งของชีวิตในตรอกเหล่านี้ ต่อมาภาพวาดและภาพถ่ายบนผนังก็ช่วยเล่าเรื่องชุมชนอีกแบบ ทั้งเรื่องเรือสำเภา สิงโตเชิด และประเพณีไหว้เจ้า

ผลงานอาจเปลี่ยนไปตามช่วงเวลา ลองเดินช้า ๆ มองสลับระหว่างภาพบนกำแพงกับหน้าร้านจริง และขออนุญาตก่อนถ่ายภาพคนที่กำลังทำงาน

**Related stops:** Robot sculpture display; Talat Noi community-life mural; Portrait of Charoenkrung: Photo Wall.  
**Editorial check:** Do not attach artists from the 2018 project, the 2016 festival or CEA projects to an individual mural without a match. Workshops are places of work; no invitation to enter or promised demonstrations.

### 06. Chow Sue Kong Shrine

**Thai title:** ศาลเจ้าโจวซือกง  
**Location reference:** 758 Soi Phanu Rangsi (ภาณุรังษี), Talat Noi, as listed by TAT.

**Card preview — EN**  
A Hokkien shrine facing the river, where generations have come to pray for health and good fortune.

**Read the story — EN**  
An inscription dates the shrine to 1804, in the reign of Rama I. For the Hokkien community, it was a place to gather and keep religious traditions after settling in Bangkok. Chow Sue Kong is the local name associated with Qingshui Zushi (清水祖師), revered in Fujian and often called the “Divine Doctor” here. Worshippers traditionally come with hopes for health, well-being and good fortune. [S06] [S10] [S18]

Look at the shrine’s orientation toward the Chao Phraya and the detailed stucco, which TAT describes as retaining Qing-style features. The shrine is closely associated with Talat Noi’s Vegetarian Festival. During Yuanxiao, after Lunar New Year, worshippers also bring *khanom tao*. A study of the ritual describes Talat Noi’s version as a white, bun-like wheat pastry in the shape of a turtle, a symbol of long life. It is a small detail that connects the shrine, household cooking and the stories painted in nearby lanes. [S10] [S14] [S15] [S18]

**When you visit — EN**  
Take a moment at the entrance before going in. Let people complete their offerings, and ask before photographing a ceremony.

**Card preview — TH**  
ศาลเจ้าฮกเกี้ยนที่หันหน้าออกแม่น้ำ ผู้คนแวะมาขอพรเรื่องสุขภาพและความเป็นสิริมงคล

**Read the story and visit note — TH**  
จารึกของศาลเจ้าระบุปีสร้าง พ.ศ. 2347 ตรงกับสมัยรัชกาลที่ 1 ศาลเป็นที่ยึดเหนี่ยวของชาวจีนฮกเกี้ยนในย่านนี้ มีองค์โจวซือกง หรือที่หลายคนเรียกว่า “พระหมอ” เป็นเทพประธาน นอกจากเทศกาลกินเจแล้ว งานศึกษายังบันทึกว่าในเทศกาลหยวนเซียว ชาวตลาดน้อยนำขนมเต่าสีขาวทำจากแป้งสาลีคล้ายซาลาเปามาไหว้ เต่าเป็นสัญลักษณ์ของความปรารถนาให้อายุยืน

ลองสังเกตงานปูนปั้นและทิศที่ศาลหันไปทางแม่น้ำ หากมีพิธีอยู่ ให้ยืนดูอย่างสงบและขออนุญาตก่อนถ่ายภาพ

**Related stops:** Rong Kueak Shrine; Old Commercial Quarter; Street Art & Workshop Lanes.  
**Editorial check:** The ritual description is historical and cultural. Do not promise a specific festival day without the shrine’s current calendar or make health claims. Leave current access and hours for the editor to confirm.


### 07. Robot sculpture display

**Thai title:** มุมจัดแสดงหุ่นยนต์หน้าเวิร์กช็อป  
**Location reference:** The orange frontage and row of lanterns in P01 are the visual clues. Keep the specific location pending.

**Card preview — EN**  
Red lanterns hang over a row of robots, with metal parts piled behind them. Take a second look at the details.

**Read the story — EN**  
The first thing you might notice is the red-and-gold figure. Then your eye moves to the dark metal figures beside it: pointed shoulders, layered plates and feet built up in pieces. The orange shopfront and lanterns make the display feel like part of the lane. The photo also shows stacks of parts behind the sculptures. [P01]

There is a local story behind that juxtaposition. Talat Noi became known for dealing in used machinery and vehicle parts, a trade called Xiang Kong. In a published interview, parts trader Aree Manatpakorn, known as Hia Seng Junior, described making other robot sculptures from reclaimed components. The trade helps explain why metal and machines appear so often in the neighborhood’s newer art. The maker of the specific figures in this field photo still needs to be confirmed. [S01] [S19]

**When you visit — EN**  
If you come across the display, see it from the public side of the frontage. Leave room for people working or passing through.

**Card preview — TH**  
ใต้โคมแดงหน้าร้านสีส้มมีหุ่นโลหะหลายตัว ลองมองใกล้ ๆ ว่าแต่ละตัวประกอบจากชิ้นส่วนหน้าตาแบบไหน

**Read the story and visit note — TH**  
ในภาพมีทั้งหุ่นสีแดงทอง หุ่นโลหะสีเข้ม และกองชิ้นส่วนอยู่ด้านหลัง ภาพนี้ชวนให้นึกถึงเซียงกง การค้าเครื่องจักรและอะไหล่มือสองที่ผูกกับตลาดน้อยมานาน ในย่านเดียวกันมีตัวอย่างงานหุ่นที่นำอะไหล่เก่ามาทำใหม่ แต่ผู้สร้างหุ่นในภาพนี้ยังต้องยืนยัน หากเดินเจอ ลองชมจากทางสาธารณะและเว้นพื้นที่ให้คนทำงาน

**Related stops:** Bumblebee near Holy Rosary Church; Street Art & Workshop Lanes.  
**Editorial check:** Reporting identifies Hia Seng's shopfront display near Wanit 2 and Charoen Krung Soi 22 as a lead. Match the orange façade and exact figures in person before assigning this photo to the workshop or naming its owner or maker. Leave Directions off. [S20]  
**Image alt:** Red-and-gold and dark metal robot sculptures beside an orange shopfront with red lanterns.

### 08. Local street-food stall

**Thai title:** รถเข็นอาหารในตรอก  
**Location reference:** No reliable shop name, street number or exact spot was identifiable from P02. Use the photo as a field note.

**Card preview — EN**  
A glass food cart and a few folding tables show how a small lane can make room for a meal.

**Read the story — EN**  
A glass-fronted cart sits under an awning, with trays and neatly stacked ingredients visible inside. Next to it are metal tables with condiments, backed by pale green tiles. In a lane this narrow, a kitchen counter, a dining spot and a route home can be only a few steps apart. [P02]

A table beside a doorway and a cart pulled up under cover tell their own story about daily life here. This is a glimpse from Jump’s walk; the vendor’s name and menu are still being checked. [P02]

**When you visit — EN**  
If a cart is serving as you pass, ask what is available that day. Leave a clear path around the tables.

**Card preview — TH**  
รถเข็นตู้กระจกกับโต๊ะพับไม่กี่ตัว ทำให้เห็นว่าตรอกเล็ก ๆ ก็เป็นที่แวะกินข้าวได้

**Read the story and visit note — TH**  
ใต้กันสาดในภาพมีรถเข็นอาหารตั้งอยู่ใกล้ผนังกระเบื้องสีเขียวอ่อน ข้าง ๆ เป็นโต๊ะพับพร้อมเครื่องปรุง เป็นมุมเล็ก ๆ ที่เห็นชีวิตประจำวันของย่านได้ชัด ชื่อร้านและเมนูยังไม่ได้ยืนยัน หากเดินผ่านแล้วร้านกำลังขาย ลองถามว่าวันนั้นมีอะไรให้ชิม และเผื่อทางให้คนเดินผ่าน

**Related stops:** Khun Pu’s Curry Puffs; Soraya Larb 101; Old Commercial Quarter.  
**Editorial check:** Keep as **Field note**. The glass case alone does not establish ingredients, a noodle specialty or a specific vendor. Record sign, corner or street number, vendor-confirmed menu and coordinates on a return visit. Do not attach it to a known noodle shop by resemblance. Leave Directions off.  
**Image alt:** Glass-sided food cart and folding tables in a narrow lane with a pale green tiled wall.

### 09. Khun Pu’s Curry Puffs

**Thai title:** กะหรี่ปั๊บคุณปุ๊  
**Search aliases:** Local snack shop; Khun Phu; Pu Curry Puff; Currypuff K.phu.  
**Location reference:** No. 24, Charoen Krung Soi 22, Talat Noi. The door number, teal and cream folding frontage, arch and photo-covered panels in P03 are the useful field markers. [S21] [S22] [S23]

**Card preview — EN**  
Look for the teal folding doors at No. 24, where a tray of golden curry puffs makes an easy snack stop.

**Read the story — EN**  
Khun Pu is Ratchanee Sae Tia. She learned to make curry puffs at a vocational training center, then tested and adapted the recipe until it was her own. In an interview she recalled getting feedback from people who tried the pastries. She started with a chicken filling and went on to make other fillings. A small red dot pattern was used to help tell them apart. [S21] [S24]

The shop’s story also has a newer chapter. In the Creative Economy Agency’s *Made in Charoenkrung* project, Khun Pu worked with Nosh.nosh Project and illustrator Jirayu Koo on new fillings and takeaway packaging. It is an example of an everyday neighborhood snack growing through both practice and collaboration. [S21]

**When you visit — EN**  
If the shop is serving, ask what fillings are ready that day. It is a good stop for something small to take along.

**Card preview — TH**  
มองหาประตูพับสีเขียวที่บ้านเลขที่ 24 แล้วแวะถามว่ากะหรี่ปั๊บไส้ไหนเพิ่งทอดเสร็จ

**Read the story and visit note — TH**  
คุณปุ๊ หรือรัชนี แซ่เตีย เรียนทำกะหรี่ปั๊บจากศูนย์ฝึกอาชีพ แล้วกลับมาลองปรับสูตรจากคำติชมของคนที่ได้ชิม เริ่มจากไส้ไก่ก่อนค่อย ๆ เพิ่มไส้อื่น เคยใช้จุดสีแดงบนตัวขนมช่วยแยกไส้ด้วย ต่อมาร้านยังร่วมกับนักสร้างสรรค์ในโครงการ Made in Charoenkrung ทดลองไส้และกล่องแบบใหม่ หากร้านเปิด ลองถามว่ารอบนั้นมีไส้อะไรให้เลือกซื้อกลับ

**Related stops:** 22 Barber & Hair Studio; Local street-food stall; Soraya Larb 101.  
**Editorial check:** The CEA project confirms the named shop and Soi 22. The VNA report reproduces a labeled Bangkok Post storefront photo that matches the teal frontage and doorway details; published address and door number corroborate. Keep hours, stock and price out of the durable story. Confirm the entrance pin.  
**Image alt:** Teal folding doorway and tables of packaged snacks at Khun Pu’s Curry Puffs.

### 10. 22 Barber & Hair Studio

**Thai title:** 22 Barber & Hair Studio · ร้านตัดผม  
**Location reference:** Charoen Krung Soi 22. The directory lists No. 16; verify this with the studio before publishing the street number or placing a route pin. [S25]

**Card preview — EN**  
Look for the black-and-gold barber sign, a reminder that these lanes are still places for everyday errands.

**Read the story — EN**  
The photographed sign reads “22 Barber & Hair Studio.” Behind the glass door is a small barber studio, and trays of accessories and keepsakes sit near the neighboring frontage. This is one of the map’s everyday community stops. A haircut, a shop next door and people passing on their way home are part of the same street scene. [P04] [S25]

**When you visit — EN**  
If you would like a haircut, check with the studio about availability. Let customers come and go while you look at the sign or neighboring displays.

**Card preview — TH**  
ป้ายร้านตัดผมสีดำทองเป็นอีกมุมของตลาดน้อยที่ยังเห็นชีวิตประจำวันของคนในย่าน

**Read the story and visit note — TH**  
หน้าร้านในภาพมีป้าย 22 Barber & Hair Studio ติดอยู่ข้างประตูกระจก ใกล้กันมีของชิ้นเล็ก ๆ วางขายให้คนเดินผ่านได้หยุดดู มุมนี้ชวนให้เห็นว่าตรอกเดียวกันมีทั้งร้านบริการและร้านค้าในชีวิตประจำวัน หากอยากตัดผม ลองสอบถามร้านเรื่องคิวก่อนแวะ

**Related stops:** Khun Pu’s Curry Puffs; Old Commercial Quarter.  
**Editorial check:** Do not treat the number 22 in the brand or a number on a separate sign as a street address. Listing metadata is a lead for the exact door, not proof of current hours or prices. No shared ownership with the souvenir stall was verified.  
**Image alt:** Black-and-gold 22 Barber & Hair Studio sign beside a glass entrance and small displays.

### 11. Soraya Larb 101

**Thai title:** โสรยา ลาบ 101  
**Search aliases:** Som tam, larb & grilled-chicken stall; Soraya Laab 101; โสรยาลาบ 101.  
**Location reference:** No. 1172/8, Talat Noi, near the Marine Department lane according to the public business listing. Match the green frontage and the street number in P05 before enabling routing. [S26]

**Card preview — EN**  
A green-fronted Isan stall for papaya salad, larb and grilled chicken. Look for the red lettering on the counter.

**Read the story — EN**  
The sign on the stall reads โสรยา ลาบ 101. It names several familiar Isan dishes: *som tam*, a pounded papaya salad; *larb*, a chopped meat salad seasoned with herbs; and *kai yang*, grilled chicken. It also lists *nam tok* and sticky rice. The mortar printed on the sign and the woven rice containers in the photo give you a few clues to the meal before you order. [P05] [S26] [S27]

This stop shows another strand of everyday Bangkok food. The combination of green papaya salad, grilled chicken and sticky rice is associated with Isan and neighboring Laos. It works well as a shared meal: one dish bright and sharp, another grilled, with sticky rice alongside. [S27]

**When you visit — EN**  
Ask what is available, and say how much chili you would like. “Mai phet” (ไม่เผ็ด) means “not spicy.” If you want the cook to leave the chili out, ask “mai sai phrik” (ไม่ใส่พริก).

**Card preview — TH**  
แวะมองหาป้ายโสรยา ลาบ 101 หน้าร้านสีเขียว มีชื่อเมนูส้มตำ ลาบ และไก่ย่างให้เลือกถามหน้าร้าน

**Read the story and visit note — TH**  
บนป้ายร้านมีทั้งส้มตำ ลาบ น้ำตก ไก่ย่าง และข้าวเหนียว เป็นชุดอาหารที่คุ้นเคยในวัฒนธรรมการกินแบบอีสานและพบได้ในกรุงเทพฯ ด้วย ถ้ามากันหลายคน ลองถามว่าเมนูไหนพร้อมขายแล้วเลือกมาชิมด้วยกัน บอกระดับความเผ็ดได้ก่อนสั่ง

**Related stops:** Mother Roaster · Talat Noi; Khun Pu’s Curry Puffs; Local street-food stall.  
**Editorial check:** The Thai name, No. 1172/8 and business phone printed on the photo corroborate the merchant listing. No verified founding story, owner biography, fixed menu, price or opening hours. Do not interpret “101” as proof that the vendor comes from Roi Et.  
**Image alt:** Green-fronted Soraya Larb 101 stall, with a Thai menu sign and stacked colorful stools.

### 12. Bumblebee near Holy Rosary Church

**Thai title:** หุ่นบัมเบิลบีหน้าโบสถ์กาลหว่าร์  
**Search aliases:** Yellow robot sculpture; Bumblebee; บัมเบิ้ลบี.  
**Location reference:** Small paved island by the Holy Rosary Church street gateway in P07. Identify a safe public viewing point on the approach; do not route to the island.

**Card preview — EN**  
A yellow robot and a historic church share one view, with a story about the neighborhood’s spare-parts trade in between.

**Read the story — EN**  
This yellow figure is Bumblebee, one of the robot sculptures made by local used-parts trader Aree Manatpakorn, known as Hia Seng Junior. In a 2025 interview, he explained that the idea came out of a conversation about making a neighborhood landmark that would recall the Xiang Kong trade. The reclaimed parts differ from piece to piece, so the shapes come from what the makers have to work with. [S19]

Heritage researcher Alisa Santikarn documented Bumblebee in front of Holy Rosary Church after the figure moved from a different roundabout where Optimus Prime took its place. Jump's photo shows the yellow figure on the paved island with the church sign behind it. The juxtaposition is worth a look: an old faith community and a new piece of neighborhood craft in the same frame. [S28] [P07]

**When you visit — EN**  
Look from a clear pavement or public approach. You can see the shape of the sculpture without standing in the traffic island.

**Card preview — TH**  
หุ่นสีเหลืองกับป้ายโบสถ์กาลหว่าร์อยู่ในภาพเดียวกัน ชวนมองตลาดน้อยทั้งในมุมงานช่างและประวัติชุมชน

**Read the story and visit note — TH**  
บัมเบิลบีเป็นหนึ่งในหุ่นที่อารี มนัสภากร หรือเฮียเซ้ง จูเนียร์ ทำขึ้นจากแนวคิดนำอะไหล่เก่ามาสร้างจุดจดจำของย่านเซียงกง นักวิจัยด้านมรดกบันทึกว่าหุ่นเคยอยู่ที่วงเวียนอีกจุดหนึ่ง ก่อนย้ายมาบริเวณหน้าโบสถ์กาลหว่าร์ ลองชมจากทางเท้าหรือจุดที่ยืนได้โดยไม่กีดขวางรถ

**Related stops:** Holy Rosary Church; Robot sculpture display; Street Art & Workshop Lanes.  
**Editorial check:** Treat the church and sculpture as different records. The photo and researcher’s documentation confirm the subject and vicinity; the public viewing location and continued presence still need on-site confirmation. Do not transfer stories about Optimus Prime’s offerings or rituals to this sculpture.  
**Image alt:** Yellow Bumblebee sculpture on a low paved island with the Holy Rosary Church gateway behind it.

### 13. Portrait of Charoenkrung: Photo Wall

**Thai title:** Portrait of Charoenkrung · กำแพงภาพถ่ายเจริญกรุง  
**Search aliases:** Outdoor photography display; กำแพงภาพถ่าย; ภาพถ่ายเจริญกรุง.  
**Location reference:** The Department of Tourism and contemporary reporting document a display in Trok San Chao Rong Kueak. Match the wall and mounting brackets in P08 before setting a precise pin.

**Card preview — EN**  
A few prints clipped to an old wall offer a way to meet the people and places behind the streets you are walking.

**Read the story — EN**  
In Jump’s photo, prints hang from simple metal brackets against a worn wall. One picture shows the entrance of Haroon Mosque. Its printed caption identifies the *Portrait of Charoenkrung* project. Another shows a person in red looking out from a railing. Take a moment to look at how each photograph makes a different part of the area feel close. [P08]

The Creative Economy Agency records *Portrait of Charoenkrung* as a 2020 project about the district’s residents, families, work and traditions. The photography reached into public space during Bangkok Design Week. The tourism directory documents the exhibition in the shrine lane, and reporting from the event describes photographs installed along its wall. The project gives the walk something you cannot get from architecture alone: a look at the people who give the neighborhood its character. [S14] [S16] [S17] [S29]

**When you visit — EN**  
If the prints are up, stop to look at one caption. Keep the passage clear for people coming from either direction.

**Card preview — TH**  
ภาพถ่ายที่แขวนบนกำแพงเก่าพาไปรู้จักผู้คนและสถานที่ในย่านเจริญกรุงทีละภาพ

**Read the story and visit note — TH**  
โครงการ Portrait of Charoenkrung บันทึกครอบครัว อาชีพ และวิถีชีวิตในย่านเจริญกรุงเมื่อ พ.ศ. 2563 ภาพบางส่วนเคยจัดแสดงในตรอกช่วง Bangkok Design Week ในภาพภาคสนามของ Jumpมีภาพทางเข้ามัสยิดฮารูณอยู่บนกำแพงด้วย เป็นเรื่องของสถานที่ในภาพ ไม่ใช่ตำแหน่งของกำแพง หากยังมีภาพแขวนอยู่ ลองหยุดอ่านคำบรรยายสักภาพแล้วเว้นทางให้คนเดินผ่าน

**Related stops:** Rong Kueak Shrine; Street Art & Workshop Lanes; Talat Noi community-life mural.  
**Editorial check:** Keep the actual display wall as the subject. The mosque is pictured in a print; do not rename this pin as a mosque or use its coordinates. Do not assume the 2020 display stayed up continuously, assign a photographer from a blurred byline, or promise the same prints are there now. Credit Jump for the field photo of the wall; retain any legible original artwork credits separately if they are confirmed.  
**Image alt:** Three mounted photographs on a weathered lane wall, including a print of Haroon Mosque.

### 14. Mother Roaster · Talat Noi

**Thai title:** มาเธอร์ โรสเตอร์ สาขาตลาดน้อย  
**Search aliases:** Mother Roaster entrance; Mother Roaster Talad Noi; Mother Roaster.  
**Location reference:** No. 1172 in the Charoen Krung Soi 22 / Trok San Chao Rong Kueak area. P09 shows the number, yellow mural and shared doorway signage. [S30] [S31] [S32]

**Card preview — EN**  
At the yellow mural and wooden doors, stop for the story of a barista who started a new chapter after retirement.

**Read the story — EN**  
Mother Roaster began with Ploenpit Rianmek, better known as Pa Pim. In an interview she described taking up coffee seriously after retirement, experimenting with roasting, grinding and brewing by hand at a small coffee stand. Her story is an easy one to connect with: a daily pleasure became something she wanted to learn more about and share. [S30]

By 2020, the Talat Noi café was documented in the upper floor of a wooden building associated with spare parts. Visitors passed metal components on the way upstairs. The building made room for a new use while keeping clues to the work that had been done there. Look for the weathered double doors and the yellow mural in the photo. In the fieldwork photo, the Mother Roaster sign hangs beside an Elephant Parade sign. [S31] [S32] [P09]

**When you visit — EN**  
If the café is open, ask what coffee is available that day. Check posted access if stairs would affect your visit.

**Card preview — TH**  
ประตูไม้ใต้กำแพงสีเหลืองพาไปเจอเรื่องของป้าพิม คนรักกาแฟที่เริ่มต้นเส้นทางบาริสต้าหลังเกษียณ

**Read the story and visit note — TH**  
ป้าพิม เพลินพิศ เรียนเมฆ เริ่มจากร้านกาแฟเล็ก ๆ ที่ลองคั่ว บด และชงเอง ร้านสาขาตลาดน้อยเคยได้รับการบันทึกว่าอยู่ชั้นบนของอาคารไม้ที่มีอะไหล่วางอยู่ด้านล่าง จึงเห็นทั้งร่องรอยงานเก่าและการใช้พื้นที่แบบใหม่ในที่เดียวกัน ลองมองหาเลข 1172 กับประตูไม้ใต้ภาพวาดสีเหลือง หากร้านเปิด ลองถามว่ามีกาแฟอะไรให้เลือกในวันนั้น

**Related stops:** Portrait of Charoenkrung: Photo Wall; Rong Kueak Shrine; Soraya Larb 101.  
**Editorial check:** Sources vary on the original stand’s opening year and current café hours. Use the documented move by 2020 and the founder’s account of how she started. The photo establishes the signs sharing a frontage on the field visit, not a current partnership or common owner. Elephant Parade's official directory may list a different address; do not use it to overwrite the café location. Confirm current stairs/access before claiming accessibility. [S33]  
**Image alt:** Wooden doors with Mother Roaster and Elephant Parade signs beneath a yellow mural marked 1172.

### 15. Talat Noi community-life mural

**Thai title:** ภาพผนังวิถีตลาดน้อย  
**Location reference:** Published coverage places the recognizable noodle-eating rickshaw scene in Soi Duang Tawan, near So Heng Tai. Confirm the exact wall face, a clear public standing point and the artist credit before enabling navigation. [S34] [S35]

**Card preview — EN**  
A bowl of noodles, a rickshaw and a blacksmith: three small stories meet on one wall.

**Read the story — EN**  
Follow the painted scene from left to right. A passenger in red eats from a bowl while a rickshaw puller leans into his work. Nearby, a blacksmith raises a hammer at a glowing hearth. The characters make the wall playful, but the details also invite you to notice the work that keeps a street going. [P10] [S34] [S35]

The blacksmith scene has a documented connection to the neighborhood, even though the artist’s intention for this wall has not been confirmed. The Creative Economy Agency records Talat Noi smiths making anchors, chains and other fittings for boats that came in by river. The painted forge is a good cue to think about that history as you pass today’s shopfronts. [S14]

**When you visit — EN**  
Try spotting the noodle bowl and the hammer first. If scooters or cars are parked in front, enjoy what you can see without stepping into the traffic path.

**Card preview — TH**  
ชามก๋วยเตี๋ยว รถลาก และช่างตีเหล็กอยู่บนผนังเดียวกัน ลองค่อย ๆ มองจากซ้ายไปขวา

**Read the story and visit note — TH**  
ในภาพมีคนนั่งกินก๋วยเตี๋ยวบนรถลาก คนลากรถที่เอนตัวไปข้างหน้า และช่างที่ยกค้อนอยู่หน้าเตา ภาพช่างชวนให้นึกถึงงานตีสมอ โซ่ และชิ้นส่วนเรือที่เคยมีบทบาทในตลาดน้อย ลองหาชามก๋วยเตี๋ยวกับค้อนให้เจอก่อน หากมีรถจอดบังบางส่วน ให้ชมจากจุดที่ยืนได้โดยไม่กีดขวางทาง

**Related stops:** So Heng Tai Mansion; Street Art & Workshop Lanes; Robot sculpture display.  
**Editorial check:** The current title is descriptive, not an official artwork title. Coverage locates the rickshaw motif at lane level. Do not infer that the adjacent blacksmith panel has the same artist, commission or painting date. Do not present the visual interpretation as a quote from the artist.  
**Image alt:** Painted rickshaw passenger eating noodles and a blacksmith with a hammer, behind parked scooters.


---

## Plan your walk

Use these as three browsable chapters in the current map interface. This is a suggested way to explore. Let visitors skip, reorder or come back to any chapter. Use the existing route engine only for destinations the editor has confirmed.

**Welcome — EN**  
Start by the river, turn into a lane and see what catches your eye. This guide brings together places to pause, things to taste and stories you can read as you go. Pick a few stops or follow the whole walk at your own pace.

**Welcome — TH**  
เริ่มจากริมแม่น้ำ แล้วค่อยเลี้ยวเข้าตรอกที่ชวนให้หยุดดู เลือกจุดที่อยากแวะชิม แวะชม หรือกดอ่านเรื่องราวระหว่างทาง เดินตามจังหวะของตัวเองได้เลย

| Chapter | Ready-to-use visitor copy | Suggested entries |
|---|---|---|
| **Start by the river / เริ่มจากริมแม่น้ำ** | Begin at the church gate and look for the signs in three languages. Then open the old quarter story to see why so much of Talat Noi grew up facing the water. / เริ่มจากซุ้มประตูโบสถ์ที่มีป้ายสามภาษา แล้วเปิดเรื่องราวย่านการค้าเก่าเพื่อดูว่าแม่น้ำมีส่วนสร้างย่านนี้อย่างไร | Holy Rosary Church → Old Commercial Quarter. Offer Bumblebee as a related photo stop with the viewing point confirmed first. |
| **Find a bite and a story / แวะชิมแล้วค่อยเดินต่อ** | On the Soi 22 side, look for the teal curry-puff doors, the green Isan stall or the yellow doorway at Mother Roaster. Pick one break that fits your walk and what is open. / แถวซอยเจริญกรุง 22 ลองเลือกแวะซื้อกะหรี่ปั๊บ ชิมอาหารอีสาน หรือพักจิบกาแฟตามร้านที่เปิดในวันนั้น | Khun Pu’s Curry Puffs; Soraya Larb 101; Mother Roaster · Talat Noi. Show the barber and unnamed cart as related community and field notes. |
| **Read the lanes slowly / อ่านเรื่องราวในตรอก** | Look for a print, a painted noodle bowl and traces of metalwork. Pause at the Hakka shrine, pass the courtyard house if accessible, and finish with the Hokkien shrine’s river-facing story. / ลองมองหาภาพถ่าย ชามก๋วยเตี๋ยวบนกำแพง และร่องรอยงานช่าง แวะอ่านเรื่องศาลเจ้าโรงเกือก บ้านโซวเฮงไถ่ และศาลเจ้าโจวซือกง | Street Art & Workshop Lanes → Rong Kueak Shrine → So Heng Tai Mansion → Chow Sue Kong Shrine. Open the photo wall, mural and robot display as related cards. Use only stops with confirmed positions in the walking route. |

**Short visit:** Suggest choosing one riverside landmark, one snack or coffee stop, and one lane story.  
**Longer visit:** Suggest all three chapters with a flexible food break. Read the place stories in order or choose what is nearby. TAT’s walking article supports the shared neighborhood context; current entrances and routing still need confirmation. [S02] [S10]

**Map copy for uncertain stops:** “This story is ready to read. We’re still checking the exact spot.” / “อ่านเรื่องราวได้แล้ว กำลังตรวจสอบตำแหน่งที่แน่นอน”  
**Map copy for changes on the day:** “Check the sign when you arrive. You can keep walking and come back to this stop later.” / “ดูป้ายหน้าร้านหรือทางเข้าเมื่อมาถึง แล้วค่อยเลือกว่าจะแวะตอนนี้หรือกลับมาทีหลัง”

## Editor field checks before enabling directions

- **P02:** Ask the vendor for the shop name, dishes, usual operating window, and whether the cart moves. Log the entrance or usual public-side spot.
- **P01, P07, P08, P10:** Confirm the exact display or wall, current presence, photo viewpoint and where a visitor can stand without blocking access. Identify the maker or artist only from a signature, organizer or direct confirmation.
- **P03, P04, P05, P09:** Match the photographed doorway and business name on site. Record opening information with a date. Check whether access requires stairs, a reservation or permission before publishing those details.
- **Church, house and shrines:** Check the visitor entrance and posted access rules. Keep a gate, a worship space, a school driveway and a public walking route distinct in the data.
- **Every location:** Log which entrance or viewpoint was confirmed, how, and when. A researched story and a verified navigation point are separate checks.

## Acceptance checks

1. Exactly 15 existing places are updated. Searching an old title or Thai/English alias still finds its record.
2. All ten field photos are mapped to the intended entries, especially the separate church and Bumblebee records. Photos and credits survive refresh.
3. The public map shows a short preview first, then the full story and useful visit note. Sources open from each appropriate card. Thai text displays and wraps correctly on a phone.
4. The unnamed cart and other unverified positions cannot launch walking directions from any map control. The two area guides do not route to a made-up entrance.
5. Visitors can choose chapters, open a related place, then return to the same search/filter/map position. Check the updated experience at mobile and desktop widths.
6. Run the existing build and relevant checks. Provide a working preview plus a short summary of changed files, which entries were matched and which entrance pins still need my field check.

---

## Source register for Claude and the editor

Use these as actual citations. Render the publisher and title, with the clickable URL, in the appropriate place card. Use the cited portions for the stated facts; some sources also contain older schedules or different spellings. Text in the public cards is original copy based on the evidence below.

| ID | Source | What it supports |
|---|---|---|
| S01 | [Princess Maha Chakri Sirindhorn Anthropology Centre, community profile: ตลาดน้อย](https://wikicommunity.sac.or.th/community/329) | Local name, growth from Sampeng, migration and river trade, blacksmithing, and development of the Xiang Kong used-parts trade. |
| S02 | [Tourism Authority of Thailand, ตลาดน้อย](https://thai.tourismthailand.org/Attraction/%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%A2) | Area around Wanit 2 and Charoen Krung 22, early commercial roots and street art. |
| S03 | [Holy Rosary parish archive, ประวัติวัดแม่พระลูกประคำ (กาลหว่าร์)](https://rosary.catholic.or.th/aboutchurch/history.html) | Parish account of Portuguese Catholic migration and the two devotional figures carried from Ayutthaya. The indexed archive was available in search; direct fetching was restricted. |
| S04 | [The Momentum, วัดแม่พระลูกประคำ วัดคาทอลิกเคียงคู่กรุงรัตนโกสินทร์](https://themomentum.co/holy-rosary-church/) | Corroborates the church timeline, figures, Kalawar name, present building and architecture, citing the Catholic historical archive. |
| S05 | [Tourism Authority of Thailand, Japan office: Holy Rosary Church](https://www.thailandtravel.or.jp/holy-rosary-church/) | Street address, 1897 building completion and Gothic Revival features. |
| S06 | [Princess Maha Chakri Sirindhorn Anthropology Centre, Culturio: วิถีเมืองน้ำและความเชื่อ](https://culturio.sac.or.th/content/1836) | Teochew Catholic parish history, river-facing worship spaces and distinctions among Talat Noi’s Hokkien, Hakka and Catholic communities. |
| S07 | [Treasury Department, Talat Noi Museum: About the museum](https://emuseum-taladnoi.treasury.go.th/en/%20about-us) | Community and Treasury collaboration; museum on the former lathe workshop site, with a design recalling that building. [Museum home](https://emuseum-taladnoi.treasury.go.th/en/) corroborates the boat, machine and rice mill part-making context. |
| S08 | [Creative Thailand, January 2018, “เรียนดำน้ำในเก๋งจีน,” p. 27](https://www.creativethailand.org/admin/uploads/images/2561/01/file_pdf/MagazineFile_100.pdf) | Phra Aphai Wanit / Chao Sua Jat, family's river trade connection, courtyard plan and pool adaptation. |
| S09 | [Chinese Diasporic Heritage Houses in Bangkok: Between Recognition and Responsibility, International Journal of Heritage Studies](https://www.tandfonline.com/doi/full/10.1080/2159032X.2026.2728185) | Research with the family on ownership, Hokkien and Siamese elements, private stewardship and adaptive reuse. No precise founding year claimed in map copy. |
| S10 | [Tourism Authority of Thailand, 1 day in Talat Noi](https://www.tourismthailand.org/Articles/1-day-in-talat-noi) | Mansion and Chow Sue Kong addresses; courtyard and pool; Chow Sue Kong’s riverside orientation and Qing-style features; documented neighborhood walking stops. Use S11–S13 for Rong Kueak history. |
| S11 | [Treasury Department, Talat Noi Museum: ศาลเจ้าโรงเกือก (ฮ้อนหว่องกุง)](https://emuseum-taladnoi.treasury.go.th/en/learning-corner/deva/) | Hakka affiliation, deity, stone plaque, Pun Thao Kong and tentative name explanation. |
| S12 | [Thailand Tourism Directory, ศาลเจ้าโรงเกือก หรือ ศาลฮ้อนหว่องกุง](https://www.thailandtourismdirectory.go.th/th/attraction/103473) | Plaque-based account of land acquisition, ritual space and decorative panels. Use the Thai record to avoid translation confusion. |
| S13 | [Tourism Authority of Thailand, 1 วัน ย่านตลาดน้อย](https://thai.tourismthailand.org/Articles/1-%E0%B8%A7%E0%B8%B1%E0%B8%99-%E0%B8%A2%E0%B9%88%E0%B8%B2%E0%B8%99-%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%A2) | Shrine alley and Hakka attribution in the Thai article. |
| S14 | [Creative Economy Agency, Portrait of Charoenkrung](https://creativecity.cea.or.th/th/district-projects/portrait-of-charoenkrung) | Organizer’s account of 2020 portrait project; neighborhood smith profile and boat fittings; Chow Sue Kong tradition. Use the parish and TAT for church chronology. |
| S15 | [Nisit Journal, Street Art ศิลปะข้างถนน คุณค่าที่มากกว่าความสวยงาม](https://nisitjournal.press/2022/06/02/street-art-at-talad-noi/) | Interviews with the local tourism organizer and artists about the wall, community art and 2018 works. |
| S16 | [Thailand Tourism Directory, Street art at Trok Rong Kuek Shrine](https://www.thailandtourismdirectory.go.th/en/attraction/103461) | Public art alley, historical festival works, and the Portrait of Charoenkrung display. |
| S17 | [Creative Economy Agency, Bangkok Design Week 2020 program](https://www.cea.or.th/th/single-district-program/bkkdw2020) | Festival dates and Charoen Krung–Talat Noi program area. |
| S18 | [Thai Studies Journal, ขนมเต่ากับพิธีกรรมเซ่นไหว้ในชุมชนตลาดน้อย กรุงเทพมหานครและชุมชนบางเหนียว จังหวัดภูเก็ต](https://so04.tci-thaijo.org/index.php/TSDJ/article/download/264078/178684/1015512) | Research on 1804 shrine inscription, Yuanxiao observance and turtle-shaped offerings. |
| S19 | [MGR Online, interview with Aree Manatpakorn on sculptures from reclaimed parts](https://social-mgr.mgronline.com/smes/detail/9680000021226) | 2025 maker interview: name, Xiang Kong background, inspiration, Bumblebee and Optimus Prime. Does not by itself identify every figure in P01. |
| S20 | [Phuket 101, Talat Noi walking guide, “The Scrap Metal Transformers of Talat Noi”](https://www.phuket101.net/bangkok/talat-noi-in-bangkok/) | Lead for matching a shopfront sculpture display at the Wanit 2 / Soi 22 corner. Use this section only as an editor lead, not proof of ownership of P01. |
| S21 | [Creative Economy Agency, Made in Charoenkrung Year 1: กะหรี่ปั๊บคุณปุ๊](https://creativecity.cea.or.th/th/district-projects/made-in-charoenkrung-year-1) | Named maker, vocational training, recipe development, Soi 22, and collaboration on fillings and packaging. |
| S22 | [Vietnam News Agency / VietnamPlus, dated storefront photo credited to Bangkok Post](https://en.vietnamplus.vn/thailand-revises-tourism-strategy-after-earthquake-post312725.vnp) | Caption identifies the teal-fronted Khun Phu shop. Compare the photograph with P03; the surrounding news story is unrelated to the shop’s history. |
| S23 | [Tripadvisor listing, Pu Curry Puff](https://th.tripadvisor.com/Restaurant_Review-g293916-d15757572-Reviews-Pu_Curry_Puff-Bangkok.html) | Address corroboration: No. 24, Soi Charoen Krung 22. The photo and CEA corroborate identity; do not use reviews to assert current hours or service. |
| S24 | [Thai Post, interview with Khun Pu](https://www.thaipost.net/main/detail/44029) | Founder’s account of starting after vocational training, customer feedback, initial chicken filling and dots used to distinguish flavors. |
| S25 | [Local Thailand, 22 Barber & Hair Studio directory entry](https://localthailand.net/thurakit/22-barber-hair-studio-private-one-on-one-service-samphanthawong) | Name, business category and listed Soi 22 address. Use listing metadata only; exact entrance and owner history remain to be confirmed. |
| S26 | [Wongnai, merchant listing for โสรยา ลาบ 101](https://www.wongnai.com/restaurants/431692fq-%E0%B9%82%E0%B8%AA%E0%B8%A3%E0%B8%A2%E0%B8%B2-%E0%B8%A5%E0%B8%B2%E0%B8%9A-101-%E0%B9%80%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B9%80%E0%B8%81%E0%B9%88%E0%B8%B2-%E0%B8%95%E0%B8%B3%E0%B9%81%E0%B8%8A%E0%B9%88%E0%B8%9A%E0%B8%99%E0%B8%B1%E0%B8%A7%E0%B9%80%E0%B8%A2%E0%B8%B2%E0%B8%A7%E0%B8%A3%E0%B8%B2%E0%B8%8A) | Merchant name and 1172/8 address match P05. The matching business phone on the photographed sign provides an additional identity check. |
| S27 | [Tourism Authority of Thailand, ASEAN Heritage Trail: Mekong and Indochina, culinary section](https://tourismproduct.tourismthailand.org/wp-content/uploads/2023/01/ASEAN-HT_3_Mekong_Online-Spread144.pdf) | Isan and Lao food context for green papaya salad, larb, grilled chicken and sticky rice. |
| S28 | [Alisa Santikarn, Cultural Heritage Studies Vienna, field account on Talat Noi’s robot sculptures](https://hexagon-impala-fsmz.squarespace.com/gloco-blog/what-does-a-statue-of-optimus-prime-have-to-do-with-heritage-in-bangkok) | Researcher’s photograph and account of Bumblebee outside Holy Rosary Church after relocation. |
| S29 | [Bangkok Biz News, interview with the Portrait of Charoenkrung photographers](https://www.bangkokbiznews.com/lifestyle/867655) | Exhibition’s local-family focus, photographers’ approach, and historical wall installation in the Rong Kueak shrine alley. |
| S30 | [The Potential, interview with Ploenpit Rianmek of Mother Roaster](https://thepotential.org/creative-learning/mother-roaster/) | Pa Pim’s name and account of learning to roast, grind and brew by hand after retirement. |
| S31 | [BK Magazine, Mother Roaster’s Talat Noi location in 2020](https://www.bkmagazine.com/restaurants/bangkok-restaurant-reviews/mother-roaster/) | Contemporary account of move from a small stand near Hua Lamphong to the upper floor of the parts building. |
| S32 | [bkkbrew, Mother Roaster Talat Noi branch](https://www.bkkbrew.com/shop/mother-roaster-taladnoi) | Branch address and yellow mural / timber doorway context. Cross-check with P09. |
| S33 | [Elephant Parade, official store directory](https://www.elephantparade.com/find-a-store?country=Thailand) | Separate Elephant Parade identity. Do not treat its listed address as the café’s. |
| S34 | [BK Magazine, Talat Noi murals, reporting by Dhipkawee Sriyananda Selley](https://www.bkmagazine.com/city-living/these-murals-highlight-talad-nois-rise-bangkoks-hub-street-art/) | Published field reporting places the noodle-eating rickshaw mural on Soi Duang Tawan. |
| S35 | [BKKMENU, Yaowarat–Talat Noi guide, “Street Art”](https://www.bkkmenu.com/eat/stories/city-guide-yaowarat-talat-noi.html) | Published photograph of the same recognizable rickshaw scene; corroborate the motif with P10. |

**Field evidence P01–P10:** Jump’s original photos as assigned above. A photo establishes what appears in that frame. It does not, by itself, establish the business history, exact coordinates or what is available today.

**End of prompt.**

[S01]: https://wikicommunity.sac.or.th/community/329
[S02]: https://thai.tourismthailand.org/Attraction/%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%A2
[S03]: https://rosary.catholic.or.th/aboutchurch/history.html
[S04]: https://themomentum.co/holy-rosary-church/
[S05]: https://www.thailandtravel.or.jp/holy-rosary-church/
[S06]: https://culturio.sac.or.th/content/1836
[S07]: https://emuseum-taladnoi.treasury.go.th/en/%20about-us
[S08]: https://www.creativethailand.org/admin/uploads/images/2561/01/file_pdf/MagazineFile_100.pdf
[S09]: https://www.tandfonline.com/doi/full/10.1080/2159032X.2026.2728185
[S10]: https://www.tourismthailand.org/Articles/1-day-in-talat-noi
[S11]: https://emuseum-taladnoi.treasury.go.th/en/learning-corner/deva/
[S12]: https://www.thailandtourismdirectory.go.th/th/attraction/103473
[S13]: https://thai.tourismthailand.org/Articles/1-%E0%B8%A7%E0%B8%B1%E0%B8%99-%E0%B8%A2%E0%B9%88%E0%B8%B2%E0%B8%99-%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%AD%E0%B8%A2
[S14]: https://creativecity.cea.or.th/th/district-projects/portrait-of-charoenkrung
[S15]: https://nisitjournal.press/2022/06/02/street-art-at-talad-noi/
[S16]: https://www.thailandtourismdirectory.go.th/en/attraction/103461
[S17]: https://www.cea.or.th/th/single-district-program/bkkdw2020
[S18]: https://so04.tci-thaijo.org/index.php/TSDJ/article/download/264078/178684/1015512
[S19]: https://social-mgr.mgronline.com/smes/detail/9680000021226
[S20]: https://www.phuket101.net/bangkok/talat-noi-in-bangkok/
[S21]: https://creativecity.cea.or.th/th/district-projects/made-in-charoenkrung-year-1
[S22]: https://en.vietnamplus.vn/thailand-revises-tourism-strategy-after-earthquake-post312725.vnp
[S23]: https://th.tripadvisor.com/Restaurant_Review-g293916-d15757572-Reviews-Pu_Curry_Puff-Bangkok.html
[S24]: https://www.thaipost.net/main/detail/44029
[S25]: https://localthailand.net/thurakit/22-barber-hair-studio-private-one-on-one-service-samphanthawong
[S26]: https://www.wongnai.com/restaurants/431692fq-%E0%B9%82%E0%B8%AA%E0%B8%A3%E0%B8%A2%E0%B8%B2-%E0%B8%A5%E0%B8%B2%E0%B8%9A-101-%E0%B9%80%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B9%80%E0%B8%81%E0%B9%88%E0%B8%B2-%E0%B8%95%E0%B8%B3%E0%B9%81%E0%B8%8A%E0%B9%88%E0%B8%9A%E0%B8%99%E0%B8%B1%E0%B8%A7%E0%B9%80%E0%B8%A2%E0%B8%B2%E0%B8%A7%E0%B8%A3%E0%B8%B2%E0%B8%8A
[S27]: https://tourismproduct.tourismthailand.org/wp-content/uploads/2023/01/ASEAN-HT_3_Mekong_Online-Spread144.pdf
[S28]: https://hexagon-impala-fsmz.squarespace.com/gloco-blog/what-does-a-statue-of-optimus-prime-have-to-do-with-heritage-in-bangkok
[S29]: https://www.bangkokbiznews.com/lifestyle/867655
[S30]: https://thepotential.org/creative-learning/mother-roaster/
[S31]: https://www.bkmagazine.com/restaurants/bangkok-restaurant-reviews/mother-roaster/
[S32]: https://www.bkkbrew.com/shop/mother-roaster-taladnoi
[S33]: https://www.elephantparade.com/find-a-store?country=Thailand
[S34]: https://www.bkmagazine.com/city-living/these-murals-highlight-talad-nois-rise-bangkoks-hub-street-art/
[S35]: https://www.bkkmenu.com/eat/stories/city-guide-yaowarat-talat-noi.html


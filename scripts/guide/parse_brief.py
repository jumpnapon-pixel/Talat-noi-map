import re, json, sys
src = open(sys.argv[1], encoding="utf-8").read()
body = src.split("## Place content", 1)[1].split("## Plan your walk", 1)[0]
sections = re.split(r"\n### (\d\d)\. ", body)[1:]
FIELDS = {
    "Thai title": "titleTh", "Search aliases": "aliases", "Location reference": "location",
    "Related stops": "related", "Editorial check": "editorial", "Image alt": "alt",
}
BLOCKS = {
    "Card preview — EN": "previewEn", "Read the story — EN": "storyEn", "When you visit — EN": "visitEn",
    "Card preview — TH": "previewTh", "Read the story and visit note — TH": "storyVisitTh",
}
entries = []
for num, text in zip(sections[0::2], sections[1::2]):
    title, rest = text.split("\n", 1)
    e = {"num": num, "titleEn": title.strip()}
    # inline fields: **Name:** value (to end of line, trailing double-space stripped)
    for label, key in FIELDS.items():
        m = re.search(r"\*\*" + re.escape(label) + r":\*\*\s*(.+)", rest)
        if m: e[key] = m.group(1).strip()
    # blocks: **Label**  \n paragraphs until next **...** line or end
    parts = re.split(r"\n\*\*([^*\n]+?)\*\*  \n", "\n" + rest)
    for label, content in zip(parts[1::2], parts[2::2]):
        if label in BLOCKS:
            content = re.split(r"\n\*\*[A-Z][^*\n]*:\*\*", content)[0]
            e[BLOCKS[label]] = content.strip()
    entries.append(e)
json.dump(entries, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for e in entries:
    print(e["num"], e["titleEn"], "|", sorted(k for k in e if k not in ("num","titleEn")))

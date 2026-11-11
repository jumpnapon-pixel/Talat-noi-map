# Applying the research brief

`docs/research/2026-11-11-content-brief.md` is the research brief for the 15 original
places. These scripts turn it into place data:

```sh
python3 -I scripts/guide/parse_brief.py docs/research/2026-11-11-content-brief.md /tmp/parsed.json
python3 -I scripts/guide/apply_guide.py docs/research/2026-11-11-content-brief.md /tmp/parsed.json BASE.json OUT.json
```

`BASE.json` is an edition or a saved draft (`{places, structures, ...}`). Each record is
matched by its current title and photo file before it is updated in place, so the script
stops instead of guessing if a record has been renamed since.

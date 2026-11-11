# Talat-noi-map
Codes and progress of Talat Noi

An interactive story map of Talat Noi (ตลาดน้อย), Bangkok: places across heritage, belief,
art & craft, food & drink and community, shown on two illustrated maps and a navigation
map. Editors can add, select, move and update place pins directly on the illustrated map.

- **Working preview with the editor:** <https://claude.ai/artifact/L11qJxFD2DWdfMLXjzZyd4>
  (private until shared from its Share menu)
- **How to edit the map (no coding):** [docs/EDITING-GUIDE.md](docs/EDITING-GUIDE.md)
- **Visitor guide:** each card has a preview, the full story, a visit note, related stops and
  sources; **Plan your walk** groups the places into three chapters. Directions appear only
  for places whose entrance an editor has confirmed.
- **How it is built:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

The map started as a snapshot of the Claude artifact
<https://claude.ai/artifact/TkqKbPWn4bnvpNdqyRsojh> (version `1793847477-f87d`).

## Editing in short

1. Open the map as an Editor or Owner and press **Edit map**.
2. Tap a pin to open its panel, or press **Add pin** and tap the illustration.
3. To move a pin, press **Move pin** and tap where it should be. Set the place's real location
   for navigation and directions with **Set real location** (the navigation map).
4. Edit names, category, description, visitor information and the photo in the panel.
5. **Save draft**, check with **Preview**, then **Publish** for visitors.

## Run locally

```sh
npm install        # once: installs the build tool (esbuild)
npm run build      # writes index.html from src/
npm run serve      # http://localhost:8000/
```

On `localhost` the editor is available and saves to your browser only. Published as a
claude.ai artifact, it saves to the artifact's shared database and asset store. Only the
artifact's Editors and Owner can edit there.

## Share link and QR

The in-app **Share map** button, copy link and QR use `SHARE_URL` in `src/app/share.jsx`.
Change it there when the launch link changes, then rebuild.

## Share as one file

```sh
npm run build:standalone   # writes dist/talat-noi-map.html (about 15 MB, works offline)
```

The file contains the visitor map with all photos and map data inside. Send it to anyone or
open it from disk. It is read-only.

## Test

```sh
npm run build
npm test           # Playwright end-to-end checks, desktop and mobile; screenshots in test-results/
```

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The built map (generated: edit `src/` and run `npm run build`) |
| `src/` | Source: recovered map components, the app and editor, styles, the built-in edition |
| `assets/*.webp` | Landmark photos and map illustrations |
| `assets/fieldwork/*.jpg` | Field photos taken 2026-11-04 |
| `data/talat-noi-osm.json` | OpenStreetMap buildings and features for the area |
| `data/talat-noi-street-network.json` | Street network used for the map and directions |
| `docs/` | Editing guide and architecture notes |
| `tests/` | End-to-end tests |

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).

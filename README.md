# Talat-noi-map
Codes and progress of Talat Noi

An interactive story map of Talat Noi (ตลาดน้อย), Bangkok: 15 places across
heritage, belief, art & craft, food & drink and community, shown on an
illustrated 3D map, an illustrated map, the original map and a navigation view.

Snapshot of the Claude artifact
<https://claude.ai/artifact/TkqKbPWn4bnvpNdqyRsojh> (version `1793847477-f87d`,
copied 2026-11-05).

## Run locally

The page fetches its data with relative URLs, so serve the folder over HTTP
rather than opening `index.html` as a file:

```sh
python3 -m http.server 8000
# open http://localhost:8000/
```

The folder also works as-is on GitHub Pages.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole app as one compiled bundle (React, Three.js, Tailwind); no separate source |
| `assets/*.webp` | Landmark photos and map illustrations |
| `assets/fieldwork/*.jpg` | Field photos taken 2026-11-04 |
| `data/talat-noi-osm.json` | OpenStreetMap buildings and features for the area |
| `data/talat-noi-street-network.json` | Street network used for the map and directions |

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
Landmarks and pins people add in the app are saved only in that browser's
`localStorage`, not in this repository.

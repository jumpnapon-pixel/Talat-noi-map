// Readable names for the recovered bundle's internals (src/recovered/*.js).
// The app code shares one scope with the recovered code (see scripts/build.mjs), so these
// are plain aliases; nothing is copied.

// React (bundled react@19) and the JSX factory used by the .jsx files.
const React = we(mt(), 1);
const ReactDOMClient = DU;
const h = React.createElement;
const Fragment = React.Fragment;
const { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useReducer, useId } = React;

// Data model.
const CATEGORIES = q1; // ["Heritage", "Belief", "Art & craft", "Food & drink", "Community"]
const CATEGORY_STYLE = hp; // colours and Thai names per category
const categoryLabel = pp; // (category, lang) -> label
const MARKER_ICONS = LN; // marker icon names for the flat illustrated view
const createPlaceRecord = Ng; // (id) -> a new place with every field filled
const PlacesSchema = W1; // zod schema for the whole places array
const StructuresSchema = tS; // zod schema for the 3D structures array
const normaliseStructure = Hw;
const comparePublished = TU; // (publishedPlaces, draftPlaces) -> change summary
const describeChanges = CU; // change summary -> ["2 places moved", ...]
const isTemporaryPosition = Ns;
const pinAriaLabel = mp;
const SEED_EDITION = Q; // the published edition built into this page

// Fieldwork photo queue.
const fieldworkQueue = uS; // (places) -> [{ photo, place }]
const FIELDWORK_PHOTOS = cS;
const fieldworkPhotoFields = G3; // (photo, url) -> photo fields for a place
const placeFromFieldworkPhoto = $N; // (photo, url, extra) -> new place
const fieldworkPhotoUrl = U3; // (asset, filename, options) -> url

// Geography (see src/app/geo.js).
const sceneFromIllustration = ho;
const hasCoordinates = qo;

// Map views and place components.
const NavigationMap = pE;
const GoogleStreetMap = k3;
const VisitorPlaceCard = mE;
const PhotoViewer = $ee; // full-screen photo with close button
const WalkingSteps = oS; // walking steps along the mapped lanes (confirmed places only)
const DirectionsButton = qN; // Google Maps walking directions (confirmed places only)
const canRoute = tnCanRoute; // place -> may it offer directions? (entrance confirmed)
const DirectionsList = sS;
const MenuDrawer = gE;
const ArchitectureNotes = SU;
const PhotoQueueList = IU;
const PhotoQueueReview = PU;
const PlacePhoto = Ys;
const CategoryChip = Ul;
const CategoryIcon = dS;
const PinArt = Zd;
const PhotoUploader = z3;
const MapsLinkField = N3;
const useLiveLocation = RN;
const usePanZoom = K1;
const spreadMarkers = dp;
const leaderLine = fp;

// shadcn/ui + Radix components.
const Button = _t;
const Sheet = Cg;
const SheetContent = Lg;
const SheetTitle = Eg;
const SheetDescription = Ag;
const AlertDialog = n3;
const AlertDialogContent = a3;
const AlertDialogHeader = i3;
const AlertDialogTitle = o3;
const AlertDialogDescription = s3;
const AlertDialogFooter = r3;
const AlertDialogCancel = c3;
const AlertDialogAction = l3;
const Select = qh;
const SelectValue = Wh;
const SelectTrigger = Yh;
const SelectContent = Zh;
const SelectItem = Kh;
const Slider = $h;
const Toaster = uN;
const toast = fi;

// Icons (lucide-react). New ones are created with the bundled lucide factory.
const Icon = {
  X: va,
  Plus: ws,
  Minus: bl,
  RotateCcw: Sl,
  Locate: na,
  Search: Xc,
  Layers: _s,
  Compass: id,
  Menu: Z0,
  List: W0,
  ChevronRight: ad,
  Eye: G0,
  Earth: Hc,
  Upload: sd,
  Trash: ag,
  Loader: Wi,
  Alert: Fc,
  CircleCheck: io,
  Download: F0,
  View: Ph,
  Hand: X0,
  Check: nd,
  MapPin: Yi,
  Warning: jc,
  Settings: eg,
  Focus: od,
  Info: vl,
  Book: B0,
  Walk: Gc,
  Clock: z0,
  ShieldCheck: tg,
  Image: j0,
  Pencil: ke("pencil", [
    ["path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z", key: "a" }],
    ["path", { d: "m15 5 4 4", key: "b" }],
  ]),
  Undo: ke("undo-2", [
    ["path", { d: "M9 14 4 9l5-5", key: "a" }],
    ["path", { d: "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11", key: "b" }],
  ]),
  Redo: ke("redo-2", [
    ["path", { d: "m15 14 5-5-5-5", key: "a" }],
    ["path", { d: "M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13", key: "b" }],
  ]),
  Save: ke("save", [
    ["path", { d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", key: "a" }],
    ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "b" }],
    ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "c" }],
  ]),
  Move: ke("move", [
    ["path", { d: "M12 2v20", key: "a" }],
    ["path", { d: "m15 19-3 3-3-3", key: "b" }],
    ["path", { d: "m19 9 3 3-3 3", key: "c" }],
    ["path", { d: "M2 12h20", key: "d" }],
    ["path", { d: "m5 9-3 3 3 3", key: "e" }],
    ["path", { d: "m9 5 3-3 3 3", key: "f" }],
  ]),
  ArrowUp: ke("arrow-up", [
    ["path", { d: "m5 12 7-7 7 7", key: "a" }],
    ["path", { d: "M12 19V5", key: "b" }],
  ]),
  ArrowDown: ke("arrow-down", [
    ["path", { d: "M12 5v14", key: "a" }],
    ["path", { d: "m19 12-7 7-7-7", key: "b" }],
  ]),
  ArrowLeft: ke("arrow-left", [
    ["path", { d: "m12 19-7-7 7-7", key: "a" }],
    ["path", { d: "M19 12H5", key: "b" }],
  ]),
  ArrowRight: ke("arrow-right-solid", [
    ["path", { d: "M5 12h14", key: "a" }],
    ["path", { d: "m12 5 7 7-7 7", key: "b" }],
  ]),
  PinPlus: ke("map-pin-plus", [
    ["path", { d: "M19.914 11.105A7.298 7.298 0 0 0 20 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32 32 0 0 0 .824-.738", key: "a" }],
    ["circle", { cx: "12", cy: "10", r: "3", key: "b" }],
    ["path", { d: "M16 18h6", key: "c" }],
    ["path", { d: "M19 15v6", key: "d" }],
  ]),
  Exit: ke("log-out", [
    ["path", { d: "m16 17 5-5-5-5", key: "a" }],
    ["path", { d: "M21 12H9", key: "b" }],
    ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "c" }],
  ]),
  More: ke("ellipsis", [
    ["circle", { cx: "12", cy: "12", r: "1", key: "a" }],
    ["circle", { cx: "19", cy: "12", r: "1", key: "b" }],
    ["circle", { cx: "5", cy: "12", r: "1", key: "c" }],
  ]),
  Share: ke("share-2", [
    ["circle", { cx: "18", cy: "5", r: "3", key: "a" }],
    ["circle", { cx: "6", cy: "12", r: "3", key: "b" }],
    ["circle", { cx: "18", cy: "19", r: "3", key: "c" }],
    ["line", { x1: "8.59", x2: "15.42", y1: "13.51", y2: "17.49", key: "d" }],
    ["line", { x1: "15.41", x2: "8.59", y1: "6.51", y2: "10.49", key: "e" }],
  ]),
  Copy: ke("copy", [
    ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "a" }],
    ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "b" }],
  ]),
  Filter: ke("list-filter", [
    ["path", { d: "M3 6h18", key: "a" }],
    ["path", { d: "M7 12h10", key: "b" }],
    ["path", { d: "M10 18h4", key: "c" }],
  ]),
  Map: ke("map", [
    ["path", { d: "M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z", key: "a" }],
    ["path", { d: "M15 5.764v15", key: "b" }],
    ["path", { d: "M9 3.236v15", key: "c" }],
  ]),
  TopDown: ke("scan", [
    ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2", key: "a" }],
    ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2", key: "b" }],
    ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2", key: "c" }],
    ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2", key: "d" }],
    ["circle", { cx: "12", cy: "12", r: "2", key: "e" }],
  ]),
};

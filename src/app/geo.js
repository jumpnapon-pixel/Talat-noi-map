// The map keeps two independent positions for every place:
//
// 1. Position on the flat illustration: place.x / place.y, percentages (2–98) of the
//    hand-drawn artwork used by the "Illustrated" and "Original" views. Adding or moving a
//    pin in the editor sets these. The artwork is stylised and rotated, so it cannot be
//    computed from coordinates (a fitted transform is off by 15% on average).
//
// 2. Real-world location: place.lat / place.lng (WGS84), set on the navigation map or typed
//    in. They drive the navigation map, the street map and walking directions. A place may
//    have none yet (null), in which case it is left out of navigation.

const Geo = {
  roundCoordinate(value) {
    return Math.round(value * 1e6) / 1e6; // about 0.1 m
  },

  distanceMetres(a, b) {
    const rad = Math.PI / 180;
    const x = (b.lng - a.lng) * rad * Math.cos(((a.lat + b.lat) * rad) / 2);
    const y = (b.lat - a.lat) * rad;
    return Math.hypot(x, y) * 6371e3;
  },

  // A starting position on the flat illustration for a new place: the artwork position of
  // the geographically nearest place, nudged aside so the two markers do not cover each
  // other. Flagged as estimated so the editor can ask for it to be checked.
  estimateIllustration(places, latLng) {
    const located = places.filter((place) => hasCoordinates(place));
    if (!located.length) return { x: 50, y: 48 };
    let nearest = located[0];
    let best = Infinity;
    for (const place of located) {
      const metres = Geo.distanceMetres(place, latLng);
      if (metres < best) ((best = metres), (nearest = place));
    }
    const clamp = (value) => Math.max(2, Math.min(98, Math.round(value * 10) / 10));
    return { x: clamp(nearest.x + 3), y: clamp(nearest.y + 2) };
  },

  formatLatLng(place) {
    return hasCoordinates(place) ? `${place.lat.toFixed(6)}, ${place.lng.toFixed(6)}` : "Not set";
  },
};

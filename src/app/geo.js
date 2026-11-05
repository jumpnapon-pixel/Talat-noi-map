// The map keeps two independent positions for every place:
//
// 1. Real-world location: place.lat / place.lng (WGS84). The illustrated 3D map is built
//    from OpenStreetMap geography, so its ground plane converts exactly to latitude and
//    longitude. Moving or adding a pin on the 3D map saves these coordinates. They also
//    drive the navigation map, the street map and walking directions.
//
// 2. Position on the flat illustration: place.x / place.y, percentages (2–98) of the
//    hand-drawn artwork used by the "Illustrated" and "Original" views. The artwork is
//    stylised and rotated, so it cannot be computed from coordinates (a fitted transform is
//    off by 15% on average). It is edited separately and never overwritten by a 3D move.

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

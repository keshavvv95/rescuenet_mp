/**
 * Precise Dombivli Municipal GIS & Landmark Mapping Service (Client-Side)
 * Provides detailed locality mapping, landmark auto-complete, and exact zone resolution for Dombivli city.
 */

export const DOMBIVLI_CITY_CENTER = {
  latitude: 19.2183,
  longitude: 73.0868,
  cityName: "Dombivli",
  district: "Thane",
  corporation: "KDMC (Kalyan-Dombivli Municipal Corporation)",
  state: "Maharashtra"
};

export const DOMBIVLI_MUNICIPAL_ZONES = [
  {
    code: "ZONE-1",
    name: "Dombivli East - Station & Ramnagar",
    shortName: "Ramnagar & Station East",
    center: { lat: 19.2183, lng: 73.0868 },
    bounds: { minLat: 19.2150, maxLat: 19.2220, minLng: 73.0830, maxLng: 73.0900 },
    landmarks: [
      "Dombivli Railway Station East",
      "Ramnagar Police Station",
      "Baji Prabhu Chowk",
      "Nehru Road",
      "Gupte Road",
      "Char Rasta Junction",
      "Tilak Road Market",
      "Madhuban Cinema Chowk"
    ]
  },
  {
    code: "ZONE-2",
    name: "Dombivli East - Phadke Road & Manpada",
    shortName: "Phadke Road & Manpada",
    center: { lat: 19.2140, lng: 73.0920 },
    bounds: { minLat: 19.2100, maxLat: 19.2160, minLng: 73.0880, maxLng: 73.0960 },
    landmarks: [
      "Phadke Road Shopping Hub",
      "Shree Ganesh Mandir (Phadke Rd)",
      "Tilak Nagar",
      "KV Pendharkar College",
      "Manpada Road",
      "DNC High School",
      "Sarvoday Mall Area",
      "Ayre Village Chowk"
    ]
  },
  {
    code: "ZONE-3",
    name: "Dombivli East - MIDC & Residential",
    shortName: "MIDC & Sagaon",
    center: { lat: 19.2080, lng: 73.0980 },
    bounds: { minLat: 19.2000, maxLat: 19.2100, minLng: 73.0920, maxLng: 73.1100 },
    landmarks: [
      "MIDC Phase 1 & 2 Industrial Area",
      "Model College Ground",
      "Sagaon Village",
      "Sonarpada Junction",
      "Regency Estate",
      "Kattai Naka Junction",
      "Bhoper Road",
      "Ghararda Circle"
    ]
  },
  {
    code: "ZONE-4",
    name: "Dombivli West - Station & Subhash Road",
    shortName: "Subhash Road & Station West",
    center: { lat: 19.2195, lng: 73.0810 },
    bounds: { minLat: 19.2150, maxLat: 19.2250, minLng: 73.0760, maxLng: 73.0830 },
    landmarks: [
      "Dombivli Railway Station West",
      "Subhash Road Market",
      "Mahatma Gandhi Road",
      "Vishnu Nagar Police Station",
      "Anand Nagar",
      "Samrat Ashok Nagar",
      "Old Dombivli Court",
      "Gopi Cine Mall"
    ]
  },
  {
    code: "ZONE-5",
    name: "Dombivli West - Garibachawada & Kopar",
    shortName: "Garibachawada & Kopar",
    center: { lat: 19.2230, lng: 73.0760 },
    bounds: { minLat: 19.2200, maxLat: 19.2350, minLng: 73.0650, maxLng: 73.0790 },
    landmarks: [
      "Kopar Railway Station",
      "Garibachawada Locality",
      "Retibunder Jetty",
      "Devi Chowk",
      "Shastri Nagar Municipal Hospital",
      "Kumbharkhan Pada",
      "Motiram Nagar",
      "Ulhas Creek Riverfront"
    ]
  }
];

/**
 * Resolves latitude and longitude to exact Dombivli zone and landmark details.
 */
export function resolveDombivliZone(lat, lng) {
  if (!lat || !lng) {
    return DOMBIVLI_MUNICIPAL_ZONES[0];
  }

  // Exact bounding box match
  for (const zone of DOMBIVLI_MUNICIPAL_ZONES) {
    const b = zone.bounds;
    if (lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng) {
      return zone;
    }
  }

  // Nearest center fallback
  let bestZone = DOMBIVLI_MUNICIPAL_ZONES[0];
  let minDistance = Infinity;

  for (const zone of DOMBIVLI_MUNICIPAL_ZONES) {
    const dist = Math.hypot(lat - zone.center.lat, lng - zone.center.lng);
    if (dist < minDistance) {
      minDistance = dist;
      bestZone = zone;
    }
  }

  return bestZone;
}

/**
 * Search landmarks across Dombivli
 */
export function searchDombivliLandmarks(query) {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase();
  const results = [];

  for (const zone of DOMBIVLI_MUNICIPAL_ZONES) {
    for (const lm of zone.landmarks) {
      if (lm.toLowerCase().includes(q)) {
        results.append?.({ landmark: lm, zoneName: zone.name, zoneCode: zone.code, center: zone.center }) ||
        results.push({ landmark: lm, zoneName: zone.name, zoneCode: zone.code, center: zone.center });
      }
    }
  }

  return results;
}

/**
 * Precise Mumbai & MMR Municipal GIS & Landmark Mapping Service (Client-Side)
 * Provides detailed locality mapping, landmark auto-complete, and exact zone resolution across 17 zones.
 */

export const MUMBAI_CITY_CENTER = {
  latitude: 19.0760,
  longitude: 72.8777,
  cityName: "Mumbai",
  district: "Mumbai Suburban",
  corporation: "BMC / KDMC / NMMC",
  state: "Maharashtra"
};

export const DOMBIVLI_CITY_CENTER = MUMBAI_CITY_CENTER;

export const MUMBAI_MUNICIPAL_ZONES = [
  // 1. Dombivli Zones
  {
    code: "ZONE-1",
    name: "Mumbai East - Station & Ramnagar",
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
    name: "Mumbai East - Phadke Road & Manpada",
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
    name: "Mumbai East - MIDC & Residential",
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
    name: "Mumbai West - Station & Subhash Road",
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
      "Old Court",
      "Gopi Cine Mall"
    ]
  },
  {
    code: "ZONE-5",
    name: "Mumbai West - Garibachawada & Kopar",
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
  },

  // 2. Mumbai Zones
  {
    code: "MUM-1",
    name: "Mumbai - Andheri & Juhu",
    shortName: "Andheri & Juhu",
    center: { lat: 19.1136, lng: 72.8697 },
    bounds: { minLat: 19.0900, maxLat: 19.1400, minLng: 72.8200, maxLng: 72.8900 },
    landmarks: [
      "Andheri Railway Station",
      "Juhu Beach Circle",
      "DN Nagar Metro Station",
      "Chakala MIDC",
      "Lokhandwala Complex",
      "Versova Beach",
      "Shoppers Stop Andheri West"
    ]
  },
  {
    code: "MUM-2",
    name: "Mumbai - Bandra & Khar",
    shortName: "Bandra & Khar",
    center: { lat: 19.0596, lng: 72.8295 },
    bounds: { minLat: 19.0400, maxLat: 19.0800, minLng: 72.8100, maxLng: 72.8500 },
    landmarks: [
      "Bandra Bandstand",
      "Carter Road Promenade",
      "Hill Road Shopping Street",
      "Linking Road Khar",
      "Bandra Terminus",
      "Lilavati Hospital",
      "BKC Connector"
    ]
  },
  {
    code: "MUM-3",
    name: "Mumbai - South Bombay (Colaba & Fort)",
    shortName: "Colaba & Fort",
    center: { lat: 18.9219, lng: 72.8346 },
    bounds: { minLat: 18.9000, maxLat: 18.9500, minLng: 72.8100, maxLng: 72.8500 },
    landmarks: [
      "Gateway of India",
      "Colaba Causeway",
      "Chhatrapati Shivaji Maharaj Terminus (CSMT)",
      "Marine Drive Promenade",
      "Nariman Point",
      "Churchgate Station",
      "Flora Fountain"
    ]
  },

  // 3. Navi Mumbai Zones
  {
    code: "NM-1",
    name: "Navi Mumbai - Panvel",
    shortName: "Panvel & Khandeshwar",
    center: { lat: 18.9894, lng: 73.1175 },
    bounds: { minLat: 18.9600, maxLat: 19.0200, minLng: 73.0900, maxLng: 73.1500 },
    landmarks: [
      "Panvel Railway Station",
      "Orion Mall Panvel",
      "Old Panvel Market",
      "Khandeshwar Metro Station",
      "Palaspa Phata",
      "Kalamboli Circle"
    ]
  },
  {
    code: "NM-2",
    name: "Navi Mumbai - Belapur & Kharghar",
    shortName: "Belapur & Kharghar",
    center: { lat: 19.0187, lng: 73.0392 },
    bounds: { minLat: 19.0000, maxLat: 19.0400, minLng: 73.0200, maxLng: 73.0800 },
    landmarks: [
      "CBD Belapur Station",
      "Kharghar Utsav Chowk",
      "Central Park Kharghar",
      "NMMC Headquarters",
      "Belapur Fort",
      "Golf Course Kharghar"
    ]
  },
  {
    code: "NM-3",
    name: "Navi Mumbai - Nerul & Seawoods",
    shortName: "Nerul & Seawoods",
    center: { lat: 19.0330, lng: 73.0180 },
    bounds: { minLat: 19.0100, maxLat: 19.0600, minLng: 73.0000, maxLng: 73.0400 },
    landmarks: [
      "Nerul Railway Station East/West",
      "Seawoods Grand Central Mall",
      "SIES College Nerul",
      "DY Patil Sports Stadium",
      "Wonders Park Nerul",
      "Adi Shankaracharya Marg",
      "Juinagar Station Naka",
      "Jewel of Navi Mumbai"
    ]
  },
  {
    code: "NM-4",
    name: "Navi Mumbai - Vashi & Sanpada",
    shortName: "Vashi & Sanpada",
    center: { lat: 19.0745, lng: 72.9978 },
    bounds: { minLat: 19.0500, maxLat: 19.0900, minLng: 72.9800, maxLng: 73.0200 },
    landmarks: [
      "Vashi Plaza / Shivaji Chowk",
      "Inorbit Mall Vashi",
      "Vashi Railway Station",
      "Sanpada Palm Beach Road",
      "APMC Market Vashi",
      "Sector 17 Vashi Shopping"
    ]
  },
  {
    code: "NM-5",
    name: "Navi Mumbai - Koparkhairane & Airoli",
    shortName: "Koparkhairane & Airoli",
    center: { lat: 19.1033, lng: 72.9996 },
    bounds: { minLat: 19.0800, maxLat: 19.1600, minLng: 72.9800, maxLng: 73.0300 },
    landmarks: [
      "Airoli Knowledge Park",
      "Koparkhairane D-Mart Chowk",
      "Ghansoli Station Bridge",
      "Rabale MIDC Junction",
      "Airoli Bridge Toll",
      "Mindspace Airoli"
    ]
  },

  // 4. Thane Zones
  {
    code: "TH-1",
    name: "Thane - West",
    shortName: "Thane West & Ghodbunder",
    center: { lat: 19.2183, lng: 72.9781 },
    bounds: { minLat: 19.1800, maxLat: 19.2700, minLng: 72.9400, maxLng: 72.9900 },
    landmarks: [
      "Thane Railway Station West",
      "Viviana Mall",
      "Korum Mall",
      "Gokhale Road Market",
      "Talao Pali Lake",
      "Majiwada Junction",
      "Ghodbunder Road"
    ]
  },
  {
    code: "TH-2",
    name: "Thane - East",
    shortName: "Thane East & Kopri",
    center: { lat: 19.1969, lng: 72.9806 },
    bounds: { minLat: 19.1800, maxLat: 19.2200, minLng: 72.9700, maxLng: 73.0000 },
    landmarks: [
      "Kopri Colony Market",
      "Thane Station East Bus Terminus",
      "Mith Bunder Road",
      "Eastern Express Highway Kopri Bridge"
    ]
  },

  // 5. Eastern Mumbai Routes
  {
    code: "ROUTE-1",
    name: "Mumbai - Mankhurd & Chembur",
    shortName: "Chembur & Mankhurd",
    center: { lat: 19.0494, lng: 72.9234 },
    bounds: { minLat: 19.0300, maxLat: 19.0700, minLng: 72.8900, maxLng: 72.9500 },
    landmarks: [
      "Chembur Diamond Garden",
      "Mankhurd Vashi Link Road",
      "Govandi Station",
      "Sion-Panvel Expressway",
      "Chembur Monorail Station"
    ]
  },
  {
    code: "ROUTE-2",
    name: "Mumbai - Wadala & Sewri",
    shortName: "Wadala & Sewri",
    center: { lat: 19.0163, lng: 72.8576 },
    bounds: { minLat: 19.0000, maxLat: 19.0300, minLng: 72.8400, maxLng: 72.8800 },
    landmarks: [
      "Wadala Monorail Depot",
      "Sewri Mudflats / MTHL Bridge Start",
      "Five Gardens Matunga",
      "Antop Hill Post Office",
      "Bhakti Park Wadala"
    ]
  },
  {
    code: "ROUTE-3",
    name: "Mumbai - Byculla & Dockyard Road",
    shortName: "Byculla & Dockyard Road",
    center: { lat: 18.9760, lng: 72.8360 },
    bounds: { minLat: 18.9500, maxLat: 18.9900, minLng: 72.8200, maxLng: 72.8600 },
    landmarks: [
      "Byculla Zoo (Rani Bagh)",
      "Dockyard Road Station",
      "Mazagon Dock",
      "Lalbaug Market",
      "Parel TT Circle"
    ]
  }
];

export const DOMBIVLI_MUNICIPAL_ZONES = MUMBAI_MUNICIPAL_ZONES;

/**
 * Resolves latitude and longitude to exact Mumbai zone and landmark details.
 */
export function resolveMumbaiZone(lat, lng) {
  if (!lat || !lng) {
    return MUMBAI_MUNICIPAL_ZONES[0];
  }

  // Exact bounding box match
  for (const zone of MUMBAI_MUNICIPAL_ZONES) {
    if (zone.bounds) {
      const b = zone.bounds;
      if (lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng) {
        return zone;
      }
    }
  }

  // Nearest center fallback using Euclidean distance
  let bestZone = MUMBAI_MUNICIPAL_ZONES[0];
  let minDistance = Infinity;

  for (const zone of MUMBAI_MUNICIPAL_ZONES) {
    const dist = Math.hypot(lat - zone.center.lat, lng - zone.center.lng);
    if (dist < minDistance) {
      minDistance = dist;
      bestZone = zone;
    }
  }

  return bestZone;
}

/**
 * Search landmarks across Mumbai & MMR
 */
export function searchMumbaiLandmarks(query) {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase();
  const results = [];

  for (const zone of MUMBAI_MUNICIPAL_ZONES) {
    for (const lm of zone.landmarks) {
      if (lm.toLowerCase().includes(q)) {
        results.push({
          landmark: lm,
          zoneName: zone.name,
          zoneCode: zone.code,
          center: zone.center
        });
      }
    }
  }

  return results;
}

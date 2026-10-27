/**
 * Precise Geolocation & Reverse Geocoding Helper Utility
 * Resolves exact street names, landmarks, and municipal zones for incident coordinates.
 */

import { API_BASE_URL } from '../config/api.js';
import { resolveMumbaiZone } from './mumbaiLocationService.js';

/**
 * Multi-layer reverse geocoding utility:
 * 1. Backend `/api/reports/reverse-geocode`
 * 2. OpenStreetMap Nominatim direct browser reverse-geocode
 * 3. BigDataCloud browser reverse-geocode
 * 4. Local GIS zone database lookup
 */
export async function reverseGeocode(latitude, longitude) {
  if (!latitude || !longitude) {
    const defaultZone = resolveMumbaiZone(19.2183, 73.0868);
    return {
      address: defaultZone.name,
      zoneName: defaultZone.name,
      zoneCode: defaultZone.code
    };
  }

  const zone = resolveMumbaiZone(latitude, longitude);

  // 1. Try backend reverse-geocode endpoint
  try {
    const res = await fetch(`${API_BASE_URL}/reports/reverse-geocode?lat=${latitude}&lng=${longitude}`, {
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.address && !data.address.toLowerCase().startsWith("lat:")) {
        return {
          address: data.address,
          zoneName: data.zone_name || zone.name,
          zoneCode: data.zone_code || zone.code,
          city: data.city,
          road: data.road
        };
      }
    }
  } catch (e) {
    // Backend offline or timeout, continue to client reverse-geocode
  }

  // 2. Try OpenStreetMap Nominatim directly
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&zoom=18&addressdetails=1`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const parts = [];

      const landmark = addr.amenity || addr.building || addr.shop;
      const road = addr.road || addr.pedestrian || addr.footway;
      if (landmark && road) {
        parts.push(`${landmark}, ${road}`);
      } else if (landmark) {
        parts.push(landmark);
      } else if (road) {
        parts.push(road);
      }

      const suburb = addr.suburb || addr.neighbourhood || addr.residential;
      if (suburb && !parts.includes(suburb)) {
        parts.push(suburb);
      }

      const city = addr.city || addr.town || addr.city_district || addr.county;
      if (city && !parts.includes(city)) {
        parts.push(city);
      }

      let formatted = parts.join(', ');
      if (!formatted && data.display_name) {
        formatted = data.display_name.split(',').slice(0, 3).join(', ').trim();
      }

      if (formatted) {
        if (addr.postcode && !formatted.includes(addr.postcode)) {
          formatted += ` (${addr.postcode})`;
        }
        return {
          address: formatted,
          zoneName: zone.name,
          zoneCode: zone.code
        };
      }
    }
  } catch (e) {
    // Nominatim unreachable or blocked, continue to BigDataCloud
  }

  // 3. Try BigDataCloud CORS-friendly client API
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (res.ok) {
      const data = await res.json();
      const parts = [
        data.locality || data.city,
        data.principalSubdivision
      ].filter(Boolean);

      if (parts.length > 0) {
        return {
          address: `${parts.join(', ')} (${zone.shortName || zone.name})`,
          zoneName: zone.name,
          zoneCode: zone.code
        };
      }
    }
  } catch (e) {
    // Offline
  }

  // 4. Local GIS Zone Fallback
  return {
    address: `${zone.name} (Near ${zone.landmarks?.[0] || 'Local Station'})`,
    zoneName: zone.name,
    zoneCode: zone.code
  };
}

/**
 * Auto-captures browser Geolocation coordinates and immediately reverse-geocodes to a human-readable street address.
 */
export const getCurrentLocation = (options = { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }) => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      const fallbackZone = resolveMumbaiZone(19.2183, 73.0868);
      resolve({
        latitude: 19.2183,
        longitude: 73.0868,
        address: `${fallbackZone.name} (Station East)`,
        zoneName: fallbackZone.name,
        zoneCode: fallbackZone.code,
        accuracy: 50,
        isFallback: true
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const accuracy = Math.round(position.coords.accuracy || 15);

        try {
          const geo = await reverseGeocode(lat, lng);
          resolve({
            latitude: lat,
            longitude: lng,
            accuracy: accuracy,
            address: geo.address,
            zoneName: geo.zoneName,
            zoneCode: geo.zoneCode,
            isFallback: false
          });
        } catch (err) {
          const zone = resolveMumbaiZone(lat, lng);
          resolve({
            latitude: lat,
            longitude: lng,
            accuracy: accuracy,
            address: `${zone.name} (Near ${zone.landmarks?.[0] || 'Central Junction'})`,
            zoneName: zone.name,
            zoneCode: zone.code,
            isFallback: false
          });
        }
      },
      (error) => {
        console.warn('Geolocation permission not granted or unavailable, using localized default zone:', error.message);
        const defaultZone = resolveMumbaiZone(19.2183, 73.0868);
        resolve({
          latitude: 19.2183,
          longitude: 73.0868,
          address: `${defaultZone.name} - Phadke Road & Station`,
          zoneName: defaultZone.name,
          zoneCode: defaultZone.code,
          accuracy: 100,
          isFallback: true,
          errorMessage: error.message
        });
      },
      options
    );
  });
};

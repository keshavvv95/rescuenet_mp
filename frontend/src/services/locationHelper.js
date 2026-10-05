/**
 * Helper utility for browser Geolocation API auto-capture
 */
export const getCurrentLocation = (options = { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }) => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      // Fallback location (Dombivli East)
      resolve({
        latitude: 19.2183,
        longitude: 73.0868,
        address: 'Dombivli East - Station & Ramnagar (Fallback GPS)',
        accuracy: 50,
        isFallback: true
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude.toFixed(5)),
          longitude: Number(position.coords.longitude.toFixed(5)),
          accuracy: Math.round(position.coords.accuracy),
          address: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`,
          isFallback: false
        });
      },
      (error) => {
        console.warn('Geolocation failed or permission denied, using default Dombivli coordinates:', error.message);
        // Realistic default coords: Dombivli East
        resolve({
          latitude: 19.2183,
          longitude: 73.0868,
          address: 'Dombivli East - Station & Ramnagar (Default GPS)',
          accuracy: 100,
          isFallback: true,
          errorMessage: error.message
        });
      },
      options
    );
  });
};

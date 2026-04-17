export const toRad = (deg) => (deg * Math.PI) / 180;

export const isFiniteNumber = (value) =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * Robust Haversine formula for calculating distance between two points in KM.
 */
export const haversineKm = (a, b) => {
  const lat1 = typeof a?.lat === 'number' ? a.lat : (typeof a?.latitude === 'number' ? a.latitude : Number(a?.lat ?? a?.latitude));
  const lon1 = typeof a?.lng === 'number' ? a.lng : 
               typeof a?.lon === 'number' ? a.lon : 
               typeof a?.longitude === 'number' ? a.longitude : 
               Number(a?.lng ?? a?.lon ?? a?.longitude);
  
  const lat2 = typeof b?.lat === 'number' ? b.lat : (typeof b?.latitude === 'number' ? b.latitude : Number(b?.lat ?? b?.latitude));
  const lon2 = typeof b?.lng === 'number' ? b.lng : 
               typeof b?.lon === 'number' ? b.lon : 
               typeof b?.longitude === 'number' ? b.longitude : 
               Number(b?.lng ?? b?.lon ?? b?.longitude);

  if (![lat1, lon1, lat2, lon2].every(isFiniteNumber)) return null;

  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const sLat1 = toRad(lat1);
  const sLat2 = toRad(lat2);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(sLat1) *
      Math.cos(sLat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
};

export const formatDistanceKm = (km) => {
  if (!isFiniteNumber(km)) return '';
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  const fixed = km < 10 ? 1 : 0;
  return `${km.toFixed(fixed)} km`;
};

export const normalizePlace = (value) => String(value || '').trim().toLowerCase();

export const samePlace = (a, b) => {
  const na = normalizePlace(a);
  const nb = normalizePlace(b);
  return Boolean(na && nb && na === nb);
};

/**
 * Generates a Google Maps directions or search URL.
 * If origin is missing, it falls back to a destination-only view.
 */
export const getDirectionsUrl = (dest, origin = null) => {
    const destLat = dest?.lat ?? dest?.latitude;
    const destLng = dest?.lng ?? dest?.longitude;
    
    if (!isFiniteNumber(destLat) || !isFiniteNumber(destLng)) return '#';

    if (origin && isFiniteNumber(origin.lat ?? origin.latitude) && isFiniteNumber(origin.lng ?? origin.longitude)) {
        const originLat = origin.lat ?? origin.latitude;
        const originLng = origin.lng ?? origin.longitude;
        return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
    }
    
    // Fallback: search/destination view
    return `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
};

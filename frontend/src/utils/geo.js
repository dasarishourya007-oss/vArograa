export const toRad = (deg) => (deg * Math.PI) / 180;

export const isFiniteNumber = (value) =>
  typeof value === 'number' && Number.isFinite(value);

export const haversineKm = (a, b) => {
  const lat1 = typeof a?.lat === 'number' ? a.lat : a?.latitude;
  const lon1 =
    typeof a?.lng === 'number'
      ? a.lng
      : typeof a?.lon === 'number'
        ? a.lon
        : a?.longitude;
  const lat2 = typeof b?.lat === 'number' ? b.lat : b?.latitude;
  const lon2 =
    typeof b?.lng === 'number'
      ? b.lng
      : typeof b?.lon === 'number'
        ? b.lon
        : b?.longitude;

  if (![lat1, lon1, lat2, lon2].every(isFiniteNumber)) return null;

  const R = 6371; // km
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
  const fixed = km < 10 ? 1 : 0;
  return `${km.toFixed(fixed)} km away`;
};

export const normalizePlace = (value) => String(value || '').trim().toLowerCase();

export const samePlace = (a, b) => {
  const na = normalizePlace(a);
  const nb = normalizePlace(b);
  return Boolean(na && nb && na === nb);
};

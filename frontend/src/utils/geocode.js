const CACHE_PREFIX = 'varogra_geocode_v1:';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 24h

const nowMs = () => Date.now();

const cacheGet = (key) => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || parsed.expiresAt < nowMs()) return null;
    return parsed.value ?? null;
  } catch {
    return null;
  }
};

const cacheSet = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ value, expiresAt: nowMs() + ttlMs })
    );
  } catch {
    // ignore storage quota / privacy mode
  }
};

const pickFirst = (...values) => values.find((v) => String(v || '').trim());

export const extractAddressFieldsFromNominatim = (payload) => {
  const address = payload?.address || {};
  const lat = payload?.lat != null ? Number(payload.lat) : Number(payload?.latitude);
  const lng = payload?.lon != null ? Number(payload.lon) : Number(payload?.longitude);

  // Nominatim doesn't have a guaranteed "mandal" field; for India, `county` / `subdistrict` are closest.
  const state = address.state || '';
  const district = pickFirst(
    address.state_district,
    address.county,
    address.region,
    address.city_district,
    ''
  );
  const mandal = pickFirst(
    address.county,
    address.subdistrict,
    address.municipality,
    address.city_district,
    ''
  );
  const city = pickFirst(address.city, address.town, address.village, address.hamlet, '');
  const pincode = address.postcode || '';

  return {
    state,
    district,
    mandal,
    city,
    pincode,
    country: address.country || '',
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lng) ? lng : null,
    displayName: payload?.display_name || ''
  };
};

export const reverseGeocodeNominatim = async (lat, lng, { ttlMs } = {}) => {
  const key = `rev:${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'json');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('addressdetails', '1');

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`Reverse geocode failed (${res.status})`);
    const json = await res.json();
    cacheSet(key, json, ttlMs);
    return json;
  } catch {
    // Fallback provider for better reliability when Nominatim is unavailable/rate-limited.
    const fallbackUrl = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    fallbackUrl.searchParams.set('latitude', String(lat));
    fallbackUrl.searchParams.set('longitude', String(lng));
    fallbackUrl.searchParams.set('localityLanguage', 'en');

    const fallbackRes = await fetch(fallbackUrl.toString(), {
      headers: { Accept: 'application/json' }
    });
    if (!fallbackRes.ok) throw new Error(`Reverse geocode failed (${fallbackRes.status})`);
    const fallbackJson = await fallbackRes.json();

    const normalized = {
      lat: String(lat),
      lon: String(lng),
      display_name: [
        fallbackJson.locality,
        fallbackJson.city,
        fallbackJson.principalSubdivision,
        fallbackJson.postcode,
        fallbackJson.countryName
      ]
        .filter(Boolean)
        .join(', '),
      address: {
        city: fallbackJson.city || fallbackJson.locality || '',
        town: fallbackJson.locality || '',
        village: fallbackJson.locality || '',
        state: fallbackJson.principalSubdivision || '',
        county: fallbackJson.localityInfo?.administrative?.[3]?.name || '',
        state_district: fallbackJson.localityInfo?.administrative?.[2]?.name || '',
        postcode: fallbackJson.postcode || '',
        country: fallbackJson.countryName || ''
      }
    };
    cacheSet(key, normalized, ttlMs);
    return normalized;
  }
};

export const forwardGeocodeNominatim = async (query, { ttlMs, limit = 5 } = {}) => {
  const q = String(query || '').trim();
  if (!q) return [];

  const key = `fwd:${q.toLowerCase()}:${limit}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`Forward geocode failed (${res.status})`);
  const json = await res.json();
  cacheSet(key, json, ttlMs);
  return json;
};

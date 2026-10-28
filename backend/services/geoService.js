const boardingPoints = require('../data/boardingPoints');
const { ApiError } = require('../middleware/errors');

const geocodeCache = new Map();

const normalise = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toRadians = (degrees) => (degrees * Math.PI) / 180;

function haversineDistance(a, b) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function findCuratedPoint(query) {
  const needle = normalise(query);
  if (!needle) return null;
  return (
    boardingPoints.find(
      (point) =>
        normalise(point.name) === needle ||
        normalise(point.name.replace(/\s*\(.*?\)\s*/g, ' ')) === needle ||
        point.aliases.some((alias) => normalise(alias) === needle)
    ) ||
    boardingPoints.find((point) => normalise(point.name).includes(needle) && needle.length > 3) ||
    null
  );
}

async function geocodeIndianPlace(query) {
  if (process.env.ENABLE_GEOCODING === 'false') return null;
  const key = normalise(query);
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', String(query));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'in');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TravelMate/1.0 (educational trip planning prototype)',
        Accept: 'application/json'
      }
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const results = await response.json();
    const match = results[0];
    if (!match) return null;
    const resolved = {
      name: String(match.display_name || query).split(',').slice(0, 2).join(',').slice(0, 90),
      lat: Number(match.lat),
      lng: Number(match.lon),
      source: 'OpenStreetMap'
    };
    geocodeCache.set(key, resolved);
    return resolved;
  } catch (error) {
    return null;
  }
}

async function resolveBoardingPoint(input) {
  if (input && typeof input === 'object') {
    const lat = Number(input.lat);
    const lng = Number(input.lng);
    const name = String(input.name || 'Custom boarding point').trim();
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new ApiError(400, 'Boarding point coordinates are invalid');
    }
    return { name: name.slice(0, 90), lat, lng, source: 'custom' };
  }

  const query = String(input || '').trim();
  if (query.length < 2) {
    throw new ApiError(400, 'Choose or enter a boarding point');
  }

  const curated = findCuratedPoint(query);
  if (curated) {
    return {
      name: curated.name,
      lat: curated.lat,
      lng: curated.lng,
      state: curated.state,
      source: 'curated'
    };
  }

  const geocoded = await geocodeIndianPlace(query);
  if (geocoded) return geocoded;

  throw new ApiError(
    400,
    'We could not locate that boarding point. Choose a city from the suggested list.'
  );
}

module.exports = {
  boardingPoints,
  haversineDistance,
  resolveBoardingPoint,
  geocodeIndianPlace
};

#!/usr/bin/env node
/**
 * Dependency-free API smoke test.
 *
 *   node backend/scripts/smoke.js [baseUrl]
 *
 * Expects a running TravelMate API (default http://127.0.0.1:5000) that was
 * started with demo data (the default in development).
 */
const BASE = process.argv[2] || process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5000';

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  const mark = passed ? '\u2713' : '\u2717';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
};

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  return { status: response.status, payload };
}

async function run() {
  const health = await request('/api/meta/health');
  check('Health endpoint responds', health.status === 200, health.payload?.data?.database?.mode);

  const meta = await request('/api/meta');
  check('Meta endpoint exposes board points & pricing', meta.status === 200 && meta.payload.data.boardingPoints.length > 10);

  const destinations = await request('/api/destinations');
  const items = destinations.payload?.data || [];
  check('Destinations seeded', items.length >= 6, `${items.length} destinations`);
  check(
    'Each destination has 4 famous places with images',
    items.every((item) => item.places.length === 4 && item.places.every((place) => place.image && place.description))
  );

  const goa = items.find((item) => item.slug === 'goa');
  check(
    'Goa includes Fort Aguada, Baga, Anjuna and Chapora',
    ['Fort Aguada', 'Baga Beach', 'Anjuna Beach', 'Chapora Fort'].every((name) =>
      goa?.places.some((place) => place.name === name)
    )
  );

  const estimate = await request('/api/trips/estimate', {
    method: 'POST',
    body: JSON.stringify({
      boardingPoint: 'Hyderabad',
      destinationSlug: 'goa',
      days: 4,
      travelers: 2,
      options: { needTransport: true, transportMode: 'train', needHotel: true, needGuide: true }
    })
  });
  const breakdown = estimate.payload?.data?.estimate;
  check('Cost estimate calculated server-side', estimate.status === 200 && breakdown.total > 0, `₹${breakdown?.total}`);
  check(
    'Estimate is itemised and includes taxes/contingency',
    Array.isArray(breakdown?.lineItems) &&
      breakdown.lineItems.length >= 4 &&
      breakdown.taxes > 0 &&
      breakdown.contingency > 0
  );

  const noExtras = await request('/api/trips/estimate', {
    method: 'POST',
    body: JSON.stringify({
      boardingPoint: 'Pune',
      destinationSlug: 'goa',
      days: 2,
      travelers: 1,
      options: { needTransport: false, needHotel: false, needGuide: false }
    })
  });
  const keys = (noExtras.payload?.data?.estimate?.lineItems || []).map((item) => item.key);
  check('Trip can be planned without guide, transport or hotel', !keys.includes('guide') && !keys.includes('hotel') && !keys.includes('transport'));

  const badLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'traveller@travelmate.in', password: 'wrong-password' })
  });
  check('Invalid credentials rejected', badLogin.status === 401);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'traveller@travelmate.in', password: 'Demo@123' })
  });
  check('Demo traveller can sign in', login.status === 200 && Boolean(login.payload?.data?.token));
  const token = login.payload?.data?.token;
  const auth = { Authorization: `Bearer ${token}` };

  const summary = await request('/api/dashboard', { headers: auth });
  check('Traveller dashboard summary loads', summary.status === 200 && summary.payload.data.cards.length === 4);

  const trips = await request('/api/trips', { headers: auth });
  check('Saved trips load from MongoDB', trips.status === 200 && trips.payload.data.length >= 1);

  const services = await request('/api/services');
  check('Marketplace services seeded', services.status === 200 && services.payload.data.length >= 6);

  const guide = services.payload.data.find((service) => service.type === 'guide');
  const booking = await request('/api/bookings', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      serviceId: guide.id,
      bookingDate: new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10),
      duration: 1,
      guests: 2,
      note: 'Smoke test booking'
    })
  });
  check('Traveller can create a booking request', booking.status === 201, `₹${booking.payload?.data?.amount}`);

  const forbidden = await request('/api/services', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ title: 'Nope', description: 'blocked', destinationSlug: 'goa', price: { amount: 10, unit: 'day' } })
  });
  check('Role guard blocks travellers from publishing services', forbidden.status === 403);

  const providerLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'hotel@travelmate.in', password: 'Demo@123' })
  });
  const providerAuth = { Authorization: `Bearer ${providerLogin.payload?.data?.token}` };
  const providerBookings = await request('/api/bookings/provider', { headers: providerAuth });
  check('Provider sees booking requests', providerBookings.status === 200 && Array.isArray(providerBookings.payload.data));

  const failed = results.filter((result) => !result.passed);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
}

run().catch((error) => {
  console.error('Smoke test failed to run:', error.message);
  process.exit(1);
});

const { haversineDistance, resolveBoardingPoint } = require('./geoService');
const { ApiError } = require('../middleware/errors');

const TRANSPORT_PROFILES = {
  bus: {
    label: 'AC bus',
    ratePerKm: 2.2,
    baseFare: 450,
    routeFactor: 1.28,
    chargeBy: 'traveller'
  },
  train: {
    label: 'Train (3AC)',
    ratePerKm: 2.4,
    baseFare: 250,
    routeFactor: 1.18,
    chargeBy: 'traveller'
  },
  flight: {
    label: 'Economy flight',
    ratePerKm: 8.5,
    baseFare: 1200,
    routeFactor: 1.05,
    chargeBy: 'traveller'
  },
  cab: {
    label: 'Private cab',
    ratePerKm: 14,
    baseFare: 900,
    routeFactor: 1.28,
    chargeBy: 'vehicle'
  },
  self: {
    label: 'Self-drive fuel',
    ratePerKm: 8,
    baseFare: 0,
    routeFactor: 1.28,
    chargeBy: 'vehicle'
  }
};

const HOTEL_TIERS = {
  budget: 'Budget stay',
  standard: 'Standard stay',
  premium: 'Premium stay'
};

const round = (value) => Math.round(value);
const money = (value) => `₹${round(value).toLocaleString('en-IN')}`;

const positiveInt = (value, fallback, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
};

const booleanOption = (value, fallback) =>
  typeof value === 'boolean' ? value : fallback;

function normaliseOptions(raw = {}) {
  const days = positiveInt(raw.days, 3, 1, 30);
  const travelers = positiveInt(raw.travelers, 1, 1, 30);
  const transportMode = TRANSPORT_PROFILES[raw.transportMode] ? raw.transportMode : 'train';
  const hotelTier = HOTEL_TIERS[raw.hotelTier] ? raw.hotelTier : 'standard';
  return {
    days,
    travelers,
    startDate: raw.startDate || null,
    needTransport: booleanOption(raw.needTransport, true),
    transportMode,
    needHotel: booleanOption(raw.needHotel, true),
    hotelTier,
    rooms: positiveInt(raw.rooms, Math.max(1, Math.ceil(travelers / 2)), 1, 15),
    needGuide: booleanOption(raw.needGuide, false),
    guideDays: Math.min(positiveInt(raw.guideDays, days, 1, 30), days),
    mealPlan: booleanOption(raw.mealPlan, true),
    includeActivities: booleanOption(raw.includeActivities, true)
  };
}

async function estimateTrip(destination, payload = {}) {
  if (!destination || !destination.coordinates || !destination.dailyCosts) {
    throw new ApiError(500, 'Destination pricing data is not configured');
  }

  const options = normaliseOptions({ ...payload, ...(payload.options || {}) });
  const boardingPoint = await resolveBoardingPoint(
    payload.boardingPoint || payload.boardingCity || payload.from
  );

  const distanceKm = haversineDistance(boardingPoint, destination.coordinates);
  const profile = TRANSPORT_PROFILES[options.transportMode];
  const routeFactor = profile.routeFactor;
  const roadDistanceKm = round(distanceKm * routeFactor);
  const roundTripKm = roadDistanceKm * 2;
  const lineItems = [];

  if (options.needTransport) {
    const passengers = profile.chargeBy === 'traveller' ? options.travelers : 1;
    const vehicles = profile.chargeBy === 'vehicle' ? Math.max(1, Math.ceil(options.travelers / 4)) : 1;
    const variableFare = roundTripKm * profile.ratePerKm * passengers * vehicles;
    const baseFare = profile.baseFare * passengers * vehicles;
    const tolls = profile.chargeBy === 'vehicle' ? round(variableFare * 0.08) : 0;
    lineItems.push({
      key: 'transport',
      label: `Return ${profile.label} travel`,
      details: `${roundTripKm.toLocaleString('en-IN')} km round trip · ${boardingPoint.name} ↔ ${destination.name}`,
      amount: round(variableFare + baseFare + tolls)
    });
  }

  const nights = Math.max(1, options.days - 1);
  if (options.needHotel) {
    const rate = destination.dailyCosts[`${options.hotelTier}Hotel`];
    lineItems.push({
      key: 'hotel',
      label: `${HOTEL_TIERS[options.hotelTier]} (${nights} night${nights > 1 ? 's' : ''})`,
      details: `${money(rate)} per room × ${options.rooms} room${options.rooms > 1 ? 's' : ''} × ${nights} night${nights > 1 ? 's' : ''}`,
      amount: round(rate * options.rooms * nights)
    });
  }

  const mealRate = destination.dailyCosts.food * (options.mealPlan ? 1 : 0.65);
  lineItems.push({
    key: 'meals',
    label: options.mealPlan ? 'Meals for the full trip' : 'Essential meals',
    details: `${money(mealRate)} per traveller × ${options.travelers} × ${options.days} day${options.days > 1 ? 's' : ''}`,
    amount: round(mealRate * options.travelers * options.days)
  });

  const localVehicles = Math.max(1, Math.ceil(options.travelers / 4));
  lineItems.push({
    key: 'localTransport',
    label: 'Local sightseeing transfers',
    details: `${money(destination.dailyCosts.localTransport)} per day × ${localVehicles} vehicle${localVehicles > 1 ? 's' : ''}`,
    amount: round(destination.dailyCosts.localTransport * localVehicles * options.days)
  });

  if (options.needGuide) {
    lineItems.push({
      key: 'guide',
      label: 'Local travel guide',
      details: `${money(destination.dailyCosts.guide)} per day × ${options.guideDays} day${options.guideDays > 1 ? 's' : ''}`,
      amount: round(destination.dailyCosts.guide * options.guideDays)
    });
  }

  if (options.includeActivities) {
    lineItems.push({
      key: 'activities',
      label: 'Activities & monument entries',
      details: `${money(destination.dailyCosts.activities)} per traveller × ${options.travelers} × ${options.days} day${options.days > 1 ? 's' : ''}`,
      amount: round(destination.dailyCosts.activities * options.travelers * options.days)
    });
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxes = round(subtotal * 0.05);
  const contingency = round(subtotal * 0.05);
  const total = subtotal + taxes + contingency;
  const perPerson = Math.max(1, round(total / options.travelers));

  return {
    boardingPoint,
    destination: {
      slug: destination.slug,
      name: destination.name,
      state: destination.state,
      coordinates: destination.coordinates
    },
    options,
    estimate: {
      distanceKm: round(distanceKm),
      roadDistanceKm,
      routeFactor,
      currency: 'INR',
      lineItems,
      subtotal,
      taxes,
      contingency,
      total,
      perPerson,
      assumptions: [
        'Distance is great-circle distance multiplied by a mode-specific road/rail factor.',
        'Return travel is assumed. Public transport is charged per traveller; cab and self-drive per vehicle.',
        'Hotel nights are trip days minus one. Prices are planning averages, not live inventory.',
        'Taxes/fees and a 5% contingency are included in the final estimate.'
      ],
      generatedAt: new Date().toISOString(),
      disclaimer:
        'Indicative estimate in Indian rupees. Actual prices vary by date, availability, operator and booking class.'
    }
  };
}

module.exports = {
  TRANSPORT_PROFILES,
  HOTEL_TIERS,
  estimateTrip,
  normaliseOptions
};

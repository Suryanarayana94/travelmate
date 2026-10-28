const fs = require('fs');
const path = require('path');
const { asyncHandler } = require('../middleware/errors');
const { sendSuccess } = require('../views/responseView');
const { TRANSPORT_PROFILES, HOTEL_TIERS } = require('../services/costService');
const { boardingPoints } = require('../services/geoService');
const { ROLE_LABELS } = require('../views/responseView');
const { ROLES } = require('../models/User');
const { getDatabaseInfo } = require('../config/database');

const creditsPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'images', 'image-credits.json');

const getAppMeta = asyncHandler(async (_req, res) => {
  let imageCredits = { count: 0, source: 'Wikimedia Commons' };
  try {
    const parsed = JSON.parse(fs.readFileSync(creditsPath, 'utf8'));
    imageCredits = {
      count: Object.keys(parsed.images || {}).length,
      source: parsed.source,
      generatedAt: parsed.generatedAt,
      creditsUrl: '/images/CREDITS.md'
    };
  } catch {
    // Credits are optional metadata; the app continues if the file is absent.
  }

  sendSuccess(res, {
    app: 'TravelMate',
    version: '1.0.0',
    currency: 'INR',
    country: 'India',
    roles: ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
    boardingPoints,
    transportModes: Object.entries(TRANSPORT_PROFILES).map(([value, profile]) => ({
      value,
      label: profile.label,
      ratePerKm: profile.ratePerKm,
      routeFactor: profile.routeFactor
    })),
    hotelTiers: Object.entries(HOTEL_TIERS).map(([value, label]) => ({ value, label })),
    imageCredits,
    database: getDatabaseInfo()
  });
});

const getHealth = asyncHandler(async (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    database: getDatabaseInfo(),
    timestamp: new Date().toISOString()
  });
});

module.exports = { getAppMeta, getHealth };

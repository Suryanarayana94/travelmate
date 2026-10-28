const { getDatabaseInfo, isDatabaseReady } = require('../config/database');

/**
 * Blocks data routes while the Atlas cluster is unavailable.
 *
 * Reads are allowed to fail loudly: a 503 with setup guidance is far more
 * useful than an empty list, and the frontend renders this message in a banner.
 */
const requireDatabase = (req, res, next) => {
  if (isDatabaseReady()) return next();

  const info = getDatabaseInfo();
  res.status(503).json({
    success: false,
    message:
      info.mode === 'not-configured'
        ? 'TravelMate is not connected to MongoDB Atlas yet. Add MONGODB_URI to .env, restart the API, then run `npm run seed`.'
        : `MongoDB Atlas is unreachable (${info.message}). Run \`npm run db:check\` for a guided diagnosis.`,
    details: {
      code: 'DATABASE_UNAVAILABLE',
      database: info,
      setupSteps: [
        'Create a free cluster at cloud.mongodb.com',
        'Add your IP under Network Access',
        'Copy the mongodb+srv:// string from Connect → Drivers',
        'Set MONGODB_URI in .env and restart the API',
        'Run npm run db:check, then npm run seed'
      ]
    }
  });
};

module.exports = { requireDatabase };

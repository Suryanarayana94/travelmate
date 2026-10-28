const { connectDatabase, disconnectDatabase, getDatabaseInfo } = require('./config/database');
const { seedAll } = require('./services/seedService');
const app = require('./app');

const PORT = Number(process.env.PORT) || 5000;

const printDatabaseFailure = (error) => {
  console.error('');
  console.error('  ┌─ MongoDB Atlas is not available ────────────────────────────────');
  String(error.message || error)
    .split('\n')
    .forEach((line) => console.error(`  │ ${line}`));
  console.error('  │');
  (error.details?.setupSteps || []).forEach((step, index) => {
    console.error(`  │ ${index + 1}. ${step}`);
  });
  console.error('  └─────────────────────────────────────────────────────────────────');
  console.error('');
};

async function startServer() {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TravelMate] API listening on http://0.0.0.0:${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[TravelMate] Received ${signal}; shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
}

async function bootstrap() {
  let info;
  let connected = false;

  try {
    info = await connectDatabase();
    connected = true;
  } catch (error) {
    info = getDatabaseInfo();
    if (process.env.NODE_ENV === 'production') throw error;

    // Development: keep the UI usable so the setup screen can explain the fix.
    printDatabaseFailure(error);
    console.warn('[TravelMate] Starting in SETUP MODE — data routes will return 503 until MongoDB Atlas is connected.\n');
  }

  app.locals.databaseInfo = info;

  if (connected) {
    const shouldSeedDemo = process.env.SEED_DEMO_DATA === 'true';
    const seedResult = await seedAll({ demo: shouldSeedDemo });
    console.log(
      `[TravelMate] Storage: MongoDB Atlas · ${info.host} · database "${info.database}"`
    );
    console.log(`[TravelMate] Seeded ${seedResult.destinations} destinations`);
    if (seedResult.demoData) {
      console.log(
        `[TravelMate] Demo data ready → ${seedResult.demoData.users} users, ${seedResult.demoData.services} services, ${seedResult.demoData.trips} trips, ${seedResult.demoData.bookings} bookings`
      );
      console.log('[TravelMate] Demo login password: Demo@123');
    }
  }

  await startServer();
}

bootstrap().catch((error) => {
  printDatabaseFailure(error);
  console.error('[TravelMate] Failed to start API. Run `npm run db:check` for a guided diagnosis.\n');
  process.exit(1);
});

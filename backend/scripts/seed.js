#!/usr/bin/env node
/**
 * Seeds the destinations (always) and the demo accounts/services/trips/bookings
 * (unless SEED_DEMO_DATA=false) into the database pointed at by MONGODB_URI.
 *
 *   npm run seed              # seed the MongoDB Atlas cluster in MONGODB_URI
 *
 * The script is idempotent: destinations are upserted by slug, demo users by
 * email, and demo services/trips/bookings by their `seedKey`, so it can be run
 * repeatedly against the same Atlas cluster without duplicating data.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { connectDatabase, disconnectDatabase, getDatabaseInfo, describeTarget, maskUri } =
  require('../config/database');
const { seedAll, DEMO_PASSWORD } = require('../services/seedService');

const uri = (process.env.MONGODB_URI || '').trim();

async function run() {
  if (!uri) {
    console.error(
      [
        '',
        'MONGODB_URI is not set, so there is nowhere to seed.',
        '',
        '  1. Create a free cluster at https://cloud.mongodb.com',
        '  2. Database → Connect → Drivers → copy the mongodb+srv:// string',
        '  3. Put it in .env as MONGODB_URI=... (see .env.example)',
        '  4. Run `npm run db:check`, then `npm run seed` again',
        ''
      ].join('\n')
    );
    process.exit(1);
  }

  if (uri) {
    const target = describeTarget(uri);
    console.log(`Seeding ${target.provider} · ${target.host} · database "${target.database}"`);
    console.log(`Using connection string: ${maskUri(uri)}\n`);
  }

  await connectDatabase();
  const demo = process.env.SEED_DEMO_DATA !== 'false';
  const result = await seedAll({ demo });
  const info = getDatabaseInfo();

  console.log('');
  console.log('Seed complete');
  console.log(`  provider ......... ${info.provider}`);
  console.log(`  host ............. ${info.host}`);
  console.log(`  database ......... ${info.database}`);
  console.log(`  destinations ..... ${result.destinations}`);
  if (result.demoData) {
    console.log(`  demo users ....... ${result.demoData.users}`);
    console.log(`  demo services .... ${result.demoData.services}`);
    console.log(`  demo trips ....... ${result.demoData.trips}`);
    console.log(`  demo bookings .... ${result.demoData.bookings}`);
    console.log(`  demo password .... ${DEMO_PASSWORD}`);
  } else {
    console.log('  demo data ........ skipped (SEED_DEMO_DATA=false)');
  }
  await disconnectDatabase();
}

run().catch((error) => {
  console.error('\nSeed failed:\n', error.message);
  process.exit(1);
});

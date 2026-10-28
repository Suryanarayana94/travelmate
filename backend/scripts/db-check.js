#!/usr/bin/env node
/**
 * MongoDB Atlas connection doctor.
 *
 *   npm run db:check            # from the repo root
 *   node backend/scripts/db-check.js
 *
 * What it checks:
 *   1. whether MONGODB_URI is configured and looks like an Atlas string
 *   2. this machine's public IP (so you can add it to Atlas → Network Access)
 *   3. DNS SRV/TXT records for mongodb+srv:// hosts
 *   4. authentication + TLS handshake with a bounded timeout
 *   5. read/write permissions, server version and replica-set details
 *   6. how many of the TravelMate collections/documents are already present
 *
 * The connection string is never printed with its password.
 */
const path = require('path');
const dns = require('dns').promises;
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { maskUri, describeTarget, explainConnectionError } = require('../config/database');

const OK = '\u2713';
const BAD = '\u2717';
const SKIP = '\u2022';
const results = [];
const line = (status, label, detail = '') => {
  results.push({ status, label, detail });
  console.log(`${status} ${label}${detail ? ` — ${detail}` : ''}`);
};

const COLLECTIONS = ['users', 'destinations', 'services', 'trips', 'bookings'];

async function publicIp() {
  const endpoints = ['https://api.ipify.org', 'https://ifconfig.me/ip'];
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timer);
      if (response.ok) {
        const text = (await response.text()).trim();
        if (text) return text;
      }
    } catch {
      // try the next endpoint
    }
  }
  return null;
}

async function resolveSrv(host) {
  const srvName = `_mongodb._tcp.${host}`;
  try {
    const records = await dns.resolveSrv(srvName);
    if (!records.length) return { ok: false, detail: 'no SRV records returned' };
    return { ok: true, records };
  } catch (error) {
    return { ok: false, detail: `${error.code || error.message}` };
  }
}

async function main() {
  console.log('\nTravelMate — MongoDB connection check\n');

  const uri = (process.env.MONGODB_URI || '').trim();

  if (!uri) {
    line(BAD, 'MONGODB_URI is not set', 'copy .env.example to .env and paste your Atlas string');
    line(SKIP, 'Next step', 'Atlas → Database → Connect → Drivers → copy the mongodb+srv:// string');
    finish(1);
    return;
  }

  const target = describeTarget(uri);
  line(OK, 'MONGODB_URI found', `${target.provider} · ${target.database}`);
  line(SKIP, 'Connection string', maskUri(uri));

  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    line(BAD, 'Connection string scheme', 'must start with mongodb+srv:// (Atlas) or mongodb://');
    finish(1);
    return;
  }

  if (/<password>|<db_password>|xxxx/i.test(uri)) {
    line(BAD, 'Connection string still contains a placeholder', 'replace <password> / <username> with real values');
    finish(1);
    return;
  }

  if (target.provider === 'MongoDB Atlas') {
    line(OK, 'Atlas SRV hostname detected', target.host);
    const srv = await resolveSrv(target.host);
    if (srv.ok) {
      line(OK, 'DNS SRV records resolved', `${srv.records.length} node(s): ${srv.records.map((r) => `${r.name}:${r.port}`).slice(0, 3).join(', ')}${srv.records.length > 3 ? '…' : ''}`);
    } else {
      line(BAD, 'DNS SRV lookup failed', srv.detail);
      line(SKIP, 'Hint', 'Check the hostname, or whether this network blocks DNS SRV queries');
    }
  }

  const ip = await publicIp();
  if (ip) {
    line(SKIP, 'This machine’s public IP', `${ip} — add it in Atlas → Network Access (or allow 0.0.0.0/0 while developing)`);
  }

  console.log('\nConnecting…\n');
  const started = Date.now();
  let connection;
  try {
    connection = mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      retryWrites: true,
      ...(target.provider === 'MongoDB Atlas' ? { tls: true } : {})
    });
    await connection.asPromise();
  } catch (error) {
    const explained = explainConnectionError(error, uri);
    line(BAD, 'Connection failed', explained.message.split('\n')[0]);
    console.log(`\n${explained.message}\n`);
    finish(1);
    return;
  }

  const elapsed = Date.now() - started;
  line(OK, 'Connected and authenticated', `${elapsed} ms`);

  const admin = connection.db.admin();
  try {
    const hello = await admin.command({ hello: 1 });
    line(
      OK,
      'Cluster',
      `${hello.setName ? `replica set ${hello.setName}` : 'standalone'} · primary: ${hello.primary || 'this node'}`
    );
    const build = await admin.command({ buildInfo: 1 });
    line(OK, 'Server version', build.version);
  } catch (error) {
    line(SKIP, 'Server details unavailable', error.message);
  }

  const databaseName = process.env.MONGODB_DB || connection.db.databaseName;
  line(OK, 'Database in use', databaseName);

  // Write permission probe: a read-only Atlas user would fail here.
  try {
    const probe = connection.db.collection('__travelmate_probe');
    await probe.insertOne({ checkedAt: new Date(), note: 'temporary connectivity probe' });
    await probe.deleteOne({ note: 'temporary connectivity probe' });
    line(OK, 'Read + write permissions', 'write probe inserted and removed');
  } catch (error) {
    line(BAD, 'Write permission missing', `${error.message} — the Atlas user needs readWrite on this database`);
  }

  const existing = await connection.db.listCollections().toArray();
  const names = existing.map((item) => item.name).filter((name) => !name.startsWith('system.'));
  console.log('');
  for (const name of COLLECTIONS) {
    if (!names.includes(name)) {
      line(SKIP, `Collection ${name}`, 'not created yet');
      continue;
    }
    const count = await connection.db.collection(name).estimatedDocumentCount();
    line(OK, `Collection ${name}`, `${count} document${count === 1 ? '' : 's'}`);
  }
  const others = names.filter((name) => !COLLECTIONS.includes(name) && !name.startsWith('__travelmate'));
  if (others.length) line(SKIP, 'Other collections in this database', others.join(', '));

  if (!names.includes('destinations') || (await connection.db.collection('destinations').estimatedDocumentCount()) === 0) {
    console.log('\nNext step: run `npm run seed` to load the six destinations and demo accounts.');
  }

  await connection.close();
  finish(0);
}

function finish(code) {
  const failed = results.filter((result) => result.status === BAD).length;
  const passed = results.filter((result) => result.status === OK).length;
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(code);
}

main().catch((error) => {
  console.error('\nUnexpected error during the database check:\n', error);
  process.exit(1);
});

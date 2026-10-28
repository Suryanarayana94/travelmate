const path = require('path');
const mongoose = require('mongoose');

// Load a root .env first, then allow backend/.env to override it.
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * TravelMate stores everything in a MongoDB Atlas cluster.
 *
 * There is exactly one supported database: the cluster referenced by
 * MONGODB_URI. No local server, no container, no in-memory substitute — if the
 * URI is missing the API refuses to serve data and explains how to fix it.
 */

let connectionInfo = {
  mode: 'not-configured',
  provider: 'MongoDB Atlas',
  host: null,
  uri: null,
  database: null,
  ready: false,
  message: 'MONGODB_URI is not configured.'
};

const getMongoUri = () => (process.env.MONGODB_URI || '').trim();

/**
 * Removes credentials from a connection string so it is safe to log or expose
 * through /api/meta/health.
 */
const maskUri = (uri) => {
  if (!uri) return null;
  try {
    const parsed = new URL(uri);
    // Connection strings percent-encode credentials; decode them for display so
    // `%3Cusername%3E` reads as `<username>`.
    const decode = (value) => {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    };
    const auth = parsed.username ? `${decode(parsed.username)}:***@` : '';
    return `${parsed.protocol}//${auth}${parsed.host}${parsed.pathname}`;
  } catch {
    return 'mongodb+srv://***';
  }
};

const describeTarget = (uri) => {
  try {
    const parsed = new URL(uri);
    const host = parsed.host;
    const isAtlas = /\.mongodb\.net$/i.test(host) || uri.startsWith('mongodb+srv://');
    const dbFromPath = parsed.pathname.replace(/^\//, '').split('?')[0];
    return {
      host,
      database: process.env.MONGODB_DB || dbFromPath || 'travelmate',
      provider: isAtlas ? 'MongoDB Atlas' : 'MongoDB'
    };
  } catch {
    return { host: 'unknown', database: 'travelmate', provider: 'MongoDB' };
  }
};

const SETUP_STEPS = [
  'Create a free cluster at https://cloud.mongodb.com',
  'Database Access → add a user with the "Read and write to any database" role',
  'Network Access → add the IP of this machine (run `npm run db:check` to print it)',
  'Database → Connect → Drivers → copy the mongodb+srv:// string',
  'Paste it into .env as MONGODB_URI=..., then restart the API'
];

/**
 * Error thrown when MONGODB_URI is absent or unusable. `details` is safe to
 * send to the browser: it carries setup guidance, never credentials.
 */
class DatabaseConfigError extends Error {
  constructor(message, { code = 'DATABASE_NOT_CONFIGURED', details = {} } = {}) {
    super(message);
    this.name = 'DatabaseConfigError';
    this.code = code;
    this.isOperational = true;
    this.details = { setupSteps: SETUP_STEPS, ...details };
  }
}

/**
 * Turns low-level driver errors into actionable setup guidance. Atlas failures
 * are almost always one of: IP allow-list, bad credentials, or an unencoded
 * password, so the message says so directly.
 */
const explainConnectionError = (error, uri) => {
  const message = String(error?.message || error || '');
  const target = describeTarget(uri);
  const isAtlas = target.provider === 'MongoDB Atlas';
  const hints = [];

  if (/ENOTFOUND|EAI_AGAIN|querySrv/i.test(message)) {
    hints.push(
      'DNS lookup failed. Check the cluster hostname in MONGODB_URI, and make sure this network allows DNS SRV queries' +
        (isAtlas ? ' (Atlas needs `mongodb+srv://` to resolve).' : '.')
    );
  }
  if (/ETIMEDOUT|timeout|Server selection timed out/i.test(message)) {
    hints.push(
      isAtlas
        ? 'Atlas could not be reached. Add the connecting machine to Atlas → Network Access (the public IP of this machine is printed by `npm run db:check`).'
        : 'The server could not be reached. Confirm the host/port are correct.'
    );
  }
  if (/Authentication failed|bad auth|SCRAM|credentials/i.test(message)) {
    hints.push(
      'Authentication failed. Verify the database user and password in MONGODB_URI, and URL-encode special characters in the password (for example @ → %40).'
    );
  }
  if (/Invalid scheme|must begin with mongodb/i.test(message)) {
    hints.push('MONGODB_URI must start with `mongodb+srv://` (Atlas) or `mongodb://`.');
  }
  if (/MongooseServerSelectionError/i.test(error?.name || '')) {
    hints.push(
      'If the cluster is paused or still provisioning, resume it in Atlas and wait for the green Active state.'
    );
  }

  const detail = hints.length ? `${message}\n\nHow to fix it:\n- ${hints.join('\n- ')}` : message;
  const wrapped = new DatabaseConfigError(
    `Could not connect to ${target.provider} at ${target.host}: ${detail}`,
    {
      code: 'DATABASE_UNREACHABLE',
      details: {
        host: target.host,
        provider: target.provider,
        hints
      }
    }
  );
  wrapped.cause = error;
  return wrapped;
};

const buildMongooseOptions = (uri) => {
  const isAtlas = uri.startsWith('mongodb+srv://') || /\.mongodb\.net/i.test(uri);
  return {
    // Atlas clusters can take a while to warm up, especially the free tier.
    serverSelectionTimeoutMS:
      Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) || (isAtlas ? 20000 : 10000),
    connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS) || 20000,
    socketTimeoutMS: 45000,
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE) || 10,
    retryWrites: true,
    ...(isAtlas ? { tls: true } : {})
  };
};

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return connectionInfo;

  const uri = getMongoUri();

  if (!uri) {
    connectionInfo = {
      mode: 'not-configured',
      provider: 'MongoDB Atlas',
      host: null,
      uri: null,
      database: null,
      ready: false,
      message: 'MONGODB_URI is not set. TravelMate only stores data in MongoDB Atlas.'
    };
    throw new DatabaseConfigError(
      'MONGODB_URI is not set. TravelMate stores all data in MongoDB Atlas, so the API cannot start without it.',
      { details: { envFile: path.join(__dirname, '..', '..', '.env') } }
    );
  }

  if (/<password>|<db_password>|<username>|xxxxx/i.test(uri)) {
    connectionInfo = {
      mode: 'not-configured',
      provider: 'MongoDB Atlas',
      host: describeTarget(uri).host,
      uri: maskUri(uri),
      database: describeTarget(uri).database,
      ready: false,
      message: 'MONGODB_URI still contains the Atlas placeholder values.'
    };
    throw new DatabaseConfigError(
      'MONGODB_URI still contains placeholder values. Replace <username> and <password> with your Atlas database user credentials.',
      { code: 'DATABASE_PLACEHOLDER', details: { host: describeTarget(uri).host } }
    );
  }

  const target = describeTarget(uri);
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, buildMongooseOptions(uri));
  } catch (error) {
    const explained = explainConnectionError(error, uri);
    connectionInfo = {
      mode: 'unreachable',
      provider: target.provider,
      host: target.host,
      uri: maskUri(uri),
      database: target.database,
      ready: false,
      message: explained.message.split('\n')[0]
    };
    throw explained;
  }

  if (process.env.MONGODB_DB) {
    // Allows reusing one Atlas cluster for several apps/environments.
    mongoose.connection.useDb(process.env.MONGODB_DB, { useCache: true });
  }

  connectionInfo = {
    mode: target.provider === 'MongoDB Atlas' ? 'mongodb-atlas' : 'mongodb',
    provider: target.provider,
    host: target.host,
    uri: maskUri(uri),
    database: mongoose.connection.name,
    ready: true,
    message: 'Connected'
  };

  console.log(
    `[TravelMate] MongoDB Atlas connected → ${connectionInfo.host}/${mongoose.connection.name}`
  );

  mongoose.connection.on('disconnected', () => {
    console.warn('[TravelMate] MongoDB connection closed — data routes will return 503 until it recovers.');
    connectionInfo = { ...connectionInfo, ready: false, message: 'Connection closed.' };
  });
  mongoose.connection.on('reconnected', () => {
    console.log('[TravelMate] MongoDB reconnected.');
    connectionInfo = { ...connectionInfo, ready: true, message: 'Connected' };
  });

  return connectionInfo;
}

async function disconnectDatabase() {
  await mongoose.disconnect();
  connectionInfo = { ...connectionInfo, ready: false };
}

const getDatabaseInfo = () => ({
  ...connectionInfo,
  state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] ||
    'disconnected'
});

const isDatabaseReady = () => mongoose.connection.readyState === 1;

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getDatabaseInfo,
  isDatabaseReady,
  getMongoUri,
  maskUri,
  describeTarget,
  explainConnectionError,
  DatabaseConfigError,
  SETUP_STEPS
};

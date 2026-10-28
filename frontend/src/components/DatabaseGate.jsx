import { useCallback, useEffect, useState } from 'react';
import { DatabaseZap, RefreshCw, Terminal, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const REFRESH_MS = 6000;

const STEPS = [
  {
    title: 'Create a free cluster',
    body: 'Sign in at cloud.mongodb.com and create an M0 cluster — it is free and takes about three minutes.'
  },
  {
    title: 'Add a database user',
    body: 'Database Access → Add New Database User. Give it the “Read and write to any database” role.'
  },
  {
    title: 'Allow this machine',
    body: 'Network Access → Add IP Address. Use the IP printed by npm run db:check (0.0.0.0/0 while testing).'
  },
  {
    title: 'Paste the connection string',
    body: 'Database → Connect → Drivers, then set MONGODB_URI in the project’s .env file and restart the API.'
  }
];

/**
 * TravelMate reads and writes everything in MongoDB Atlas. Until that cluster is
 * reachable there is nothing meaningful to show, so this gate replaces the app
 * with setup instructions instead of a screen full of failing requests.
 */
const DatabaseGate = ({ children }) => {
  const [status, setStatus] = useState({ phase: 'loading', database: null });
  const [refreshing, setRefreshing] = useState(false);

  const check = useCallback(async ({ manual = false } = {}) => {
    if (manual) setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE}/meta/health`);
      const payload = await response.json();
      const database = payload?.data?.database || null;
      setStatus({
        phase: database?.state === 'connected' ? 'connected' : 'disconnected',
        database
      });
    } catch {
      setStatus({ phase: 'offline', database: null });
    } finally {
      if (manual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    check();
    const timer = setInterval(() => check(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [check]);

  if (status.phase === 'connected') return children;

  if (status.phase === 'loading') {
    return (
      <div className="db-gate db-gate--loading">
        <div className="db-gate-spinner" aria-hidden="true" />
        <p>Checking the MongoDB Atlas connection…</p>
      </div>
    );
  }

  const database = status.database;
  const offline = status.phase === 'offline';
  const notConfigured = database?.mode === 'not-configured';

  return (
    <div className="db-gate">
      <div className="db-gate-card">
        <header className="db-gate-head">
          <span className="db-gate-icon" aria-hidden="true">
            <DatabaseZap size={26} strokeWidth={2} />
          </span>
          <div>
            <p className="db-gate-eyebrow">TravelMate · setup</p>
            <h1>Connect MongoDB Atlas</h1>
            <p className="db-gate-lede">
              Accounts, destinations, trip estimates and bookings are all stored in MongoDB Atlas.
              No cluster is connected yet, so the app is showing this setup screen instead of empty
              data.
            </p>
          </div>
        </header>

        <div className={`db-gate-status ${offline ? 'is-offline' : 'is-pending'}`}>
          {offline ? <AlertTriangle size={17} /> : <AlertTriangle size={17} />}
          <div>
            <strong>{offline ? 'API not reachable' : notConfigured ? 'MONGODB_URI is not set' : 'Atlas cluster unreachable'}</strong>
            <span>
              {offline
                ? 'Start the backend with npm run dev, then this screen will retry automatically.'
                : notConfigured
                  ? 'Paste your cluster’s mongodb+srv:// string into .env as MONGODB_URI, then restart the API.'
                  : database?.message || 'The API is running, but it cannot reach the cluster.'}
            </span>
            {!offline && database?.host ? <code>{database.host}{database.database ? `/${database.database}` : ''}</code> : null}
          </div>
        </div>

        <ol className="db-gate-steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="db-gate-step-number">{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="db-gate-commands">
          <p><Terminal size={15} /> After pasting the URI into <code>.env</code>, run:</p>
          <pre><code>{`cp .env.example .env   # if .env does not exist yet
npm run db:check       # verify DNS, auth, IP allow-list, read + write
npm run seed           # load 6 destinations and the demo accounts
npm run dev            # API + web app`}</code></pre>
        </div>

        <footer className="db-gate-actions">
          <button type="button" className="btn btn-primary" onClick={() => check({ manual: true })} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'is-spinning' : undefined} />
            {refreshing ? 'Checking…' : 'Retry connection'}
          </button>
          <a
            className="btn btn-outline"
            href="https://cloud.mongodb.com"
            target="_blank"
            rel="noreferrer noopener"
          >
            Open MongoDB Atlas <ExternalLink size={15} />
          </a>
          <span className="db-gate-hint">
            <CheckCircle2 size={15} /> This screen disappears as soon as the cluster answers.
          </span>
        </footer>
      </div>

      <p className="db-gate-footnote">
        Full walkthrough: <code>README.md → Connect MongoDB Atlas</code> · connection doctor:{' '}
        <code>npm run db:check</code>
      </p>
    </div>
  );
};

export default DatabaseGate;

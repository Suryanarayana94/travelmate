const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/errors');
const { requireDatabase } = require('./middleware/database');

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // The proxied Vite preview and localhost are allowed in development.
      if (process.env.NODE_ENV !== 'production' && /\.e2b\.app$/.test(new URL(origin).hostname || '')) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    fallthrough: false,
    maxAge: '7d',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
  })
);

if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'TravelMate API',
    version: '1.0.0',
    endpoints: ['/api/meta', '/api/auth', '/api/destinations', '/api/trips', '/api/services', '/api/bookings', '/api/dashboard']
  });
});

// Meta routes stay reachable so the UI can explain why the database is offline.
app.use('/api/meta', require('./routes/metaRoutes'));

// Every other endpoint needs the Atlas cluster.
app.use('/api', requireDatabase);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/destinations', require('./routes/destinationRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;

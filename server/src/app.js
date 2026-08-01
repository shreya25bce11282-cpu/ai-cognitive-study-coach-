require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const sessionRoutes = require('./routes/sessionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// ─── Security Middleware ────────────────────────────────────
app.use(helmet());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    optionsSuccessStatus: 200,
  })
);

// ─── Body parsing & logging ─────────────────────────────────
app.use(express.json({ limit: '16kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── Health check ───────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Global error handler ───────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
});

// ─── Start ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;
app.listen(PORT, () => {
  console.log(`✓  Server running on http://localhost:${PORT}`);
});
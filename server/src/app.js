require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const sessionRoutes = require('./routes/sessionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const goalsRoutes = require('./routes/goalsRoutes');

const app = express();

// ─── Request ID (tracing) ───────────────────────────────────
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// ─── Security Middleware ────────────────────────────────────
app.use(helmet());

if (process.env.NODE_ENV === 'production') {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
    })
  );
}

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'DELETE'],
    optionsSuccessStatus: 200,
  })
);

// ─── Body parsing & logging ─────────────────────────────────
app.use(express.json({ limit: '16kb' }));
morgan.token('id', (req) => req.requestId);
app.use(
  morgan(
    process.env.NODE_ENV === 'production'
      ? ':id :method :url :status :res[content-length] - :response-time ms'
      : ':id :method :url :status - :response-time ms'
  )
);

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/goals', goalsRoutes);

// ─── Health check ───────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', ai_enabled: Boolean(process.env.GEMINI_API_KEY) })
);

// ─── 404 ────────────────────────────────────────────────────
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// ─── Global error handler ───────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(`[${req.requestId}]`, err);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    request_id: req.requestId,
  });
});

// ─── Start ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;
const server = app.listen(PORT, () => {
  console.log(`✓  Server running on http://localhost:${PORT}`);
  console.log(
    process.env.GEMINI_API_KEY
      ? '✓  AI features enabled (Gemini key detected)'
      : '⚠  AI features disabled — set GEMINI_API_KEY in .env to enable'
  );
});

// ─── Graceful shutdown ───────────────────────────────────────
function shutdown(signal) {
  console.log(`\n${signal} received. Closing server gracefully...`);
  server.close(() => {
    console.log('✓  HTTP server closed');
    const db = require('./db/db');
    db.pool
      .end()
      .then(() => {
        console.log('✓  Database pool closed');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Error closing database pool', err);
        process.exit(1);
      });
  });
  // Force-exit if graceful close hangs
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
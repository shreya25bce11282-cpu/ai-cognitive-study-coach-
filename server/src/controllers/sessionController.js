const db = require('../db/db');

// GET /api/sessions — list all sessions, newest first
async function listSessions(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT id, subject, started_at, ended_at, duration_min,
              focus_rating, fatigue_rating, created_at
       FROM study_sessions
       ORDER BY started_at DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/sessions/start — start a new session
async function startSession(req, res, next) {
  try {
    const { subject } = req.body;
    const { rows } = await db.query(
      `INSERT INTO study_sessions (subject, started_at)
       VALUES ($1, NOW())
       RETURNING id, subject, started_at`,
      [subject]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/sessions/end — end an existing session
async function endSession(req, res, next) {
  try {
    const { session_id, focus_rating, fatigue_rating } = req.body;

    const { rows } = await db.query(
      `UPDATE study_sessions
       SET ended_at       = NOW(),
           duration_min   = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60.0,
           focus_rating   = $1,
           fatigue_rating = $2
       WHERE id = $3 AND ended_at IS NULL
       RETURNING *`,
      [focus_rating, fatigue_rating, session_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Session not found or already ended' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listSessions, startSession, endSession };
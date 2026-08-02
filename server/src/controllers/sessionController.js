const db = require('../db/db');
const gamification = require('../services/gamificationService');

// GET /api/sessions — list all sessions, newest first
async function listSessions(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT id, subject, started_at, ended_at, duration_min,
              focus_rating, fatigue_rating, notes, tags, pomodoro_count,
              xp_earned, mode, created_at
       FROM study_sessions
       ORDER BY started_at DESC
       LIMIT 200`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/sessions/start — start a new session
async function startSession(req, res, next) {
  try {
    const { subject, mode } = req.body;
    const { rows } = await db.query(
      `INSERT INTO study_sessions (subject, started_at, mode)
       VALUES ($1, NOW(), $2)
       RETURNING id, subject, started_at, mode`,
      [subject, mode || 'classic']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/sessions/end — end an existing session
async function endSession(req, res, next) {
  try {
    const { session_id, focus_rating, fatigue_rating, notes, tags, pomodoro_count } = req.body;

    const { rows } = await db.query(
      `UPDATE study_sessions
       SET ended_at       = NOW(),
           duration_min   = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60.0,
           focus_rating   = $1,
           fatigue_rating = $2,
           notes          = COALESCE($3, notes),
           tags           = COALESCE($4, tags),
           pomodoro_count = COALESCE($5, pomodoro_count)
       WHERE id = $6 AND ended_at IS NULL
       RETURNING *`,
      [focus_rating, fatigue_rating, notes ?? null, tags ?? null, pomodoro_count ?? null, session_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Session not found or already ended' });
    }

    const session = rows[0];

    // ─── Gamification: XP + streak + achievements ───────────
    let gamificationResult = null;
    let newlyUnlocked = [];
    try {
      gamificationResult = await gamification.updateStatsAfterSession({
        durationMin: session.duration_min,
        focusRating: session.focus_rating,
        startedAt: session.started_at,
      });

      await db.query('UPDATE study_sessions SET xp_earned = $1 WHERE id = $2', [
        gamificationResult.xpEarned,
        session.id,
      ]);
      session.xp_earned = gamificationResult.xpEarned;

      newlyUnlocked = await gamification.checkAchievements();
    } catch (gamErr) {
      // Don't fail the session save if gamification bookkeeping hiccups
      console.error('Gamification update failed:', gamErr.message);
    }

    res.json({ ...session, gamification: gamificationResult, newly_unlocked: newlyUnlocked });
  } catch (err) {
    next(err);
  }
}

module.exports = { listSessions, startSession, endSession };
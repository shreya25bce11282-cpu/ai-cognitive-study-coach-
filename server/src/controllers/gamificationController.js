const db = require('../db/db');
const gamification = require('../services/gamificationService');

// GET /api/gamification/stats — streak, XP, level, progress
async function getStats(req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM user_stats WHERE id = 1');
    const stats = rows[0] || {
      current_streak: 0,
      longest_streak: 0,
      total_xp: 0,
      level: 1,
      last_study_date: null,
    };
    const progress = gamification.xpProgress(stats.total_xp);
    res.json({ ...stats, ...progress });
  } catch (err) {
    next(err);
  }
}

// GET /api/gamification/achievements — all achievement defs with lock state
async function getAchievements(req, res, next) {
  try {
    await gamification.ensureAchievementDefs();
    const { rows } = await db.query(
      `SELECT achievement_key, title, description, icon, unlocked_at
       FROM achievements
       ORDER BY (unlocked_at IS NULL), unlocked_at DESC NULLS LAST, id ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/gamification/streak — just the streak numbers
async function getStreak(req, res, next) {
  try {
    const { rows } = await db.query(
      'SELECT current_streak, longest_streak, last_study_date FROM user_stats WHERE id = 1'
    );
    res.json(rows[0] || { current_streak: 0, longest_streak: 0, last_study_date: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats, getAchievements, getStreak };
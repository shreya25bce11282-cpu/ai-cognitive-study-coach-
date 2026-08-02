const db = require('../db/db');

// GET /api/goals — list active goals
async function listGoals(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT id, subject, weekly_hours_target, created_at, active
       FROM study_goals
       WHERE active = TRUE
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/goals — { subject, weekly_hours_target }
async function createGoal(req, res, next) {
  try {
    const { subject, weekly_hours_target } = req.body;
    const { rows } = await db.query(
      `INSERT INTO study_goals (subject, weekly_hours_target)
       VALUES ($1, $2)
       RETURNING *`,
      [subject, weekly_hours_target]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/goals/:id — deactivate a goal
async function deleteGoal(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `UPDATE study_goals SET active = FALSE WHERE id = $1 RETURNING id`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    res.json({ deleted: true, id: rows[0].id });
  } catch (err) {
    next(err);
  }
}

// GET /api/goals/progress — weekly hours studied vs target, per active goal
async function getProgress(req, res, next) {
  try {
    const { rows: goals } = await db.query(
      `SELECT id, subject, weekly_hours_target FROM study_goals WHERE active = TRUE`
    );

    const results = [];
    for (const goal of goals) {
      const { rows } = await db.query(
        `SELECT COALESCE(ROUND(SUM(duration_min) / 60.0, 2), 0) AS hours_studied
         FROM study_sessions
         WHERE ended_at IS NOT NULL
           AND LOWER(subject) = LOWER($1)
           AND started_at >= date_trunc('week', NOW())`,
        [goal.subject]
      );
      const hoursStudied = parseFloat(rows[0].hours_studied);
      const target = parseFloat(goal.weekly_hours_target);
      results.push({
        ...goal,
        hours_studied: hoursStudied,
        percent_complete: target > 0 ? Math.min(100, Math.round((hoursStudied / target) * 100)) : 0,
      });
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = { listGoals, createGoal, deleteGoal, getProgress };
const db = require('../db/db');

// GET /api/analytics/summary
async function getSummary(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT
        COUNT(*)::int                                          AS total_sessions,
        COALESCE(ROUND(SUM(duration_min) / 60.0, 1), 0)       AS total_hours,
        COALESCE(ROUND(AVG(duration_min), 1), 0)               AS avg_session_min,
        COALESCE(ROUND(AVG(focus_rating), 1), 0)               AS avg_focus,
        COALESCE(ROUND(AVG(fatigue_rating), 1), 0)             AS avg_fatigue
      FROM study_sessions
      WHERE ended_at IS NOT NULL
    `);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/fatigue
async function getFatigue(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT
        COALESCE(ROUND(AVG(duration_min), 1), 0) AS avg_duration_before_fatigue,
        COALESCE(ROUND(AVG(fatigue_rating), 1), 0) AS avg_fatigue_level
      FROM study_sessions
      WHERE ended_at IS NOT NULL AND fatigue_rating >= 6
    `);

    const allSessions = await db.query(`
      SELECT
        COALESCE(ROUND(AVG(duration_min), 1), 0) AS avg_session_duration,
        COALESCE(ROUND(AVG(fatigue_rating), 1), 0) AS overall_avg_fatigue
      FROM study_sessions
      WHERE ended_at IS NOT NULL
    `);

    res.json({
      high_fatigue_sessions: rows[0],
      overall: allSessions.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/burnout-risk
async function getBurnoutRisk(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT
        COUNT(*)::int                                   AS recent_sessions,
        COALESCE(AVG(fatigue_rating), 0)                AS avg_fatigue,
        COALESCE(AVG(focus_rating), 0)                  AS avg_focus,
        COALESCE(AVG(duration_min), 0)                  AS avg_duration,
        COALESCE(SUM(duration_min), 0)                  AS total_min
      FROM study_sessions
      WHERE ended_at IS NOT NULL
        AND started_at >= NOW() - INTERVAL '7 days'
    `);

    const stats = rows[0];
    const sessions = parseInt(stats.recent_sessions);
    const avgFatigue = parseFloat(stats.avg_fatigue);
    const avgFocus = parseFloat(stats.avg_focus);
    const totalMin = parseFloat(stats.total_min);

    // Burnout score: weighted composite 0-100
    let score = 0;
    if (sessions > 0) {
      const fatigueComponent = (avgFatigue / 10) * 40;
      const focusDecline = ((10 - avgFocus) / 10) * 25;
      const volumeComponent = Math.min(totalMin / 1200, 1) * 20;
      const frequencyComponent = Math.min(sessions / 21, 1) * 15;
      score = Math.round(fatigueComponent + focusDecline + volumeComponent + frequencyComponent);
    }

    let risk = 'LOW';
    if (score >= 60) risk = 'HIGH';
    else if (score >= 35) risk = 'MEDIUM';

    res.json({
      risk,
      score,
      recent_sessions: sessions,
      avg_fatigue: avgFatigue.toFixed(1),
      avg_focus: avgFocus.toFixed(1),
      total_hours_this_week: (totalMin / 60).toFixed(1),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/break-recommendation
async function getBreakRecommendation(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT fatigue_rating, duration_min, ended_at
      FROM study_sessions
      WHERE ended_at IS NOT NULL
      ORDER BY ended_at DESC
      LIMIT 1
    `);

    if (rows.length === 0) {
      return res.json({
        break_min: 5,
        reason: 'No sessions recorded yet. Start with a short break before your first session!',
      });
    }

    const last = rows[0];
    const fatigue = parseInt(last.fatigue_rating);
    const duration = parseFloat(last.duration_min);
    const minutesSinceEnd = last.ended_at
      ? (Date.now() - new Date(last.ended_at).getTime()) / 60000
      : 0;

    let breakMin;
    if (fatigue >= 8)      breakMin = 30;
    else if (fatigue >= 6) breakMin = 20;
    else if (fatigue >= 4) breakMin = 10;
    else                   breakMin = 5;

    if (duration > 90) breakMin += 10;
    else if (duration > 60) breakMin += 5;

    breakMin = Math.max(0, breakMin - Math.floor(minutesSinceEnd));

    const reason = breakMin === 0
      ? `You've rested enough (${Math.round(minutesSinceEnd)} min). Ready to study!`
      : `Based on fatigue ${fatigue}/10 after ${Math.round(duration)} min, rest ${breakMin} more min.`;

    res.json({ break_min: breakMin, reason });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/best-time
async function getBestTime(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT
        EXTRACT(HOUR FROM started_at)::int AS hour,
        ROUND(AVG(focus_rating), 2)        AS avg_focus,
        ROUND(AVG(fatigue_rating), 2)      AS avg_fatigue,
        COUNT(*)::int                      AS session_count
      FROM study_sessions
      WHERE ended_at IS NOT NULL
      GROUP BY EXTRACT(HOUR FROM started_at)
      ORDER BY avg_focus DESC, avg_fatigue ASC
    `);

    const best = rows[0] || null;
    res.json({
      best_hour: best ? best.hour : null,
      best_hour_label: best ? `${best.hour}:00 – ${best.hour + 1}:00` : 'No data',
      hourly_breakdown: rows,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/predict-session?subject=X
async function predictSession(req, res, next) {
  try {
    const { subject } = req.query;
    const { rows } = await db.query(`
      SELECT duration_min, focus_rating
      FROM study_sessions
      WHERE ended_at IS NOT NULL
        AND LOWER(subject) = LOWER($1)
        AND focus_rating >= 7
      ORDER BY started_at DESC
      LIMIT 20
    `, [subject]);

    if (rows.length < 2) {
      return res.json({
        subject,
        predicted_optimal_min: 45,
        confidence: 'low',
        note: 'Not enough high-focus sessions to predict. Defaulting to 45 min.',
      });
    }

    const durations = rows.map((r) => parseFloat(r.duration_min));
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

    res.json({
      subject,
      predicted_optimal_min: Math.round(avg),
      confidence: rows.length >= 10 ? 'high' : 'medium',
      based_on_sessions: rows.length,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/optimal-session?subject=X
async function optimalSession(req, res, next) {
  try {
    const { subject } = req.query;
    const { rows } = await db.query(`
      SELECT
        ROUND(AVG(duration_min), 1)   AS optimal_duration_min,
        ROUND(AVG(focus_rating), 1)   AS avg_focus_at_optimal,
        COUNT(*)::int                 AS session_count
      FROM study_sessions
      WHERE ended_at IS NOT NULL
        AND LOWER(subject) = LOWER($1)
        AND focus_rating = (
          SELECT MAX(focus_rating)
          FROM study_sessions
          WHERE ended_at IS NOT NULL AND LOWER(subject) = LOWER($1)
        )
    `, [subject, subject]);

    res.json({ subject, ...rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/subject-performance
async function subjectPerformance(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT
        subject,
        COUNT(*)::int                       AS sessions,
        ROUND(AVG(focus_rating), 1)         AS avg_focus,
        ROUND(AVG(fatigue_rating), 1)       AS avg_fatigue,
        ROUND(AVG(duration_min), 1)         AS avg_duration_min,
        ROUND(SUM(duration_min) / 60.0, 1)  AS total_hours
      FROM study_sessions
      WHERE ended_at IS NOT NULL
      GROUP BY subject
      ORDER BY avg_focus DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/recommend-study-plan
async function recommendStudyPlan(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT
        CASE
          WHEN duration_min < 30 THEN '< 30 min'
          WHEN duration_min BETWEEN 30 AND 60 THEN '30-60 min'
          WHEN duration_min BETWEEN 60 AND 90 THEN '60-90 min'
          ELSE '> 90 min'
        END AS duration_bucket,
        ROUND(AVG(focus_rating), 2) AS avg_focus,
        ROUND(AVG(fatigue_rating), 2) AS avg_fatigue,
        COUNT(*)::int AS session_count
      FROM study_sessions
      WHERE ended_at IS NOT NULL
      GROUP BY duration_bucket
      ORDER BY avg_focus DESC
    `);

    const bestBucket = rows[0] || null;

    const overall = await db.query(`
      SELECT
        ROUND(AVG(duration_min), 0) AS recommended_length_min,
        ROUND(AVG(focus_rating), 1) AS expected_focus
      FROM study_sessions
      WHERE ended_at IS NOT NULL AND focus_rating >= 7
    `);

    res.json({
      recommended_session_length_min: overall.rows[0]?.recommended_length_min || 45,
      expected_focus: overall.rows[0]?.expected_focus || null,
      best_duration_bucket: bestBucket,
      all_buckets: rows,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/weekly-trends — 4-week rolling focus/fatigue averages
async function getWeeklyTrends(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT
        date_trunc('week', started_at)::date AS week_start,
        ROUND(AVG(focus_rating), 2)          AS avg_focus,
        ROUND(AVG(fatigue_rating), 2)        AS avg_fatigue,
        COUNT(*)::int                        AS session_count,
        ROUND(SUM(duration_min) / 60.0, 1)   AS total_hours
      FROM study_sessions
      WHERE ended_at IS NOT NULL
        AND started_at >= NOW() - INTERVAL '28 days'
      GROUP BY week_start
      ORDER BY week_start ASC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/heatmap — daily study minutes for the last 90 days
async function getHeatmapData(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT
        started_at::date                   AS day,
        ROUND(SUM(duration_min), 0)::int   AS minutes,
        COUNT(*)::int                      AS session_count
      FROM study_sessions
      WHERE ended_at IS NOT NULL
        AND started_at >= NOW() - INTERVAL '90 days'
      GROUP BY day
      ORDER BY day ASC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/focus-decay — duration vs focus scatter data
async function getFocusDecayCurve(req, res, next) {
  try {
    const { rows } = await db.query(`
      SELECT
        ROUND(duration_min, 0)::int AS duration_min,
        focus_rating,
        subject
      FROM study_sessions
      WHERE ended_at IS NOT NULL
        AND duration_min IS NOT NULL
        AND focus_rating IS NOT NULL
      ORDER BY duration_min ASC
      LIMIT 300
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getFatigue,
  getBurnoutRisk,
  getBreakRecommendation,
  getBestTime,
  predictSession,
  optimalSession,
  subjectPerformance,
  recommendStudyPlan,
  getWeeklyTrends,
  getHeatmapData,
  getFocusDecayCurve,
};
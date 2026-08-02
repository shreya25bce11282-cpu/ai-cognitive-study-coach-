const db = require('../db/db');

// XP formula: duration (min) weighted by focus quality, scaled by 10
function calculateXp(durationMin, focusRating) {
  const duration = parseFloat(durationMin) || 0;
  const focus = parseFloat(focusRating) || 5;
  return Math.max(0, Math.round(duration * (focus / 5) * 10));
}

// Logarithmic level curve: level N requires roughly N^2 * 50 XP cumulatively
function levelFromXp(totalXp) {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp && level < 50) level += 1;
  return level;
}

function xpForLevel(level) {
  return Math.round(50 * Math.pow(level - 1, 2));
}

function xpProgress(totalXp) {
  const level = levelFromXp(totalXp);
  const currentFloor = xpForLevel(level);
  const nextCeiling = level >= 50 ? currentFloor : xpForLevel(level + 1);
  const span = Math.max(1, nextCeiling - currentFloor);
  const progress = Math.min(1, (totalXp - currentFloor) / span);
  return { level, currentFloor, nextCeiling, progress };
}

const ACHIEVEMENT_DEFS = [
  {
    key: 'first_session',
    title: 'First Session',
    description: 'Complete your very first study session.',
    icon: '🌱',
  },
  {
    key: 'streak_7',
    title: '7-Day Streak',
    description: 'Study on 7 consecutive days.',
    icon: '🔥',
  },
  {
    key: 'night_owl',
    title: 'Night Owl',
    description: 'Complete 10 sessions started after 10pm.',
    icon: '🦉',
  },
  {
    key: 'marathon',
    title: 'Marathon',
    description: 'Complete a single session of 90+ minutes.',
    icon: '🏃',
  },
  {
    key: 'zen_master',
    title: 'Zen Master',
    description: 'Average focus of 8+ across your last 20 sessions.',
    icon: '🧘',
  },
];

// Ensure achievement rows exist (idempotent upsert of definitions)
async function ensureAchievementDefs() {
  for (const def of ACHIEVEMENT_DEFS) {
    await db.query(
      `INSERT INTO achievements (achievement_key, title, description, icon, criteria)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (achievement_key) DO NOTHING`,
      [def.key, def.title, def.description, def.icon, JSON.stringify({})]
    );
  }
}

// Updates streak + XP for a just-completed session, returns updated stats
async function updateStatsAfterSession({ durationMin, focusRating, startedAt }) {
  const xpEarned = calculateXp(durationMin, focusRating);
  const sessionDate = new Date(startedAt);
  const sessionDay = sessionDate.toISOString().slice(0, 10);

  const { rows } = await db.query('SELECT * FROM user_stats WHERE id = 1');
  let stats = rows[0];
  if (!stats) {
    await db.query(
      `INSERT INTO user_stats (id, current_streak, longest_streak, total_xp, level)
       VALUES (1, 0, 0, 0, 1)`
    );
    const again = await db.query('SELECT * FROM user_stats WHERE id = 1');
    stats = again.rows[0];
  }

  let { current_streak: currentStreak, longest_streak: longestStreak, total_xp: totalXp, last_study_date: lastStudyDate } = stats;

  const lastDay = lastStudyDate ? new Date(lastStudyDate).toISOString().slice(0, 10) : null;

  if (lastDay === sessionDay) {
    // same day, streak unchanged
  } else {
    const yesterday = new Date(sessionDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (lastDay === yesterdayStr) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);
  totalXp += xpEarned;
  const { level } = xpProgress(totalXp);

  await db.query(
    `UPDATE user_stats
     SET current_streak = $1, longest_streak = $2, total_xp = $3, level = $4,
         last_study_date = $5, updated_at = NOW()
     WHERE id = 1`,
    [currentStreak, longestStreak, totalXp, level, sessionDay]
  );

  return { xpEarned, currentStreak, longestStreak, totalXp, level };
}

async function checkAchievements() {
  await ensureAchievementDefs();
  const unlocked = [];

  const { rows: statsRows } = await db.query('SELECT * FROM user_stats WHERE id = 1');
  const stats = statsRows[0] || {};

  const { rows: sessions } = await db.query(
    `SELECT id, duration_min, focus_rating, started_at
     FROM study_sessions
     WHERE ended_at IS NOT NULL
     ORDER BY started_at DESC
     LIMIT 200`
  );

  const checks = {
    first_session: sessions.length >= 1,
    streak_7: (stats.current_streak || 0) >= 7,
    marathon: sessions.some((s) => parseFloat(s.duration_min) >= 90),
    night_owl:
      sessions.filter((s) => new Date(s.started_at).getHours() >= 22).length >= 10,
    zen_master: (() => {
      const last20 = sessions.slice(0, 20);
      if (last20.length < 20) return false;
      const avg =
        last20.reduce((sum, s) => sum + (parseFloat(s.focus_rating) || 0), 0) / last20.length;
      return avg >= 8;
    })(),
  };

  for (const [key, met] of Object.entries(checks)) {
    if (!met) continue;
    const { rows } = await db.query(
      `UPDATE achievements SET unlocked_at = NOW()
       WHERE achievement_key = $1 AND unlocked_at IS NULL
       RETURNING *`,
      [key]
    );
    if (rows.length > 0) unlocked.push(rows[0]);
  }

  return unlocked;
}

module.exports = {
  calculateXp,
  levelFromXp,
  xpForLevel,
  xpProgress,
  ensureAchievementDefs,
  updateStatsAfterSession,
  checkAchievements,
  ACHIEVEMENT_DEFS,
};
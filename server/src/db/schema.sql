-- AI Cognitive Study Coach — Database Schema
-- Run: psql -d studycoach -f server/src/db/schema.sql
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS everywhere.

CREATE TABLE IF NOT EXISTS study_sessions (
  id             SERIAL PRIMARY KEY,
  subject        VARCHAR(100) NOT NULL,
  started_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ended_at       TIMESTAMPTZ,
  duration_min   NUMERIC(6,2),
  focus_rating   INTEGER      CHECK (focus_rating   BETWEEN 1 AND 10),
  fatigue_rating INTEGER      CHECK (fatigue_rating BETWEEN 1 AND 10),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON study_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_subject    ON study_sessions(subject);

-- ─── V2: Pomodoro / Notes / Tags / XP columns on study_sessions ──────────
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS notes           TEXT;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS tags            VARCHAR(255)[] DEFAULT '{}';
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS pomodoro_count  INTEGER DEFAULT 0;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS xp_earned       INTEGER DEFAULT 0;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS mode            VARCHAR(20) DEFAULT 'classic';

CREATE INDEX IF NOT EXISTS idx_sessions_tags ON study_sessions USING GIN (tags);

-- ─── V2: Gamification ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_stats (
  id             SERIAL PRIMARY KEY,
  current_streak INTEGER      NOT NULL DEFAULT 0,
  longest_streak INTEGER      NOT NULL DEFAULT 0,
  total_xp       INTEGER      NOT NULL DEFAULT 0,
  level          INTEGER      NOT NULL DEFAULT 1,
  last_study_date DATE,
  streak_freezes INTEGER      NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Single-row table for this single-user app. Seed it if empty.
INSERT INTO user_stats (id, current_streak, longest_streak, total_xp, level)
SELECT 1, 0, 0, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM user_stats WHERE id = 1);

CREATE TABLE IF NOT EXISTS achievements (
  id              SERIAL PRIMARY KEY,
  achievement_key VARCHAR(50) UNIQUE NOT NULL,
  title           VARCHAR(120) NOT NULL,
  description     VARCHAR(255) NOT NULL,
  icon            VARCHAR(10)  NOT NULL,
  unlocked_at     TIMESTAMPTZ,
  criteria        JSONB
);

-- ─── V2: Study Goals ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_goals (
  id                  SERIAL PRIMARY KEY,
  subject             VARCHAR(100) NOT NULL,
  weekly_hours_target NUMERIC(5,2) NOT NULL,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  active              BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_goals_active ON study_goals(active);
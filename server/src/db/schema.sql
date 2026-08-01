-- AI Cognitive Study Coach — Database Schema
-- Run: psql -d studycoach -f server/src/db/schema.sql

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
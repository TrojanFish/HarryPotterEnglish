-- ====================================================================
-- Hogwarts Audio English · Cloudflare D1 Serverless Database Schema
-- Run via: wrangler d1 execute <database-name> --file=./d1/schema.sql
-- ====================================================================

-- 1. User Vocabulary Table (with SRS & Soft Deletion)
CREATE TABLE IF NOT EXISTS user_vocab (
  user_id           TEXT NOT NULL,              -- Device Anonymous ID or User Passcode ID
  word              TEXT NOT NULL,              -- English word (normalized lowercase)
  phonetic          TEXT,                       -- Phonetic string (e.g. /ˈluːmɒs/)
  pos               TEXT,                       -- Part of speech (n., v., adj.)
  translation       TEXT NOT NULL,              -- Chinese meaning
  definition        TEXT,                       -- English short definition
  context_sentence  TEXT,                       -- Example sentence from book
  context_audio_key TEXT,                       -- Audio key corresponding to sentence
  srs_box           INTEGER NOT NULL DEFAULT 1, -- Leitner Box (1~5)
  next_review_at    INTEGER NOT NULL DEFAULT 0, -- Next review timestamp in milliseconds
  review_count      INTEGER NOT NULL DEFAULT 0, -- Total review count
  correct_count     INTEGER NOT NULL DEFAULT 0, -- Successful review count
  is_deleted        INTEGER NOT NULL DEFAULT 0, -- Soft delete flag (0 = active, 1 = deleted)
  updated_at        INTEGER NOT NULL,           -- Last updated timestamp in milliseconds
  created_at        INTEGER NOT NULL,           -- First recorded timestamp in milliseconds
  PRIMARY KEY (user_id, word)
);

CREATE INDEX IF NOT EXISTS idx_user_vocab_sync ON user_vocab (user_id, updated_at);

-- 2. User Daily Learning Analytics Table
CREATE TABLE IF NOT EXISTS user_analytics (
  user_id           TEXT NOT NULL,              -- User Passcode ID
  date_str          TEXT NOT NULL,              -- Date string ('YYYY-MM-DD')
  listening_seconds INTEGER NOT NULL DEFAULT 0, -- Total listening seconds for the day
  completed_goal    INTEGER NOT NULL DEFAULT 0, -- 5-minute habit completed (0 or 1)
  streak_days       INTEGER NOT NULL DEFAULT 0, -- Current streak count as of date
  time_turners      INTEGER NOT NULL DEFAULT 1, -- Remaining Time-Turners
  day_summary_json  TEXT,                       -- JSON string of chapters and errors
  updated_at        INTEGER NOT NULL,           -- Last updated timestamp in milliseconds
  PRIMARY KEY (user_id, date_str)
);

CREATE INDEX IF NOT EXISTS idx_user_analytics_sync ON user_analytics (user_id, updated_at);

-- 3. Device & Pairing Code Mapping Table
CREATE TABLE IF NOT EXISTS user_devices (
  device_id         TEXT PRIMARY KEY,           -- Unique UUID generated on client
  user_id           TEXT NOT NULL,              -- Associated User Passcode ID
  sync_code         TEXT NOT NULL,              -- 6-character human-friendly sync passcode (e.g. 'HP-7892')
  platform          TEXT,                       -- iOS / Android / Desktop / Web
  last_synced_at    INTEGER NOT NULL DEFAULT 0, -- Last successful sync timestamp
  created_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_devices_code ON user_devices (sync_code);
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices (user_id);

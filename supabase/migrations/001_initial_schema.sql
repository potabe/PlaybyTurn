-- ============================================================
-- Migration: 001_initial_schema
-- Description: Core tables for UrTurn MVP
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE session_status AS ENUM ('SETUP', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE sport_type     AS ENUM ('PADEL', 'BADMINTON', 'TENNIS', 'TABLE_TENNIS');
CREATE TYPE format_type    AS ENUM ('SINGLES', 'FIXED_DOUBLES', 'MIXED_DOUBLES', 'AMERICANO');
CREATE TYPE gender_type    AS ENUM ('MALE', 'FEMALE');
CREATE TYPE match_status   AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE winning_team   AS ENUM ('TEAM1', 'TEAM2');

-- ============================================================
-- PROFILES (extends Supabase Auth users)
-- ============================================================

CREATE TABLE profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SESSIONS
-- ============================================================

CREATE TABLE sessions (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id    UUID           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT           NOT NULL,
  sport           sport_type     NOT NULL,
  format          format_type    NOT NULL,
  status          session_status NOT NULL DEFAULT 'SETUP',
  spectator_code  TEXT           NOT NULL UNIQUE,  -- 6-char alphanumeric short code
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PLAYERS (session-scoped roster)
-- ============================================================

CREATE TABLE players (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name                 TEXT        NOT NULL,
  gender               gender_type NOT NULL,
  matches_played       INT         NOT NULL DEFAULT 0,
  matches_won          INT         NOT NULL DEFAULT 0,
  points_won           INT         NOT NULL DEFAULT 0,
  point_differential   INT         NOT NULL DEFAULT 0,
  last_played_at       TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COURTS
-- ============================================================

CREATE TABLE courts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MATCHES
-- ============================================================

CREATE TABLE matches (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  court_id           UUID         REFERENCES courts(id),
  round_number       INT          NOT NULL DEFAULT 1,
  status             match_status NOT NULL DEFAULT 'PENDING',
  -- Team composition (player2 is NULL for Singles)
  team1_player1_id   UUID         REFERENCES players(id),
  team1_player2_id   UUID         REFERENCES players(id),
  team2_player1_id   UUID         REFERENCES players(id),
  team2_player2_id   UUID         REFERENCES players(id),
  -- Result
  winning_team       winning_team,
  -- Sport-specific score state stored as JSONB
  -- Badminton: { sets: [{t1: 0, t2: 0}], currentSet: 0 }
  -- Tennis:    { sets: [{t1: 0, t2: 0, tiebreak: false}], games: {t1: 0, t2: 0}, points: {t1: 0, t2: 0} }
  -- Padel:     { sets: [...], superTiebreak: null }
  -- TableTennis: { games: [{t1: 0, t2: 0}], currentGame: 0 }
  score_data         JSONB        NOT NULL DEFAULT '{}',
  score_history      JSONB        NOT NULL DEFAULT '[]', -- Stack for undo
  started_at         TIMESTAMPTZ,
  completed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

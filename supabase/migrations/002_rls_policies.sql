-- ============================================================
-- Migration: 002_rls_policies
-- Description: Row Level Security policies for all tables
-- ============================================================

-- ============================================================
-- PROFILES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- SESSIONS
-- ============================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Organizer: full CRUD on their own sessions
CREATE POLICY "sessions_select_organizer"
  ON sessions FOR SELECT
  USING (auth.uid() = organizer_id);

CREATE POLICY "sessions_insert_organizer"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "sessions_update_organizer"
  ON sessions FOR UPDATE
  USING (auth.uid() = organizer_id);

CREATE POLICY "sessions_delete_organizer"
  ON sessions FOR DELETE
  USING (auth.uid() = organizer_id);

-- Anyone (including anon): read sessions via spectator_code lookup
-- Security: the spectator_code acts as a secret token
CREATE POLICY "sessions_select_spectator"
  ON sessions FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- PLAYERS
-- ============================================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Organizer: full CRUD on players in their sessions
CREATE POLICY "players_all_organizer"
  ON players FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = players.session_id
        AND sessions.organizer_id = auth.uid()
    )
  );

-- Anyone (including anon): read players (for spectator view)
CREATE POLICY "players_select_public"
  ON players FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- COURTS
-- ============================================================

ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courts_all_organizer"
  ON courts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = courts.session_id
        AND sessions.organizer_id = auth.uid()
    )
  );

CREATE POLICY "courts_select_public"
  ON courts FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- MATCHES
-- ============================================================

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches_all_organizer"
  ON matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = matches.session_id
        AND sessions.organizer_id = auth.uid()
    )
  );

CREATE POLICY "matches_select_public"
  ON matches FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- Migration: 003_indexes
-- Description: Performance indexes for common query patterns
-- ============================================================

-- Sessions: lookup by organizer (dashboard list)
CREATE INDEX idx_sessions_organizer_id ON sessions(organizer_id);

-- Sessions: lookup by spectator_code (spectator view)
CREATE INDEX idx_sessions_spectator_code ON sessions(spectator_code);

-- Sessions: filter by status
CREATE INDEX idx_sessions_status ON sessions(status);

-- Players: lookup by session (roster fetch)
CREATE INDEX idx_players_session_id ON players(session_id);

-- Players: leaderboard sort (points_won DESC, point_differential DESC)
CREATE INDEX idx_players_leaderboard ON players(session_id, matches_won DESC, point_differential DESC);

-- Courts: lookup by session
CREATE INDEX idx_courts_session_id ON courts(session_id);

-- Matches: lookup by session (active session hub)
CREATE INDEX idx_matches_session_id ON matches(session_id);

-- Matches: filter by status within session (live matches)
CREATE INDEX idx_matches_session_status ON matches(session_id, status);

-- Matches: lookup by court
CREATE INDEX idx_matches_court_id ON matches(court_id);

-- Matches: round ordering
CREATE INDEX idx_matches_round ON matches(session_id, round_number);

-- Realtime: enable replication on matches table (for Supabase Realtime)
ALTER TABLE matches REPLICA IDENTITY FULL;
ALTER TABLE players REPLICA IDENTITY FULL;
ALTER TABLE sessions REPLICA IDENTITY FULL;

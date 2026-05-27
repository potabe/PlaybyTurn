-- ============================================================
-- Migration: 006_tournament_mode
-- Description: Add knockout tournament support to sessions and matches
-- ============================================================

-- 1. Add is_knockout to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_knockout BOOLEAN NOT NULL DEFAULT false;

-- 2. Add match_order and next_match_id to matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_order INT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS next_match_id UUID REFERENCES matches(id);

-- Optional: Create an index to speed up bracket tree queries
CREATE INDEX IF NOT EXISTS idx_matches_next_match_id ON matches(next_match_id);

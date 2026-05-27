// ============================================================
// Domain types used throughout the frontend
// ============================================================

import type {
  SportType,
  FormatType,
  GenderType,
  SessionStatus,
  MatchStatus,
  WinningTeam,
} from "./database";
import type { ScoreData } from "./scoring";

export type SkillLevel = "NEWBIE" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PRO";

export type { SportType, FormatType, GenderType, SessionStatus, MatchStatus, WinningTeam, ScoreData };

// ============================================================
// Profile
// ============================================================

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  skill_levels?: Record<SportType, SkillLevel> | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Session
// ============================================================

export interface Session {
  id: string;
  organizer_id: string;
  title: string;
  sport: SportType;
  format: FormatType;
  status: SessionStatus;
  spectator_code: string;
  is_knockout: boolean;
  metadata?: { team_names?: Record<string, string> } | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Player
// ============================================================

export interface Player {
  id: string;
  session_id: string;
  name: string;
  gender: GenderType;
  matches_played: number;
  matches_won: number;
  points_won: number;
  point_differential: number;
  last_played_at: string | null;
  created_at: string;
}

// ============================================================
// Court
// ============================================================

export interface Court {
  id: string;
  session_id: string;
  name: string;
  created_at: string;
}

// ============================================================
// Match
// ============================================================

export interface Match {
  id: string;
  session_id: string;
  court_id: string | null;
  round_number: number;
  status: MatchStatus;
  team1_player1_id: string | null;
  team1_player2_id: string | null;
  team2_player1_id: string | null;
  team2_player2_id: string | null;
  winning_team: WinningTeam | null;
  score_data: ScoreData;
  score_history: ScoreData[];
  match_order?: number | null;
  next_match_id?: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// ============================================================
// Session Setup Form types
// ============================================================

export interface PlayerInput {
  name: string;
  gender: GenderType;
}

export interface SessionSetupForm {
  title: string;
  sport: SportType;
  format: FormatType;
  is_knockout: boolean;
  players: PlayerInput[];
  courtNames: string[];
}

// ============================================================
// Leaderboard
// ============================================================

export interface LeaderboardEntry extends Player {
  rank: number;
}

// ============================================================
// Shared TypeScript types for Supabase Edge Functions
// ============================================================

export type SportType = "PADEL" | "BADMINTON" | "TENNIS" | "TABLE_TENNIS";
export type FormatType =
  | "SINGLES"
  | "FIXED_DOUBLES"
  | "MIXED_DOUBLES"
  | "AMERICANO";
export type GenderType = "MALE" | "FEMALE";
export type MatchStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

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
}

export interface Court {
  id: string;
  session_id: string;
  name: string;
}

export interface TeamAssignment {
  player1_id: string; // male
  player2_id: string; // female
}

export interface GenerateMatchesRequest {
  session_id: string;
  players: Player[];
  courts: Court[];
  sport: SportType;
  format: FormatType;
  team_assignments?: TeamAssignment[]; // for FIXED_DOUBLES
}

export interface MatchAssignment {
  court_id: string;
  team1_player1_id: string;
  team1_player2_id: string | null;
  team2_player1_id: string;
  team2_player2_id: string | null;
  round_number: number;
}

export interface GenerateMatchesResponse {
  matches: MatchAssignment[];
  resting_player_ids: string[];
  warnings: string[];
}

// ============================================================
// Supabase Database Types (auto-generated from schema)
// Run: npx supabase gen types typescript --local > src/types/database.ts
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SessionStatus = "SETUP" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type SportType = "PADEL" | "BADMINTON" | "TENNIS" | "TABLE_TENNIS";
export type FormatType =
  | "SINGLES"
  | "FIXED_DOUBLES"
  | "MIXED_DOUBLES"
  | "AMERICANO";
export type GenderType = "MALE" | "FEMALE";
export type MatchStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type WinningTeam = "TEAM1" | "TEAM2";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          skill_levels: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar_url?: string | null;
          skill_levels?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          avatar_url?: string | null;
          skill_levels?: Json | null;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          organizer_id: string;
          title: string;
          sport: SportType;
          format: FormatType;
          status: SessionStatus;
          spectator_code: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organizer_id: string;
          title: string;
          sport: SportType;
          format: FormatType;
          status?: SessionStatus;
          spectator_code: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          sport?: SportType;
          format?: FormatType;
          status?: SessionStatus;
          spectator_code?: string;
          metadata?: Json | null;
          updated_at?: string;
        };
      };
      players: {
        Row: {
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
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          gender: GenderType;
          matches_played?: number;
          matches_won?: number;
          points_won?: number;
          point_differential?: number;
          last_played_at?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          gender?: GenderType;
          matches_played?: number;
          matches_won?: number;
          points_won?: number;
          point_differential?: number;
          last_played_at?: string | null;
        };
      };
      courts: {
        Row: {
          id: string;
          session_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
      };
      matches: {
        Row: {
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
          score_data: Json;
          score_history: Json;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          court_id?: string | null;
          round_number?: number;
          status?: MatchStatus;
          team1_player1_id?: string | null;
          team1_player2_id?: string | null;
          team2_player1_id?: string | null;
          team2_player2_id?: string | null;
          winning_team?: WinningTeam | null;
          score_data?: Json;
          score_history?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          court_id?: string | null;
          status?: MatchStatus;
          winning_team?: WinningTeam | null;
          score_data?: Json;
          score_history?: Json;
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
    };
  };
}

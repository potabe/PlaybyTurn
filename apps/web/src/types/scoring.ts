// ============================================================
// Scoring engine types — sport-specific score state shapes
// ============================================================

// Generic team identifier
export type Team = "team1" | "team2";

// ============================================================
// Tennis/Padel Points: 0=0, 1=15, 2=30, 3=40, 4=ADV
// ============================================================
export type TennisPoint = 0 | 1 | 2 | 3 | 4;

export interface TennisSetScore {
  t1: number; // games won in this set
  t2: number;
  tiebreak: boolean;
  tiebreakScore?: { t1: number; t2: number };
}

export interface TennisScoreData {
  sport: "TENNIS" | "PADEL";
  sets: TennisSetScore[];
  currentSet: number;
  points: { t1: TennisPoint; t2: TennisPoint };
  superTiebreak?: { t1: number; t2: number } | null; // Padel only
  setsToWin: number; // 2 for best of 3
  gamesPerSet: number; // 6
}

// ============================================================
// Badminton
// ============================================================
export interface BadmintonSetScore {
  t1: number;
  t2: number;
}

export interface BadmintonScoreData {
  sport: "BADMINTON";
  sets: BadmintonSetScore[];
  currentSet: number;
  setsToWin: number; // 2 for best of 3
  pointsPerSet: number; // 21
  capPoints: number; // 30
}

// ============================================================
// Table Tennis
// ============================================================
export interface TableTennisGameScore {
  t1: number;
  t2: number;
}

export interface TableTennisScoreData {
  sport: "TABLE_TENNIS";
  games: TableTennisGameScore[];
  currentGame: number;
  gamesToWin: number; // 3 for best of 5
  pointsPerGame: number; // 11
}

// ============================================================
// Union type
// ============================================================
export type ScoreData =
  | TennisScoreData
  | BadmintonScoreData
  | TableTennisScoreData
  | Record<string, never>; // Empty initial state

// ============================================================
// Display types (for rendering)
// ============================================================
export interface DisplayScore {
  team1: string;
  team2: string;
  sets?: { t1: number; t2: number }[];
  currentSetDetail?: string;
  isMatchPoint?: boolean;
  isSetPoint?: boolean;
}

// ============================================================
// Scoring engine interface
// ============================================================
export interface ScoringEngine<T extends ScoreData> {
  sport: string;
  initState(): T;
  addPoint(state: T, team: Team): T;
  undoPoint(state: T, history: T[]): { state: T; history: T[] };
  isMatchComplete(state: T): boolean;
  getWinner(state: T): Team | null;
  getDisplayScore(state: T): DisplayScore;
}

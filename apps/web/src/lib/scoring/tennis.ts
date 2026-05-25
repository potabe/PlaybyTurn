import type {
  TennisScoreData,
  TennisPoint,
  DisplayScore,
  ScoringEngine,
  Team,
} from "@/types/scoring";

// ============================================================
// Tennis Scoring Engine
// Rules:
// - Best of 3 sets (first to 2 sets)
// - Points: 0 → 15 → 30 → 40 → Game
// - Deuce at 40-40: need 2-point lead (ADV → Game)
// - Games: first to 6 with 2-game lead
// - Tiebreak at 6-6: first to 7 with 2-point lead
// ============================================================

const SETS_TO_WIN = 2;
const GAMES_PER_SET = 6;

// Points mapping: index = point value (0,1,2,3,4=ADV)
const POINT_LABELS: Record<TennisPoint, string> = {
  0: "0",
  1: "15",
  2: "30",
  3: "40",
  4: "Ad",
};

function getSetsWon(state: TennisScoreData): { t1: number; t2: number } {
  return state.sets.reduce(
    (acc, set, i) => {
      if (i < state.currentSet) {
        if (set.t1 > set.t2) acc.t1++;
        else if (set.t2 > set.t1) acc.t2++;
      }
      return acc;
    },
    { t1: 0, t2: 0 }
  );
}

function isSetComplete(
  t1Games: number,
  t2Games: number,
  tiebreak: boolean,
  tiebreakScore?: { t1: number; t2: number }
): boolean {
  if (tiebreak && tiebreakScore) {
    const max = Math.max(tiebreakScore.t1, tiebreakScore.t2);
    const diff = Math.abs(tiebreakScore.t1 - tiebreakScore.t2);
    return max >= 7 && diff >= 2;
  }

  const max = Math.max(t1Games, t2Games);
  const diff = Math.abs(t1Games - t2Games);
  return max >= GAMES_PER_SET && diff >= 2;
}

export const tennisEngine: ScoringEngine<TennisScoreData> = {
  sport: "TENNIS",

  initState(): TennisScoreData {
    return {
      sport: "TENNIS",
      sets: [{ t1: 0, t2: 0, tiebreak: false }],
      currentSet: 0,
      points: { t1: 0, t2: 0 },
      setsToWin: SETS_TO_WIN,
      gamesPerSet: GAMES_PER_SET,
    };
  },

  addPoint(state: TennisScoreData, team: Team): TennisScoreData {
    if (this.isMatchComplete(state)) return state;

    const newState = structuredClone(state);
    const currentSet = newState.sets[newState.currentSet];

    // Handle tiebreak
    if (currentSet.tiebreak) {
      if (!currentSet.tiebreakScore) {
        currentSet.tiebreakScore = { t1: 0, t2: 0 };
      }
      if (team === "team1") currentSet.tiebreakScore.t1++;
      else currentSet.tiebreakScore.t2++;

      if (isSetComplete(currentSet.t1, currentSet.t2, true, currentSet.tiebreakScore)) {
        // Advance set
        const setsWon = getSetsWon(newState);
        if (setsWon.t1 < SETS_TO_WIN - 1 && setsWon.t2 < SETS_TO_WIN - 1) {
          newState.currentSet++;
          newState.sets.push({ t1: 0, t2: 0, tiebreak: false });
        }
        newState.points = { t1: 0, t2: 0 };
      }
      return newState;
    }

    // Normal point scoring
    const p = newState.points;

    // Deuce/advantage logic
    if (p.t1 === 3 && p.t2 === 3) {
      // Deuce
      if (team === "team1") p.t1 = 4; // ADV team1
      else p.t2 = 4; // ADV team2
    } else if (p.t1 === 4) {
      // ADV team1
      if (team === "team1") {
        // Game to team1
        currentSet.t1++;
        newState.points = { t1: 0, t2: 0 };
      } else {
        // Back to deuce
        p.t1 = 3;
      }
    } else if (p.t2 === 4) {
      // ADV team2
      if (team === "team2") {
        // Game to team2
        currentSet.t2++;
        newState.points = { t1: 0, t2: 0 };
      } else {
        // Back to deuce
        p.t2 = 3;
      }
    } else if (p.t1 === 3 && team === "team1") {
      // Game to team1 (no deuce)
      currentSet.t1++;
      newState.points = { t1: 0, t2: 0 };
    } else if (p.t2 === 3 && team === "team2") {
      // Game to team2 (no deuce)
      currentSet.t2++;
      newState.points = { t1: 0, t2: 0 };
    } else {
      // Regular point increment
      if (team === "team1") p.t1 = (p.t1 + 1) as TennisPoint;
      else p.t2 = (p.t2 + 1) as TennisPoint;
      return newState;
    }

    // Check if set is complete after game point
    if (currentSet.t1 === GAMES_PER_SET && currentSet.t2 === GAMES_PER_SET) {
      // Enter tiebreak
      currentSet.tiebreak = true;
      currentSet.tiebreakScore = { t1: 0, t2: 0 };
    } else if (isSetComplete(currentSet.t1, currentSet.t2, false)) {
      // Advance to next set
      const setsWon = getSetsWon(newState);
      const t1Sets = setsWon.t1 + (currentSet.t1 > currentSet.t2 ? 1 : 0);
      const t2Sets = setsWon.t2 + (currentSet.t2 > currentSet.t1 ? 1 : 0);

      if (t1Sets < SETS_TO_WIN && t2Sets < SETS_TO_WIN) {
        newState.currentSet++;
        newState.sets.push({ t1: 0, t2: 0, tiebreak: false });
        newState.points = { t1: 0, t2: 0 };
      }
    }

    return newState;
  },

  undoPoint(
    state: TennisScoreData,
    history: TennisScoreData[]
  ): { state: TennisScoreData; history: TennisScoreData[] } {
    if (history.length === 0) return { state, history };
    const newHistory = [...history];
    const previousState = newHistory.pop()!;
    return { state: previousState, history: newHistory };
  },

  isMatchComplete(state: TennisScoreData): boolean {
    const setsWon = state.sets.reduce(
      (acc, set, i) => {
        const complete = isSetComplete(
          set.t1,
          set.t2,
          set.tiebreak,
          set.tiebreakScore
        );
        if (complete) {
          const winner =
            set.tiebreak && set.tiebreakScore
              ? set.tiebreakScore.t1 > set.tiebreakScore.t2
                ? "t1"
                : "t2"
              : set.t1 > set.t2
              ? "t1"
              : "t2";
          if (winner === "t1") acc.t1++;
          else acc.t2++;
        }
        return acc;
      },
      { t1: 0, t2: 0 }
    );
    return setsWon.t1 >= SETS_TO_WIN || setsWon.t2 >= SETS_TO_WIN;
  },

  getWinner(state: TennisScoreData): Team | null {
    if (!this.isMatchComplete(state)) return null;
    const setsWon = state.sets.reduce(
      (acc, set) => {
        if (set.t1 > set.t2) acc.t1++;
        else if (set.t2 > set.t1) acc.t2++;
        return acc;
      },
      { t1: 0, t2: 0 }
    );
    return setsWon.t1 >= SETS_TO_WIN ? "team1" : "team2";
  },

  getDisplayScore(state: TennisScoreData): DisplayScore {
    const currentSet = state.sets[state.currentSet];
    const p = state.points;

    let pointDisplay = "";
    if (currentSet.tiebreak && currentSet.tiebreakScore) {
      pointDisplay = `${currentSet.tiebreakScore.t1} - ${currentSet.tiebreakScore.t2}`;
    } else {
      pointDisplay = `${POINT_LABELS[p.t1]} - ${POINT_LABELS[p.t2]}`;
    }

    return {
      team1: String(currentSet.t1),
      team2: String(currentSet.t2),
      sets: state.sets.slice(0, state.currentSet).map((s) => ({
        t1: s.t1,
        t2: s.t2,
      })),
      currentSetDetail: currentSet.tiebreak ? `TB: ${pointDisplay}` : pointDisplay,
    };
  },
};

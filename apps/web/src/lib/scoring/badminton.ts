import type {
  BadmintonScoreData,
  DisplayScore,
  ScoringEngine,
  Team,
} from "@/types/scoring";

// ============================================================
// Badminton Scoring Engine
// Rules:
// - Best of 3 sets (first to win 2 sets wins the match)
// - Rally point scoring: 21 points per set, win by 2
// - Cap: if tied at 29-29, next point wins (30 cap)
// ============================================================

const SETS_TO_WIN = 2;
const POINTS_PER_SET = 21;
const CAP_POINTS = 30;

function getSetsWon(state: BadmintonScoreData): { t1: number; t2: number } {
  return state.sets.slice(0, state.currentSet).reduce(
    (acc, set) => {
      if (set.t1 > set.t2) acc.t1++;
      else if (set.t2 > set.t1) acc.t2++;
      return acc;
    },
    { t1: 0, t2: 0 }
  );
}

function isSetComplete(
  t1: number,
  t2: number
): { complete: boolean; winner: Team | null } {
  const diff = Math.abs(t1 - t2);
  const maxPoints = Math.max(t1, t2);

  if (maxPoints >= POINTS_PER_SET && diff >= 2) {
    return { complete: true, winner: t1 > t2 ? "team1" : "team2" };
  }
  if (t1 >= CAP_POINTS || t2 >= CAP_POINTS) {
    return { complete: true, winner: t1 > t2 ? "team1" : "team2" };
  }
  return { complete: false, winner: null };
}

export const badmintonEngine: ScoringEngine<BadmintonScoreData> = {
  sport: "BADMINTON",

  initState(): BadmintonScoreData {
    return {
      sport: "BADMINTON",
      sets: [{ t1: 0, t2: 0 }],
      currentSet: 0,
      setsToWin: SETS_TO_WIN,
      pointsPerSet: POINTS_PER_SET,
      capPoints: CAP_POINTS,
    };
  },

  addPoint(state: BadmintonScoreData, team: Team): BadmintonScoreData {
    if (this.isMatchComplete(state)) return state;

    const newState = structuredClone(state);
    const currentSet = newState.sets[newState.currentSet];

    if (team === "team1") currentSet.t1++;
    else currentSet.t2++;

    const { complete } = isSetComplete(currentSet.t1, currentSet.t2);

    if (complete) {
      const setsWon = getSetsWon(newState);
      // +1 for the just-completed set
      const t1Sets = setsWon.t1 + (currentSet.t1 > currentSet.t2 ? 1 : 0);
      const t2Sets = setsWon.t2 + (currentSet.t2 > currentSet.t1 ? 1 : 0);

      if (t1Sets < SETS_TO_WIN && t2Sets < SETS_TO_WIN) {
        // Start next set
        newState.currentSet++;
        newState.sets.push({ t1: 0, t2: 0 });
      }
      // If match is complete, leave as-is (isMatchComplete handles it)
    }

    return newState;
  },

  undoPoint(
    state: BadmintonScoreData,
    history: BadmintonScoreData[]
  ): { state: BadmintonScoreData; history: BadmintonScoreData[] } {
    if (history.length === 0) return { state, history };
    const newHistory = [...history];
    const previousState = newHistory.pop()!;
    return { state: previousState, history: newHistory };
  },

  isMatchComplete(state: BadmintonScoreData): boolean {
    const setsWon = state.sets.reduce(
      (acc, set, i) => {
        if (i < state.currentSet || isSetComplete(set.t1, set.t2).complete) {
          if (set.t1 > set.t2) acc.t1++;
          else if (set.t2 > set.t1) acc.t2++;
        }
        return acc;
      },
      { t1: 0, t2: 0 }
    );
    return setsWon.t1 >= SETS_TO_WIN || setsWon.t2 >= SETS_TO_WIN;
  },

  getWinner(state: BadmintonScoreData): Team | null {
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

  getDisplayScore(state: BadmintonScoreData): DisplayScore {
    const currentSet = state.sets[state.currentSet];
    const setsWon = state.sets.slice(0, state.currentSet).reduce(
      (acc, set) => {
        if (set.t1 > set.t2) acc.t1++;
        else if (set.t2 > set.t1) acc.t2++;
        return acc;
      },
      { t1: 0, t2: 0 }
    );

    return {
      team1: String(currentSet.t1),
      team2: String(currentSet.t2),
      sets: state.sets.slice(0, state.currentSet),
      currentSetDetail: `Set ${state.currentSet + 1}`,
    };
  },
};

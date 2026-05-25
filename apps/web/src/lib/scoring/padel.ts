// ============================================================
// Padel Scoring Engine
// Extends Tennis with:
// - Super Tiebreak at 1-1 sets (first to 10, win by 2)
//   instead of a third full set
// ============================================================

import type {
  TennisScoreData,
  DisplayScore,
  ScoringEngine,
  Team,
} from "@/types/scoring";
import { tennisEngine } from "./tennis";

const SUPER_TIEBREAK_POINTS = 10;

export const padelEngine: ScoringEngine<TennisScoreData> = {
  sport: "PADEL",

  initState(): TennisScoreData {
    return {
      ...tennisEngine.initState(),
      sport: "PADEL",
      superTiebreak: null,
    };
  },

  addPoint(state: TennisScoreData, team: Team): TennisScoreData {
    if (this.isMatchComplete(state)) return state;

    // If we're in super tiebreak mode
    if (state.superTiebreak !== null && state.superTiebreak !== undefined) {
      const newState = structuredClone(state);
      if (!newState.superTiebreak) return newState;
      if (team === "team1") newState.superTiebreak.t1++;
      else newState.superTiebreak.t2++;

      const st = newState.superTiebreak;
      const maxPoints = Math.max(st.t1, st.t2);
      const diff = Math.abs(st.t1 - st.t2);

      if (maxPoints >= SUPER_TIEBREAK_POINTS && diff >= 2) {
        // Match complete — winner determined by superTiebreak
      }

      return newState;
    }

    // Check if we should enter super tiebreak (1-1 in sets)
    const setsWon = state.sets.reduce(
      (acc, set, i) => {
        if (i < state.currentSet) {
          if (set.t1 > set.t2) acc.t1++;
          else if (set.t2 > set.t1) acc.t2++;
        }
        return acc;
      },
      { t1: 0, t2: 0 }
    );

    if (setsWon.t1 === 1 && setsWon.t2 === 1) {
      // Enter super tiebreak instead of 3rd set
      const newState = structuredClone(state);
      newState.superTiebreak = { t1: 0, t2: 0 };
      if (team === "team1") newState.superTiebreak.t1++;
      else newState.superTiebreak.t2++;
      return newState;
    }

    // Otherwise use tennis engine logic
    const result = tennisEngine.addPoint(state, team);
    return { ...result, sport: "PADEL", superTiebreak: state.superTiebreak };
  },

  undoPoint(
    state: TennisScoreData,
    history: TennisScoreData[]
  ): { state: TennisScoreData; history: TennisScoreData[] } {
    return tennisEngine.undoPoint(state, history);
  },

  isMatchComplete(state: TennisScoreData): boolean {
    if (state.superTiebreak !== null && state.superTiebreak !== undefined) {
      const st = state.superTiebreak;
      const maxPoints = Math.max(st.t1, st.t2);
      const diff = Math.abs(st.t1 - st.t2);
      return maxPoints >= SUPER_TIEBREAK_POINTS && diff >= 2;
    }
    return tennisEngine.isMatchComplete(state);
  },

  getWinner(state: TennisScoreData): Team | null {
    if (!this.isMatchComplete(state)) return null;
    if (state.superTiebreak !== null && state.superTiebreak !== undefined) {
      return state.superTiebreak.t1 > state.superTiebreak.t2 ? "team1" : "team2";
    }
    return tennisEngine.getWinner(state);
  },

  getDisplayScore(state: TennisScoreData): DisplayScore {
    if (state.superTiebreak !== null && state.superTiebreak !== undefined) {
      const st = state.superTiebreak;
      return {
        team1: String(st.t1),
        team2: String(st.t2),
        sets: state.sets.slice(0, state.currentSet).map((s) => ({
          t1: s.t1,
          t2: s.t2,
        })),
        currentSetDetail: "Super Tiebreak",
      };
    }
    const base = tennisEngine.getDisplayScore(state);
    return base;
  },
};

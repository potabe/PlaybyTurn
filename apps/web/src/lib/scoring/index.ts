// ============================================================
// Scoring Engine Registry
// Single import point for all sport scoring engines
// ============================================================

import type { SportType } from "@/types/session";
import type { ScoreData, ScoringEngine } from "@/types/scoring";
import { badmintonEngine } from "./badminton";
import { tennisEngine } from "./tennis";
import { padelEngine } from "./padel";
import { tableTennisEngine } from "./tabletennis";

// Registry of all sport engines
const ENGINES: Record<SportType, ScoringEngine<ScoreData>> = {
  BADMINTON: badmintonEngine as ScoringEngine<ScoreData>,
  TENNIS: tennisEngine as ScoringEngine<ScoreData>,
  PADEL: padelEngine as ScoringEngine<ScoreData>,
  TABLE_TENNIS: tableTennisEngine as ScoringEngine<ScoreData>,
};

/**
 * Gets the scoring engine for a given sport.
 * @throws if sport is not registered
 */
export function getScoringEngine(sport: SportType): ScoringEngine<ScoreData> {
  const engine = ENGINES[sport];
  if (!engine) throw new Error(`No scoring engine found for sport: ${sport}`);
  return engine;
}

export { badmintonEngine, tennisEngine, padelEngine, tableTennisEngine };

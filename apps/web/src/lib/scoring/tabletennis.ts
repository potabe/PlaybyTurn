import type {
  TableTennisScoreData,
  DisplayScore,
  ScoringEngine,
  Team,
} from "@/types/scoring";

// ============================================================
// Table Tennis Scoring Engine
// Rules:
// - Best of 5 games (first to win 3 games wins the match)
// - 11 points per game, win by 2
// - No cap (deuce continues until 2-point lead)
// ============================================================

const GAMES_TO_WIN = 3; // Best of 5
const POINTS_PER_GAME = 11;

function isGameComplete(
  t1: number,
  t2: number
): { complete: boolean; winner: Team | null } {
  const maxPoints = Math.max(t1, t2);
  const diff = Math.abs(t1 - t2);

  if (maxPoints >= POINTS_PER_GAME && diff >= 2) {
    return { complete: true, winner: t1 > t2 ? "team1" : "team2" };
  }
  return { complete: false, winner: null };
}

function getGamesWon(state: TableTennisScoreData): { t1: number; t2: number } {
  return state.games.slice(0, state.currentGame).reduce(
    (acc, game) => {
      if (game.t1 > game.t2) acc.t1++;
      else if (game.t2 > game.t1) acc.t2++;
      return acc;
    },
    { t1: 0, t2: 0 }
  );
}

export const tableTennisEngine: ScoringEngine<TableTennisScoreData> = {
  sport: "TABLE_TENNIS",

  initState(): TableTennisScoreData {
    return {
      sport: "TABLE_TENNIS",
      games: [{ t1: 0, t2: 0 }],
      currentGame: 0,
      gamesToWin: GAMES_TO_WIN,
      pointsPerGame: POINTS_PER_GAME,
    };
  },

  addPoint(state: TableTennisScoreData, team: Team): TableTennisScoreData {
    if (this.isMatchComplete(state)) return state;

    const newState = structuredClone(state);
    const currentGame = newState.games[newState.currentGame];

    if (team === "team1") currentGame.t1++;
    else currentGame.t2++;

    const { complete } = isGameComplete(currentGame.t1, currentGame.t2);

    if (complete) {
      const gamesWon = getGamesWon(newState);
      const t1Games = gamesWon.t1 + (currentGame.t1 > currentGame.t2 ? 1 : 0);
      const t2Games = gamesWon.t2 + (currentGame.t2 > currentGame.t1 ? 1 : 0);

      if (t1Games < GAMES_TO_WIN && t2Games < GAMES_TO_WIN) {
        newState.currentGame++;
        newState.games.push({ t1: 0, t2: 0 });
      }
    }

    return newState;
  },

  undoPoint(
    state: TableTennisScoreData,
    history: TableTennisScoreData[]
  ): { state: TableTennisScoreData; history: TableTennisScoreData[] } {
    if (history.length === 0) return { state, history };
    const newHistory = [...history];
    const previousState = newHistory.pop()!;
    return { state: previousState, history: newHistory };
  },

  isMatchComplete(state: TableTennisScoreData): boolean {
    const gamesWon = state.games.reduce(
      (acc, game) => {
        if (isGameComplete(game.t1, game.t2).complete) {
          if (game.t1 > game.t2) acc.t1++;
          else if (game.t2 > game.t1) acc.t2++;
        }
        return acc;
      },
      { t1: 0, t2: 0 }
    );
    return gamesWon.t1 >= GAMES_TO_WIN || gamesWon.t2 >= GAMES_TO_WIN;
  },

  getWinner(state: TableTennisScoreData): Team | null {
    if (!this.isMatchComplete(state)) return null;
    const gamesWon = state.games.reduce(
      (acc, game) => {
        if (game.t1 > game.t2) acc.t1++;
        else if (game.t2 > game.t1) acc.t2++;
        return acc;
      },
      { t1: 0, t2: 0 }
    );
    return gamesWon.t1 >= GAMES_TO_WIN ? "team1" : "team2";
  },

  getDisplayScore(state: TableTennisScoreData): DisplayScore {
    const currentGame = state.games[state.currentGame];
    const gamesWon = state.games.slice(0, state.currentGame).reduce(
      (acc, game) => {
        if (game.t1 > game.t2) acc.t1++;
        else if (game.t2 > game.t1) acc.t2++;
        return acc;
      },
      { t1: 0, t2: 0 }
    );

    return {
      team1: String(currentGame.t1),
      team2: String(currentGame.t2),
      sets: state.games.slice(0, state.currentGame),
      currentSetDetail: `Game ${state.currentGame + 1}`,
    };
  },
};

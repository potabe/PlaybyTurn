"use server";

import { prisma } from "@/lib/prisma";
import { FormatType, Player, Court } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface TeamAssignment {
  player1_id: string;
  player2_id: string;
}

export interface MatchAssignment {
  court_id: string;
  team1_player1_id: string;
  team1_player2_id: string | null;
  team2_player1_id: string;
  team2_player2_id: string | null;
  round_number: number;
}

export interface KnockoutTeam {
  id: string;
  player1: Player;
  player2: Player | null;
}

export interface KnockoutMatchNode {
  id: string;
  round: number;
  matchOrder: number;
  team1: KnockoutTeam | null | "BYE";
  team2: KnockoutTeam | null | "BYE";
  nextMatchId: string | null;
}

// ============================================================
// Helpers
// ============================================================
function buildRotationQueue(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (a.matches_played !== b.matches_played) {
      return a.matches_played - b.matches_played;
    }
    const aLast = a.last_played_at ? a.last_played_at.getTime() : 0;
    const bLast = b.last_played_at ? b.last_played_at.getTime() : 0;
    return aLast - bLast;
  });
}

// ============================================================
// SINGLES
// ============================================================
function generateSingles(players: Player[], courts: Court[], startRound: number): { matches: MatchAssignment[]; warnings: string[] } {
  const warnings: string[] = [];
  if (players.length < 2) return { matches: [], warnings: ["Need at least 2 players for Singles."] };

  const allMatches: MatchAssignment[] = [];
  const numCourts = courts.length;
  const matchups: [Player, Player][] = [];
  
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) matchups.push([players[i], players[j]]);
  }

  const lastPlayedRound: Record<string, number> = {};
  players.forEach((p) => { lastPlayedRound[p.id] = 0; });
  const scheduled = new Set<number>();
  let round = 1;

  while (scheduled.size < matchups.length) {
    const usedThisRound = new Set<string>();
    let matchesThisRound = 0;

    for (let c = 0; c < numCourts; c++) {
      let bestIdx = -1;
      let bestScore = -1;

      for (let idx = 0; idx < matchups.length; idx++) {
        if (scheduled.has(idx)) continue;
        const [p1, p2] = matchups[idx];
        if (usedThisRound.has(p1.id) || usedThisRound.has(p2.id)) continue;

        const score = (round - (lastPlayedRound[p1.id] ?? 0)) + (round - (lastPlayedRound[p2.id] ?? 0));
        if (score > bestScore) {
          bestScore = score;
          bestIdx = idx;
        }
      }

      if (bestIdx === -1) break;

      const [p1, p2] = matchups[bestIdx];
      allMatches.push({
        court_id: courts[c % numCourts].id,
        team1_player1_id: p1.id, team1_player2_id: null,
        team2_player1_id: p2.id, team2_player2_id: null,
        round_number: startRound + round - 1,
      });

      usedThisRound.add(p1.id); usedThisRound.add(p2.id);
      lastPlayedRound[p1.id] = round; lastPlayedRound[p2.id] = round;
      scheduled.add(bestIdx);
      matchesThisRound++;
    }
    if (matchesThisRound === 0) break;
    round++;
  }
  return { matches: allMatches, warnings };
}

// ============================================================
// FIXED DOUBLES
// ============================================================
function generateFixedDoubles(players: Player[], courts: Court[], teamAssignments: TeamAssignment[] | undefined, startRound: number): { matches: MatchAssignment[]; warnings: string[] } {
  const warnings: string[] = [];
  if (teamAssignments && teamAssignments.length >= 2) {
    const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
    const teams = teamAssignments.filter((t) => playerMap[t.player1_id] && playerMap[t.player2_id]);

    if (teams.length < 2) return { matches: [], warnings: ["Need at least 2 valid teams."] };

    const matchups: [TeamAssignment, TeamAssignment][] = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) matchups.push([teams[i], teams[j]]);
    }

    const allMatches: MatchAssignment[] = [];
    const numCourts = courts.length;
    const lastPlayedRound: Record<string, number> = {};
    teams.forEach((t) => {
      lastPlayedRound[t.player1_id] = 0; lastPlayedRound[t.player2_id] = 0;
    });

    const scheduled = new Set<number>();
    let round = 1;

    while (scheduled.size < matchups.length) {
      const usedThisRound = new Set<string>();
      let matchesThisRound = 0;

      for (let c = 0; c < numCourts; c++) {
        let bestIdx = -1;
        let bestScore = -1;

        for (let idx = 0; idx < matchups.length; idx++) {
          if (scheduled.has(idx)) continue;
          const [t1, t2] = matchups[idx];

          if (usedThisRound.has(t1.player1_id) || usedThisRound.has(t1.player2_id) ||
              usedThisRound.has(t2.player1_id) || usedThisRound.has(t2.player2_id)) continue;

          const score = (round - (lastPlayedRound[t1.player1_id] ?? 0)) + (round - (lastPlayedRound[t1.player2_id] ?? 0)) +
                        (round - (lastPlayedRound[t2.player1_id] ?? 0)) + (round - (lastPlayedRound[t2.player2_id] ?? 0));

          if (score > bestScore) { bestScore = score; bestIdx = idx; }
        }

        if (bestIdx === -1) break;

        const [t1, t2] = matchups[bestIdx];
        allMatches.push({
          court_id: courts[c % numCourts].id,
          team1_player1_id: t1.player1_id, team1_player2_id: t1.player2_id,
          team2_player1_id: t2.player1_id, team2_player2_id: t2.player2_id,
          round_number: startRound + round - 1,
        });

        usedThisRound.add(t1.player1_id); usedThisRound.add(t1.player2_id);
        usedThisRound.add(t2.player1_id); usedThisRound.add(t2.player2_id);
        lastPlayedRound[t1.player1_id] = round; lastPlayedRound[t1.player2_id] = round;
        lastPlayedRound[t2.player1_id] = round; lastPlayedRound[t2.player2_id] = round;
        scheduled.add(bestIdx);
        matchesThisRound++;
      }
      if (matchesThisRound === 0) break;
      round++;
    }
    return { matches: allMatches, warnings };
  }

  if (players.length < 4) return { matches: [], warnings: ["Need at least 4 players."] };
  const queue = buildRotationQueue(players);
  const matches: MatchAssignment[] = [];
  const usedPlayerIds = new Set<string>();

  for (const court of courts) {
    const available = queue.filter((p) => !usedPlayerIds.has(p.id));
    if (available.length < 4) break;
    const [p1, p2, p3, p4] = available;
    matches.push({
      court_id: court.id,
      team1_player1_id: p1.id, team1_player2_id: p2.id,
      team2_player1_id: p3.id, team2_player2_id: p4.id,
      round_number: startRound,
    });
    [p1, p2, p3, p4].forEach((p) => usedPlayerIds.add(p.id));
  }
  return { matches, warnings };
}

// ============================================================
// AMERICANO
// ============================================================
function generateAmericano(players: Player[], courts: Court[], startRound: number): { matches: MatchAssignment[]; warnings: string[] } {
  const warnings: string[] = [];
  const n = players.length;
  if (n < 4) return { matches: [], warnings: ["Need at least 4 players."] };

  const allMatches: MatchAssignment[] = [];
  const ids = players.map((p) => p.id);
  const numCourts = courts.length;

  let list = [...ids];
  const numRounds = n % 2 === 0 ? n - 1 : n;
  const fixed = n % 2 === 0 ? list.splice(0, 1)[0] : null;

  for (let round = 0; round < numRounds; round++) {
    const roundPlayers: string[] = fixed ? [fixed, ...list] : [...list];
    const half = Math.floor(roundPlayers.length / 2);
    const pairs: [string, string][] = [];

    for (let i = 0; i < half; i++) pairs.push([roundPlayers[i], roundPlayers[roundPlayers.length - 1 - i]]);

    for (let c = 0; c < Math.min(numCourts, Math.floor(pairs.length / 2)); c++) {
      const team1 = pairs[c * 2];
      const team2 = pairs[c * 2 + 1];
      if (!team1 || !team2) break;

      allMatches.push({
        court_id: courts[c].id,
        team1_player1_id: team1[0], team1_player2_id: team1[1],
        team2_player1_id: team2[0], team2_player2_id: team2[1],
        round_number: startRound + round,
      });
    }

    if (list.length > 0) {
      const last = list.pop()!;
      list.unshift(last);
    }
  }
  return { matches: allMatches, warnings };
}

// ============================================================
// KNOCKOUT
// ============================================================
function getSeedingPattern(M: number): number[] {
  let pattern = [1, 2];
  while (pattern.length < M) {
    const nextPattern: number[] = [];
    const currentM = pattern.length * 2;
    for (const seed of pattern) {
      nextPattern.push(seed); nextPattern.push(currentM - seed + 1);
    }
    pattern = nextPattern;
  }
  return pattern;
}

function generateKnockoutBracket(players: Player[], courts: Court[], format: FormatType, teamAssignments?: TeamAssignment[]): { matches: KnockoutMatchNode[]; warnings: string[] } {
  const warnings: string[] = [];
  const teams: KnockoutTeam[] = [];

  if (format === "SINGLES") {
    players.forEach((p) => teams.push({ id: p.id, player1: p, player2: null }));
  } else {
    if (teamAssignments && teamAssignments.length > 0) {
      const pMap = new Map(players.map((p) => [p.id, p]));
      teamAssignments.forEach((ta, idx) => {
        const p1 = pMap.get(ta.player1_id);
        const p2 = pMap.get(ta.player2_id);
        if (p1 && p2) teams.push({ id: `team_${idx}`, player1: p1, player2: p2 });
      });
    } else {
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length - 1; i += 2) {
        teams.push({ id: `team_${i / 2}`, player1: shuffled[i], player2: shuffled[i + 1] });
      }
    }
  }

  const N = teams.length;
  if (N < 2) return { matches: [], warnings: ["Not enough teams."] };

  const M = Math.pow(2, Math.ceil(Math.log2(N)));
  const totalRounds = Math.log2(M);
  teams.sort(() => Math.random() - 0.5);
  
  const seededTeams: (KnockoutTeam | "BYE")[] = new Array(M).fill("BYE");
  const pattern = getSeedingPattern(M);
  for (let i = 0; i < N; i++) {
    const seedIndex = pattern.indexOf(i + 1);
    seededTeams[seedIndex] = teams[i];
  }

  const numMatches = M - 1;
  const tree: KnockoutMatchNode[] = [];
  for (let i = 0; i <= numMatches; i++) {
    tree.push({ id: crypto.randomUUID(), round: 0, matchOrder: 0, team1: null, team2: null, nextMatchId: null });
  }

  let currentMatch = 1;
  for (let r = totalRounds; r >= 1; r--) {
    const matchesInRound = Math.pow(2, totalRounds - r);
    for (let m = 0; m < matchesInRound; m++) {
      tree[currentMatch].round = r;
      if (currentMatch > 1) tree[currentMatch].nextMatchId = tree[Math.floor(currentMatch / 2)].id;
      currentMatch++;
    }
  }

  let seedIdx = 0;
  for (let i = M / 2; i < M; i++) {
    tree[i].team1 = seededTeams[seedIdx++];
    tree[i].team2 = seededTeams[seedIdx++];
  }

  const isGhost = new Array(M).fill(false);
  for (let i = M - 1; i >= 1; i--) {
    const node = tree[i];
    if (node.team1 === "BYE" || node.team2 === "BYE") {
      isGhost[i] = true;
      const realTeam = node.team1 !== "BYE" ? node.team1 : node.team2;
      const parentIdx = Math.floor(i / 2);
      if (parentIdx > 0) {
        if (i % 2 === 0) tree[parentIdx].team1 = realTeam;
        else tree[parentIdx].team2 = realTeam;
      }
    }
  }

  let order = 1;
  const finalMatches: KnockoutMatchNode[] = [];
  for (let r = 1; r <= totalRounds; r++) {
    const roundMatches = tree.slice(1).filter(m => m.round === r && !isGhost[tree.indexOf(m)]);
    for (const m of roundMatches) {
      m.matchOrder = order++;
      finalMatches.push(m);
    }
  }

  for (const m of finalMatches) {
    let nextIdx = Math.floor(tree.indexOf(m) / 2);
    while (nextIdx > 0 && isGhost[nextIdx]) nextIdx = Math.floor(nextIdx / 2);
    m.nextMatchId = nextIdx > 0 ? tree[nextIdx].id : null;
  }

  return { matches: finalMatches, warnings };
}

// ============================================================
// MAIN SERVER ACTION
// ============================================================
export async function generateMatchesAction(
  sessionId: string,
  teamAssignments?: TeamAssignment[],
  isExtraRound = false
) {
  const session = await prisma.tournamentSession.findUnique({
    where: { id: sessionId },
    include: { players: true, courts: true, matches: true }
  });

  if (!session || !session.players.length || !session.courts.length) {
    throw new Error("Invalid session data");
  }

  let players = session.players;
  const courts = session.courts;
  const format = session.format;
  
  let startingRound = 1;

  if (isExtraRound) {
    const maxRound = session.matches.reduce((max, m) => Math.max(max, m.round_number), 0);
    startingRound = maxRound + 1;
    players = [...players].sort(() => Math.random() - 0.5);
    
    // For fixed doubles extra round without new assignments, extract the existing ones
    if (format === "FIXED_DOUBLES" && (!teamAssignments || teamAssignments.length === 0)) {
      const existingTeams = new Map<string, TeamAssignment>();
      session.matches.forEach(m => {
        if (m.team1_player1_id && m.team1_player2_id) {
          const key = [m.team1_player1_id, m.team1_player2_id].sort().join("-");
          existingTeams.set(key, { player1_id: m.team1_player1_id, player2_id: m.team1_player2_id });
        }
        if (m.team2_player1_id && m.team2_player2_id) {
          const key = [m.team2_player1_id, m.team2_player2_id].sort().join("-");
          existingTeams.set(key, { player1_id: m.team2_player1_id, player2_id: m.team2_player2_id });
        }
      });
      teamAssignments = Array.from(existingTeams.values());
    }
  }

  let warnings: string[] = [];

  if (session.is_knockout) {
    const result = generateKnockoutBracket(players, courts, format, teamAssignments);
    if (result.matches.length > 0) {
      await prisma.match.createMany({
        data: result.matches.map(m => ({
          id: m.id,
          session_id: sessionId,
          court_id: courts[0].id,
          round_number: m.round,
          match_order: m.matchOrder,
          next_match_id: m.nextMatchId,
          status: "PENDING",
          team1_player1_id: m.team1 && m.team1 !== "BYE" ? m.team1.player1.id : null,
          team1_player2_id: m.team1 && m.team1 !== "BYE" ? m.team1.player2?.id : null,
          team2_player1_id: m.team2 && m.team2 !== "BYE" ? m.team2.player1.id : null,
          team2_player2_id: m.team2 && m.team2 !== "BYE" ? m.team2.player2?.id : null,
          score_data: {},
          score_history: []
        }))
      });
    }
    warnings = result.warnings;
  } else {
    let result: { matches: MatchAssignment[]; warnings: string[] } = { matches: [], warnings: [] };
    switch (format) {
      case "SINGLES":
        result = generateSingles(players, courts, startingRound); break;
      case "FIXED_DOUBLES":
        result = generateFixedDoubles(players, courts, teamAssignments, startingRound); break;
      case "AMERICANO":
        result = generateAmericano(players, courts, startingRound); break;
      // Mixed doubles omitted for brevity, fallback to fixed
      case "MIXED_DOUBLES":
        result = generateFixedDoubles(players, courts, teamAssignments, startingRound); break;
    }

    if (result.matches.length > 0) {
      await prisma.match.createMany({
        data: result.matches.map(m => ({
          session_id: sessionId,
          court_id: m.court_id,
          round_number: m.round_number,
          status: "PENDING",
          team1_player1_id: m.team1_player1_id,
          team1_player2_id: m.team1_player2_id,
          team2_player1_id: m.team2_player1_id,
          team2_player2_id: m.team2_player2_id,
          score_data: {},
          score_history: []
        }))
      });
    }
    warnings = result.warnings;
  }

  await prisma.tournamentSession.update({
    where: { id: sessionId },
    data: { status: "ACTIVE" }
  });

  revalidatePath(`/sessions/${sessionId}`);
  return { success: true, warnings };
}

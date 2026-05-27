import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import type {
  GenerateMatchesRequest,
  GenerateMatchesResponse,
  MatchAssignment,
  Player,
  Court,
  FormatType,
  TeamAssignment,
} from "../_shared/types.ts";
import { generateKnockoutBracket } from "./knockout.ts";

// ============================================================
// Rotation Queue: sorts players by priority rules
// Priority: fewest matches played → longest rest time
// ============================================================
function buildRotationQueue(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (a.matches_played !== b.matches_played) {
      return a.matches_played - b.matches_played;
    }
    const aLastPlayed = a.last_played_at ? new Date(a.last_played_at).getTime() : 0;
    const bLastPlayed = b.last_played_at ? new Date(b.last_played_at).getTime() : 0;
    return aLastPlayed - bLastPlayed;
  });
}

// ============================================================
// SINGLES: 1v1 — full round-robin
//
// Generates all unique 1v1 matchups and schedules them using
// the max-rest greedy algorithm to ensure players get rest
// between matches.
// ============================================================
function generateSingles(
  players: Player[],
  courts: Court[]
): { matches: MatchAssignment[]; resting: Player[]; warnings: string[] } {
  const warnings: string[] = [];
  if (players.length < 2) {
    warnings.push("Need at least 2 players for Singles.");
    return { matches: [], resting: players, warnings };
  }

  const allMatches: MatchAssignment[] = [];
  const numCourts = courts.length;

  // Generate all unique 1v1 matchups: C(n, 2)
  const matchups: [Player, Player][] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matchups.push([players[i], players[j]]);
    }
  }

  // Max-rest greedy scheduler
  const lastPlayedRound: Record<string, number> = {};
  players.forEach((p) => {
    lastPlayedRound[p.id] = 0;
  });

  const scheduled = new Set<number>(); // indices into matchups[]
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

        // Skip if any player is already in a match this round
        if (usedThisRound.has(p1.id) || usedThisRound.has(p2.id)) continue;

        // Rest score: higher = both players have been waiting longer
        const score =
          (round - (lastPlayedRound[p1.id] ?? 0)) +
          (round - (lastPlayedRound[p2.id] ?? 0));

        if (score > bestScore) {
          bestScore = score;
          bestIdx = idx;
        }
      }

      if (bestIdx === -1) break; // no valid matchup for this court slot

      const [p1, p2] = matchups[bestIdx];
      allMatches.push({
        court_id: courts[c % numCourts].id,
        team1_player1_id: p1.id,
        team1_player2_id: null,
        team2_player1_id: p2.id,
        team2_player2_id: null,
        round_number: round,
      });

      // Update state
      usedThisRound.add(p1.id);
      usedThisRound.add(p2.id);
      lastPlayedRound[p1.id] = round;
      lastPlayedRound[p2.id] = round;
      scheduled.add(bestIdx);
      matchesThisRound++;
    }

    if (matchesThisRound === 0) break; // safety: no progress
    round++;
  }

  return { matches: allMatches, resting: [], warnings };
}

// ============================================================
// FIXED DOUBLES: pre-assigned teams, full round-robin
//
// Scheduling uses a "max-rest" greedy algorithm:
//   Each round, score every unscheduled matchup by the total
//   rest time of all 4 players (sum of rounds since last played).
//   Pick the highest-scoring matchup for each court slot.
//   This ensures teams get to rest instead of playing back-to-back.
//
// Example — 4 teams + 1 court (6 matches):
//   Round 1: T1 vs T2   (T3,T4 rest)
//   Round 2: T3 vs T4   ← both teams fully rested, score = 8
//   Round 3: T1 vs T3   ← T1 rested R2, T3 rested R1
//   Round 4: T2 vs T4   ← T2 rested R2-R3, T4 rested R2-R3
//   Round 5: T1 vs T4
//   Round 6: T2 vs T3
//
// Fallback: if no team_assignments given, auto-pair by rotation queue.
// ============================================================
function generateFixedDoubles(
  players: Player[],
  courts: Court[],
  teamAssignments?: TeamAssignment[]
): { matches: MatchAssignment[]; resting: Player[]; warnings: string[] } {
  const warnings: string[] = [];

  // ── Case 1: manual team assignments provided ──────────────
  if (teamAssignments && teamAssignments.length >= 2) {
    const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
    const teams = teamAssignments.filter(
      (t) => playerMap[t.player1_id] && playerMap[t.player2_id]
    );

    if (teams.length < 2) {
      warnings.push("Need at least 2 valid teams for Fixed Doubles.");
      return { matches: [], resting: players, warnings };
    }

    // Generate all unique team vs team matchups: C(n, 2)
    const matchups: [TeamAssignment, TeamAssignment][] = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matchups.push([teams[i], teams[j]]);
      }
    }

    // ── Max-rest greedy scheduler ──────────────────────────────────────────
    // Each round: for every unscheduled matchup, compute a "rest score" =
    // sum of (currentRound - lastPlayedRound) for all 4 players.
    // Pick the matchup with the highest score (most rested players first).
    // Multiple courts per round: repeat for each court, excluding already-
    // used players in that round.
    const allMatches: MatchAssignment[] = [];
    const numCourts = courts.length;

    // lastPlayedRound[playerId] = round number when they last played (0 = never)
    const lastPlayedRound: Record<string, number> = {};
    teams.forEach((t) => {
      lastPlayedRound[t.player1_id] = 0;
      lastPlayedRound[t.player2_id] = 0;
    });

    const scheduled = new Set<number>(); // indices into matchups[]
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

          // Skip if any player is already in a match this round
          if (
            usedThisRound.has(t1.player1_id) ||
            usedThisRound.has(t1.player2_id) ||
            usedThisRound.has(t2.player1_id) ||
            usedThisRound.has(t2.player2_id)
          ) continue;

          // Rest score: higher = both teams have been waiting longer
          const score =
            (round - (lastPlayedRound[t1.player1_id] ?? 0)) +
            (round - (lastPlayedRound[t1.player2_id] ?? 0)) +
            (round - (lastPlayedRound[t2.player1_id] ?? 0)) +
            (round - (lastPlayedRound[t2.player2_id] ?? 0));

          if (score > bestScore) {
            bestScore = score;
            bestIdx = idx;
          }
        }

        if (bestIdx === -1) break; // no valid matchup for this court slot

        const [t1, t2] = matchups[bestIdx];
        allMatches.push({
          court_id: courts[c % numCourts].id,
          team1_player1_id: t1.player1_id,
          team1_player2_id: t1.player2_id,
          team2_player1_id: t2.player1_id,
          team2_player2_id: t2.player2_id,
          round_number: round,
        });

        // Update state
        usedThisRound.add(t1.player1_id); usedThisRound.add(t1.player2_id);
        usedThisRound.add(t2.player1_id); usedThisRound.add(t2.player2_id);
        lastPlayedRound[t1.player1_id] = round; lastPlayedRound[t1.player2_id] = round;
        lastPlayedRound[t2.player1_id] = round; lastPlayedRound[t2.player2_id] = round;
        scheduled.add(bestIdx);
        matchesThisRound++;
      }

      if (matchesThisRound === 0) break; // safety: no progress
      round++;
    }

    return { matches: allMatches, resting: [], warnings };
  }

  // ── Case 2: fallback — auto-pair by rotation queue ────────
  if (players.length < 4) {
    warnings.push("Need at least 4 players for Fixed Doubles.");
    return { matches: [], resting: players, warnings };
  }

  const queue = buildRotationQueue(players);
  const matches: MatchAssignment[] = [];
  const usedPlayerIds = new Set<string>();

  for (const court of courts) {
    const available = queue.filter((p) => !usedPlayerIds.has(p.id));
    if (available.length < 4) break;
    const [p1, p2, p3, p4] = available;
    matches.push({
      court_id: court.id,
      team1_player1_id: p1.id,
      team1_player2_id: p2.id,
      team2_player1_id: p3.id,
      team2_player2_id: p4.id,
      round_number: 1,
    });
    [p1, p2, p3, p4].forEach((p) => usedPlayerIds.add(p.id));
  }

  const resting = players.filter((p) => !usedPlayerIds.has(p.id));
  return { matches, resting, warnings };
}

// ============================================================
// MIXED DOUBLES AMERICANO: 1M+1F per team, rotating partners
//
// Works like Americano: keeps generating rounds until every
// unique M-F partnership has played together at least once.
//
// Examples:
//   5M + 5F + 1 court  → 13 rounds = 13 matches
//   5M + 5F + 2 courts → ~7 rounds = 14 matches
//   4M + 4F + 2 courts → ~8 rounds = 16 matches
//
// Each round greedily picks the best uncovered (M,F) pair
// whose individual players have played the fewest matches,
// ensuring balanced playtime across all players.
// ============================================================

/** Pick the best (M,F) team for a slot this round.
 *  Prefers: (1) uncovered partnerships, (2) fewest individual matches played.
 */
function pickTeam(
  males: Player[],
  females: Player[],
  covered: Set<string>,
  playCount: Record<string, number>,
  usedM: Set<string>,
  usedF: Set<string>
): { m: Player; f: Player } | null {
  let best: { m: Player; f: Player } | null = null;
  let bestScore = Infinity;

  for (const m of males) {
    if (usedM.has(m.id)) continue;
    for (const f of females) {
      if (usedF.has(f.id)) continue;
      const penalty = covered.has(`${m.id}:${f.id}`) ? 100_000 : 0;
      const score = penalty + (playCount[m.id] ?? 0) + (playCount[f.id] ?? 0);
      if (score < bestScore) {
        bestScore = score;
        best = { m, f };
      }
    }
  }
  return best;
}

function generateMixedDoubles(
  players: Player[],
  courts: Court[]
): { matches: MatchAssignment[]; resting: Player[]; warnings: string[] } {
  const warnings: string[] = [];
  const males = buildRotationQueue(players.filter((p) => p.gender === "MALE"));
  const females = buildRotationQueue(players.filter((p) => p.gender === "FEMALE"));

  if (males.length < 2 || females.length < 2) {
    warnings.push("Need at least 2 male and 2 female players for Mixed Doubles.");
    return { matches: [], resting: players, warnings };
  }

  const allMatches: MatchAssignment[] = [];
  const totalPartnerships = males.length * females.length;
  const covered = new Set<string>();
  const playCount: Record<string, number> = {};
  [...males, ...females].forEach((p) => { playCount[p.id] = 0; });

  const numCourts = courts.length;
  let round = 1;
  const maxRounds = Math.ceil(totalPartnerships / (numCourts * 2)) * 2 + 10;

  while (covered.size < totalPartnerships && round <= maxRounds) {
    const usedM = new Set<string>();
    const usedF = new Set<string>();
    let scheduledThisRound = 0;

    for (let c = 0; c < numCourts; c++) {
      const team1 = pickTeam(males, females, covered, playCount, usedM, usedF);
      if (!team1) break;

      const team2 = pickTeam(
        males, females, covered, playCount,
        new Set([...usedM, team1.m.id]),
        new Set([...usedF, team1.f.id])
      );
      if (!team2) break;

      allMatches.push({
        court_id: courts[c].id,
        team1_player1_id: team1.m.id,
        team1_player2_id: team1.f.id,
        team2_player1_id: team2.m.id,
        team2_player2_id: team2.f.id,
        round_number: round,
      });

      usedM.add(team1.m.id); usedM.add(team2.m.id);
      usedF.add(team1.f.id); usedF.add(team2.f.id);
      [team1.m.id, team1.f.id, team2.m.id, team2.f.id].forEach(
        (id) => { playCount[id] = (playCount[id] ?? 0) + 1; }
      );
      covered.add(`${team1.m.id}:${team1.f.id}`);
      covered.add(`${team2.m.id}:${team2.f.id}`);
      scheduledThisRound++;
    }

    if (scheduledThisRound === 0) break;
    round++;
  }

  if (allMatches.length === 0) {
    warnings.push("Could not generate Mixed Doubles schedule. Check player count and gender balance.");
  }

  return { matches: allMatches, resting: [], warnings };
}

// ============================================================
// AMERICANO: round-robin rotation (polygon method)
// ============================================================
function generateAmericano(
  players: Player[],
  courts: Court[]
): { matches: MatchAssignment[]; resting: Player[]; warnings: string[] } {
  const warnings: string[] = [];
  const n = players.length;

  if (n < 4) {
    warnings.push("Need at least 4 players for Americano.");
    return { matches: [], resting: players, warnings };
  }

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

    for (let i = 0; i < half; i++) {
      pairs.push([roundPlayers[i], roundPlayers[roundPlayers.length - 1 - i]]);
    }

    for (let c = 0; c < Math.min(numCourts, Math.floor(pairs.length / 2)); c++) {
      const team1 = pairs[c * 2];
      const team2 = pairs[c * 2 + 1];
      if (!team1 || !team2) break;

      allMatches.push({
        court_id: courts[c].id,
        team1_player1_id: team1[0],
        team1_player2_id: team1[1],
        team2_player1_id: team2[0],
        team2_player2_id: team2[1],
        round_number: round + 1,
      });
    }

    if (list.length > 0) {
      const last = list.pop()!;
      list.unshift(last);
    }
  }

  if (allMatches.length === 0) {
    warnings.push("Could not generate Americano schedule. Check player count.");
  }

  return { matches: allMatches, resting: [], warnings };
}

// ============================================================
// MAIN HANDLER
// ============================================================
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: GenerateMatchesRequest = await req.json();
    const { session_id, players, courts, format, is_knockout, team_assignments } = body;

    if (!session_id || !players?.length || !courts?.length || !format) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── KNOCKOUT MODE ─────────────────────────────────────────
    if (is_knockout) {
      const result = generateKnockoutBracket(players, courts, format, team_assignments);
      if (result.matches.length > 0) {
        const matchRows = result.matches.map((m) => ({
          id: m.id,
          session_id,
          court_id: courts[0].id, // assign first court by default or null
          round_number: m.round,
          match_order: m.matchOrder,
          next_match_id: m.nextMatchId,
          status: "PENDING",
          team1_player1_id: m.team1?.player1?.id ?? null,
          team1_player2_id: m.team1?.player2?.id ?? null,
          team2_player1_id: m.team2?.player1?.id ?? null,
          team2_player2_id: m.team2?.player2?.id ?? null,
          score_data: {},
          score_history: [],
        }));

        const { error: insertError } = await supabase.from("matches").insert(matchRows);
        if (insertError) throw new Error(`Failed to insert knockout matches: ${insertError.message}`);

        await supabase.from("sessions").update({ status: "ACTIVE" }).eq("id", session_id);
      }

      return new Response(JSON.stringify({
        matches: result.matches, // this type doesn't perfectly match MatchAssignment, but frontend usually doesn't use it directly
        resting_player_ids: [],
        warnings: result.warnings,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── REGULAR MODE ──────────────────────────────────────────
    let result: { matches: MatchAssignment[]; resting: Player[]; warnings: string[] };

    switch (format as FormatType) {
      case "SINGLES":
        result = generateSingles(players, courts);
        break;
      case "FIXED_DOUBLES":
        result = generateFixedDoubles(players, courts, body.team_assignments);
        break;
      case "MIXED_DOUBLES":
        result = generateMixedDoubles(players, courts);
        break;
      case "AMERICANO":
        result = generateAmericano(players, courts);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown format: ${format}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    if (result.matches.length > 0) {
      const matchRows = result.matches.map((m) => ({
        session_id,
        court_id: m.court_id,
        round_number: m.round_number,
        status: "PENDING",
        team1_player1_id: m.team1_player1_id,
        team1_player2_id: m.team1_player2_id,
        team2_player1_id: m.team2_player1_id,
        team2_player2_id: m.team2_player2_id,
        score_data: {},
        score_history: [],
      }));

      const { error: insertError } = await supabase.from("matches").insert(matchRows);
      if (insertError) throw new Error(`Failed to insert matches: ${insertError.message}`);

      await supabase.from("sessions").update({ status: "ACTIVE" }).eq("id", session_id);
    }

    const response: GenerateMatchesResponse = {
      matches: result.matches,
      resting_player_ids: result.resting.map((p) => p.id),
      warnings: result.warnings,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

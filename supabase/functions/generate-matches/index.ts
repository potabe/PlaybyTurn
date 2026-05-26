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


// ============================================================
// Rotation Queue: sorts players by priority rules
// Priority: fewest matches played → longest rest time
// ============================================================
function buildRotationQueue(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (a.matches_played !== b.matches_played) {
      return a.matches_played - b.matches_played;
    }
    const aLastPlayed = a.last_played_at
      ? new Date(a.last_played_at).getTime()
      : 0;
    const bLastPlayed = b.last_played_at
      ? new Date(b.last_played_at).getTime()
      : 0;
    return aLastPlayed - bLastPlayed;
  });
}

// ============================================================
// SINGLES: 1v1 — dequeue top 2 per court
// ============================================================
function generateSingles(
  players: Player[],
  courts: Court[]
): { matches: MatchAssignment[]; resting: Player[] } {
  const queue = buildRotationQueue(players);
  const matches: MatchAssignment[] = [];
  const usedPlayerIds = new Set<string>();

  for (const court of courts) {
    const available = queue.filter((p) => !usedPlayerIds.has(p.id));
    if (available.length < 2) break;

    const [p1, p2] = available;
    matches.push({
      court_id: court.id,
      team1_player1_id: p1.id,
      team1_player2_id: null,
      team2_player1_id: p2.id,
      team2_player2_id: null,
      round_number: 1,
    });
    usedPlayerIds.add(p1.id);
    usedPlayerIds.add(p2.id);
  }

  const resting = players.filter((p) => !usedPlayerIds.has(p.id));
  return { matches, resting };
}

// ============================================================
// FIXED DOUBLES: pre-assigned teams rotate round-robin
// If team_assignments provided: full round-robin between all teams
// Otherwise: fallback to rotation queue (auto-pair sequentially)
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

    // Round-robin: every team plays against every other team
    const allMatches: MatchAssignment[] = [];
    const numCourts = courts.length;
    let round = 1;
    let courtIdx = 0;

    // Generate all unique team vs team pairings
    const matchups: [TeamAssignment, TeamAssignment][] = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matchups.push([teams[i], teams[j]]);
      }
    }

    // Schedule matchups into rounds — pack as many courts per round as possible
    // without a team playing twice in the same round
    const scheduled = new Array<boolean>(matchups.length).fill(false);
    let remaining = matchups.length;

    while (remaining > 0) {
      const usedTeamsThisRound = new Set<string>();
      let matchesThisRound = 0;

      for (let idx = 0; idx < matchups.length; idx++) {
        if (scheduled[idx]) continue;
        const [t1, t2] = matchups[idx];
        // Check no player conflicts in this round
        if (
          usedTeamsThisRound.has(t1.player1_id) ||
          usedTeamsThisRound.has(t1.player2_id) ||
          usedTeamsThisRound.has(t2.player1_id) ||
          usedTeamsThisRound.has(t2.player2_id)
        ) continue;

        const court = courts[courtIdx % numCourts];
        allMatches.push({
          court_id: court.id,
          team1_player1_id: t1.player1_id,
          team1_player2_id: t1.player2_id,
          team2_player1_id: t2.player1_id,
          team2_player2_id: t2.player2_id,
          round_number: round,
        });

        usedTeamsThisRound.add(t1.player1_id);
        usedTeamsThisRound.add(t1.player2_id);
        usedTeamsThisRound.add(t2.player1_id);
        usedTeamsThisRound.add(t2.player2_id);
        scheduled[idx] = true;
        remaining--;
        courtIdx++;
        matchesThisRound++;

        if (matchesThisRound >= numCourts) break; // courts full for this round
      }

      if (matchesThisRound === 0) break; // safety
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
      // Large penalty for already-covered partnerships so we exhaust new ones first
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

  // Target: cover every unique (M, F) partnership at least once
  const totalPartnerships = males.length * females.length;
  const covered = new Set<string>(); // "mId:fId"

  // Track how many matches each individual player has played this session
  const playCount: Record<string, number> = {};
  [...males, ...females].forEach((p) => { playCount[p.id] = 0; });

  const numCourts = courts.length;
  let round = 1;

  // Safety ceiling: need at most ceil(totalPartnerships / (numCourts * 2)) rounds
  // to cover all pairs (each round covers 2 new pairs per court). Add buffer.
  const maxRounds = Math.ceil(totalPartnerships / (numCourts * 2)) * 2 + 10;

  while (covered.size < totalPartnerships && round <= maxRounds) {
    const usedM = new Set<string>();
    const usedF = new Set<string>();
    let scheduledThisRound = 0;

    for (let c = 0; c < numCourts; c++) {
      // Pick team1
      const team1 = pickTeam(males, females, covered, playCount, usedM, usedF);
      if (!team1) break;

      // Pick team2: must use a DIFFERENT male and DIFFERENT female
      const team2 = pickTeam(
        males,
        females,
        covered,
        playCount,
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

      // Mark players as used in this round
      usedM.add(team1.m.id); usedM.add(team2.m.id);
      usedF.add(team1.f.id); usedF.add(team2.f.id);

      // Update global play counts and covered partnerships
      [team1.m.id, team1.f.id, team2.m.id, team2.f.id].forEach(
        (id) => { playCount[id] = (playCount[id] ?? 0) + 1; }
      );
      covered.add(`${team1.m.id}:${team1.f.id}`);
      covered.add(`${team2.m.id}:${team2.f.id}`);
      scheduledThisRound++;
    }

    if (scheduledThisRound === 0) break; // No progress possible
    round++;
  }

  if (allMatches.length === 0) {
    warnings.push(
      "Could not generate Mixed Doubles schedule. Check player count and gender balance."
    );
  }

  return { matches: allMatches, resting: [], warnings };
}

// ============================================================
// AMERICANO: round-robin rotation
// Uses the "polygon method" for even N, handles odd N with bye
// Returns ALL rounds upfront (deterministic full schedule)
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
    const { session_id, players, courts, format } = body;

    if (!session_id || !players?.length || !courts?.length || !format) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: { matches: MatchAssignment[]; resting: Player[]; warnings: string[] };

    switch (format as FormatType) {
      case "SINGLES": {
        const singlesResult = generateSingles(players, courts);
        result = { ...singlesResult, warnings: [] };
        break;
      }
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

      const { error: insertError } = await supabase
        .from("matches")
        .insert(matchRows);

      if (insertError) {
        throw new Error(`Failed to insert matches: ${insertError.message}`);
      }

      await supabase
        .from("sessions")
        .update({ status: "ACTIVE" })
        .eq("id", session_id);
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

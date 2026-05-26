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
// FIXED DOUBLES: static team pairs rotate as units
// ============================================================
function generateFixedDoubles(
  players: Player[],
  courts: Court[]
): { matches: MatchAssignment[]; resting: Player[]; warnings: string[] } {
  const warnings: string[] = [];
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
// MIXED DOUBLES: strict 1M + 1F per team, multi-round rotation
// With 10 players (5M+5F) & 1 court → generates multiple rounds
// ============================================================
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
  const numCourts = courts.length;

  // Max matches schedulable per round
  const matchesPerRound = Math.min(
    Math.floor(males.length / 2),
    Math.floor(females.length / 2),
    numCourts
  );

  // Generate enough rounds so all players rotate partners
  const numRounds = Math.max(males.length, females.length);

  // Polygon method: fix first male & first female, rotate the rest
  const maleIds = males.map((p) => p.id);
  const femaleIds = females.map((p) => p.id);
  const maleFixed = maleIds.splice(0, 1)[0];
  const femaleFixed = femaleIds.splice(0, 1)[0];

  for (let round = 0; round < numRounds; round++) {
    const roundMales = [maleFixed, ...maleIds];
    const roundFemales = [femaleFixed, ...femaleIds];
    const usedThisRound = new Set<string>();

    for (let c = 0; c < matchesPerRound; c++) {
      const court = courts[c % numCourts];
      const m1 = roundMales[c * 2];
      const m2 = roundMales[c * 2 + 1];
      const f1 = roundFemales[c * 2];
      const f2 = roundFemales[c * 2 + 1];

      if (!m1 || !m2 || !f1 || !f2) break;
      if (usedThisRound.has(m1) || usedThisRound.has(m2) ||
          usedThisRound.has(f1) || usedThisRound.has(f2)) continue;

      allMatches.push({
        court_id: court.id,
        team1_player1_id: m1,
        team1_player2_id: f1,
        team2_player1_id: m2,
        team2_player2_id: f2,
        round_number: round + 1,
      });
      usedThisRound.add(m1); usedThisRound.add(m2);
      usedThisRound.add(f1); usedThisRound.add(f2);
    }

    // Rotate for next round
    if (maleIds.length > 0) { const l = maleIds.pop()!; maleIds.unshift(l); }
    if (femaleIds.length > 0) { const l = femaleIds.pop()!; femaleIds.unshift(l); }
  }

  if (allMatches.length === 0) {
    warnings.push("Could not generate Mixed Doubles schedule. Check player count.");
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

  // Americano round-robin: each player partners with every other player
  // Using social golfer pairing for doubles
  const allMatches: MatchAssignment[] = [];
  const ids = players.map((p) => p.id);

  // For Americano, generate round by round pairings
  // Each round: pair players into 2-person teams, then match teams
  const numCourts = courts.length;
  const playersPerRound = numCourts * 4;
  const roundQueue = buildRotationQueue(players);

  // Generate pairs using round-robin tournament scheduling
  let list = [...ids];
  const numRounds = n % 2 === 0 ? n - 1 : n;
  // Fixed element for even rotation (polygon method)
  const fixed = n % 2 === 0 ? list.splice(0, 1)[0] : null;

  for (let round = 0; round < numRounds; round++) {
    const roundPlayers: string[] = fixed ? [fixed, ...list] : [...list];
    const half = Math.floor(roundPlayers.length / 2);
    const pairs: [string, string][] = [];

    for (let i = 0; i < half; i++) {
      pairs.push([roundPlayers[i], roundPlayers[roundPlayers.length - 1 - i]]);
    }

    // Match pairs against each other per court
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

    // Rotate (polygon method): move last element to position 1
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

    // Validate
    if (!session_id || !players?.length || !courts?.length || !format) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: { matches: MatchAssignment[]; resting: Player[]; warnings: string[] };

    switch (format as FormatType) {
      case "SINGLES":
        const singlesResult = generateSingles(players, courts);
        result = { ...singlesResult, warnings: [] };
        break;
      case "FIXED_DOUBLES":
        result = generateFixedDoubles(players, courts);
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

    // Insert matches into DB
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

      // Update session status to ACTIVE
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

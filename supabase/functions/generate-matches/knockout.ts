import type {
  Player,
  Court,
  FormatType,
  TeamAssignment,
  MatchAssignment,
} from "../_shared/types.ts";

export interface KnockoutTeam {
  id: string; // unique string to represent the team
  player1: Player;
  player2: Player | null;
}

export interface KnockoutMatchNode {
  id: string; // temp local ID
  round: number;
  matchOrder: number;
  team1: KnockoutTeam | null | "BYE";
  team2: KnockoutTeam | null | "BYE";
  nextMatchId: string | null;
}

// Standard seeding pattern for a bracket of size M (power of 2)
// e.g. M=8 -> [1, 8, 4, 5, 2, 7, 3, 6]
function getSeedingPattern(M: number): number[] {
  let pattern = [1, 2];
  while (pattern.length < M) {
    const nextPattern: number[] = [];
    const currentM = pattern.length * 2;
    for (const seed of pattern) {
      nextPattern.push(seed);
      nextPattern.push(currentM - seed + 1);
    }
    pattern = nextPattern;
  }
  return pattern;
}

export function generateKnockoutBracket(
  players: Player[],
  courts: Court[],
  format: FormatType,
  teamAssignments?: TeamAssignment[]
): { matches: KnockoutMatchNode[]; warnings: string[] } {
  const warnings: string[] = [];
  const teams: KnockoutTeam[] = [];

  // 1. Form Teams
  if (format === "SINGLES") {
    players.forEach((p) => {
      teams.push({ id: p.id, player1: p, player2: null });
    });
  } else {
    // Doubles formats
    if (teamAssignments && teamAssignments.length > 0) {
      const pMap = new Map(players.map((p) => [p.id, p]));
      teamAssignments.forEach((ta, idx) => {
        const p1 = pMap.get(ta.player1_id);
        const p2 = pMap.get(ta.player2_id);
        if (p1 && p2) {
          teams.push({ id: `team_${idx}`, player1: p1, player2: p2 });
        }
      });
    } else {
      // Auto pair
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length - 1; i += 2) {
        teams.push({
          id: `team_${i / 2}`,
          player1: shuffled[i],
          player2: shuffled[i + 1],
        });
      }
    }
  }

  const N = teams.length;
  if (N < 2) {
    warnings.push("Not enough teams for a knockout bracket.");
    return { matches: [], warnings };
  }

  // 2. Determine bracket size (next power of 2)
  const M = Math.pow(2, Math.ceil(Math.log2(N)));
  const totalRounds = Math.log2(M);

  // 3. Shuffle teams for random seeding
  teams.sort(() => Math.random() - 0.5);
  
  // Pad with BYEs
  const seededTeams: (KnockoutTeam | "BYE")[] = new Array(M).fill("BYE");
  const pattern = getSeedingPattern(M);
  for (let i = 0; i < N; i++) {
    // pattern[i] is the seed number (1-based)
    // we put team i at the index of that seed
    const seedIndex = pattern.indexOf(i + 1);
    seededTeams[seedIndex] = teams[i];
  }

  // 4. Build Full Binary Tree
  // We represent it as an array of matches, where index 1 is the final,
  // 2 and 3 are SFs, 4,5,6,7 are QFs, etc.
  const numMatches = M - 1;
  const tree: KnockoutMatchNode[] = [];
  
  for (let i = 0; i <= numMatches; i++) {
    tree.push({
      id: crypto.randomUUID(),
      round: 0,
      matchOrder: 0,
      team1: null,
      team2: null,
      nextMatchId: null,
    });
  }

  // Assign rounds and links
  let currentMatch = 1;
  for (let r = totalRounds; r >= 1; r--) {
    const matchesInRound = Math.pow(2, totalRounds - r);
    for (let m = 0; m < matchesInRound; m++) {
      tree[currentMatch].round = r;
      // The parent of node i in a 1-based binary tree is floor(i/2)
      if (currentMatch > 1) {
        tree[currentMatch].nextMatchId = tree[Math.floor(currentMatch / 2)].id;
      }
      currentMatch++;
    }
  }

  // Assign initial teams to the leaf nodes (Round 1)
  // Leaf nodes are at indices M/2 to M-1 in our array
  let seedIdx = 0;
  for (let i = M / 2; i < M; i++) {
    tree[i].team1 = seededTeams[seedIdx++];
    tree[i].team2 = seededTeams[seedIdx++];
  }

  // Now, we have a full tree. Some matches are "BYE vs BYE" (if M is much larger than N, though we use next power of 2 so at most half are BYEs, meaning no BYE vs BYE will happen in round 1 with standard seeding).
  // Some matches are "Team vs BYE".
  // We will process the tree bottom-up to advance BYEs.
  
  // Actually, processing BYEs on the server:
  // If a node has a BYE as one of its teams, the other team automatically advances to the parent node.
  // Then we mark this node as deleted (or just don't return it).
  for (let i = M - 1; i >= 1; i--) {
    const node = tree[i];
    if (!node.team1 && !node.team2) continue; // Intermediate node, will be filled later

    if (node.team1 === "BYE" && node.team2 === "BYE") {
      // Should not happen with M = next power of 2
    } else if (node.team1 === "BYE" || node.team2 === "BYE") {
      // Advance the real team to the parent node
      const realTeam = node.team1 !== "BYE" ? node.team1 : node.team2;
      const parentIdx = Math.floor(i / 2);
      if (parentIdx > 0) {
        const parent = tree[parentIdx];
        if (i % 2 === 0) {
          parent.team1 = realTeam; // Left child
        } else {
          parent.team2 = realTeam; // Right child
        }
      }
      // This match is a ghost match, we won't insert it.
      node.team1 = null; 
      node.team2 = null;
    } else {
      // Real match. 
      // If it's a leaf node, we keep it. If it's an intermediate node, it's a future match.
    }
  }

  // Filter out the ghost matches
  const validMatches = tree.slice(1).filter(m => {
    // A match is valid if it's a real match (both teams present) OR it's a future match (one or both teams null, meaning waiting for winner of previous round)
    // Wait, if BOTH teams are null, is it a ghost match or a future match?
    // If it's a future match, its children must be valid matches.
    // Actually, any match that is not resolved as a BYE is a valid match.
    // When we advanced BYEs, we set node.team1 = null and node.team2 = null for the ghost match.
    // But a true future match (e.g. final) also starts with null teams!
    // So how to distinguish?
    return true;
  });

  // A better way to distinguish is to keep track of which matches are "ghosts".
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
    } else if (isGhost[i * 2] && isGhost[i * 2 + 1]) {
        // If both children are ghosts, this node might also be a ghost if it resolves immediately?
        // Actually, with standard seeding, this never happens because BYEs don't play each other.
    }
  }

  // Set match orders
  let order = 1;
  const finalMatches: KnockoutMatchNode[] = [];
  
  // We want to return them ordered by round, then by matchOrder
  for (let r = 1; r <= totalRounds; r++) {
    const roundMatches = tree.slice(1).filter(m => m.round === r && !isGhost[tree.indexOf(m)]);
    for (const m of roundMatches) {
      m.matchOrder = order++;
      finalMatches.push(m);
    }
  }

  // Because some parents might be ghosts, we need to update nextMatchId to point to the next VALID match.
  // For a Knockout tree, if a node's parent is a ghost, it means the node's winner advances through the ghost to the grandparent.
  for (const m of finalMatches) {
    let nextIdx = Math.floor(tree.indexOf(m) / 2);
    while (nextIdx > 0 && isGhost[nextIdx]) {
      nextIdx = Math.floor(nextIdx / 2);
    }
    if (nextIdx > 0) {
      m.nextMatchId = tree[nextIdx].id;
    } else {
      m.nextMatchId = null; // Final match
    }
  }

  return { matches: finalMatches, warnings };
}

import React from "react";
import type { Match, Player } from "@/types/session";

interface TournamentBracketProps {
  matches: Match[];
  players: Player[];
  isAdmin?: boolean;
}

// Helper to resolve player names
function getTeamName(p1Id: string | null, p2Id: string | null, playersMap: Record<string, Player>) {
  if (!p1Id) return "TBD";
  const p1 = playersMap[p1Id]?.name ?? "Unknown";
  if (p2Id) {
    const p2 = playersMap[p2Id]?.name ?? "Unknown";
    // Get initials or first names
    return `${p1.split(" ")[0]} & ${p2.split(" ")[0]}`;
  }
  return p1;
}

export function TournamentBracket({ matches, players, isAdmin }: TournamentBracketProps) {
  const playersMap = Object.fromEntries(players.map((p) => [p.id, p]));

  // Group matches by round
  const maxRound = Math.max(...matches.map(m => m.round_number), 1);
  const rounds: { round: number; matches: Match[] }[] = [];
  
  for (let r = 1; r <= maxRound; r++) {
    rounds.push({
      round: r,
      matches: matches.filter(m => m.round_number === r).sort((a, b) => (a.match_order ?? 0) - (b.match_order ?? 0)),
    });
  }

  return (
    <div className="w-full overflow-x-auto pb-8 pt-4">
      <div className="flex items-start gap-8 min-w-max px-4">
        {rounds.map((r, roundIndex) => (
          <div key={r.round} className="flex flex-col gap-8 w-[240px]">
            {/* Round Header */}
            <div className="text-center font-bold text-sm text-primary uppercase tracking-wider mb-2">
              {r.round === maxRound ? "Final" : r.round === maxRound - 1 ? "Semifinal" : `Round ${r.round}`}
            </div>

            {/* Match Nodes */}
            <div className="flex flex-col flex-1 justify-around gap-4">
              {r.matches.map((match) => {
                const team1Name = getTeamName(match.team1_player1_id, match.team1_player2_id, playersMap);
                const team2Name = getTeamName(match.team2_player1_id, match.team2_player2_id, playersMap);
                
                const isT1Winner = match.winning_team === "TEAM1";
                const isT2Winner = match.winning_team === "TEAM2";

                return (
                  <div key={match.id} className="relative flex flex-col">
                    <div className="bg-white border-2 border-border rounded-xl overflow-hidden shadow-sm hover:border-primary/50 transition-colors">
                      {/* Team 1 */}
                      <div className={`flex justify-between items-center px-3 py-2 border-b border-border ${isT1Winner ? 'bg-primary/10' : ''}`}>
                        <span className={`text-sm truncate mr-2 ${isT1Winner ? 'font-bold text-primary' : 'font-medium text-slate-700'}`}>
                          {team1Name}
                        </span>
                        {match.status === "COMPLETED" && (
                          <span className={`text-xs font-bold ${isT1Winner ? 'text-primary' : 'text-muted-foreground'}`}>
                            {isT1Winner ? "W" : "L"}
                          </span>
                        )}
                      </div>
                      {/* Team 2 */}
                      <div className={`flex justify-between items-center px-3 py-2 ${isT2Winner ? 'bg-primary/10' : ''}`}>
                        <span className={`text-sm truncate mr-2 ${isT2Winner ? 'font-bold text-primary' : 'font-medium text-slate-700'}`}>
                          {team2Name}
                        </span>
                        {match.status === "COMPLETED" && (
                          <span className={`text-xs font-bold ${isT2Winner ? 'text-primary' : 'text-muted-foreground'}`}>
                            {isT2Winner ? "W" : "L"}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Connector Lines (Right side, unless it's the final round) */}
                    {roundIndex < rounds.length - 1 && (
                      <div className="absolute top-1/2 -right-4 w-4 h-px bg-border" />
                    )}
                    {/* Connector Lines (Left side, unless it's the first round) */}
                    {roundIndex > 0 && (
                      <div className="absolute top-1/2 -left-4 w-4 h-px bg-border" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

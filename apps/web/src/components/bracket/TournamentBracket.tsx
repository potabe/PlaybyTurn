import React, { useState } from "react";
import type { Match, Player, Session } from "@/types/session";
import { getTeamName } from "@/lib/utils/team";

export interface TeamSlot {
  matchId: string;
  teamIndex: 1 | 2;
}

interface TournamentBracketProps {
  session: Session;
  matches: Match[];
  players: Player[];
  isAdmin?: boolean;
  isEditMode?: boolean;
  onSwap?: (slot1: TeamSlot, slot2: TeamSlot) => void;
}

export function TournamentBracket({ session, matches, players, isAdmin, isEditMode, onSwap }: TournamentBracketProps) {
  const playersMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const [selectedSlot, setSelectedSlot] = useState<TeamSlot | null>(null);

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
                const team1Name = getTeamName(match.team1_player1_id, match.team1_player2_id, playersMap, session);
                const team2Name = getTeamName(match.team2_player1_id, match.team2_player2_id, playersMap, session);
                
                const isT1Winner = match.winning_team === "TEAM1";
                const isT2Winner = match.winning_team === "TEAM2";

                const handleSlotClick = (teamIndex: 1 | 2, teamName: string) => {
                  if (!isEditMode || teamName === "TBD") return;
                  const slot: TeamSlot = { matchId: match.id, teamIndex };
                  
                  if (!selectedSlot) {
                    setSelectedSlot(slot);
                  } else {
                    if (selectedSlot.matchId === slot.matchId && selectedSlot.teamIndex === slot.teamIndex) {
                      setSelectedSlot(null); // Deselect
                    } else {
                      onSwap?.(selectedSlot, slot);
                      setSelectedSlot(null); // Reset after swap
                    }
                  }
                };

                const isSlotSelected = (teamIndex: 1 | 2) => 
                  selectedSlot?.matchId === match.id && selectedSlot?.teamIndex === teamIndex;

                return (
                  <div key={match.id} className="relative flex flex-col">
                    <div className={`bg-card border-2 rounded-xl overflow-hidden shadow-sm transition-colors ${
                      isEditMode ? "border-primary/40 shadow-primary/10" : "border-border hover:border-primary/50"
                    }`}>
                      {/* Team 1 */}
                      <div 
                        onClick={() => handleSlotClick(1, team1Name)}
                        className={`flex justify-between items-center px-3 py-2 border-b border-border transition-colors ${
                          isEditMode && team1Name !== "TBD" ? "cursor-pointer hover:bg-primary/10" : ""
                        } ${isSlotSelected(1) ? "bg-primary/20" : isT1Winner ? 'bg-primary/10' : ''}`}
                      >
                        <span className={`text-sm truncate mr-2 ${isT1Winner || isSlotSelected(1) ? 'font-bold text-primary' : 'font-medium text-slate-700'}`}>
                          {team1Name}
                        </span>
                        {match.status === "COMPLETED" && (
                          <span className={`text-xs font-bold ${isT1Winner ? 'text-primary' : 'text-muted-foreground'}`}>
                            {isT1Winner ? "W" : "L"}
                          </span>
                        )}
                      </div>
                      {/* Team 2 */}
                      <div 
                        onClick={() => handleSlotClick(2, team2Name)}
                        className={`flex justify-between items-center px-3 py-2 transition-colors ${
                          isEditMode && team2Name !== "TBD" ? "cursor-pointer hover:bg-primary/10" : ""
                        } ${isSlotSelected(2) ? "bg-primary/20" : isT2Winner ? 'bg-primary/10' : ''}`}
                      >
                        <span className={`text-sm truncate mr-2 ${isT2Winner || isSlotSelected(2) ? 'font-bold text-primary' : 'font-medium text-slate-700'}`}>
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

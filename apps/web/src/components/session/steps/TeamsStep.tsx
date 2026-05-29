"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconArrowsShuffle, IconX, IconChevronRight, IconAlertTriangle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { SetupForm, TeamAssignmentInput } from "../SessionSetupWizard";

interface Props {
  form: SetupForm;
  setForm: React.Dispatch<React.SetStateAction<SetupForm>>;
  onNext: () => void;
}

export function TeamsStep({ form, setForm, onNext }: Props) {
  const [selectedPlayer1Id, setSelectedPlayer1Id] = useState<string | null>(null);

  const players = form.players.filter((p) => p.name.trim());
  const teams = form.teamAssignments;

  const assignedIds = new Set(teams.flatMap((t) => [t.player1_id, t.player2_id]));
  const freePlayers = players.filter((p) => !assignedIds.has(p.id));

  function handlePlayerClick(id: string) {
    if (!selectedPlayer1Id) {
      setSelectedPlayer1Id(id);
    } else if (selectedPlayer1Id === id) {
      setSelectedPlayer1Id(null);
    } else {
      setForm((f) => ({
        ...f,
        teamAssignments: [
          ...f.teamAssignments,
          { player1_id: selectedPlayer1Id, player2_id: id },
        ],
      }));
      setSelectedPlayer1Id(null);
    }
  }

  function updateTeamName(idx: number, newName: string) {
    setForm((f) => {
      const newTeams = [...f.teamAssignments];
      newTeams[idx] = { ...newTeams[idx], team_name: newName };
      return { ...f, teamAssignments: newTeams };
    });
  }

  function removeTeam(idx: number) {
    setSelectedPlayer1Id(null);
    setForm((f) => ({
      ...f,
      teamAssignments: f.teamAssignments.filter((_, i) => i !== idx),
    }));
  }

  function randomize() {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const newTeams: TeamAssignmentInput[] = [];
    for (let i = 0; i < Math.floor(shuffled.length / 2); i++) {
      newTeams.push({
        player1_id: shuffled[i * 2].id,
        player2_id: shuffled[i * 2 + 1].id,
      });
    }
    setForm((f) => ({ ...f, teamAssignments: newTeams }));
    setSelectedPlayer1Id(null);
  }

  const canProceed = teams.length >= 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black">Assign Teams</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Pair up your players. Teams play round-robin against each other.
        </p>
      </div>

      {/* Randomize button */}
      <button
        onClick={randomize}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-primary/30 text-primary font-bold text-sm hover:bg-primary/5 hover:border-primary/50 transition-all active:scale-98"
        id="randomize-teams-btn"
      >
        <IconArrowsShuffle className="h-4 w-4" />
        Randomize All Teams
      </button>

      {/* Assigned teams */}
      <AnimatePresence mode="popLayout">
        {teams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Teams ({teams.length})
            </p>
            {teams.map((team, idx) => {
              const p1 = players.find((p) => p.id === team.player1_id);
              const p2 = players.find((p) => p.id === team.player2_id);
              return (
                <motion.div
                  key={`${team.player1_id}-${team.player2_id}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
                  layout
                  className="flex flex-col gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-black text-muted-foreground flex-shrink-0">
                      T{idx + 1}
                    </span>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className={`text-sm font-semibold rounded-lg px-2.5 py-1 truncate ${p1?.gender === 'MALE' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'}`}>
                        {p1?.gender === 'MALE' ? '♂️' : '♀️'} {p1?.name}
                      </span>
                      <span className="text-xs font-black text-muted-foreground flex-shrink-0">+</span>
                      <span className={`text-sm font-semibold rounded-lg px-2.5 py-1 truncate ${p2?.gender === 'MALE' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'}`}>
                        {p2?.gender === 'MALE' ? '♂️' : '♀️'} {p2?.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeTeam(idx)}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
                      aria-label={`Remove team ${idx + 1}`}
                      id={`remove-team-${idx}-btn`}
                    >
                      <IconX className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="pl-9 pr-8 mt-1">
                    <input
                      type="text"
                      placeholder={`Custom Name (e.g. The Smashers)`}
                      className="w-full text-xs font-bold bg-muted/30 border border-border/50 focus:border-primary/50 focus:bg-card rounded-lg px-3 py-2 outline-none transition-all placeholder:font-medium"
                      value={team.team_name || ""}
                      onChange={(e) => updateTeamName(idx, e.target.value)}
                    />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unassigned players picker */}
      {freePlayers.length > 0 && (
        <div className="space-y-3">
          {/* Instruction banner */}
          <div className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors ${
            selectedPlayer1Id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground border border-border"
          }`}>
            {selectedPlayer1Id
              ? "✨ First player selected — now tap a second player to pair"
              : "👇 Tap a player to start pairing"}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {freePlayers.map((p) => {
              const isSelected = selectedPlayer1Id === p.id;
              const isMale = p.gender === 'MALE';
              const baseColors = isMale 
                ? "bg-blue-50 text-blue-800 border-blue-100 hover:border-blue-300 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/40"
                : "bg-pink-50 text-pink-800 border-pink-100 hover:border-pink-300 hover:bg-pink-100 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-300 dark:hover:bg-pink-900/40";
              const selectedColors = "bg-primary text-primary-foreground shadow-md scale-[1.02] border-transparent";

              return (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePlayerClick(p.id)}
                  className={`text-left rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 border ${
                    isSelected ? selectedColors : baseColors
                  }`}
                  id={`select-player-${p.id}`}
                >
                  <span className="mr-1">{isMale ? '♂️' : '♀️'}</span>
                  {p.name}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* All paired + no unassigned */}
      {freePlayers.length === 0 && teams.length > 0 && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-semibold flex items-center gap-2 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
          ✨ All players have been paired into teams!
        </div>
      )}

      {/* Odd players warning */}
      {players.length % 2 !== 0 && (
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3 dark:bg-amber-900/20 dark:border-amber-800">
          <IconAlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-400">
            You have an odd number of players ({players.length}). 1 player won't be assigned to a team.
          </p>
        </div>
      )}

      {/* Summary + next */}
      <Button
        className="w-full h-12 rounded-xl font-bold text-base"
        onClick={onNext}
        disabled={!canProceed}
        id="teams-next-btn"
      >
        Continue with {teams.length} team{teams.length !== 1 ? "s" : ""}
        <IconChevronRight className="h-5 w-5 ml-1" />
      </Button>
    </div>
  );
}

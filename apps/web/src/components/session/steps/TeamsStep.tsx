"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, X, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SetupForm, TeamAssignmentInput } from "../SessionSetupWizard";

interface Props {
  form: SetupForm;
  setForm: React.Dispatch<React.SetStateAction<SetupForm>>;
  onNext: () => void;
}

export function TeamsStep({ form, setForm, onNext }: Props) {
  const [selectedMaleId, setSelectedMaleId] = useState<string | null>(null);

  const males = form.players.filter((p) => p.gender === "MALE" && p.name.trim());
  const females = form.players.filter((p) => p.gender === "FEMALE" && p.name.trim());
  const teams = form.teamAssignments;

  const assignedIds = new Set(teams.flatMap((t) => [t.player1_id, t.player2_id]));
  const freeMales = males.filter((p) => !assignedIds.has(p.id));
  const freeFemales = females.filter((p) => !assignedIds.has(p.id));

  // ── Pair a male with a female ──────────────────────────────
  function handleMaleClick(id: string) {
    setSelectedMaleId((prev) => (prev === id ? null : id));
  }

  function handleFemaleClick(femaleId: string) {
    if (!selectedMaleId) return;
    setForm((f) => ({
      ...f,
      teamAssignments: [
        ...f.teamAssignments,
        { player1_id: selectedMaleId, player2_id: femaleId },
      ],
    }));
    setSelectedMaleId(null);
  }

  function updateTeamName(idx: number, newName: string) {
    setForm((f) => {
      const newTeams = [...f.teamAssignments];
      newTeams[idx] = { ...newTeams[idx], team_name: newName };
      return { ...f, teamAssignments: newTeams };
    });
  }

  function removeTeam(idx: number) {
    setSelectedMaleId(null);
    setForm((f) => ({
      ...f,
      teamAssignments: f.teamAssignments.filter((_, i) => i !== idx),
    }));
  }

  // ── Auto-randomize 1M + 1F pairs ─────────────────────────
  function randomize() {
    const shuffledMales = [...males].sort(() => Math.random() - 0.5);
    const shuffledFemales = [...females].sort(() => Math.random() - 0.5);
    const count = Math.min(shuffledMales.length, shuffledFemales.length);
    const newTeams: TeamAssignmentInput[] = Array.from({ length: count }, (_, i) => ({
      player1_id: shuffledMales[i].id,
      player2_id: shuffledFemales[i].id,
    }));
    setForm((f) => ({ ...f, teamAssignments: newTeams }));
    setSelectedMaleId(null);
  }

  const hasMismatch = males.length !== females.length;
  const canProceed = teams.length >= 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black">Assign Teams</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Pair 1 male + 1 female per team. Teams play round-robin against each other.
        </p>
      </div>

      {/* Randomize button */}
      <button
        onClick={randomize}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-primary/30 text-primary font-bold text-sm hover:bg-primary/5 hover:border-primary/50 transition-all active:scale-98"
        id="randomize-teams-btn"
      >
        <Shuffle className="h-4 w-4" />
        Randomize All Teams
      </button>

      {/* ── Assigned teams ── */}
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
              const male = males.find((p) => p.id === team.player1_id);
              const female = females.find((p) => p.id === team.player2_id);
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
                      <span className="text-sm font-semibold bg-blue-50 text-blue-700 rounded-lg px-2.5 py-1 truncate">
                        💙 {male?.name}
                      </span>
                      <span className="text-xs font-black text-muted-foreground flex-shrink-0">+</span>
                      <span className="text-sm font-semibold bg-pink-50 text-pink-700 rounded-lg px-2.5 py-1 truncate">
                        🩷 {female?.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeTeam(idx)}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
                      aria-label={`Remove team ${idx + 1}`}
                      id={`remove-team-${idx}-btn`}
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
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

      {/* ── Unassigned players picker ── */}
      {(freeMales.length > 0 || freeFemales.length > 0) && (
        <div className="space-y-3">
          {/* Instruction banner */}
          <div className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors ${
            selectedMaleId
              ? "bg-pink-500 text-white"
              : "bg-blue-50 text-blue-700 border border-blue-100"
          }`}>
            {selectedMaleId
              ? "✅ Male selected — now tap a female to pair"
              : "👆 Tap a male to start pairing"}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Males column */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-blue-600">
                💙 Males ({freeMales.length})
              </p>
              {freeMales.map((p) => (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMaleClick(p.id)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                    selectedMaleId === p.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-[1.02]"
                      : "bg-blue-50 text-blue-800 border border-blue-100 hover:border-blue-300 hover:bg-blue-100"
                  }`}
                  id={`select-male-${p.id}`}
                >
                  {p.name}
                </motion.button>
              ))}
            </div>

            {/* Females column */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-pink-600">
                🩷 Females ({freeFemales.length})
              </p>
              {freeFemales.map((p) => (
                <motion.button
                  key={p.id}
                  whileTap={selectedMaleId ? { scale: 0.95 } : {}}
                  onClick={() => handleFemaleClick(p.id)}
                  disabled={!selectedMaleId}
                  className={`w-full text-left rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                    selectedMaleId
                      ? "bg-pink-500 text-white shadow-md shadow-pink-200 hover:bg-pink-600 cursor-pointer"
                      : "bg-pink-50 text-pink-800 border border-pink-100 opacity-40 cursor-not-allowed"
                  }`}
                  id={`select-female-${p.id}`}
                >
                  {p.name}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All paired + no unassigned */}
      {freeMales.length === 0 && freeFemales.length === 0 && teams.length > 0 && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-semibold flex items-center gap-2">
          ✅ All players have been paired into teams!
        </div>
      )}

      {/* Gender mismatch warning */}
      {hasMismatch && (
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            You have {males.length} male(s) and {females.length} female(s).{" "}
            {Math.abs(males.length - females.length)} player(s) won&apos;t be assigned to a team.
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
        <ChevronRight className="h-5 w-5 ml-1" />
      </Button>
    </div>
  );
}

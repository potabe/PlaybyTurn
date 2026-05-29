"use client";

import { motion, AnimatePresence } from "framer-motion";
import { IconPlus, IconTrash, IconUser, IconAlertTriangle } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SetupForm, PlayerInput } from "@/components/session/SessionSetupWizard";
import { FORMAT_MIN_PLAYERS } from "@/lib/utils/format";
import type { GenderType } from "@/types/session";

interface Props {
  form: SetupForm;
  setForm: React.Dispatch<React.SetStateAction<SetupForm>>;
  onNext: () => void;
}

// Validate players for the chosen format
function validate(form: SetupForm): string | null {
  const filled = form.players.filter((p) => p.name.trim());
  const min = form.format ? FORMAT_MIN_PLAYERS[form.format] : 2;

  if (filled.length < min) {
    return `At least ${min} players required for ${form.format?.replace("_", " ").toLowerCase()}.`;
  }
  if (form.format === "MIXED_DOUBLES") {
    const males = filled.filter((p) => p.gender === "MALE").length;
    const females = filled.filter((p) => p.gender === "FEMALE").length;
    if (males < 2 || females < 2) {
      return "Mixed Doubles needs at least 2 male and 2 female players.";
    }
    if (males % 2 !== females % 2) {
      return `Unequal M/F ratio (${males}M / ${females}F). Some courts may be limited.`;
    }
  }
  return null;
}

function GenderToggle({
  value,
  onChange,
}: {
  value: GenderType;
  onChange: (g: GenderType) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden flex-shrink-0">
      {(["MALE", "FEMALE"] as GenderType[]).map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={`px-3 py-2 text-xs font-bold transition-colors ${
            value === g
              ? g === "MALE"
                ? "bg-blue-500 text-white"
                : "bg-pink-500 text-white"
              : "bg-card text-muted-foreground hover:bg-muted"
          }`}
          aria-label={g === "MALE" ? "Male" : "Female"}
          title={g === "MALE" ? "Male" : "Female"}
        >
          {g === "MALE" ? "M" : "F"}
        </button>
      ))}
    </div>
  );
}

export function PlayersStep({ form, setForm, onNext }: Props) {
  const validationError = validate(form);
  const hasWarning =
    validationError?.includes("ratio") || validationError?.includes("Unequal");
  const hasError = !!validationError && !hasWarning;

  function addPlayer() {
    setForm((f) => ({
      ...f,
      players: [
        ...f.players,
        { id: crypto.randomUUID(), name: "", gender: "MALE" },
      ],
    }));
  }

  function removePlayer(id: string) {
    setForm((f) => ({
      ...f,
      players: f.players.filter((p) => p.id !== id),
    }));
  }

  function updatePlayer(id: string, patch: Partial<PlayerInput>) {
    setForm((f) => ({
      ...f,
      players: f.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }

  const filled = form.players.filter((p) => p.name.trim()).length;
  const males = form.players.filter((p) => p.name.trim() && p.gender === "MALE").length;
  const females = form.players.filter((p) => p.name.trim() && p.gender === "FEMALE").length;
  const showGenderSummary = form.format === "MIXED_DOUBLES";

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-2xl font-black tracking-tight">Add players</h2>
        <span className="mt-1 rounded-full bg-primary/10 text-primary text-xs font-bold px-3 py-1">
          {filled} added
        </span>
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        Enter each player's name and tap M/F for gender.
      </p>

      {/* Gender summary for Mixed Doubles */}
      {showGenderSummary && (
        <div className="mb-4 flex gap-3">
          <div className="flex-1 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-center">
            <p className="text-xs text-blue-600 font-medium">Male</p>
            <p className="text-2xl font-black text-blue-700">{males}</p>
          </div>
          <div className="flex-1 rounded-xl bg-pink-50 border border-pink-100 px-3 py-2 text-center">
            <p className="text-xs text-pink-600 font-medium">Female</p>
            <p className="text-2xl font-black text-pink-700">{females}</p>
          </div>
        </div>
      )}

      {/* Player list */}
      <div className="space-y-2 mb-4">
        <AnimatePresence initial={false}>
          {form.players.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex items-center gap-2">
                {/* Number */}
                <span className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {idx + 1}
                </span>

                {/* Name input */}
                <div className="relative flex-1">
                  <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id={`player-name-${idx}`}
                    placeholder={`Player ${idx + 1}`}
                    value={player.name}
                    onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
                    className="pl-8 h-10 rounded-xl text-sm"
                    autoComplete="off"
                  />
                </div>

                {/* Gender toggle */}
                <GenderToggle
                  value={player.gender}
                  onChange={(g) => updatePlayer(player.id, { gender: g })}
                />

                {/* Remove */}
                {form.players.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePlayer(player.id)}
                    className="flex-shrink-0 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
                    aria-label={`Remove player ${idx + 1}`}
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add player button */}
      <button
        type="button"
        onClick={addPlayer}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors mb-6"
        id="add-player-btn"
      >
        <IconPlus className="h-4 w-4" />
        Add player
      </button>

      {/* Validation message */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm mb-4 ${
              hasWarning
                ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                : "bg-destructive/8 border border-destructive/20 text-destructive"
            }`}
          >
            <IconAlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next */}
      <Button
        onClick={onNext}
        disabled={hasError}
        className="w-full h-12 rounded-xl font-bold text-base bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20"
        id="players-next-btn"
      >
        Continue
      </Button>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Loader2, Zap, AlertTriangle, Users, MapPin, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { SetupForm } from "@/components/session/SessionSetupWizard";
import { FORMAT_LABELS, SPORT_EMOJIS, SPORT_LABELS } from "@/lib/utils/format";

interface Props {
  form: SetupForm;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: string;
}

export function ReviewStep({ form, onBack, onSubmit, isSubmitting, error }: Props) {
  const [title, setTitle] = useState(form.title);
  const filledPlayers = form.players.filter((p) => p.name.trim());
  const validCourts = form.courtNames.filter((n) => n.trim());
  const males = filledPlayers.filter((p) => p.gender === "MALE").length;
  const females = filledPlayers.filter((p) => p.gender === "FEMALE").length;

  const SUMMARY_ROWS = [
    {
      icon: "🎾",
      label: "Sport",
      value: form.sport ? `${SPORT_EMOJIS[form.sport]} ${SPORT_LABELS[form.sport]}` : "—",
    },
    {
      icon: "🔄",
      label: "Format",
      value: form.format ? FORMAT_LABELS[form.format] : "—",
    },
    {
      icon: "👥",
      label: "Players",
      value: `${filledPlayers.length} players${form.format === "MIXED_DOUBLES" ? ` (${males}M / ${females}F)` : ""}`,
    },
    {
      icon: "📍",
      label: "Courts",
      value: `${validCourts.length} court${validCourts.length !== 1 ? "s" : ""}: ${validCourts.join(", ")}`,
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight mb-1">Review & Generate</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Everything looks good? Tap generate to build your match schedule.
      </p>

      {/* Optional session name */}
      <div className="mb-6">
        <label className="text-sm font-semibold mb-1.5 block">
          Session name <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          id="session-title"
          placeholder="e.g. Sunday Padel with the crew"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            form.title = e.target.value;
          }}
          className="h-11 rounded-xl"
        />
      </div>

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-white overflow-hidden mb-6"
      >
        {SUMMARY_ROWS.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-start gap-3 px-4 py-3.5 ${
              i < SUMMARY_ROWS.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <span className="text-lg flex-shrink-0">{row.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">{row.label}</p>
              <p className="text-sm font-semibold mt-0.5 break-words">{row.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Player list preview */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Roster
        </p>
        <div className="flex flex-wrap gap-2">
          {filledPlayers.map((p) => (
            <span
              key={p.id}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${
                p.gender === "MALE"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-pink-50 text-pink-700 border-pink-200"
              }`}
            >
              {p.gender === "MALE" ? "♂" : "♀"} {p.name}
            </span>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <Button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 mb-3"
        id="generate-matches-btn"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating matches…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Generate Matches
          </span>
        )}
      </Button>

      <button
        type="button"
        onClick={onBack}
        disabled={isSubmitting}
        className="w-full text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
      >
        ← Back to Courts
      </button>
    </div>
  );
}

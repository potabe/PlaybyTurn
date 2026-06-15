"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants, type Easing } from "framer-motion";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateSpectatorCode } from "@/lib/utils/shortcode";
import { createSession as createSessionAction, createPlayers, createCourts } from "@/actions/mutations";
import { getSessionPlayers } from "@/actions/queries";
import { generateMatchesAction } from "@/actions/matchmaker";
import { SportStep } from "@/components/session/steps/SportStep";
import { FormatStep } from "@/components/session/steps/FormatStep";
import { PlayersStep } from "@/components/session/steps/PlayersStep";
import { CourtsStep } from "@/components/session/steps/CourtsStep";
import { TeamsStep } from "@/components/session/steps/TeamsStep";
import { ReviewStep } from "@/components/session/steps/ReviewStep";
import { IconArrowLeft, IconX } from "@tabler/icons-react";
import Link from "next/link";
import type { SportType, FormatType, GenderType } from "@/types/session";

// ─── Types ────────────────────────────────────────────────
export interface PlayerInput {
  id: string; // local temp ID for list keying
  name: string;
  gender: GenderType;
}

export interface TeamAssignmentInput {
  player1_id: string; // local ID (male)
  player2_id: string; // local ID (female)
  team_name?: string; // custom team name
}

export interface SetupForm {
  title: string;
  sport: SportType | null;
  format: FormatType | null;
  is_knockout: boolean;
  players: PlayerInput[];
  courtNames: string[];
  teamAssignments: TeamAssignmentInput[]; // used for FIXED_DOUBLES
}

// ─── Steps ────────────────────────────────────────────────
// "Teams" step is only shown for FIXED_DOUBLES
type Step = "Sport" | "Format" | "Players" | "Courts" | "Teams" | "Review";

const BASE_STEPS: Step[] = ["Sport", "Format", "Players", "Courts", "Review"];
const FIXED_STEPS: Step[] = ["Sport", "Format", "Players", "Courts", "Teams", "Review"];

// ─── Slide animation ──────────────────────────────────────
const easeOut: Easing = [0.0, 0.0, 0.2, 1.0];
const easeIn: Easing = [0.4, 0.0, 1.0, 1.0];

function slideVariants(direction: 1 | -1): Variants {
  return {
    enter: { x: direction * 60, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { duration: 0.28, ease: easeOut } },
    exit: { x: direction * -60, opacity: 0, transition: { duration: 0.2, ease: easeIn } },
  };
}

// ─── Main Wizard ──────────────────────────────────────────
export function SessionSetupWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<Step>("Sport");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [form, setForm] = useState<SetupForm>({
    title: "",
    sport: null,
    format: null,
    is_knockout: false,
    players: [
      { id: crypto.randomUUID(), name: "", gender: "MALE" },
      { id: crypto.randomUUID(), name: "", gender: "MALE" },
    ],
    courtNames: ["Court 1"],
    teamAssignments: [],
  });

  // Effective steps based on format
  const steps: Step[] = form.format === "FIXED_DOUBLES" ? FIXED_STEPS : BASE_STEPS;
  const stepIdx = steps.indexOf(currentStep);
  const progress = ((stepIdx + 1) / steps.length) * 100;

  // ─── Mutation: create session + call Edge Function ──────
  const createSession = useMutation({
    mutationFn: async () => {
      if (!form.sport || !form.format) throw new Error("Sport and format required");

      const spectatorCode = generateSpectatorCode();
      const sessionTitle =
        form.title.trim() ||
        `${form.sport} Session — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

      // 1. Create session
      const sessionData = await createSessionAction({
        title: sessionTitle,
        sport: form.sport,
        format: form.format,
        is_knockout: form.is_knockout,
        spectator_code: spectatorCode,
      });

      // 2. Create players
      const namedPlayers = form.players.filter((p) => p.name.trim());
      const playerRows = namedPlayers.map((p) => ({
        session_id: sessionData.id,
        name: p.name.trim(),
        gender: p.gender,
      }));
      await createPlayers(playerRows);

      // 3. Create courts
      const courtRows = form.courtNames
        .filter((n) => n.trim())
        .map((name) => ({
          session_id: sessionData.id,
          name: name.trim(),
        }));
      await createCourts(courtRows);

      // 4. Resolve team assignments
      const players = await getSessionPlayers(sessionData.id);
      const nameToDbId = new Map<string, string>();
      players.forEach(p => nameToDbId.set(p.name, p.id));
      
      const localToDbId = new Map<string, string>();
      namedPlayers.forEach(p => {
        const dbId = nameToDbId.get(p.name);
        if (dbId) localToDbId.set(p.id, dbId);
      });

      const resolvedTeams =
        form.format === "FIXED_DOUBLES" && form.teamAssignments.length >= 2
          ? form.teamAssignments
              .map((ta) => ({
                player1_id: localToDbId.get(ta.player1_id) ?? "",
                player2_id: localToDbId.get(ta.player2_id) ?? "",
                team_name: ta.team_name,
              }))
              .filter((ta) => ta.player1_id && ta.player2_id)
          : undefined;

      // 5. Call Action to generate matches
      const matchResult = await generateMatchesAction(sessionData.id, resolvedTeams);

      return { session: sessionData, warnings: matchResult.warnings ?? [] };
    },
    onSuccess: ({ session }) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      router.push(`/sessions/${session.id}`);
    },
  });

  // ─── Navigation ─────────────────────────────────────────
  function goToStep(step: Step) {
    const currIdx = steps.indexOf(currentStep);
    const nextIdx = steps.indexOf(step);
    setDirection(nextIdx > currIdx ? 1 : -1);
    // If switching format mid-wizard, reset teamAssignments
    if (step === "Teams" && form.teamAssignments.length > 0) {
      // keep existing assignments
    }
    setCurrentStep(step);
  }

  function next() {
    const idx = steps.indexOf(currentStep);
    if (idx < steps.length - 1) goToStep(steps[idx + 1]);
  }

  function back() {
    const idx = steps.indexOf(currentStep);
    if (idx > 0) goToStep(steps[idx - 1]);
  }

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4">
          <div className="h-14 flex items-center justify-between">
            <button
              onClick={stepIdx === 0 ? undefined : back}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              disabled={stepIdx === 0}
            >
              {stepIdx > 0 && <IconArrowLeft className="h-4 w-4" />}
            </button>

            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Step {stepIdx + 1} of {steps.length}
              </p>
              <p className="text-sm font-bold">{currentStep}</p>
            </div>

            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cancel"
            >
              <IconX className="h-4 w-4" />
            </Link>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden mb-0">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            />
          </div>
        </div>
      </header>

      {/* ── Step content ── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants(direction)}
            initial="enter"
            animate="center"
            exit="exit"
            className="max-w-lg mx-auto px-4 py-6"
          >
            {currentStep === "Sport" && (
              <SportStep form={form} setForm={setForm} onNext={next} />
            )}
            {currentStep === "Format" && (
              <FormatStep form={form} setForm={setForm} onNext={next} />
            )}
            {currentStep === "Players" && (
              <PlayersStep form={form} setForm={setForm} onNext={next} />
            )}
            {currentStep === "Courts" && (
              <CourtsStep form={form} setForm={setForm} onNext={next} />
            )}
            {currentStep === "Teams" && (
              <TeamsStep form={form} setForm={setForm} onNext={next} />
            )}
            {currentStep === "Review" && (
              <ReviewStep
                form={form}
                onBack={back}
                onSubmit={() => createSession.mutate()}
                isSubmitting={createSession.isPending}
                error={createSession.error?.message}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

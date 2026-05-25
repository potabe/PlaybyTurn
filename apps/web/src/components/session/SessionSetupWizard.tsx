"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants, type Easing } from "framer-motion";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { generateSpectatorCode } from "@/lib/utils/shortcode";
import { SportStep } from "@/components/session/steps/SportStep";
import { FormatStep } from "@/components/session/steps/FormatStep";
import { PlayersStep } from "@/components/session/steps/PlayersStep";
import { CourtsStep } from "@/components/session/steps/CourtsStep";
import { ReviewStep } from "@/components/session/steps/ReviewStep";
import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import type { SportType, FormatType, GenderType } from "@/types/session";

// ─── Types ────────────────────────────────────────────────
export interface PlayerInput {
  id: string; // local temp ID for list keying
  name: string;
  gender: GenderType;
}

export interface SetupForm {
  title: string;
  sport: SportType | null;
  format: FormatType | null;
  players: PlayerInput[];
  courtNames: string[];
}

// ─── Steps config ─────────────────────────────────────────
const STEPS = ["Sport", "Format", "Players", "Courts", "Review"] as const;
type Step = (typeof STEPS)[number];

const STEP_INDEX: Record<Step, number> = {
  Sport: 0,
  Format: 1,
  Players: 2,
  Courts: 3,
  Review: 4,
};

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
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState<Step>("Sport");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [form, setForm] = useState<SetupForm>({
    title: "",
    sport: null,
    format: null,
    players: [
      { id: crypto.randomUUID(), name: "", gender: "MALE" },
      { id: crypto.randomUUID(), name: "", gender: "MALE" },
    ],
    courtNames: ["Court 1"],
  });

  // ─── Mutation: create session + call Edge Function ──────
  const createSession = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!form.sport || !form.format) throw new Error("Sport and format required");

      const spectatorCode = generateSpectatorCode();
      const sessionTitle =
        form.title.trim() || `${form.sport} Session — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

      // 1. Create session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: session, error: sessionError } = await (supabase as any)
        .from("sessions")
        .insert({
          organizer_id: user.id,
          title: sessionTitle,
          sport: form.sport,
          format: form.format,
          status: "SETUP",
          spectator_code: spectatorCode,
        })
        .select()
        .single();
      if (sessionError) throw new Error(sessionError.message);
      const sessionData = session as { id: string } | null;
      if (!sessionData) throw new Error("Failed to create session");


      // 2. Create players
      const playerRows = form.players
        .filter((p) => p.name.trim())
        .map((p) => ({
          session_id: sessionData.id,
          name: p.name.trim(),
          gender: p.gender,
        }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: players, error: playersError } = await (supabase as any)
        .from("players")
        .insert(playerRows)
        .select();
      if (playersError) throw new Error(playersError.message);

      // 3. Create courts
      const courtRows = form.courtNames
        .filter((n) => n.trim())
        .map((name) => ({
          session_id: sessionData.id,
          name: name.trim(),
        }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: courts, error: courtsError } = await (supabase as any)
        .from("courts")
        .insert(courtRows)
        .select();
      if (courtsError) throw new Error(courtsError.message);


      // 4. Call Edge Function to generate matches
      const { data: matchResult, error: fnError } = await supabase.functions.invoke(
        "generate-matches",
        {
          body: {
            session_id: sessionData.id,
            players,
            courts,
            sport: form.sport,
            format: form.format,
          },
        }
      );
      if (fnError) throw new Error(fnError.message);

      return { session: sessionData, warnings: matchResult?.warnings ?? [] };
    },
    onSuccess: ({ session }) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      router.push(`/sessions/${session.id}`);
    },
  });

  // ─── Navigation ─────────────────────────────────────────
  function goToStep(step: Step) {
    const dir = STEP_INDEX[step] > STEP_INDEX[currentStep] ? 1 : -1;
    setDirection(dir);
    setCurrentStep(step);
  }

  function next() {
    const idx = STEP_INDEX[currentStep];
    if (idx < STEPS.length - 1) goToStep(STEPS[idx + 1]);
  }

  function back() {
    const idx = STEP_INDEX[currentStep];
    if (idx > 0) goToStep(STEPS[idx - 1]);
  }

  const stepIdx = STEP_INDEX[currentStep];
  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4">
          <div className="h-14 flex items-center justify-between">
            <button
              onClick={stepIdx === 0 ? undefined : back}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              disabled={stepIdx === 0}
            >
              {stepIdx > 0 && <ArrowLeft className="h-4 w-4" />}
            </button>

            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Step {stepIdx + 1} of {STEPS.length}
              </p>
              <p className="text-sm font-bold">{currentStep}</p>
            </div>

            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
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

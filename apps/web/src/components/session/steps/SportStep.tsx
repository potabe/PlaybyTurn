"use client";

import { motion } from "framer-motion";
import type { SetupForm } from "@/components/session/SessionSetupWizard";
import type { SportType } from "@/types/session";

const SPORTS: { type: SportType; label: string; emoji: string; desc: string }[] = [
  { type: "PADEL", label: "Padel", emoji: "🎾", desc: "Best of 3 sets, super tiebreak" },
  { type: "BADMINTON", label: "Badminton", emoji: "🏸", desc: "Rally point, 21 pts, best of 3" },
  { type: "TENNIS", label: "Tennis", emoji: "🎾", desc: "15-30-40, deuce, best of 3 sets" },
  { type: "TABLE_TENNIS", label: "Table Tennis", emoji: "🏓", desc: "11 pts, best of 5 games" },
];

interface Props {
  form: SetupForm;
  setForm: React.Dispatch<React.SetStateAction<SetupForm>>;
  onNext: () => void;
}

export function SportStep({ form, setForm, onNext }: Props) {
  function select(sport: SportType) {
    setForm((f) => ({ ...f, sport, format: null }));
    setTimeout(onNext, 200);
  }

  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight mb-1">Pick your sport</h2>
      <p className="text-muted-foreground text-sm mb-8">
        The scoring rules will automatically match.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {SPORTS.map((sport, i) => {
          const isSelected = form.sport === sport.type;
          return (
            <motion.button
              key={sport.type}
              id={`sport-${sport.type.toLowerCase()}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.07 }}
              onClick={() => select(sport.type)}
              className={`relative flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
                isSelected
                  ? "border-primary bg-primary/6 shadow-md shadow-primary/15"
                  : "border-border bg-white hover:border-primary/40 hover:bg-primary/3"
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="sport-check"
                  className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
              <span className="text-4xl">{sport.emoji}</span>
              <div>
                <p className="font-bold text-sm">{sport.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{sport.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

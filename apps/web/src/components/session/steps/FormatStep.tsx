"use client";

import { motion } from "framer-motion";
import type { SetupForm } from "@/components/session/SessionSetupWizard";
import { FORMAT_DESCRIPTIONS, FORMAT_LABELS, FORMAT_MIN_PLAYERS } from "@/lib/utils/format";
import type { FormatType } from "@/types/session";

const FORMATS: { type: FormatType; icon: string }[] = [
  { type: "SINGLES", icon: "👤" },
  { type: "FIXED_DOUBLES", icon: "👥" },
  { type: "MIXED_DOUBLES", icon: "⚤" },
  { type: "AMERICANO", icon: "🔄" },
];

interface Props {
  form: SetupForm;
  setForm: React.Dispatch<React.SetStateAction<SetupForm>>;
  onNext: () => void;
}

export function FormatStep({ form, setForm, onNext }: Props) {
  function select(format: FormatType) {
    setForm((f) => ({ ...f, format }));
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1">
        <h2 className="text-2xl font-black tracking-tight mb-1">Choose a format</h2>
        <p className="text-muted-foreground text-sm mb-6">
          How do you want to rotate players?
        </p>

        <div className="flex flex-col gap-3 mb-8">
          {FORMATS.map((fmt, i) => {
            const isSelected = form.format === fmt.type;
            return (
              <motion.button
                key={fmt.type}
                id={`format-${fmt.type.toLowerCase()}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                onClick={() => select(fmt.type)}
                className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.99] ${
                  isSelected
                    ? "border-primary bg-primary/6 shadow-md shadow-primary/15"
                    : "border-border bg-white hover:border-primary/40 hover:bg-primary/3"
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-colors ${
                    isSelected ? "bg-primary/15" : "bg-muted"
                  }`}
                >
                  {fmt.icon}
                </div>

                {/* Labels */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{FORMAT_LABELS[fmt.type]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {FORMAT_DESCRIPTIONS[fmt.type]}
                  </p>
                  <p className="text-xs text-primary font-medium mt-1">
                    Min. {FORMAT_MIN_PLAYERS[fmt.type]} players
                  </p>
                </div>

                {/* Check */}
                <div
                  className={`flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-border"
                  }`}
                >
                  {isSelected && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Tournament Mode Toggle */}
        <div 
          className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
            form.is_knockout ? "border-primary bg-primary/5" : "border-border bg-white"
          }`}
          onClick={() => setForm((f) => ({ ...f, is_knockout: !f.is_knockout }))}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.is_knockout ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
              🏆
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Tournament Mode</p>
              <p className="text-xs text-muted-foreground">Knockout bracket (Single Elimination)</p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${form.is_knockout ? "bg-primary" : "bg-muted-foreground/30"}`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${form.is_knockout ? "translate-x-6" : "translate-x-0"}`} />
          </div>
        </div>
      </div>

      <div className="pt-8">
        <button
          onClick={onNext}
          disabled={!form.format}
          className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

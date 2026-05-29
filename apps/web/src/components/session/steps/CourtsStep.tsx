"use client";

import { motion, AnimatePresence } from "framer-motion";
import { IconPlus, IconTrash, IconMapPin } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SetupForm } from "@/components/session/SessionSetupWizard";

interface Props {
  form: SetupForm;
  setForm: React.Dispatch<React.SetStateAction<SetupForm>>;
  onNext: () => void;
}

export function CourtsStep({ form, setForm, onNext }: Props) {
  function addCourt() {
    setForm((f) => ({
      ...f,
      courtNames: [...f.courtNames, `Court ${f.courtNames.length + 1}`],
    }));
  }

  function removeCourt(idx: number) {
    setForm((f) => ({
      ...f,
      courtNames: f.courtNames.filter((_, i) => i !== idx),
    }));
  }

  function updateCourt(idx: number, value: string) {
    setForm((f) => ({
      ...f,
      courtNames: f.courtNames.map((n, i) => (i === idx ? value : n)),
    }));
  }

  const validCourts = form.courtNames.filter((n) => n.trim()).length;
  const canContinue = validCourts >= 1;

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-2xl font-black tracking-tight">Set up courts</h2>
        <span className="mt-1 rounded-full bg-primary/10 text-primary text-xs font-bold px-3 py-1">
          {validCourts} court{validCourts !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="text-muted-foreground text-sm mb-8">
        Name each court. The algorithm will assign matches automatically.
      </p>

      {/* Court list */}
      <div className="space-y-2 mb-4">
        <AnimatePresence initial={false}>
          {form.courtNames.map((name, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8">
                  <IconMapPin className="h-4 w-4 text-primary" />
                </div>

                <Input
                  id={`court-name-${idx}`}
                  value={name}
                  onChange={(e) => updateCourt(idx, e.target.value)}
                  placeholder={`Court ${idx + 1}`}
                  className="flex-1 h-10 rounded-xl text-sm font-medium"
                />

                {form.courtNames.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCourt(idx)}
                    className="flex-shrink-0 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
                    aria-label={`Remove court ${idx + 1}`}
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add court button */}
      <button
        type="button"
        onClick={addCourt}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors mb-8"
        id="add-court-btn"
      >
        <IconPlus className="h-4 w-4" />
        Add another court
      </button>

      {/* Capacity preview */}
      {form.format && validCourts > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 rounded-2xl bg-muted/60 border border-border p-4"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            Session capacity
          </p>
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-black">{validCourts}</p>
              <p className="text-xs text-muted-foreground">Court{validCourts !== 1 ? "s" : ""}</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="text-2xl font-black">
                {validCourts * (form.format === "SINGLES" ? 2 : 4)}
              </p>
              <p className="text-xs text-muted-foreground">Max active players</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="text-2xl font-black">
                {Math.max(
                  0,
                  form.players.filter((p) => p.name.trim()).length -
                    validCourts * (form.format === "SINGLES" ? 2 : 4)
                )}
              </p>
              <p className="text-xs text-muted-foreground">Resting</p>
            </div>
          </div>
        </motion.div>
      )}

      <Button
        onClick={onNext}
        disabled={!canContinue}
        className="w-full h-12 rounded-xl font-bold text-base bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20"
        id="courts-next-btn"
      >
        Continue to Review
      </Button>
    </div>
  );
}

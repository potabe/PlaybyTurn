"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

import { IconUser, IconUsers, IconHeartHandshake, IconRefresh } from "@tabler/icons-react";

const FORMATS = [
  {
    name: "Singles",
    desc: "1v1 - individual rotation",
    icon: <IconUser className="w-10 h-10 mx-auto text-indigo-500" />,
    players: "2+",
  },
  {
    name: "Fixed Doubles",
    desc: "Static team pairs",
    icon: <IconUsers className="w-10 h-10 mx-auto text-blue-500" />,
    players: "4+",
  },
  {
    name: "Mixed Doubles",
    desc: "1 Male + 1 Female per team",
    icon: <IconHeartHandshake className="w-10 h-10 mx-auto text-pink-500" />,
    players: "4+",
  },
  {
    name: "Americano",
    desc: "Everyone vs everyone",
    icon: <IconRefresh className="w-10 h-10 mx-auto text-sky-500" />,
    players: "4+",
  },
];

const STEPS = [
  { step: "01", title: "Add Players", desc: "Name + gender, done in seconds" },
  { step: "02", title: "Pick Format", desc: "Choose sport and match style" },
  { step: "03", title: "Generate", desc: "Algorithm builds the schedule" },
  { step: "04", title: "Play!", desc: "Tap to score, share to spectate" },
];

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="px-6 py-24 bg-slate-50 dark:bg-slate-900/20"
      
    >
      <div className="max-w-6xl mx-auto">
        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
            Dead simple
          </p>
          <h2 className="text-4xl font-black tracking-tight mb-4">
            Ready in under 2 minutes
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-24">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-black text-lg mb-3">
                {s.step}
              </div>
              <h3 className="font-bold text-sm mb-1">{s.title}</h3>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Format showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-black tracking-tight mb-3">
            4 formats, infinite fun
          </h2>
          <p className="text-muted-foreground">
            Pick the format that fits your group size and vibe.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FORMATS.map((fmt, i) => (
            <motion.div
              key={fmt.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.35 + i * 0.08 }}
              className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="text-4xl mb-3">{fmt.icon}</div>
              <h3 className="font-bold mb-1">{fmt.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{fmt.desc}</p>
              <span className="inline-flex items-center rounded-full bg-primary/8 text-primary text-xs font-semibold px-3 py-1">
                {fmt.players} players
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

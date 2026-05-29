"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { IconArrowsShuffle, IconActivity, IconShare2, IconTrophy, IconClock, IconDeviceMobile } from "@tabler/icons-react";

const FEATURES = [
  {
    icon: IconArrowsShuffle,
    title: "Smart Matchmaking",
    description:
      "Automated fair rotation using smart algorithms. Singles, Doubles, Mixed Doubles, and Americano — all handled.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: IconActivity,
    title: "Live Score Tracking",
    description:
      "Giant tap-to-score interface built for sweaty hands and bright sunlight. Sport-specific rules built in.",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-100",
  },
  {
    icon: IconShare2,
    title: "Instant Spectator View",
    description:
      "Share a 6-character code. Friends see live scores and standings in real-time — no account needed.",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-100",
  },
  {
    icon: IconTrophy,
    title: "Real-time Leaderboard",
    description:
      "Automatic standings update after every match. Win count, points, differential — all calculated for you.",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
  {
    icon: IconClock,
    title: "Undo Anytime",
    description:
      "Tapped too fast? One-tap undo restores the previous state instantly. No arguments, no confusion.",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  {
    icon: IconDeviceMobile,
    title: "Works as an App",
    description:
      "Add to your home screen for a native app feel. Screen stays awake during matches. No App Store needed.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
];

export function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="px-6 py-24 max-w-6xl mx-auto">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
          Everything you need
        </p>
        <h2 className="text-4xl font-black tracking-tight mb-4">
          Built for the court, not the office
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-lg">
          Every feature designed around the real experience of organizing a
          session with friends.
        </p>
      </motion.div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`group rounded-2xl border ${feature.border} bg-card p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200`}
            >
              <div
                className={`inline-flex rounded-xl ${feature.bg} p-3 mb-4`}
              >
                <Icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="font-bold text-base mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

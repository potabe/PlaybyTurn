"use client";

import { motion, type Variants, type Easing } from "framer-motion";
import Link from "next/link";
import { IconArrowRight, IconBolt } from "@tabler/icons-react";

const SPORT_ITEMS = [
  { emoji: "🎾", label: "Padel", color: "bg-blue-100 text-blue-600" },
  { emoji: "🏸", label: "Badminton", color: "bg-green-100 text-green-600" },
  { emoji: "🎾", label: "Tennis", color: "bg-yellow-100 text-yellow-700" },
  { emoji: "🏓", label: "Table Tennis", color: "bg-pink-100 text-pink-600" },
];

const easeOut: Easing = [0.0, 0.0, 0.2, 1.0];
const easeIn: Easing = [0.4, 0.0, 1.0, 1.0];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center px-6 py-20">
      {/* Animated grid background */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.91 0.01 250) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.91 0.01 250) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, oklch(0.99 0 0) 100%)",
          }}
        />
        <div
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full blur-3xl opacity-20"
          style={{ background: "oklch(0.55 0.22 260)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full blur-3xl opacity-15"
          style={{ background: "oklch(0.55 0.18 145)" }}
        />
      </div>

      <motion.div
        className="max-w-4xl mx-auto text-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Badge */}
        <motion.div variants={item} className="mb-6 inline-flex">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-sm font-medium text-primary">
            <IconBolt className="h-3.5 w-3.5" />
            Smart Session Organizer
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="text-5xl font-black tracking-tight sm:text-6xl md:text-7xl mb-6 leading-[1.05]"
        >
          Stop calculating.
          <br />
          <span className="gradient-text">Start playing.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={item}
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          UrTurn automates the boring parts of your sports session — fair
          matchmaking, live score tracking, and real-time spectator views.
          All in one tap.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground px-8 py-4 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            Create Free Session
            <IconArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-8 py-4 text-base font-semibold hover:bg-muted hover:-translate-y-0.5 transition-all duration-200"
          >
            Sign In
          </Link>
        </motion.div>

        {/* Sport pills */}
        <motion.div variants={item} className="flex flex-wrap gap-3 justify-center">
          {SPORT_ITEMS.map((sport) => (
            <span
              key={sport.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ${sport.color}`}
            >
              <span>{sport.emoji}</span>
              {sport.label}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

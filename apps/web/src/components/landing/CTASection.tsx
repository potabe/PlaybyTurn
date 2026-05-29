"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center"
      >
        {/* Decorative orb */}
        <div className="relative mb-8 inline-block">
          <div
            className="h-24 w-24 rounded-full blur-2xl opacity-40 mx-auto"
            style={{ background: "oklch(0.55 0.22 260)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">🎾</span>
          </div>
        </div>

        <h2 className="text-4xl font-black tracking-tight mb-4">
          Your next session starts here.
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
          Free to use. No credit card. No app install.
          Just sign up and start organizing.
        </p>

        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground px-10 py-4 text-lg font-bold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-200"
        >
          Get Started — It's Free
          <IconArrowRight className="h-5 w-5" />
        </Link>

        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </section>
  );
}

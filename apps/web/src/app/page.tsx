import type { Metadata } from "next";
import { LandingNav, LandingFooter } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CTASection } from "@/components/landing/CTASection";

export const metadata: Metadata = {
  title: "UrTurn — Smart Sports Session Organizer",
  description:
    "Automate your racket sports session. Fair matchmaking, live score tracking, and shareable spectator views for Padel, Badminton, Tennis & Table Tennis.",
};

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <main>
        <HeroSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="how-it-works">
          <HowItWorksSection />
        </div>
        <CTASection />
      </main>
      <LandingFooter />
    </>
  );
}

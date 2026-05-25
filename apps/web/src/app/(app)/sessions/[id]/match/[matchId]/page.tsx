import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScoreTrackerClient } from "@/components/match/ScoreTrackerClient";
import type { Match, Session, Player } from "@/types/session";

interface Props {
  params: Promise<{ id: string; matchId: string }>;
}

export const metadata: Metadata = { title: "Score Tracker" };

export default async function MatchPage({ params }: Props) {
  const { id, matchId } = await params;
  const supabase = await createClient();

  const [matchRes, sessionRes, playersRes] = await Promise.all([
    supabase.from("matches").select("*").eq("id", matchId).single<Match>(),
    supabase.from("sessions").select("*").eq("id", id).single<Session>(),
    supabase.from("players").select("*").eq("session_id", id),
  ]);

  if (matchRes.error || !matchRes.data) notFound();
  if (sessionRes.error || !sessionRes.data) notFound();

  return (
    <ScoreTrackerClient
      initialMatch={matchRes.data}
      session={sessionRes.data}
      players={(playersRes.data as Player[]) ?? []}
    />
  );
}

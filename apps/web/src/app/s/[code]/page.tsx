import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpectatorClient } from "@/components/spectator/SpectatorClient";
import type { Session, Player, Court, Match } from "@/types/session";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select("title, sport")
    .eq("spectator_code", code.toUpperCase())
    .single<Pick<Session, "title" | "sport">>();

  return {
    title: data ? `${data.title} — Live` : "Live Session",
    description: "Watch live scores and standings. No account needed.",
  };
}

export default async function SpectatorPage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("spectator_code", code.toUpperCase())
    .single<Session>();

  if (error || !session) notFound();

  const [playersRes, courtsRes, matchesRes] = await Promise.all([
    supabase.from("players").select("*").eq("session_id", session.id),
    supabase.from("courts").select("*").eq("session_id", session.id),
    supabase.from("matches").select("*").eq("session_id", session.id).order("round_number"),
  ]);

  return (
    <SpectatorClient
      session={session}
      initialPlayers={(playersRes.data as Player[]) ?? []}
      initialCourts={(courtsRes.data as Court[]) ?? []}
      initialMatches={(matchesRes.data as Match[]) ?? []}
    />
  );
}

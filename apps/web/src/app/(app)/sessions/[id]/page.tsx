import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionHubClient } from "@/components/session/SessionHubClient";
import type { Session, Player, Court, Match } from "@/types/session";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select("title")
    .eq("id", id)
    .single<Pick<Session, "title">>();
  return { title: data?.title ?? "Session" };
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch session with all related data in parallel
  const [sessionRes, playersRes, courtsRes, matchesRes] = await Promise.all([
    supabase.from("sessions").select("*").eq("id", id).single<Session>(),
    supabase.from("players").select("*").eq("session_id", id).order("matches_played"),
    supabase.from("courts").select("*").eq("session_id", id),
    supabase.from("matches").select("*").eq("session_id", id).order("round_number"),
  ]);

  if (sessionRes.error || !sessionRes.data) notFound();

  return (
    <SessionHubClient
      initialSession={sessionRes.data}
      initialPlayers={(playersRes.data as Player[]) ?? []}
      initialCourts={(courtsRes.data as Court[]) ?? []}
      initialMatches={(matchesRes.data as Match[]) ?? []}
    />
  );
}

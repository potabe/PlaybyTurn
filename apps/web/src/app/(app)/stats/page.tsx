import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatsClient } from "@/components/stats/StatsClient";
import type { Session, Player } from "@/types/session";

export const metadata: Metadata = {
  title: "Player Stats",
};

export default async function StatsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all sessions (with their IDs) for this organizer
  const { data: rawSessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  const sessions = (rawSessions ?? []) as Session[];

  // Fetch all players across all sessions in one query
  const sessionIds = sessions.map((s) => s.id);
  const { data: rawPlayers } =
    sessionIds.length > 0
      ? await supabase
          .from("players")
          .select("*")
          .in("session_id", sessionIds)
      : { data: [] };

  const players = (rawPlayers ?? []) as Player[];

  return (
    <StatsClient sessions={sessions} players={players} />
  );
}

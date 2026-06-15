import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StatsClient } from "@/components/stats/StatsClient";
import { getDashboardSessions, getSessionPlayers } from "@/actions/queries";
import type { Session, Player } from "@/types/session";

export const metadata: Metadata = {
  title: "Player Stats",
};

export default async function StatsPage() {
  const authSession = await auth();
  if (!authSession?.user) redirect("/login");

  const sessionsData = await getDashboardSessions();
  const sessions = sessionsData as unknown as Session[];

  const playersPromises = sessions.map((s) => getSessionPlayers(s.id));
  const playersArrays = await Promise.all(playersPromises);
  const players = playersArrays.flat() as unknown as Player[];

  return <StatsClient sessions={sessions} players={players} />;
}

import type { Metadata } from "next";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { StatsClient } from "@/components/stats/StatsClient";
import { getDashboardSessions, getSessionPlayers } from "@/actions/queries";
import type { Session, Player } from "@/types/session";

export const metadata: Metadata = {
  title: "Player Stats",
};

export default async function StatsPage() {
  const reqHeaders = await headers();
  const authSession = await auth.getSession({ fetchOptions: { headers: reqHeaders } }).catch(() => null);
  if (!authSession?.data?.user) redirect("/login");

  const sessionsData = await getDashboardSessions();
  const sessions = sessionsData as unknown as Session[];

  const playersPromises = sessions.map((s) => getSessionPlayers(s.id));
  const playersArrays = await Promise.all(playersPromises);
  const players = playersArrays.flat() as unknown as Player[];

  return <StatsClient sessions={sessions} players={players} />;
}

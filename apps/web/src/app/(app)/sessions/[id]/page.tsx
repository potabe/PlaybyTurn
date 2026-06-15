import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionDetails, getSessionPlayers, getSessionCourts, getSessionMatches } from "@/actions/queries";
import { SessionHubClient } from "@/components/session/SessionHubClient";
import type { Session, Player, Court, Match } from "@/types/session";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getSessionDetails(id);
  return { title: data?.title ?? "Session" };
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params;

  // Fetch session with all related data in parallel
  const [sessionData, playersData, courtsData, matchesData] = await Promise.all([
    getSessionDetails(id),
    getSessionPlayers(id),
    getSessionCourts(id),
    getSessionMatches(id),
  ]);

  if (!sessionData) notFound();

  return (
    <SessionHubClient
      initialSession={sessionData as unknown as Session}
      initialPlayers={(playersData as unknown as Player[]) ?? []}
      initialCourts={(courtsData as unknown as Court[]) ?? []}
      initialMatches={(matchesData as unknown as Match[]) ?? []}
    />
  );
}

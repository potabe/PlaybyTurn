import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMatchById, getSessionDetails, getSessionPlayers } from "@/actions/queries";
import { ScoreTrackerClient } from "@/components/match/ScoreTrackerClient";
import type { Match, Session, Player } from "@/types/session";

interface Props {
  params: Promise<{ id: string; matchId: string }>;
}

export const metadata: Metadata = { title: "Score Tracker" };

export default async function MatchPage({ params }: Props) {
  const { id, matchId } = await params;

  const [matchData, sessionData, playersData] = await Promise.all([
    getMatchById(matchId),
    getSessionDetails(id),
    getSessionPlayers(id),
  ]);

  if (!matchData) notFound();
  if (!sessionData) notFound();

  return (
    <ScoreTrackerClient
      initialMatch={matchData as unknown as Match}
      session={sessionData as unknown as Session}
      players={(playersData as unknown as Player[]) ?? []}
    />
  );
}

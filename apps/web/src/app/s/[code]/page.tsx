import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionByCode, getSessionPlayers, getSessionCourts, getSessionMatches } from "@/actions/queries";
import { SpectatorClient } from "@/components/spectator/SpectatorClient";
import type { Session, Player, Court, Match } from "@/types/session";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const data = await getSessionByCode(code.toUpperCase());

  return {
    title: data ? `${data.title} — Live` : "Live Session",
    description: "Watch live scores and standings. No account needed.",
  };
}

export default async function SpectatorPage({ params }: Props) {
  const { code } = await params;
  const session = await getSessionByCode(code.toUpperCase());

  if (!session) notFound();

  const [playersRes, courtsRes, matchesRes] = await Promise.all([
    getSessionPlayers(session.id),
    getSessionCourts(session.id),
    getSessionMatches(session.id),
  ]);

  return (
    <SpectatorClient
      session={session as unknown as Session}
      initialPlayers={(playersRes as unknown as Player[]) ?? []}
      initialCourts={(courtsRes as unknown as Court[]) ?? []}
      initialMatches={(matchesRes as unknown as Match[]) ?? []}
    />
  );
}

"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getUserProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function getDashboardSessions() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return prisma.tournamentSession.findMany({
    where: { organizer_id: session.user.id },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getSessionDetails(id: string) {
  return prisma.tournamentSession.findUnique({ where: { id } });
}

export async function getSessionPlayers(sessionId: string) {
  return prisma.player.findMany({ 
    where: { session_id: sessionId },
    orderBy: { matches_won: 'desc' } 
  });
}

export async function getSessionCourts(sessionId: string) {
  return prisma.court.findMany({ where: { session_id: sessionId } });
}

export async function getSessionMatches(sessionId: string) {
  return prisma.match.findMany({ 
    where: { session_id: sessionId },
    orderBy: { round_number: 'asc' } 
  });
}

export async function getMatchById(matchId: string) {
  return prisma.match.findUnique({ where: { id: matchId } });
}

export async function getSessionByCode(code: string) {
  return prisma.tournamentSession.findUnique({ where: { spectator_code: code } });
}

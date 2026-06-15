"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

export async function getUserProfile() {
  const reqHeaders = await headers();
  const session = await auth.getSession({ fetchOptions: { headers: reqHeaders } }).catch(() => null);
  if (!session?.data?.user?.id) return null;
  let profile = await prisma.profile.findUnique({ where: { id: session.data.user.id } });
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        id: session.data.user.id,
        email: session.data.user.email || null,
        name: session.data.user.name || null,
        image: session.data.user.image || null,
      }
    });
  }
  return profile;
}

export async function getDashboardSessions() {
  const reqHeaders = await headers();
  const session = await auth.getSession({ fetchOptions: { headers: reqHeaders } }).catch(() => null);
  if (!session?.data?.user?.id) return [];
  return prisma.tournamentSession.findMany({
    where: { organizer_id: session.data.user.id },
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

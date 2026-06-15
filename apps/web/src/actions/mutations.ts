"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { MatchStatus, SessionStatus, WinningTeam, FormatType, SportType, GenderType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createSession(data: { title: string; sport: SportType; format: FormatType; is_knockout: boolean; spectator_code: string }) {
  const reqHeaders = await headers();
  const session = await auth.getSession({ fetchOptions: { headers: reqHeaders } }).catch(() => null);
  if (!session?.data?.user?.id) throw new Error("Unauthorized");
  
  return prisma.tournamentSession.create({
    data: {
      ...data,
      organizer_id: session.data.user.id,
    }
  });
}

export async function createPlayers(players: { session_id: string; name: string; gender: GenderType }[]) {
  return prisma.player.createMany({ data: players });
}

export async function createCourts(courts: { session_id: string; name: string }[]) {
  return prisma.court.createMany({ data: courts });
}

export async function updateSessionStatus(sessionId: string, status: SessionStatus) {
  const res = await prisma.tournamentSession.update({ where: { id: sessionId }, data: { status } });
  revalidatePath(`/sessions/${sessionId}`);
  return res;
}

export async function deleteSession(sessionId: string) {
  const reqHeaders = await headers();
  const session = await auth.getSession({ fetchOptions: { headers: reqHeaders } }).catch(() => null);
  if (!session?.data?.user?.id) throw new Error("Unauthorized");
  return prisma.tournamentSession.delete({
    where: { id: sessionId, organizer_id: session.data.user.id }
  });
}

export async function cancelPendingMatches(sessionId: string) {
  return prisma.match.updateMany({
    where: { session_id: sessionId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    data: { status: "CANCELLED" }
  });
}

export async function swapSeeding(m1Id: string, m1TeamIndex: 1 | 2, m2Id: string, m2TeamIndex: 1 | 2) {
  const m1 = await prisma.match.findUnique({ where: { id: m1Id } });
  const m2 = await prisma.match.findUnique({ where: { id: m2Id } });
  if (!m1 || !m2) throw new Error("Matches not found");

  const team1_p1 = m1TeamIndex === 1 ? m1.team1_player1_id : m1.team2_player1_id;
  const team1_p2 = m1TeamIndex === 1 ? m1.team1_player2_id : m1.team2_player2_id;
  const team2_p1 = m2TeamIndex === 1 ? m2.team1_player1_id : m2.team2_player1_id;
  const team2_p2 = m2TeamIndex === 1 ? m2.team1_player2_id : m2.team2_player2_id;

  const update1 = m1TeamIndex === 1 
    ? { team1_player1_id: team2_p1, team1_player2_id: team2_p2 }
    : { team2_player1_id: team2_p1, team2_player2_id: team2_p2 };

  const update2 = m2TeamIndex === 1
    ? { team1_player1_id: team1_p1, team1_player2_id: team1_p2 }
    : { team2_player1_id: team1_p1, team2_player2_id: team1_p2 };

  await prisma.$transaction([
    prisma.match.update({ where: { id: m1Id }, data: update1 }),
    prisma.match.update({ where: { id: m2Id }, data: update2 })
  ]);
  
  revalidatePath(`/sessions/${m1.session_id}`);
}

export async function updateMatchScore(matchId: string, scoreData: any, scoreHistory: any, status: MatchStatus, winningTeam: WinningTeam | null) {
  const res = await prisma.match.update({
    where: { id: matchId },
    data: { score_data: scoreData as any, score_history: scoreHistory as any, status, winning_team: winningTeam }
  });
  revalidatePath(`/sessions/${res.session_id}/match/${matchId}`);
  return res;
}

export async function updatePlayerStats(playerId: string, matchesPlayed: number, matchesWon: number, pointsWon: number, pointDiff: number) {
  return prisma.player.update({
    where: { id: playerId },
    data: { 
      matches_played: { increment: matchesPlayed },
      matches_won: { increment: matchesWon },
      points_won: { increment: pointsWon },
      point_differential: { increment: pointDiff },
      last_played_at: new Date()
    }
  });
}

export async function updateUserSkillLevels(skillLevels: any) {
  const reqHeaders = await headers();
  const session = await auth.getSession({ fetchOptions: { headers: reqHeaders } }).catch(() => null);
  if (!session?.data?.user?.id) throw new Error("Unauthorized");
  return prisma.profile.update({
    where: { id: session.data.user.id },
    data: { skill_levels: skillLevels as any }
  });
}

export async function updateMatchPlayers(matchId: string, data: any) {
  const res = await prisma.match.update({
    where: { id: matchId },
    data
  });
  revalidatePath(`/sessions/${res.session_id}`);
  return res;
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2, Trophy, Activity, Clock, ChevronRight, Check } from "lucide-react";
import { SPORT_EMOJIS, SPORT_LABELS, FORMAT_LABELS } from "@/lib/utils/format";
import type { Session, Player, Court, Match } from "@/types/session";


// ─── Leaderboard entry ────────────────────────────────────
function LeaderboardRow({ player, rank }: { player: Player; rank: number }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${rank <= 3 ? "bg-primary/3" : ""} border-b border-border last:border-0`}>
      <span className="w-6 text-center text-sm font-bold text-muted-foreground">
        {medal ?? rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{player.name}</p>
        <p className="text-xs text-muted-foreground">
          {player.matches_played} played · {player.matches_won} won
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black">{player.points_won}</p>
        <p className="text-xs text-muted-foreground">pts</p>
      </div>
    </div>
  );
}

// ─── Match card ───────────────────────────────────────────
function MatchCard({
  match,
  players,
  court,
  sessionId,
}: {
  match: Match;
  players: Player[];
  court?: Court;
  sessionId: string;
}) {
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const t1p1 = match.team1_player1_id ? playerMap[match.team1_player1_id] : null;
  const t1p2 = match.team1_player2_id ? playerMap[match.team1_player2_id] : null;
  const t2p1 = match.team2_player1_id ? playerMap[match.team2_player1_id] : null;
  const t2p2 = match.team2_player2_id ? playerMap[match.team2_player2_id] : null;

  const team1 = [t1p1?.name, t1p2?.name].filter(Boolean).join(" & ");
  const team2 = [t2p1?.name, t2p2?.name].filter(Boolean).join(" & ");

  const statusColors = {
    PENDING: "bg-muted text-muted-foreground",
    IN_PROGRESS: "bg-green-100 text-green-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <Link href={`/sessions/${sessionId}/match/${match.id}`}>
      <div className="group rounded-2xl border border-border bg-white p-4 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">
            {court?.name ?? "Court"} · R{match.round_number}
          </span>
          <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${statusColors[match.status]}`}>
            {match.status === "IN_PROGRESS" && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" />
            )}
            {match.status.replace("_", " ")}
          </span>
        </div>

        {/* Teams */}
        <div className="flex items-center gap-3">
          <div className="flex-1 text-sm font-semibold truncate">{team1}</div>
          <span className="text-xs font-black text-muted-foreground">VS</span>
          <div className="flex-1 text-sm font-semibold truncate text-right">{team2}</div>
        </div>

        {/* Score (if in progress or completed) */}
        {(match.status === "IN_PROGRESS" || match.status === "COMPLETED") && (
          <div className="mt-2 text-center">
            <p className="text-xs text-muted-foreground">
              {match.winning_team === "TEAM1"
                ? `${team1} won`
                : match.winning_team === "TEAM2"
                ? `${team2} won`
                : "In progress"}
            </p>
          </div>
        )}

        <div className="flex justify-end mt-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// ─── Queue card ───────────────────────────────────────────
function QueueSection({ players, matches }: { players: Player[]; matches: Match[] }) {
  const activePlayerIds = new Set(
    matches
      .filter((m) => m.status === "IN_PROGRESS" || m.status === "PENDING")
      .flatMap((m) =>
        [m.team1_player1_id, m.team1_player2_id, m.team2_player1_id, m.team2_player2_id].filter(
          Boolean
        )
      )
  );

  const resting = players.filter((p) => !activePlayerIds.has(p.id));
  const playing = players.filter((p) => activePlayerIds.has(p.id));

  return (
    <div className="space-y-4">
      {playing.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" /> On Court
          </p>
          <div className="flex flex-wrap gap-2">
            {playing.map((p) => (
              <span key={p.id} className="rounded-full bg-green-100 text-green-800 border border-green-200 text-xs font-semibold px-3 py-1.5">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
      {resting.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Resting
          </p>
          <div className="flex flex-wrap gap-2">
            {resting
              .sort((a, b) => a.matches_played - b.matches_played)
              .map((p) => (
                <span key={p.id} className="rounded-full bg-muted border border-border text-xs font-semibold px-3 py-1.5 text-muted-foreground">
                  {p.name}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Share button ─────────────────────────────────────────
function ShareButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/s/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
        copied
          ? "bg-green-100 text-green-700 border border-green-200"
          : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
      }`}
      id="share-session-btn"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : `Share · ${code}`}
    </button>
  );
}

// ─── Main client component ────────────────────────────────
interface Props {
  initialSession: Session;
  initialPlayers: Player[];
  initialCourts: Court[];
  initialMatches: Match[];
}

export function SessionHubClient({ initialSession, initialPlayers, initialCourts, initialMatches }: Props) {
  const supabase = createClient();

  const { data: session } = useQuery({
    queryKey: ["session", initialSession.id],
    queryFn: async (): Promise<Session> => {
      const { data } = await supabase.from("sessions").select("*").eq("id", initialSession.id).single();
      return (data as unknown as Session) ?? initialSession;
    },

    initialData: initialSession,
    staleTime: 60_000,
  });


  const { data: players } = useQuery({
    queryKey: ["players", initialSession.id],
    queryFn: async () => {
      const { data } = await supabase.from("players").select("*").eq("session_id", initialSession.id).order("matches_won", { ascending: false });
      return (data ?? []) as Player[];
    },
    initialData: initialPlayers,
    staleTime: 10_000,
  });

  const { data: courts } = useQuery({
    queryKey: ["courts", initialSession.id],
    queryFn: async () => {
      const { data } = await supabase.from("courts").select("*").eq("session_id", initialSession.id);
      return (data ?? []) as Court[];
    },
    initialData: initialCourts,
    staleTime: 60_000,
  });

  const { data: matches } = useQuery({
    queryKey: ["matches", initialSession.id],
    queryFn: async () => {
      const { data } = await supabase.from("matches").select("*").eq("session_id", initialSession.id).order("round_number");
      return (data ?? []) as Match[];
    },
    initialData: initialMatches,
    staleTime: 10_000,
  });

  const courtMap = Object.fromEntries((courts ?? []).map((c) => [c.id, c]));
  const liveMatches = (matches ?? []).filter((m) => m.status === "IN_PROGRESS" || m.status === "PENDING");
  const doneMatches = (matches ?? []).filter((m) => m.status === "COMPLETED");

  const sortedPlayers = [...(players ?? [])].sort((a, b) => {
    if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won;
    return b.point_differential - a.point_differential;
  });

  return (
    <div className="space-y-4 -mt-2">
      {/* Session header */}
      <div className="flex items-start justify-between gap-3 pt-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{session ? SPORT_EMOJIS[session.sport] : ""}</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {session ? `${SPORT_LABELS[session.sport]} · ${FORMAT_LABELS[session.format]}` : ""}
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight truncate">{session?.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center text-xs font-semibold rounded-full px-2 py-0.5 ${
              session?.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
            }`}>
              {session?.status === "ACTIVE" && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" />}
              {session?.status}
            </span>
          </div>
        </div>
        <ShareButton code={session?.spectator_code ?? ""} />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Players", value: players?.length ?? 0, icon: "👥" },
          { label: "Courts", value: courts?.length ?? 0, icon: "📍" },
          { label: "Matches", value: matches?.length ?? 0, icon: "🏆" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-muted/50 border border-border px-3 py-2.5 text-center">
            <p className="text-lg font-black">{stat.icon} {stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matches">
        <TabsList className="w-full rounded-xl h-10">
          <TabsTrigger value="matches" className="flex-1 rounded-lg text-xs font-semibold" id="tab-matches">
            <Activity className="h-3.5 w-3.5 mr-1" /> Matches
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex-1 rounded-lg text-xs font-semibold" id="tab-queue">
            <Clock className="h-3.5 w-3.5 mr-1" /> Queue
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex-1 rounded-lg text-xs font-semibold" id="tab-leaderboard">
            <Trophy className="h-3.5 w-3.5 mr-1" /> Standings
          </TabsTrigger>
        </TabsList>

        {/* Matches tab */}
        <TabsContent value="matches" className="space-y-3 mt-4">
          {liveMatches.length === 0 && doneMatches.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-2xl mb-2">🎾</p>
              <p className="text-sm font-medium">No matches generated yet</p>
            </div>
          )}
          {liveMatches.map((m) => (
            <MatchCard key={m.id} match={m} players={players ?? []} court={courtMap[m.court_id ?? ""]} sessionId={initialSession.id} />
          ))}
          {doneMatches.length > 0 && (
            <>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pt-2">Completed</p>
              {doneMatches.map((m) => (
                <MatchCard key={m.id} match={m} players={players ?? []} court={courtMap[m.court_id ?? ""]} sessionId={initialSession.id} />
              ))}
            </>
          )}
        </TabsContent>

        {/* Queue tab */}
        <TabsContent value="queue" className="mt-4">
          <QueueSection players={players ?? []} matches={matches ?? []} />
        </TabsContent>

        {/* Leaderboard tab */}
        <TabsContent value="leaderboard" className="mt-4">
          <div className="rounded-2xl border border-border overflow-hidden">
            {sortedPlayers.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No standings yet</div>
            ) : (
              sortedPlayers.map((p, i) => <LeaderboardRow key={p.id} player={p} rank={i + 1} />)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

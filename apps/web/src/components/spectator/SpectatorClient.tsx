"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Activity, Wifi } from "lucide-react";
import { SPORT_EMOJIS, SPORT_LABELS, FORMAT_LABELS } from "@/lib/utils/format";
import type { Session, Player, Court, Match } from "@/types/session";
import { TournamentBracket } from "@/components/bracket/TournamentBracket";

interface Props {
  session: Session;
  initialPlayers: Player[];
  initialCourts: Court[];
  initialMatches: Match[];
}

// ─── Live match card ──────────────────────────────────────
function LiveMatchCard({
  match,
  players,
  court,
}: {
  match: Match;
  players: Player[];
  court?: Court;
}) {
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const team1 = [match.team1_player1_id, match.team1_player2_id]
    .filter(Boolean)
    .map((id) => playerMap[id!]?.name)
    .filter(Boolean)
    .join(" & ");
  const team2 = [match.team2_player1_id, match.team2_player2_id]
    .filter(Boolean)
    .map((id) => playerMap[id!]?.name)
    .filter(Boolean)
    .join(" & ");

  const scoreData = match.score_data as Record<string, unknown>;
  const hasScore = Object.keys(scoreData).length > 0;

  return (
    <div className="flex-shrink-0 w-72 rounded-2xl border-2 border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-muted-foreground">{court?.name ?? "Court"}</span>
        <span className={`flex items-center gap-1 text-xs font-bold rounded-full px-2 py-0.5 ${
          match.status === "IN_PROGRESS"
            ? "bg-green-100 text-green-700"
            : match.status === "COMPLETED"
            ? "bg-blue-100 text-blue-700"
            : "bg-muted text-muted-foreground"
        }`}>
          {match.status === "IN_PROGRESS" && (
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          )}
          {match.status.replace("_", " ")}
        </span>
      </div>

      {/* VS display */}
      <div className="space-y-3">
        <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
          match.winning_team === "TEAM1" ? "bg-primary/8 border border-primary/20" : "bg-muted/40"
        }`}>
          <span className="text-sm font-bold truncate max-w-36">{team1}</span>
          {match.winning_team === "TEAM1" && <span className="text-primary text-xs font-black ml-2">WIN</span>}
        </div>
        <div className="text-center">
          <span className="text-xs font-black text-muted-foreground">VS</span>
        </div>
        <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
          match.winning_team === "TEAM2" ? "bg-primary/8 border border-primary/20" : "bg-muted/40"
        }`}>
          <span className="text-sm font-bold truncate max-w-36">{team2}</span>
          {match.winning_team === "TEAM2" && <span className="text-primary text-xs font-black ml-2">WIN</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Standings table ──────────────────────────────────────
function StandingsTable({ players }: { players: Player[] }) {
  const sorted = [...players].sort((a, b) => {
    if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won;
    return b.point_differential - a.point_differential;
  });

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      {sorted.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">No matches yet</div>
      )}
      {sorted.map((player, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
        const losses = player.matches_played - player.matches_won;
        const diffSign = player.point_differential > 0 ? "+" : "";
        const rank = i + 1;

        let pointsBg = "bg-primary/5 border-primary/10";
        let pointsText = "text-primary";
        let pointsLabel = "text-primary/60";

        if (rank === 1) {
          pointsBg = "bg-yellow-50 border-yellow-200";
          pointsText = "text-yellow-600";
          pointsLabel = "text-yellow-600/60";
        } else if (rank === 2) {
          pointsBg = "bg-slate-50 border-slate-200";
          pointsText = "text-slate-600";
          pointsLabel = "text-slate-600/60";
        } else if (rank === 3) {
          pointsBg = "bg-amber-50 border-amber-200";
          pointsText = "text-amber-700";
          pointsLabel = "text-amber-700/60";
        }

        return (
          <div
            key={player.id}
            className={`flex items-center gap-3 px-4 py-3 ${rank <= 3 ? "bg-primary/5" : ""} border-b border-border last:border-0 hover:bg-muted/30 transition-colors`}
          >
            <span className="w-6 text-center text-sm font-bold text-muted-foreground flex-shrink-0">
              {medal ?? rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-foreground">{player.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-semibold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  {player.matches_won}-0-{losses} <span className="opacity-70 font-medium">(W-T-L)</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                player.point_differential > 0 ? "bg-green-100 text-green-700" :
                player.point_differential < 0 ? "bg-red-100 text-red-700" :
                "bg-muted text-muted-foreground"
              }`}>
                Diff: {diffSign}{player.point_differential}
              </span>
              <div className={`text-right rounded-lg px-3 py-1.5 border ${pointsBg}`}>
                <p className={`text-sm font-black leading-tight ${pointsText}`}>{player.points_won}</p>
                <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${pointsLabel}`}>Pts</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main spectator client ────────────────────────────────
export function SpectatorClient({ session, initialPlayers, initialCourts, initialMatches }: Props) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [selectedCourtId, setSelectedCourtId] = useState<string | "all">("all");

  // Data queries
  const { data: players } = useQuery({
    queryKey: ["spectator-players", session.id],
    queryFn: async () => {
      const { data } = await supabase.from("players").select("*").eq("session_id", session.id);
      return (data ?? []) as Player[];
    },
    initialData: initialPlayers,
    refetchInterval: 15_000, // poll every 15s as fallback
  });

  const { data: courts } = useQuery({
    queryKey: ["spectator-courts", session.id],
    queryFn: async () => {
      const { data } = await supabase.from("courts").select("*").eq("session_id", session.id);
      return (data ?? []) as Court[];
    },
    initialData: initialCourts,
    staleTime: 60_000,
  });

  const { data: matches } = useQuery({
    queryKey: ["spectator-matches", session.id],
    queryFn: async () => {
      const { data } = await supabase.from("matches").select("*").eq("session_id", session.id).order("round_number");
      return (data ?? []) as Match[];
    },
    initialData: initialMatches,
    refetchInterval: 10_000, // poll every 10s as fallback
  });

  // ── Supabase Realtime ──────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`session:${session.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches", filter: `session_id=eq.${session.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["spectator-matches", session.id] });
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `session_id=eq.${session.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["spectator-players", session.id] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session.id, supabase, queryClient]);

  const courtMap = Object.fromEntries((courts ?? []).map((c) => [c.id, c]));
  const allActiveMatches = (matches ?? []).filter((m) => m.status === "IN_PROGRESS" || m.status === "PENDING");
  const activeMatches = allActiveMatches.filter((m) => selectedCourtId === "all" || m.court_id === selectedCourtId);
  const completedMatches = (matches ?? []).filter((m) => m.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-xl font-black gradient-text">UrTurn</span>
          <div className="flex items-center gap-2 rounded-full bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5">
            <Wifi className="h-3.5 w-3.5" />
            Live
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Session info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-4xl mb-2">{SPORT_EMOJIS[session.sport]}</div>
          <h1 className="text-2xl font-black tracking-tight">{session.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {SPORT_LABELS[session.sport]} · {FORMAT_LABELS[session.format]}
          </p>
          <div className={`inline-flex items-center gap-1.5 mt-2 rounded-full px-3 py-1 text-xs font-bold ${
            session.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
          }`}>
            {session.status === "ACTIVE" && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
            {session.status}
          </div>
        </motion.div>

        {/* Live match carousel */}
        {allActiveMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-green-600" />
              <h2 className="text-sm font-bold text-green-700 uppercase tracking-wider">On Court</h2>
            </div>
            
            {/* Court Filter */}
            {courts && courts.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-3 mb-1 snap-x scrollbar-hide -mx-4 px-4">
                <button
                  onClick={() => setSelectedCourtId("all")}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors snap-start ${
                    selectedCourtId === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  All Courts
                </button>
                {courts.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCourtId(c.id)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors snap-start ${
                      selectedCourtId === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
              {activeMatches.length === 0 ? (
                 <div className="text-center py-6 text-muted-foreground text-sm w-full">
                   No matches on this court
                 </div>
              ) : (
                activeMatches.map((m) => (
                  <div key={m.id} className="snap-start">
                    <LiveMatchCard match={m} players={players ?? []} court={courtMap[m.court_id ?? ""]} />
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Bracket or Standings */}
        {session.is_knockout ? (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Tournament Bracket</h2>
            </div>
            <div className="bg-slate-50/50 rounded-2xl border border-border min-h-[300px]">
              <TournamentBracket matches={matches ?? []} players={players ?? []} />
            </div>
          </section>
        ) : (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Standings</h2>
            </div>
            <StandingsTable players={players ?? []} />
          </section>
        )}

        {/* No account needed notice */}
        <p className="text-center text-xs text-muted-foreground pb-8">
          👀 You are viewing as a spectator · No account needed
        </p>
      </main>
    </div>
  );
}

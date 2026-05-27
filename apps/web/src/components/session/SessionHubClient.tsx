"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Share2, Trophy, Activity, Clock, ChevronRight, Check,
  FlagOff, Flag, AlertTriangle, X, Image as ImageIcon
} from "lucide-react";
import { ShareResultModal } from "./ShareResultModal";
import { SPORT_EMOJIS, SPORT_LABELS, FORMAT_LABELS } from "@/lib/utils/format";
import type { Session, Player, Court, Match } from "@/types/session";
import { TournamentBracket, type TeamSlot } from "@/components/bracket/TournamentBracket";

// ─── Leaderboard row ───────────────────────────────────────
function LeaderboardRow({ player, rank }: { player: Player; rank: number }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const losses = player.matches_played - player.matches_won;
  const diffSign = player.point_differential > 0 ? "+" : "";

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
    <div className={`flex items-center gap-3 px-4 py-3 ${rank <= 3 ? "bg-primary/5" : ""} border-b border-border last:border-0 hover:bg-muted/30 transition-colors`}>
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
}

// ─── Match card ────────────────────────────────────────────
function MatchCard({
  match, players, court, sessionId,
}: {
  match: Match; players: Player[]; court?: Court; sessionId: string;
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
        <div className="flex items-center gap-3">
          <div className="flex-1 text-sm font-semibold truncate">{team1}</div>
          <span className="text-xs font-black text-muted-foreground">VS</span>
          <div className="flex-1 text-sm font-semibold truncate text-right">{team2}</div>
        </div>
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

// ─── Queue section ─────────────────────────────────────────
function QueueSection({ players, matches }: { players: Player[]; matches: Match[] }) {
  const activePlayerIds = new Set(
    matches
      .filter((m) => m.status === "IN_PROGRESS" || m.status === "PENDING")
      .flatMap((m) =>
        [m.team1_player1_id, m.team1_player2_id, m.team2_player1_id, m.team2_player2_id].filter(Boolean)
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

// ─── Share button ──────────────────────────────────────────
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

// ─── End session modal ─────────────────────────────────────
type EndMode = "normal" | "force";

function EndSessionModal({
  mode,
  pendingCount,
  onConfirm,
  onCancel,
  isPending,
}: {
  mode: EndMode;
  pendingCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const isForce = mode === "force";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden"
      >
        <div className="w-10 h-1 rounded-full bg-border mx-auto mt-4 sm:hidden" />

        <div className="px-6 pt-6 pb-8">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isForce ? "bg-amber-100" : "bg-emerald-100"
          }`}>
            {isForce
              ? <FlagOff className="h-7 w-7 text-amber-600" />
              : <Flag className="h-7 w-7 text-emerald-600" />
            }
          </div>

          <h2 className="text-xl font-black text-center mb-1">
            {isForce ? "Force end session?" : "End session?"}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {isForce
              ? `There are still ${pendingCount} match${pendingCount > 1 ? "es" : ""} not completed.`
              : "All matches are done. Ready to wrap up?"}
          </p>

          {/* Warning for force mode */}
          {isForce && (
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3 mb-6">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Remaining pending and in-progress matches will be marked as <strong>Cancelled</strong>. Final standings will reflect only completed matches.
              </p>
            </div>
          )}

          {/* Normal mode info */}
          {!isForce && (
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-3 mb-6">
              <Trophy className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 leading-relaxed">
                The session will be marked as <strong>Completed</strong>. Final standings will be locked and viewable from your dashboard.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl"
              onClick={onCancel}
              disabled={isPending}
              id="cancel-end-session-btn"
            >
              <X className="h-4 w-4 mr-1.5" />
              Cancel
            </Button>
            <Button
              className={`flex-1 h-11 rounded-xl font-bold text-white ${
                isForce
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              onClick={onConfirm}
              disabled={isPending}
              id="confirm-end-session-btn"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ending…
                </span>
              ) : isForce ? (
                <span className="flex items-center gap-1.5">
                  <FlagOff className="h-4 w-4" />
                  Force End
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Flag className="h-4 w-4" />
                  End Session
                </span>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── End session button bar ────────────────────────────────
function EndSessionBar({
  allDone,
  pendingCount,
  onEndClick,
}: {
  allDone: boolean;
  pendingCount: number;
  onEndClick: (mode: EndMode) => void;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${
      allDone
        ? "bg-emerald-50 border-emerald-200"
        : "bg-amber-50 border-amber-200"
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {allDone ? (
            <>
              <p className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                <Trophy className="h-4 w-4" /> All matches done!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Ready to lock in final standings.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-amber-800 flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {pendingCount} match{pendingCount > 1 ? "es" : ""} remaining
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                You can force end the session early.
              </p>
            </>
          )}
        </div>
        <Button
          onClick={() => onEndClick(allDone ? "normal" : "force")}
          className={`flex-shrink-0 h-10 rounded-xl font-bold text-white text-sm ${
            allDone
              ? "bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200"
              : "bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-200"
          }`}
          id="end-session-bar-btn"
        >
          {allDone ? (
            <span className="flex items-center gap-1.5">
              <Flag className="h-4 w-4" /> End Session
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <FlagOff className="h-4 w-4" /> Force End
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────
interface Props {
  initialSession: Session;
  initialPlayers: Player[];
  initialCourts: Court[];
  initialMatches: Match[];
}

export function SessionHubClient({ initialSession, initialPlayers, initialCourts, initialMatches }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [endMode, setEndMode] = useState<EndMode | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string | "all">("all");
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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

  // ── End session mutation ──
  const endSession = useMutation({
    mutationFn: async (mode: EndMode) => {
      const sessionId = initialSession.id;

      // For force end: cancel all pending/in-progress matches first
      if (mode === "force") {
        const pendingIds = (matches ?? [])
          .filter((m) => m.status === "PENDING" || m.status === "IN_PROGRESS")
          .map((m) => m.id);

        if (pendingIds.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: matchError } = await (supabase as any)
            .from("matches")
            .update({ status: "CANCELLED" })
            .in("id", pendingIds);
          if (matchError) throw matchError;
        }
      }

      // Mark session as COMPLETED
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("sessions")
        .update({ status: "COMPLETED" })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate queries so dashboard reflects new status
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session", initialSession.id] });
      queryClient.invalidateQueries({ queryKey: ["matches", initialSession.id] });
      router.push("/dashboard");
    },
  });

  // ── Swap seeding mutation ──
  const swapSeeding = useMutation({
    mutationFn: async ({ slot1, slot2 }: { slot1: TeamSlot; slot2: TeamSlot }) => {
      if (!matches) throw new Error("Matches not loaded");
      
      const m1 = matches.find(m => m.id === slot1.matchId);
      const m2 = matches.find(m => m.id === slot2.matchId);
      
      if (!m1 || !m2) throw new Error("Matches not found");

      // Extract teams
      const team1_p1 = slot1.teamIndex === 1 ? m1.team1_player1_id : m1.team2_player1_id;
      const team1_p2 = slot1.teamIndex === 1 ? m1.team1_player2_id : m1.team2_player2_id;
      
      const team2_p1 = slot2.teamIndex === 1 ? m2.team1_player1_id : m2.team2_player1_id;
      const team2_p2 = slot2.teamIndex === 1 ? m2.team1_player2_id : m2.team2_player2_id;

      // Update match 1
      const update1 = slot1.teamIndex === 1 
        ? { team1_player1_id: team2_p1, team1_player2_id: team2_p2 }
        : { team2_player1_id: team2_p1, team2_player2_id: team2_p2 };

      // Update match 2
      const update2 = slot2.teamIndex === 1
        ? { team1_player1_id: team1_p1, team1_player2_id: team1_p2 }
        : { team2_player1_id: team1_p1, team2_player2_id: team1_p2 };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err1 } = await (supabase as any).from("matches").update(update1).eq("id", m1.id);
      if (err1) throw err1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err2 } = await (supabase as any).from("matches").update(update2).eq("id", m2.id);
      if (err2) throw err2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", initialSession.id] });
    },
    onError: (err) => {
      console.error("Failed to swap:", err.message);
    }
  });

  const courtMap = Object.fromEntries((courts ?? []).map((c) => [c.id, c]));
  const allLiveMatches = (matches ?? []).filter((m) => m.status === "IN_PROGRESS" || m.status === "PENDING");
  const allDoneMatches = (matches ?? []).filter((m) => m.status === "COMPLETED");
  const allDone = allLiveMatches.length === 0 && (matches ?? []).length > 0;
  const isActive = session?.status === "ACTIVE";
  
  // Can only edit seeding if no matches have started
  const canEditSeeding = session?.is_knockout && isActive && (matches ?? []).every(m => m.status === "PENDING");

  const liveMatches = allLiveMatches.filter((m) => selectedCourtId === "all" || m.court_id === selectedCourtId);
  const doneMatches = allDoneMatches.filter((m) => selectedCourtId === "all" || m.court_id === selectedCourtId);

  let displayStandings = [...(players ?? [])].sort((a, b) => {
    if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won;
    return b.point_differential - a.point_differential;
  });

  if (session?.format === "FIXED_DOUBLES") {
    const pairs = new Map<string, Player>();
    const playerMap = Object.fromEntries(displayStandings.map(p => [p.id, p]));
    
    (matches ?? []).forEach(m => {
      const addTeam = (p1Id: string | null, p2Id: string | null) => {
        if (!p1Id || !p2Id) return;
        const [idA, idB] = [p1Id, p2Id].sort();
        const key = `${idA}-${idB}`;
        if (!pairs.has(key)) {
          const p1 = playerMap[idA];
          const p2 = playerMap[idB];
          if (p1 && p2) {
             pairs.set(key, {
               ...p1,
               id: key,
               name: `${p1.name} & ${p2.name}`,
             });
          }
        }
      };
      addTeam(m.team1_player1_id, m.team1_player2_id);
      addTeam(m.team2_player1_id, m.team2_player2_id);
    });

    displayStandings = Array.from(pairs.values()).sort((a, b) => {
      if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won;
      return b.point_differential - a.point_differential;
    });
  }

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

      {/* ── End session bar (only when ACTIVE and has matches) ── */}
      {isActive && (matches ?? []).length > 0 && (
        <EndSessionBar
          allDone={allDone}
          pendingCount={allLiveMatches.length}
          onEndClick={(mode) => setEndMode(mode)}
        />
      )}

      {/* ── Share results bar (only when COMPLETED) ── */}
      {session?.status === "COMPLETED" && (
        <div className="rounded-2xl border bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-yellow-500" /> Session Completed!
              </p>
              <p className="text-xs text-blue-700/80 mt-0.5">
                Share the final standings with players.
              </p>
            </div>
            <Button
              onClick={() => setShowShareModal(true)}
              className="flex-shrink-0 h-10 rounded-xl font-bold text-white text-sm bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200"
            >
              <ImageIcon className="h-4 w-4 mr-1.5" /> Export Image
            </Button>
          </div>
        </div>
      )}

        {/* Tabs */}
      <Tabs defaultValue={session?.is_knockout ? "bracket" : "matches"}>
        <TabsList className="w-full rounded-xl h-10">
          {session?.is_knockout && (
            <TabsTrigger value="bracket" className="flex-1 rounded-lg text-xs font-semibold" id="tab-bracket">
              <Trophy className="h-3.5 w-3.5 mr-1" /> Bracket
            </TabsTrigger>
          )}
          <TabsTrigger value="matches" className="flex-1 rounded-lg text-xs font-semibold" id="tab-matches">
            <Activity className="h-3.5 w-3.5 mr-1" /> Matches
          </TabsTrigger>
          {!session?.is_knockout && (
            <TabsTrigger value="queue" className="flex-1 rounded-lg text-xs font-semibold" id="tab-queue">
              <Clock className="h-3.5 w-3.5 mr-1" /> Queue
            </TabsTrigger>
          )}
          <TabsTrigger value="leaderboard" className="flex-1 rounded-lg text-xs font-semibold" id="tab-leaderboard">
            <Trophy className="h-3.5 w-3.5 mr-1" /> Standings
          </TabsTrigger>
        </TabsList>

        {/* Bracket tab */}
        {session?.is_knockout && (
          <TabsContent value="bracket" className="mt-4">
            <div className="bg-slate-50/50 rounded-2xl border border-border min-h-[300px] flex flex-col">
              {canEditSeeding && (
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <div className="flex-1">
                    {isEditMode && (
                      <div className="inline-block bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/20">
                        Select 2 teams to swap their positions
                      </div>
                    )}
                  </div>
                  <Button
                    variant={isEditMode ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs font-bold shadow-sm"
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    {isEditMode ? "Done Editing" : "⚙️ Edit Seeding"}
                  </Button>
                </div>
              )}
              <div className="relative flex-1">
                <TournamentBracket 
                  matches={matches ?? []} 
                  players={players ?? []} 
                  isAdmin={true} 
                  isEditMode={isEditMode}
                  onSwap={(slot1, slot2) => {
                    swapSeeding.mutate({ slot1, slot2 });
                  }}
                />
              </div>
            </div>
          </TabsContent>
        )}

        {/* Matches tab */}
        <TabsContent value="matches" className="space-y-3 mt-4">
          
          {/* Court Filter */}
          {courts && courts.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 snap-x scrollbar-hide">
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

          {liveMatches.length === 0 && doneMatches.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-2xl mb-2">🎾</p>
              <p className="text-sm font-medium">No matches {selectedCourtId !== "all" ? "on this court" : "generated yet"}</p>
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
        {!session?.is_knockout && (
          <TabsContent value="queue" className="mt-4">
            <QueueSection players={players ?? []} matches={matches ?? []} />
          </TabsContent>
        )}

        {/* Leaderboard tab */}
        <TabsContent value="leaderboard" className="mt-4">
          <div className="rounded-2xl border border-border overflow-hidden">
            {displayStandings.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No standings yet</div>
            ) : (
              displayStandings.map((p, i) => <LeaderboardRow key={p.id} player={p} rank={i + 1} />)
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* End session confirm modal */}
      <AnimatePresence>
        {endMode && (
          <EndSessionModal
            mode={endMode}
            pendingCount={allLiveMatches.length}
            onConfirm={() => endSession.mutate(endMode)}
            onCancel={() => setEndMode(null)}
            isPending={endSession.isPending}
          />
        )}
      </AnimatePresence>

      {/* Share Results Modal */}
      {session && players && (
        <ShareResultModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          session={session}
          players={displayStandings}
        />
      )}
    </div>
  );
}

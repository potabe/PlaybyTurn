"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconSearch, IconTrophy, IconActivity, IconTrendingUp, IconUsers, IconChevronDown, IconChevronUp, IconX, IconTarget, IconCheckbox, IconChartLine, IconBolt } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { SPORT_EMOJIS, SPORT_LABELS } from "@/lib/utils/format";
import type { Session, Player } from "@/types/session";
import type { SportType } from "@/types/session";

// ─── Types ────────────────────────────────────────────────────
interface AggregatedPlayer {
  name: string;
  sessionsCount: number;
  matchesPlayed: number;
  matchesWon: number;
  pointsWon: number;
  pointDifferential: number;
  winRate: number;
  sports: SportType[];
  sessionBreakdown: {
    sessionId: string;
    sessionTitle: string;
    sport: SportType;
    matchesPlayed: number;
    matchesWon: number;
    pointsWon: number;
  }[];
  lastPlayed: Date | null;
}

// ─── Helper: aggregate players by name ────────────────────────
function aggregatePlayers(
  players: Player[],
  sessions: Session[]
): AggregatedPlayer[] {
  const sessionMap = Object.fromEntries(sessions.map((s) => [s.id, s]));
  const map = new Map<string, AggregatedPlayer>();

  for (const p of players) {
    const key = p.name.trim().toLowerCase();
    const session = sessionMap[p.session_id];
    if (!session) continue;

    if (!map.has(key)) {
      map.set(key, {
        name: p.name.trim(),
        sessionsCount: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        pointsWon: 0,
        pointDifferential: 0,
        winRate: 0,
        sports: [],
        sessionBreakdown: [],
        lastPlayed: null,
      });
    }

    const agg = map.get(key)!;
    agg.sessionsCount += 1;
    agg.matchesPlayed += p.matches_played;
    agg.matchesWon += p.matches_won;
    agg.pointsWon += p.points_won;
    agg.pointDifferential += p.point_differential;
    if (!agg.sports.includes(session.sport)) agg.sports.push(session.sport);
    if (p.last_played_at) {
      if (!agg.lastPlayed || p.last_played_at.getTime() > agg.lastPlayed.getTime()) {
        agg.lastPlayed = p.last_played_at;
      }
    }
    agg.sessionBreakdown.push({
      sessionId: session.id,
      sessionTitle: session.title,
      sport: session.sport,
      matchesPlayed: p.matches_played,
      matchesWon: p.matches_won,
      pointsWon: p.points_won,
    });
  }

  // Calculate win rates
  for (const agg of map.values()) {
    agg.winRate =
      agg.matchesPlayed > 0
        ? Math.round((agg.matchesWon / agg.matchesPlayed) * 100)
        : 0;
    // Use the display name from the first occurrence (preserves casing)
  }

  return Array.from(map.values()).sort(
    (a, b) => b.matchesWon - a.matchesWon || b.matchesPlayed - a.matchesPlayed
  );
}

// ─── Win rate badge ───────────────────────────────────────────
function WinRateBadge({ rate }: { rate: number }) {
  const color =
    rate >= 70
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : rate >= 50
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      : rate >= 30
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
  return (
    <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${color}`}>
      {rate}%
    </span>
  );
}

// ─── Stat pill ────────────────────────────────────────────────
function StatPill({
  icon,
  label,
  value,
  color = "bg-muted",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className={`rounded-xl ${color} px-3 py-2 text-center`}>
      <div className="text-base font-black flex items-center justify-center gap-1.5">{icon} <span>{value}</span></div>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// ─── Player detail modal ──────────────────────────────────────
function PlayerDetailModal({
  player,
  rank,
  onClose,
}: {
  player: AggregatedPlayer;
  rank: number;
  onClose: () => void;
}) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4 sm:hidden" />
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {medal && <span className="text-2xl">{medal}</span>}
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Rank #{rank}
                </span>
              </div>
              <h2 className="text-xl font-black">{player.name}</h2>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {player.sports.map((s) => (
                  <span key={s} className="text-xs bg-muted rounded-full px-2 py-0.5 font-medium">
                    {SPORT_EMOJIS[s]} {SPORT_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 hover:bg-muted transition-colors"
              id="close-player-modal-btn"
            >
              <IconX className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="px-6 py-4 grid grid-cols-3 gap-2 flex-shrink-0">
          <StatPill icon={<IconTrophy className="w-4 h-4 text-amber-500" />} label="Sessions" value={player.sessionsCount} color="bg-primary/5 dark:bg-primary/10" />
          <StatPill icon={<IconTarget className="w-4 h-4 text-rose-500" />} label="Matches" value={player.matchesPlayed} />
          <StatPill icon={<IconCheckbox className="w-4 h-4 text-emerald-500" />} label="Wins" value={player.matchesWon} color="bg-emerald-50 dark:bg-emerald-900/20" />
          <StatPill icon={<IconChartLine className="w-4 h-4 text-indigo-500" />} label="Win Rate" value={`${player.winRate}%`} color={
            player.winRate >= 50 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"
          } />
          <StatPill icon={<IconBolt className="w-4 h-4 text-amber-400" />} label="Points" value={player.pointsWon} />
          <StatPill icon={<span className="font-sans font-bold text-base text-foreground/80">±</span>} label="Diff" value={
            player.pointDifferential >= 0
              ? `+${player.pointDifferential}`
              : player.pointDifferential
          } color={player.pointDifferential >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"} />
        </div>

        {/* Win rate bar */}
        <div className="px-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            <span className="text-muted-foreground">Win rate</span>
            <WinRateBadge rate={player.winRate} />
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${player.winRate}%` }}
              transition={{ duration: 0.6, ease: [0.0, 0.0, 0.2, 1.0] }}
            />
          </div>
        </div>

        {/* Session breakdown */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Session History
          </p>
          <div className="space-y-2">
            {player.sessionBreakdown.map((sb, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <span className="text-xl flex-shrink-0">{SPORT_EMOJIS[sb.sport]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{sb.sessionTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {sb.matchesPlayed} matches · {sb.pointsWon} pts
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black">
                    {sb.matchesWon}
                    <span className="text-xs font-normal text-muted-foreground">
                      /{sb.matchesPlayed}W
                    </span>
                  </p>
                </div>
              </div>
            ))}
            {player.sessionBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No matches recorded yet
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Sort config ──────────────────────────────────────────────
type SortKey = "matchesWon" | "matchesPlayed" | "winRate" | "pointsWon" | "sessionsCount";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "matchesWon", label: "Wins" },
  { key: "winRate", label: "Win %" },
  { key: "matchesPlayed", label: "Matches" },
  { key: "pointsWon", label: "Points" },
  { key: "sessionsCount", label: "Sessions" },
];

// ─── Main component ───────────────────────────────────────────
interface Props {
  sessions: Session[];
  players: Player[];
}

export function StatsClient({ sessions, players }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("matchesWon");
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<AggregatedPlayer | null>(null);
  const [sportFilter, setSportFilter] = useState<SportType | "ALL">("ALL");

  const allAggregated = useMemo(
    () => aggregatePlayers(players, sessions),
    [players, sessions]
  );

  // All sports that appear across all sessions
  const availableSports = useMemo(() => {
    const s = new Set<SportType>();
    sessions.forEach((sess) => s.add(sess.sport));
    return Array.from(s);
  }, [sessions]);

  const filtered = useMemo(() => {
    let list = allAggregated;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (sportFilter !== "ALL") {
      list = list.filter((p) => p.sports.includes(sportFilter));
    }
    list = [...list].sort((a, b) => {
      const diff = (b[sortKey] as number) - (a[sortKey] as number);
      return sortAsc ? -diff : diff;
    });
    return list;
  }, [allAggregated, search, sportFilter, sortKey, sortAsc]);

  // Global stats
  const totalMatches = allAggregated.reduce((s, p) => s + p.matchesPlayed, 0);
  const uniquePlayers = allAggregated.length;
  const avgWinRate =
    allAggregated.length > 0
      ? Math.round(
          allAggregated.reduce((s, p) => s + p.winRate, 0) / allAggregated.length
        )
      : 0;

  const selectedRank = selected
    ? filtered.findIndex((p) => p.name.toLowerCase() === selected.name.toLowerCase()) + 1
    : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Player Stats</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Historical performance across all your sessions
        </p>
      </div>

      {/* ── Global stat strip ── */}
      {uniquePlayers > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 px-4 py-3 text-center">
            <p className="text-2xl font-black">{uniquePlayers}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
              <IconUsers className="h-3 w-3" /> Players
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 px-4 py-3 text-center">
            <p className="text-2xl font-black">{totalMatches}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
              <IconActivity className="h-3 w-3" /> Matches
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 px-4 py-3 text-center">
            <p className="text-2xl font-black">{avgWinRate}%</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
              <IconTrendingUp className="h-3 w-3" /> Avg Win Rate
            </p>
          </div>
        </div>
      )}

      {/* ── IconSearch & filters ── */}
      <div className="space-y-3">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="IconSearch player..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
            id="stats-search-input"
          />
        </div>

        {/* Sport filter */}
        {availableSports.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSportFilter("ALL")}
              className={`text-xs font-semibold rounded-full px-3 py-1.5 transition-colors ${
                sportFilter === "ALL"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              id="filter-all-btn"
            >
              All Sports
            </button>
            {availableSports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSportFilter(sport)}
                className={`text-xs font-semibold rounded-full px-3 py-1.5 transition-colors ${
                  sportFilter === sport
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                id={`filter-${sport.toLowerCase()}-btn`}
              >
                {SPORT_EMOJIS[sport]} {SPORT_LABELS[sport]}
              </button>
            ))}
          </div>
        )}

        {/* Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Sort by:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                if (sortKey === opt.key) setSortAsc(!sortAsc);
                else { setSortKey(opt.key); setSortAsc(false); }
              }}
              className={`flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1.5 transition-colors ${
                sortKey === opt.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              id={`sort-${opt.key}-btn`}
            >
              {opt.label}
              {sortKey === opt.key && (
                sortAsc ? <IconChevronUp className="h-3 w-3" /> : <IconChevronDown className="h-3 w-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Player list ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          {uniquePlayers === 0 ? (
            <>
              <div className="text-5xl mb-3">📊</div>
              <h3 className="text-base font-bold">No stats yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Stats appear after players complete matches in your sessions.
              </p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm font-medium">No players found</p>
              <button
                onClick={() => { setSearch(""); setSportFilter("ALL"); }}
                className="mt-2 text-xs text-primary font-semibold hover:underline"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">W/M</span>
            <span className="text-right hidden sm:block">Pts</span>
            <span className="text-right">Win%</span>
          </div>

          {/* Player rows */}
          <div>
            {filtered.map((player, idx) => {
              const rank = idx + 1;
              const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
              return (
                <motion.button
                  key={player.name.toLowerCase()}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setSelected(player)}
                  className="w-full grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 px-4 py-3.5 border-b border-border last:border-0 hover:bg-primary/3 transition-colors text-left items-center"
                  id={`player-row-${idx}`}
                >
                  {/* Rank */}
                  <span className="w-6 text-center font-black text-sm text-muted-foreground">
                    {medal ?? rank}
                  </span>

                  {/* Name + sports */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{player.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {player.sessionsCount} {player.sessionsCount === 1 ? "session" : "sessions"}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs">
                        {player.sports.map((s) => SPORT_EMOJIS[s]).join(" ")}
                      </span>
                    </div>
                  </div>

                  {/* W/M */}
                  <div className="text-right">
                    <span className="text-sm font-black text-foreground">{player.matchesWon}</span>
                    <span className="text-xs text-muted-foreground">/{player.matchesPlayed}</span>
                  </div>

                  {/* Points */}
                  <div className="text-right hidden sm:block">
                    <span className="text-sm font-bold">{player.pointsWon}</span>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>

                  {/* Win rate */}
                  <div className="text-right">
                    <WinRateBadge rate={player.winRate} />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Footer note ── */}
      {filtered.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Tap any player to see their full history
        </p>
      )}

      {/* ── Player detail modal ── */}
      <AnimatePresence>
        {selected && (
          <PlayerDetailModal
            player={selected}
            rank={selectedRank}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

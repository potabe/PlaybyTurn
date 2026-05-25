"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getScoringEngine } from "@/lib/scoring";
import { ArrowLeft, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Match, Session, Player } from "@/types/session";
import type { ScoreData, Team } from "@/types/scoring";
import { SPORT_LABELS } from "@/lib/utils/format";

interface Props {
  initialMatch: Match;
  session: Session;
  players: Player[];
}

export function ScoreTrackerClient({ initialMatch, session, players }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const engine = getScoringEngine(session.sport);

  // ── State ──────────────────────────────────────────────
  const [match, setMatch] = useState<Match>(initialMatch);
  const [scoreState, setScoreState] = useState<ScoreData>(
    Object.keys(initialMatch.score_data as object).length > 0
      ? (initialMatch.score_data as ScoreData)
      : engine.initState()
  );
  const [history, setHistory] = useState<ScoreData[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tapFeedback, setTapFeedback] = useState<Team | null>(null);

  // Screen wake lock
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if ("wakeLock" in navigator) {
      navigator.wakeLock
        .request("screen")
        .then((lock) => { wakeLockRef.current = lock; })
        .catch(() => {});
    }
    return () => { wakeLockRef.current?.release().catch(() => {}); };
  }, []);

  // ── Players ────────────────────────────────────────────
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const t1p1 = match.team1_player1_id ? playerMap[match.team1_player1_id] : null;
  const t1p2 = match.team1_player2_id ? playerMap[match.team1_player2_id] : null;
  const t2p1 = match.team2_player1_id ? playerMap[match.team2_player1_id] : null;
  const t2p2 = match.team2_player2_id ? playerMap[match.team2_player2_id] : null;
  const team1Name = [t1p1?.name, t1p2?.name].filter(Boolean).join(" & ");
  const team2Name = [t2p1?.name, t2p2?.name].filter(Boolean).join(" & ");

  // ── Score display ──────────────────────────────────────
  const display = engine.getDisplayScore(scoreState);
  const isComplete = engine.isMatchComplete(scoreState);
  const winner = engine.getWinner(scoreState);

  // ── Mutations ──────────────────────────────────────────
  const updateScore = useMutation({
    mutationFn: async (newScoreData: ScoreData) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("matches")
        .update({
          score_data: newScoreData,
          status: "IN_PROGRESS",
          started_at: match.started_at ?? new Date().toISOString(),
        })
        .eq("id", match.id);
      if (error) throw error;
    },
  });


  const finishMatch = useMutation({
    mutationFn: async () => {
      const winningTeam = winner;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("matches")
        .update({
          status: "COMPLETED",
          winning_team: winningTeam === "team1" ? "TEAM1" : "TEAM2",
          completed_at: new Date().toISOString(),
          score_data: scoreState,
        })
        .eq("id", match.id);
      if (error) throw error;


      // Update player stats
      const winnerIds = winningTeam === "team1"
        ? [match.team1_player1_id, match.team1_player2_id]
        : [match.team2_player1_id, match.team2_player2_id];
      const allIds = [
        match.team1_player1_id, match.team1_player2_id,
        match.team2_player1_id, match.team2_player2_id,
      ].filter(Boolean) as string[];

      for (const playerId of allIds) {
        const isWinner = winnerIds.includes(playerId);
        const player = playerMap[playerId];
        if (!player) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("players")
          .update({
            matches_played: player.matches_played + 1,
            matches_won: player.matches_won + (isWinner ? 1 : 0),
            last_played_at: new Date().toISOString(),
          })
          .eq("id", playerId);

      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", match.session_id] });
      queryClient.invalidateQueries({ queryKey: ["players", match.session_id] });
      router.push(`/sessions/${match.session_id}`);
    },
  });

  // ── Point handlers ─────────────────────────────────────
  const addPoint = useCallback(
    (team: Team) => {
      if (isComplete) return;
      setHistory((h) => [...h, scoreState]);
      const newState = engine.addPoint(scoreState, team);
      setScoreState(newState);
      updateScore.mutate(newState);

      // Tap feedback animation
      setTapFeedback(team);
      setTimeout(() => setTapFeedback(null), 150);

      // Auto-show finish if complete after adding
      if (engine.isMatchComplete(newState)) {
        setTimeout(() => setShowConfirm(true), 400);
      }
    },
    [isComplete, scoreState, engine, updateScore]
  );

  const undoPoint = useCallback(() => {
    if (history.length === 0) return;
    const { state, history: newHistory } = engine.undoPoint(scoreState, history);
    setScoreState(state);
    setHistory(newHistory);
    updateScore.mutate(state);
  }, [history, scoreState, engine, updateScore]);

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-white flex flex-col overflow-hidden">
      {/* ── Nav bar ── */}
      <div className="flex items-center justify-between px-4 pt-safe h-14 bg-white border-b border-border flex-shrink-0 z-10">
        <button
          onClick={() => router.push(`/sessions/${match.session_id}`)}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium">{SPORT_LABELS[session.sport]}</p>
          {display.currentSetDetail && (
            <p className="text-xs font-bold text-primary">{display.currentSetDetail}</p>
          )}
        </div>
        <button
          onClick={undoPoint}
          disabled={history.length === 0}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          aria-label="Undo last point"
          id="undo-btn"
        >
          <RotateCcw className="h-4 w-4" />
          Undo
        </button>
      </div>

      {/* ── Previous set scores ── */}
      {display.sets && display.sets.length > 0 && (
        <div className="flex justify-center gap-3 py-2 bg-muted/30 border-b border-border flex-shrink-0">
          {display.sets.map((set, i) => (
            <div key={i} className="flex gap-2 text-xs font-bold text-muted-foreground">
              <span>S{i + 1}:</span>
              <span className={set.t1 > set.t2 ? "text-primary" : ""}>{set.t1}</span>
              <span>-</span>
              <span className={set.t2 > set.t1 ? "text-primary" : ""}>{set.t2}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Score tap zones (50/50 vertical split) ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Team 1 */}
        <motion.button
          id="score-team1-btn"
          className={`relative flex-1 flex flex-col items-center justify-center select-none cursor-pointer transition-colors ${
            tapFeedback === "team1" ? "bg-primary/8" : "bg-white hover:bg-primary/4 active:bg-primary/10"
          }`}
          onClick={() => addPoint("team1")}
          disabled={isComplete}
          whileTap={{ scale: 0.97 }}
        >
          <AnimatePresence>
            {tapFeedback === "team1" && (
              <motion.div
                initial={{ scale: 1.6, opacity: 0.6 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 bg-primary/15 rounded-none pointer-events-none"
              />
            )}
          </AnimatePresence>
          <div className="score-display text-foreground">
            {display.team1}
          </div>
          <p className="text-sm font-bold text-muted-foreground mt-2 px-4 text-center max-w-48 truncate">
            {team1Name}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">Tap to score</p>
        </motion.button>

        {/* Divider */}
        <div className="w-px bg-border flex-shrink-0" />

        {/* Team 2 */}
        <motion.button
          id="score-team2-btn"
          className={`relative flex-1 flex flex-col items-center justify-center select-none cursor-pointer transition-colors ${
            tapFeedback === "team2" ? "bg-primary/8" : "bg-white hover:bg-primary/4 active:bg-primary/10"
          }`}
          onClick={() => addPoint("team2")}
          disabled={isComplete}
          whileTap={{ scale: 0.97 }}
        >
          <AnimatePresence>
            {tapFeedback === "team2" && (
              <motion.div
                initial={{ scale: 1.6, opacity: 0.6 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 bg-primary/15 rounded-none pointer-events-none"
              />
            )}
          </AnimatePresence>
          <div className="score-display text-foreground">
            {display.team2}
          </div>
          <p className="text-sm font-bold text-muted-foreground mt-2 px-4 text-center max-w-48 truncate">
            {team2Name}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">Tap to score</p>
        </motion.button>
      </div>

      {/* ── End match button ── */}
      <div className="px-4 pb-safe py-3 border-t border-border flex-shrink-0 bg-white">
        <Button
          variant="outline"
          className="w-full h-11 rounded-xl font-semibold text-sm"
          onClick={() => setShowConfirm(true)}
          id="end-match-btn"
        >
          End Match
        </Button>
      </div>

      {/* ── Confirm end match overlay ── */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-end z-50 pb-safe"
            onClick={(e) => e.target === e.currentTarget && !isComplete && setShowConfirm(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full bg-white rounded-t-3xl px-6 pt-6 pb-8"
            >
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" />

              {isComplete ? (
                <>
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-3">🏆</div>
                    <h3 className="text-xl font-black">Match Complete!</h3>
                    <p className="text-muted-foreground mt-1">
                      <strong>{winner === "team1" ? team1Name : team2Name}</strong> wins!
                    </p>
                  </div>
                  <Button
                    className="w-full h-12 rounded-xl font-bold bg-primary"
                    onClick={() => finishMatch.mutate()}
                    disabled={finishMatch.isPending}
                    id="confirm-finish-btn"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {finishMatch.isPending ? "Saving…" : "Save Result & Continue"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-3">⚠️</div>
                    <h3 className="text-xl font-black">End match early?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      The match isn't finished. Current score will be saved.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-xl font-semibold"
                      onClick={() => setShowConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 h-12 rounded-xl font-bold bg-destructive hover:bg-destructive/90"
                      onClick={() => finishMatch.mutate()}
                      disabled={finishMatch.isPending}
                      id="force-end-btn"
                    >
                      {finishMatch.isPending ? "Saving…" : "End Anyway"}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

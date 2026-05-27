"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getScoringEngine } from "@/lib/scoring";
import { ArrowLeft, Minus, CheckCircle2, AlertTriangle, Pencil } from "lucide-react";


import { Button } from "@/components/ui/button";
import type { Match, Session, Player } from "@/types/session";
import type { ScoreData, Team } from "@/types/scoring";
import { SPORT_LABELS } from "@/lib/utils/format";
import { getTeamName } from "@/lib/utils/team";

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
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
  const team1Name = getTeamName(match.team1_player1_id, match.team1_player2_id, playerMap, session);
  const team2Name = getTeamName(match.team2_player1_id, match.team2_player2_id, playerMap, session);

  // ── Score display ──────────────────────────────────────
  const display = engine.getDisplayScore(scoreState);
  const isComplete = engine.isMatchComplete(scoreState);
  const winner = engine.getWinner(scoreState);

  // ── Helper to calculate points ─────────────────────────
  const getMatchStats = (scoreData: ScoreData, team: Team) => {
    if (!("sport" in scoreData)) return { won: 0, lost: 0 };
    let won = 0;
    let lost = 0;

    if (scoreData.sport === "TENNIS" || scoreData.sport === "PADEL") {
      // Sum of games won in all sets
      for (const set of scoreData.sets) {
        if (team === "team1") { won += set.t1; lost += set.t2; }
        else { won += set.t2; lost += set.t1; }
      }
      // Sum points from super tiebreak if it exists
      if (scoreData.sport === "PADEL" && scoreData.superTiebreak) {
        if (team === "team1") { won += scoreData.superTiebreak.t1; lost += scoreData.superTiebreak.t2; }
        else { won += scoreData.superTiebreak.t2; lost += scoreData.superTiebreak.t1; }
      }
    } else if (scoreData.sport === "BADMINTON") {
      for (const set of scoreData.sets) {
        if (team === "team1") { won += set.t1; lost += set.t2; }
        else { won += set.t2; lost += set.t1; }
      }
    } else if (scoreData.sport === "TABLE_TENNIS") {
      for (const game of scoreData.games) {
        if (team === "team1") { won += game.t1; lost += game.t2; }
        else { won += game.t2; lost += game.t1; }
      }
    }
    return { won, lost };
  };


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
      if (match.status === "COMPLETED") {
        throw new Error("Match is already completed");
      }

      const winningTeam = winner;

      // Update player stats
      const winnerIds = winningTeam === "team1"
        ? [match.team1_player1_id, match.team1_player2_id]
        : [match.team2_player1_id, match.team2_player2_id];

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

      // ── KNOCKOUT ADVANCE LOGIC ──
      if (match.next_match_id) {
        // Fetch next match
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: nextMatch } = await (supabase as any)
          .from("matches")
          .select("*")
          .eq("id", match.next_match_id)
          .single();
        
        if (nextMatch) {
          const isTeam1Empty = !nextMatch.team1_player1_id && !nextMatch.team1_player2_id;
          const updatePayload: Record<string, string | null> = {};
          
          if (isTeam1Empty) {
            updatePayload.team1_player1_id = winnerIds[0] ?? null;
            updatePayload.team1_player2_id = winnerIds[1] ?? null;
          } else {
            updatePayload.team2_player1_id = winnerIds[0] ?? null;
            updatePayload.team2_player2_id = winnerIds[1] ?? null;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: nextError } = await (supabase as any)
            .from("matches")
            .update(updatePayload)
            .eq("id", match.next_match_id);
            
          if (nextError) console.error("Failed to advance winner", nextError);
        }
      }


      const allIds = [
        match.team1_player1_id, match.team1_player2_id,
        match.team2_player1_id, match.team2_player2_id,
      ].filter(Boolean) as string[];

      for (const playerId of allIds) {
        const isWinner = winnerIds.includes(playerId);
        
        // Fetch fresh player data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: dbPlayer } = await (supabase as any)
          .from("players")
          .select("*")
          .eq("id", playerId)
          .single();
          
        const player = dbPlayer || playerMap[playerId];
        if (!player) continue;

        const team = (playerId === match.team1_player1_id || playerId === match.team1_player2_id) ? "team1" : "team2";
        const stats = getMatchStats(scoreState, team);
        const diff = stats.won - stats.lost;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("players")
          .update({
            matches_played: player.matches_played + 1,
            matches_won: player.matches_won + (isWinner ? 1 : 0),
            points_won: (player.points_won || 0) + stats.won,
            point_differential: (player.point_differential || 0) + diff,
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

  const reopenMatch = useMutation({
    mutationFn: async () => {
      if (match.status !== "COMPLETED") throw new Error("Match is not completed");

      const winningTeam = match.winning_team === "TEAM1" ? "team1" : "team2";
      const winnerIds = winningTeam === "team1"
        ? [match.team1_player1_id, match.team1_player2_id]
        : [match.team2_player1_id, match.team2_player2_id];

      // ── KNOCKOUT ROLLBACK LOGIC ──
      if (match.next_match_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: nextMatch } = await (supabase as any)
          .from("matches")
          .select("*")
          .eq("id", match.next_match_id)
          .single();
        
        if (nextMatch) {
          if (nextMatch.status !== "PENDING") {
            throw new Error("Cannot reopen: The next match has already started or completed.");
          }

          const updatePayload: Record<string, string | null> = {};
          if (nextMatch.team1_player1_id === winnerIds[0]) {
            updatePayload.team1_player1_id = null;
            updatePayload.team1_player2_id = null;
          } else if (nextMatch.team2_player1_id === winnerIds[0]) {
            updatePayload.team2_player1_id = null;
            updatePayload.team2_player2_id = null;
          }

          if (Object.keys(updatePayload).length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: nextError } = await (supabase as any)
              .from("matches")
              .update(updatePayload)
              .eq("id", match.next_match_id);
            if (nextError) throw new Error("Failed to rollback next match slots");
          }
        }
      }

      // Rollback players stats
      const allIds = [
        match.team1_player1_id, match.team1_player2_id,
        match.team2_player1_id, match.team2_player2_id,
      ].filter(Boolean) as string[];

      for (const playerId of allIds) {
        const isWinner = winnerIds.includes(playerId);
        
        // Fetch fresh player data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: dbPlayer } = await (supabase as any)
          .from("players")
          .select("*")
          .eq("id", playerId)
          .single();
          
        const player = dbPlayer || playerMap[playerId];
        if (!player) continue;

        const team = (playerId === match.team1_player1_id || playerId === match.team1_player2_id) ? "team1" : "team2";
        const stats = getMatchStats(scoreState, team); // Using the final score that was saved
        const diff = stats.won - stats.lost;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("players")
          .update({
            matches_played: Math.max(0, player.matches_played - 1),
            matches_won: Math.max(0, player.matches_won - (isWinner ? 1 : 0)),
            points_won: Math.max(0, (player.points_won || 0) - stats.won),
            point_differential: (player.point_differential || 0) - diff,
          })
          .eq("id", playerId);
      }

      // Update match status to IN_PROGRESS
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("matches")
        .update({
          status: "IN_PROGRESS",
          winning_team: null,
          completed_at: null,
        })
        .eq("id", match.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", match.session_id] });
      queryClient.invalidateQueries({ queryKey: ["players", match.session_id] });
      setShowReopenConfirm(false);
      setMatch(prev => ({...prev, status: "IN_PROGRESS", winning_team: null, completed_at: null}));
    },
    onError: (err) => {
      alert(err.message);
    }
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

  const handleManualEditSave = useCallback((newScore: ScoreData) => {
    setHistory((h) => [...h, scoreState]);
    setScoreState(newScore);
    updateScore.mutate(newScore);
    setShowEditModal(false);
  }, [scoreState, updateScore]);

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
      {/* ── Nav bar ── */}
      <div className="flex items-center justify-between px-4 pt-safe h-14 bg-white border-b border-border flex-shrink-0 z-10">
        <button
          onClick={() => router.push(`/sessions/${match.session_id}`)}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-16"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="text-center flex-1">
          <p className="text-xs text-muted-foreground font-medium">{SPORT_LABELS[session.sport]}</p>
          {display.currentSetDetail && (
            <p className="text-xs font-bold text-primary">{display.currentSetDetail}</p>
          )}
        </div>
        <div className="w-16 flex justify-end">
          {match.status !== "COMPLETED" && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
              aria-label="Edit score manually"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
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
          {/* Score + minus button */}
          <div className="flex items-center gap-3">
            <div className="score-display text-foreground">{display.team1}</div>
            <AnimatePresence>
              {history.length > 0 && !isComplete && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: "spring", damping: 18, stiffness: 380 }}
                  onClick={(e) => { e.stopPropagation(); undoPoint(); }}
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-muted border border-border hover:bg-muted/70 active:scale-90 transition-transform shadow-sm"
                  aria-label="Undo last point"
                  id="undo-btn"
                >
                  <Minus className="h-5 w-5 text-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <p className="text-sm font-bold text-muted-foreground mt-3 px-4 text-center max-w-48 truncate">
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
          {/* Minus button + score (mirrored) */}
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {history.length > 0 && !isComplete && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: "spring", damping: 18, stiffness: 380 }}
                  onClick={(e) => { e.stopPropagation(); undoPoint(); }}
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-muted border border-border hover:bg-muted/70 active:scale-90 transition-transform shadow-sm"
                  aria-label="Undo last point"
                  id="undo-btn-team2"
                >
                  <Minus className="h-5 w-5 text-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
            <div className="score-display text-foreground">{display.team2}</div>
          </div>
          <p className="text-sm font-bold text-muted-foreground mt-3 px-4 text-center max-w-48 truncate">
            {team2Name}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">Tap to score</p>
        </motion.button>
      </div>

      {/* ── Bottom Action Button ── */}
      <div className="px-4 pb-safe py-3 border-t border-border flex-shrink-0 bg-white">
        {match.status === "COMPLETED" ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-[2] h-11 rounded-xl font-bold text-sm bg-muted/30 hover:bg-muted border-dashed"
              onClick={() => router.push(`/sessions/${match.session_id}`)}
              id="back-to-session-btn"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Matches
            </Button>
            <Button
              variant="outline"
              className="flex-[1] h-11 rounded-xl font-bold text-sm border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
              onClick={() => setShowReopenConfirm(true)}
              id="reopen-match-btn"
            >
              Re-open
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl font-semibold text-sm"
            onClick={() => setShowConfirm(true)}
            id="end-match-btn"
          >
            End Match
          </Button>
        )}
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

      {/* ── Confirm reopen match overlay ── */}
      <AnimatePresence>
        {showReopenConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-end z-50 pb-safe"
            onClick={(e) => e.target === e.currentTarget && setShowReopenConfirm(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full bg-white rounded-t-3xl px-6 pt-6 pb-8"
            >
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" />
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="text-xl font-black">Re-open Match?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This will undo the final result and deduct any points/wins that were awarded to the players.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl font-semibold"
                  onClick={() => setShowReopenConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => reopenMatch.mutate()}
                  disabled={reopenMatch.isPending}
                  id="confirm-reopen-btn"
                >
                  {reopenMatch.isPending ? "Reopening…" : "Yes, Re-open"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Score Modal ── */}
      <AnimatePresence>
        {showEditModal && (
          <EditScoreModal
            scoreState={scoreState}
            onSave={handleManualEditSave}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Edit Score Modal Component ─────────────────────────────
function EditScoreModal({
  scoreState,
  onSave,
  onCancel,
}: {
  scoreState: ScoreData;
  onSave: (newScore: ScoreData) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ScoreData>(JSON.parse(JSON.stringify(scoreState)));

  if (!("sport" in draft)) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 400 }}
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh] shadow-2xl"
      >
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/10">
          <h3 className="font-black text-lg">Edit Score</h3>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded-full">
            {draft.sport.replace("_", " ")}
          </p>
        </div>
        
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Badminton */}
          {draft.sport === "BADMINTON" && (
            <div className="space-y-4">
               {draft.sets.map((set: any, i: number) => (
                 <div key={i} className="flex items-center justify-between gap-4">
                   <span className="text-sm font-bold w-12 text-muted-foreground">Set {i+1}</span>
                   <input type="number" className="flex-1 min-w-0 p-3 text-center border-2 border-border rounded-xl font-black text-xl focus:border-primary focus:ring-0 outline-none transition-colors" value={set.t1} onChange={e => {
                     const newDraft = JSON.parse(JSON.stringify(draft)); newDraft.sets[i].t1 = parseInt(e.target.value)||0; setDraft(newDraft);
                   }} />
                   <span className="font-black text-muted-foreground">-</span>
                   <input type="number" className="flex-1 min-w-0 p-3 text-center border-2 border-border rounded-xl font-black text-xl focus:border-primary focus:ring-0 outline-none transition-colors" value={set.t2} onChange={e => {
                     const newDraft = JSON.parse(JSON.stringify(draft)); newDraft.sets[i].t2 = parseInt(e.target.value)||0; setDraft(newDraft);
                   }} />
                 </div>
               ))}
               <Button variant="outline" className="w-full border-dashed h-11 rounded-xl font-bold" onClick={() => {
                 const newDraft = JSON.parse(JSON.stringify(draft)); newDraft.sets.push({ t1: 0, t2: 0 }); setDraft(newDraft);
               }}>+ Add Set</Button>
            </div>
          )}

          {/* Table Tennis */}
          {draft.sport === "TABLE_TENNIS" && (
            <div className="space-y-4">
               {draft.games.map((game: any, i: number) => (
                 <div key={i} className="flex items-center justify-between gap-4">
                   <span className="text-sm font-bold w-16 text-muted-foreground">Game {i+1}</span>
                   <input type="number" className="flex-1 min-w-0 p-3 text-center border-2 border-border rounded-xl font-black text-xl focus:border-primary outline-none transition-colors" value={game.t1} onChange={e => {
                     const newDraft = JSON.parse(JSON.stringify(draft)); newDraft.games[i].t1 = parseInt(e.target.value)||0; setDraft(newDraft);
                   }} />
                   <span className="font-black text-muted-foreground">-</span>
                   <input type="number" className="flex-1 min-w-0 p-3 text-center border-2 border-border rounded-xl font-black text-xl focus:border-primary outline-none transition-colors" value={game.t2} onChange={e => {
                     const newDraft = JSON.parse(JSON.stringify(draft)); newDraft.games[i].t2 = parseInt(e.target.value)||0; setDraft(newDraft);
                   }} />
                 </div>
               ))}
               <Button variant="outline" className="w-full border-dashed h-11 rounded-xl font-bold" onClick={() => {
                 const newDraft = JSON.parse(JSON.stringify(draft)); newDraft.games.push({ t1: 0, t2: 0 }); setDraft(newDraft);
               }}>+ Add Game</Button>
            </div>
          )}

          {/* Tennis/Padel */}
          {(draft.sport === "TENNIS" || draft.sport === "PADEL") && (
            <div className="space-y-6">
               <div className="space-y-4">
                 <h4 className="font-bold text-[10px] text-primary uppercase tracking-widest bg-primary/10 w-fit px-2 py-1 rounded">Sets (Games Won)</h4>
                 {draft.sets.map((set: any, i: number) => (
                   <div key={i} className="flex items-center justify-between gap-4">
                     <span className="text-sm font-bold w-12 text-muted-foreground">Set {i+1}</span>
                     <input type="number" className="flex-1 min-w-0 p-3 text-center border-2 border-border rounded-xl font-black text-xl focus:border-primary outline-none transition-colors" value={set.t1} onChange={e => {
                       const newDraft = JSON.parse(JSON.stringify(draft)); newDraft.sets[i].t1 = parseInt(e.target.value)||0; setDraft(newDraft);
                     }} />
                     <span className="font-black text-muted-foreground">-</span>
                     <input type="number" className="flex-1 min-w-0 p-3 text-center border-2 border-border rounded-xl font-black text-xl focus:border-primary outline-none transition-colors" value={set.t2} onChange={e => {
                       const newDraft = JSON.parse(JSON.stringify(draft)); newDraft.sets[i].t2 = parseInt(e.target.value)||0; setDraft(newDraft);
                     }} />
                   </div>
                 ))}
                 <Button variant="outline" className="w-full border-dashed h-11 rounded-xl font-bold" onClick={() => {
                   const newDraft = JSON.parse(JSON.stringify(draft)); newDraft.sets.push({ t1: 0, t2: 0, tiebreak: false }); setDraft(newDraft);
                 }}>+ Add Set</Button>
               </div>

               <div className="space-y-4 pt-5 border-t border-border">
                 <h4 className="font-bold text-[10px] text-primary uppercase tracking-widest bg-primary/10 w-fit px-2 py-1 rounded">Current Points (0=0, 1=15, 2=30, 3=40, 4=Ad)</h4>
                 <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold w-12 text-muted-foreground">Pts</span>
                    <input type="number" min={0} max={4} className="flex-1 min-w-0 p-3 text-center border-2 border-border rounded-xl font-black text-xl focus:border-primary outline-none transition-colors" value={(draft as any).points.t1} onChange={e => {
                      const newDraft = JSON.parse(JSON.stringify(draft)); newDraft.points.t1 = parseInt(e.target.value) as any; setDraft(newDraft);
                    }} />
                    <span className="font-black text-muted-foreground">-</span>
                    <input type="number" min={0} max={4} className="flex-1 min-w-0 p-3 text-center border-2 border-border rounded-xl font-black text-xl focus:border-primary outline-none transition-colors" value={(draft as any).points.t2} onChange={e => {
                      const newDraft = JSON.parse(JSON.stringify(draft)); newDraft.points.t2 = parseInt(e.target.value) as any; setDraft(newDraft);
                    }} />
                 </div>
               </div>

               {draft.sport === "PADEL" && (
                 <div className="space-y-4 pt-5 border-t border-border">
                   <div className="flex justify-between items-center">
                     <h4 className="font-bold text-[10px] text-primary uppercase tracking-widest bg-primary/10 w-fit px-2 py-1 rounded">Super Tiebreak</h4>
                     <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold" onClick={() => {
                        const newDraft = JSON.parse(JSON.stringify(draft));
                        if (newDraft.superTiebreak) newDraft.superTiebreak = null;
                        else newDraft.superTiebreak = { t1: 0, t2: 0 };
                        setDraft(newDraft);
                     }}>{(draft as any).superTiebreak ? "Remove" : "Enable"}</Button>
                   </div>
                   {(draft as any).superTiebreak && (
                     <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-bold w-12 text-muted-foreground">STB</span>
                        <input type="number" className="flex-1 min-w-0 p-3 text-center border-2 border-border rounded-xl font-black text-xl focus:border-primary outline-none transition-colors" value={(draft as any).superTiebreak.t1} onChange={e => {
                          const newDraft = JSON.parse(JSON.stringify(draft)); newDraft.superTiebreak.t1 = parseInt(e.target.value)||0; setDraft(newDraft);
                        }} />
                        <span className="font-black text-muted-foreground">-</span>
                        <input type="number" className="flex-1 min-w-0 p-3 text-center border-2 border-border rounded-xl font-black text-xl focus:border-primary outline-none transition-colors" value={(draft as any).superTiebreak.t2} onChange={e => {
                          const newDraft = JSON.parse(JSON.stringify(draft)); newDraft.superTiebreak.t2 = parseInt(e.target.value)||0; setDraft(newDraft);
                        }} />
                     </div>
                   )}
                 </div>
               )}
            </div>
          )}
        </div>
        
        <div className="p-5 border-t border-border flex gap-3 bg-muted/10">
           <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold bg-white" onClick={onCancel}>Cancel</Button>
           <Button className="flex-1 h-12 rounded-xl font-black bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all" onClick={() => onSave(draft)}>Save Changes</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

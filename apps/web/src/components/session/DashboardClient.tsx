"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, Zap, Trash2, X, AlertTriangle } from "lucide-react";
import { formatRelativeTime, SPORT_EMOJIS, SPORT_LABELS, FORMAT_LABELS } from "@/lib/utils/format";
import type { Session } from "@/types/session";

const STATUS_CONFIG = {
  ACTIVE: { label: "Live", className: "bg-green-100 text-green-700 border-green-200" },
  SETUP: { label: "Setup", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  COMPLETED: { label: "Completed", className: "bg-muted text-muted-foreground border-border" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200" },
};

// ── Deletable statuses ──────────────────────────────────────────
const DELETABLE_STATUSES: Session["status"][] = ["COMPLETED", "CANCELLED"];

// ── Delete confirmation modal ───────────────────────────────────
function DeleteConfirmModal({
  session,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  session: Session;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
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
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-border mx-auto mt-4 mb-0 sm:hidden" />

        <div className="px-6 pt-6 pb-8">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-7 w-7 text-destructive" />
          </div>

          <h2 className="text-xl font-black text-center mb-1">Delete session?</h2>
          <p className="text-sm text-muted-foreground text-center mb-1">
            <span className="font-semibold text-foreground">&ldquo;{session.title}&rdquo;</span>
          </p>
          <p className="text-xs text-muted-foreground text-center mb-6">
            {SPORT_EMOJIS[session.sport]} {SPORT_LABELS[session.sport]} ·{" "}
            {FORMAT_LABELS[session.format]} · {formatRelativeTime(session.created_at)}
          </p>

          {/* Warning */}
          <div className="flex items-start gap-2.5 rounded-xl bg-destructive/6 border border-destructive/20 px-3.5 py-3 mb-6">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-destructive leading-relaxed">
              This will permanently delete the session along with all players, matches, and scores. This cannot be undone.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl"
              onClick={onCancel}
              disabled={isDeleting}
              id="cancel-delete-btn"
            >
              <X className="h-4 w-4 mr-1.5" />
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold"
              onClick={onConfirm}
              disabled={isDeleting}
              id="confirm-delete-btn"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </span>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Session card ────────────────────────────────────────────────
function SessionCard({
  session,
  onDeleteRequest,
}: {
  session: Session;
  onDeleteRequest: (session: Session) => void;
}) {
  const status = STATUS_CONFIG[session.status];
  const emoji = SPORT_EMOJIS[session.sport];
  const isDeletable = DELETABLE_STATUSES.includes(session.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
      layout
    >
      <div className="group flex items-center gap-3 rounded-2xl border border-border bg-white hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden pr-1">
        {/* Main clickable area */}
        <Link
          href={`/sessions/${session.id}`}
          className="flex items-center gap-4 flex-1 min-w-0 p-4 pr-2"
        >
          {/* Sport icon */}
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-primary/8 text-2xl">
            {emoji}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {session.title}
              </h3>
              <span
                className={`flex-shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${status.className}`}
              >
                {status.label === "Live" && (
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                )}
                {status.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {SPORT_LABELS[session.sport]} · {FORMAT_LABELS[session.format]}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(session.created_at)}
            </p>
          </div>
        </Link>

        {/* Delete button — only for completed/cancelled */}
        {isDeletable && (
          <button
            onClick={() => onDeleteRequest(session)}
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors mr-1"
            aria-label={`Delete session ${session.title}`}
            id={`delete-session-${session.id}-btn`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/8 text-4xl">
        🎾
      </div>
      <h3 className="text-lg font-bold mb-2">No sessions yet</h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-8">
        Create your first session and let UrTurn handle the matchmaking for you.
      </p>
      <Link
        href="/sessions/new"
        className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-150"
        id="create-first-session-btn"
      >
        <Plus className="h-4 w-4" />
        Create your first session
      </Link>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface DashboardClientProps {
  initialSessions: Session[];
}

export function DashboardClient({ initialSessions }: DashboardClientProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Session[];
    },
    initialData: initialSessions,
    staleTime: 30_000,
  });

  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("sessions")
        .delete()
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: (_, sessionId) => {
      // Optimistically remove from cache
      queryClient.setQueryData<Session[]>(["sessions"], (old) =>
        old ? old.filter((s) => s.id !== sessionId) : []
      );
      setSessionToDelete(null);
    },
  });

  const activeSessions = sessions?.filter((s) => s.status === "ACTIVE") ?? [];
  const pastSessions = sessions?.filter((s) => s.status !== "ACTIVE") ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Your Sessions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sessions?.length
              ? `${sessions.length} session${sessions.length > 1 ? "s" : ""} total`
              : "Let's get started!"}
          </p>
        </div>

        {/* Stats strip */}
        {sessions && sessions.length > 0 && (
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-black text-green-600">{activeSessions.length}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-black">{sessions.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && <DashboardSkeleton />}

      {/* Empty state */}
      {!isLoading && (!sessions || sessions.length === 0) && <EmptyState />}

      {/* Active sessions */}
      {!isLoading && activeSessions.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-green-600" />
            <h2 className="text-sm font-bold text-green-700 uppercase tracking-wider">
              Live Now
            </h2>
          </div>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {activeSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onDeleteRequest={setSessionToDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Past sessions */}
      {!isLoading && pastSessions.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              {activeSessions.length > 0 ? "Past Sessions" : "All Sessions"}
            </h2>
          </div>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {pastSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onDeleteRequest={setSessionToDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* FAB: New Session */}
      <Link
        href="/sessions/new"
        className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-5 py-3.5 text-sm font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 z-30"
        id="new-session-fab"
        aria-label="Create new session"
      >
        <Plus className="h-5 w-5" />
        <span>New Session</span>
      </Link>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {sessionToDelete && (
          <DeleteConfirmModal
            session={sessionToDelete}
            onConfirm={() => deleteSession.mutate(sessionToDelete.id)}
            onCancel={() => setSessionToDelete(null)}
            isDeleting={deleteSession.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

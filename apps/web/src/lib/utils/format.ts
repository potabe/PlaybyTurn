import type { SportType, FormatType } from "@/types/session";

// ============================================================
// Sport display names and icons
// ============================================================

export const SPORT_LABELS: Record<SportType, string> = {
  PADEL: "Padel",
  BADMINTON: "Badminton",
  TENNIS: "Tennis",
  TABLE_TENNIS: "Table Tennis",
};

export const SPORT_EMOJIS: Record<SportType, string> = {
  PADEL: "🎾",
  BADMINTON: "🏸",
  TENNIS: "🎾",
  TABLE_TENNIS: "🏓",
};

// ============================================================
// Format display names and descriptions
// ============================================================

export const FORMAT_LABELS: Record<FormatType, string> = {
  SINGLES: "Singles",
  FIXED_DOUBLES: "Fixed Doubles",
  MIXED_DOUBLES: "Mixed Doubles",
  AMERICANO: "Americano",
};

export const FORMAT_DESCRIPTIONS: Record<FormatType, string> = {
  SINGLES: "1v1 — players rotate individually",
  FIXED_DOUBLES: "2v2 — static team pairs rotate together",
  MIXED_DOUBLES: "2v2 — strict 1 Male + 1 Female per team",
  AMERICANO: "Round-robin — everyone plays with and against everyone",
};

export const FORMAT_MIN_PLAYERS: Record<FormatType, number> = {
  SINGLES: 2,
  FIXED_DOUBLES: 4,
  MIXED_DOUBLES: 4,
  AMERICANO: 4,
};

// ============================================================
// Date/time formatting
// ============================================================

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

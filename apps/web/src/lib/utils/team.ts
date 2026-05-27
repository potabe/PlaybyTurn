import type { Player, Session } from "@/types/session";

export function getTeamName(
  p1Id: string | null,
  p2Id: string | null,
  playersMap: Record<string, Player>,
  session?: Session | null
): string {
  if (!p1Id) return "TBD";
  
  if (p2Id) {
    const sortedIds = [p1Id, p2Id].sort().join("_");
    const customName = session?.metadata?.team_names?.[sortedIds];
    if (customName) return customName;
  }
  
  const p1Name = playersMap[p1Id]?.name ?? "Unknown";
  if (p2Id) {
    const p2Name = playersMap[p2Id]?.name ?? "Unknown";
    return `${p1Name.split(" ")[0]} & ${p2Name.split(" ")[0]}`;
  }
  return p1Name;
}

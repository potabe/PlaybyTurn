import type { Metadata } from "next";
import { getDashboardSessions } from "@/actions/queries";
import { DashboardClient } from "@/components/session/DashboardClient";
import type { Session } from "@/types/session";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const sessions = await getDashboardSessions();

  return <DashboardClient initialSessions={(sessions as unknown as Session[]) ?? []} />;
}

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/session/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch user's sessions
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false });

  return <DashboardClient initialSessions={sessions ?? []} />;
}

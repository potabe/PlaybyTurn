import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/common/AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {children}
      </main>
    </div>
  );
}

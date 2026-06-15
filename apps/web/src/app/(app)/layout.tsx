import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/common/AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth guard via NextAuth
  const session = await auth();

  if (!session?.user) {
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

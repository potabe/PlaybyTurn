import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/common/AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const session = await auth.getSession({ fetchOptions: { headers: reqHeaders } }).catch(() => null);

  if (!session?.data?.user) {
    redirect("/auth/sign-in");
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

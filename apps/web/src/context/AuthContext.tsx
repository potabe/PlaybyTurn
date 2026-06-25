"use client";
import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

export const authClient = createAuthClient(
  typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || ""),
  {
    adapter: BetterAuthReactAdapter()
  }
);

export function useAuth() {
  const { data: session, isPending } = authClient.useSession();
  
  return { 
    user: session?.user || null, 
    profile: session?.user || null, 
    isLoading: isPending, 
    signOut: async () => {
      await authClient.signOut();
      window.location.href = "/login";
    }
  };
}

"use client";
import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

export const authClient = createAuthClient(process.env.NEXT_PUBLIC_NEON_AUTH_URL || "", {
  adapter: BetterAuthReactAdapter()
});

export function useAuth() {
  const { data: session, isPending } = authClient.useSession();
  
  return { 
    user: session?.user || null, 
    profile: session?.user || null, 
    isLoading: isPending, 
    signOut: async () => {
      await authClient.signOut();
      window.location.href = "/auth/sign-in";
    }
  };
}

"use client";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function useAuth() {
  const { data: session, status } = useSession();
  return { 
    user: session?.user || null, 
    profile: session?.user || null, 
    isLoading: status === "loading", 
    signOut: () => signOut({ callbackUrl: "/login" }) 
  };
}

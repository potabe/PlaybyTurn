"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/context/AuthContext";
import "@neondatabase/auth-ui/css";
import { ReactNode } from "react";

export function NeonAuthProvider({ children }: { children: ReactNode }) {
  return (
    <NeonAuthUIProvider authClient={authClient as any} redirectTo="/dashboard">
      {children}
    </NeonAuthUIProvider>
  );
}

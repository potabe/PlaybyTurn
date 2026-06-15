"use client";

import { AuthView } from "@neondatabase/auth-ui";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/10">
      <div className="w-full max-w-md">
        <AuthView path="sign-in" />
      </div>
    </div>
  );
}

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";


// GitHub Icon SVG
function GitHubIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-sm animate-pulse space-y-4">
        <div className="h-8 w-24 bg-muted rounded" />
        <div className="h-6 w-40 bg-muted rounded" />
        <div className="h-11 bg-muted rounded-xl" />
        <div className="h-11 bg-muted rounded-xl" />
        <div className="h-11 bg-muted rounded-xl" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleResetPassword() {
    if (!email) {
      setError("Please enter your email to reset your password.");
      setSuccessMsg(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?redirect=/update-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccessMsg("Password reset link sent! Please check your email.");
    }
    setIsLoading(false);
  }

  async function handleGitHubLogin() {
    setIsGitHubLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });
    if (error) {
      setError(error.message);
      setIsGitHubLoading(false);
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push(redirect);
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <Link href="/" className="inline-block mb-8">
        <span className="text-3xl font-black gradient-text">UrTurn</span>
      </Link>

      <h1 className="text-2xl font-black tracking-tight mb-1">Welcome back</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Sign in to manage your sessions
      </p>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Success */}
      {successMsg && (
        <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {/* GitHub OAuth */}
      <Button
        variant="outline"
        className="w-full h-11 rounded-xl font-semibold gap-2 mb-6 border-border hover:bg-foreground hover:text-background transition-colors"
        onClick={handleGitHubLogin}
        disabled={isGitHubLoading || isLoading}
        id="github-login-btn"
      >
        {isGitHubLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GitHubIcon />
        )}
        Continue with GitHub
      </Button>

      {/* Divider */}
      <div className="relative mb-6">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
          or continue with email
        </span>
      </div>

      {/* Email form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium mb-1.5 block">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="pl-9 h-11 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={isLoading}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-9 pr-10 h-11 rounded-xl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 rounded-xl font-semibold bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20"
          disabled={isLoading || isGitHubLoading}
          id="email-login-btn"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary font-semibold hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  );
}

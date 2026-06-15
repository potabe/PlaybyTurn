"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { IconBrandGithub, IconBrandDiscord } from "@tabler/icons-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="bg-card p-8 rounded-3xl shadow-xl w-full max-w-sm border border-border text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          🎾
        </div>
        <h1 className="text-2xl font-black mb-2">Welcome to UrTurn</h1>
        <p className="text-sm text-muted-foreground mb-8">Sign in to organize and manage your tournaments</p>
        
        <div className="flex flex-col gap-4">
          <Button 
            className="w-full h-12 text-base font-bold bg-[#24292F] hover:bg-[#24292F]/90 text-white rounded-xl"
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          >
            <IconBrandGithub className="mr-2 h-5 w-5" />
            Sign in with GitHub
          </Button>
          <Button 
            className="w-full h-12 text-base font-bold bg-[#5865F2] hover:bg-[#5865F2]/90 text-white rounded-xl"
            onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
          >
            <IconBrandDiscord className="mr-2 h-5 w-5" />
            Sign in with Discord
          </Button>
        </div>
      </div>
    </div>
  );
}

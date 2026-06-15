"use client";

import React, { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconLayoutDashboard, IconChartBar, IconLogout, IconUserCircle, IconChevronDown, IconDownload, IconMoon, IconSun } from "@tabler/icons-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useTheme } from "next-themes";

export function AppNav() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isInstallable, isStandalone, isIOS, promptInstall } = usePWAInstall();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);


  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-1.5">
          <span className="text-xl font-black gradient-text">UrTurn</span>
        </Link>

        {/* Nav tabs — desktop */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname === "/dashboard"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <IconLayoutDashboard className="h-3.5 w-3.5" />
            Sessions
          </Link>
          <Link
            href="/stats"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname === "/stats"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            id="nav-stats-link"
          >
            <IconChartBar className="h-3.5 w-3.5" />
            Stats
          </Link>
        </nav>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted transition-colors focus:outline-none"
            aria-label="User menu"
            id="user-menu-btn"
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.image ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {mounted ? initials : ""}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium max-w-24 truncate">
              {mounted ? (profile?.name ?? user?.email?.split("@")[0] ?? "User") : "..."}
            </span>
            <IconChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <div className="px-1.5 py-1 text-xs text-muted-foreground font-normal mb-1">
              {user?.email}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push("/dashboard")}
            >
              <IconLayoutDashboard className="h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push("/stats")}
              id="dropdown-stats-link"
            >
              <IconChartBar className="h-4 w-4" />
              Player Stats
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push("/profile")}
              id="dropdown-profile-link"
            >
              <IconUserCircle className="h-4 w-4" />
              Profile & Settings
            </DropdownMenuItem>
            {isInstallable && !isStandalone && (
              <>
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer font-bold text-primary focus:text-primary focus:bg-primary/10"
                  onClick={async () => {
                    if (isIOS) {
                      router.push("/profile");
                    } else {
                      await promptInstall();
                    }
                  }}
                >
                  <IconDownload className="h-4 w-4" />
                  Install App
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={(e) => {
                e.preventDefault(); // prevent dropdown from closing
                setTheme(theme === "dark" ? "light" : "dark");
              }}
            >
              <div className="flex items-center gap-2">
                {mounted && theme === "dark" ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
                <span>Theme</span>
              </div>
              <span className="text-xs text-muted-foreground capitalize">
                {mounted ? theme : ""}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="flex items-center gap-2 text-destructive cursor-pointer focus:text-destructive"
              onClick={signOut}
              id="signout-btn"
            >
              <IconLogout className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

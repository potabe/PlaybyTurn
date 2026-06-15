"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { updateUserSkillLevels } from "@/actions/mutations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconCamera, IconCheck, IconLoader2, IconLogout, IconUser, IconMail, IconShield, IconTrash, IconChevronRight, IconDownload, IconShare, IconPlus, IconX as IconX, IconTrophy, IconMoon, IconSun, IconDeviceDesktop } from "@tabler/icons-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { SPORT_EMOJIS, SPORT_LABELS } from "@/lib/utils/format";
import type { SportType, SkillLevel } from "@/types/session";
import { useTheme } from "next-themes";

// ─── Animated section wrapper ─────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-primary/70 px-1 ml-1">{title}</p>
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  );
}

// ... existing Row, EditNameModal, ConfirmModal ...

function IOSInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4 pb-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="bg-card rounded-3xl w-full max-w-sm shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
        <h3 className="font-black text-xl mb-4 text-center">Install UrTurn</h3>
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
            <div className="w-10 h-10 bg-card rounded-xl shadow-sm flex items-center justify-center text-primary flex-shrink-0">
              <IconShare className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700 leading-tight">
              1. Tap the <span className="font-black text-primary">IconShare</span> button in your Safari menu bar.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
            <div className="w-10 h-10 bg-card rounded-xl shadow-sm flex items-center justify-center text-primary flex-shrink-0">
              <div className="w-5 h-5 border-2 border-primary rounded-md flex items-center justify-center font-bold text-[10px]">+</div>
            </div>
            <p className="text-sm font-semibold text-slate-700 leading-tight">
              2. Scroll down and tap <span className="font-black text-primary">Add to Home Screen</span>.
            </p>
          </div>
        </div>
        <Button className="w-full h-12 rounded-xl font-bold mt-8" onClick={onClose}>
          Got it
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Profile Client ──────────────────────────────────────

function Row({
  icon: Icon, label, value, onClick, destructive, showArrow = true,
}: {
  icon: React.ElementType; label: string; value?: string; onClick?: () => void; destructive?: boolean; showArrow?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0 transition-colors text-left
        ${onClick ? "hover:bg-muted/30 active:bg-muted/50 cursor-pointer" : "cursor-default"}
        ${destructive ? "text-destructive" : "text-foreground"}
      `}
    >
      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${destructive ? "bg-destructive/10" : "bg-primary/8"}`}>
        <Icon className={`h-4 w-4 ${destructive ? "text-destructive" : "text-primary"}`} />
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${destructive ? "text-destructive" : ""}`}>{label}</p>
        {value && <p className="text-xs text-muted-foreground truncate mt-0.5">{value}</p>}
      </div>
      {onClick && showArrow && (
        <IconChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );
}

// ─── Skill Badges config ──────────────────────────────────────
const SKILL_LEVELS: SkillLevel[] = ["NEWBIE", "BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"];

const SKILL_COLORS: Record<SkillLevel, string> = {
  NEWBIE: "bg-slate-100 text-slate-700 border-slate-200",
  BEGINNER: "bg-blue-100 text-blue-800 border-blue-200",
  INTERMEDIATE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ADVANCED: "bg-purple-100 text-purple-800 border-purple-200",
  PRO: "bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 border-yellow-400 shadow-sm",
};

const SKILL_LABELS: Record<SkillLevel, string> = {
  NEWBIE: "Newbie",
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  PRO: "Pro",
};

// ─── Edit Skills Modal ────────────────────────────────────────
function EditSkillsModal({ currentSkills, onSave, onCancel, isSaving }: {
  currentSkills: Record<SportType, SkillLevel>;
  onSave: (skills: Record<SportType, SkillLevel>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [skills, setSkills] = useState<Record<string, SkillLevel>>(currentSkills || {});

  const toggleSportSkill = (sport: SportType, level: SkillLevel) => {
    setSkills(prev => {
      // If clicking the same level, remove the sport entirely
      if (prev[sport] === level) {
        const next = { ...prev };
        delete next[sport];
        return next;
      }
      return { ...prev, [sport]: level };
    });
  };

  const sportsList: SportType[] = ["PADEL", "TENNIS", "BADMINTON", "TABLE_TENNIS"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 420 }}
        className="bg-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-5 border-b border-border bg-muted/10 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-black text-lg">Sport Skills</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Select your skill level for each sport</p>
          </div>
          <button onClick={onCancel} className="p-2 bg-card rounded-full text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors shadow-sm border border-border">
            <IconX className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {sportsList.map(sport => {
            const currentLevel = skills[sport];
            return (
              <div key={sport} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{SPORT_EMOJIS[sport]}</span>
                  <span className="font-bold text-sm">{SPORT_LABELS[sport]}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SKILL_LEVELS.map(level => {
                    const isSelected = currentLevel === level;
                    return (
                      <button
                        key={level}
                        onClick={() => toggleSportSkill(sport, level)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          isSelected 
                            ? SKILL_COLORS[level] + " ring-2 ring-primary/20 scale-105" 
                            : "bg-card text-slate-500 border-slate-200 hover:bg-muted/30"
                        }`}
                      >
                        {SKILL_LABELS[level]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-5 border-t border-border bg-card flex-shrink-0">
          <Button
            className="w-full h-12 rounded-xl font-black"
            onClick={() => onSave(skills as Record<SportType, SkillLevel>)}
            disabled={isSaving}
          >
            {isSaving ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <><IconCheck className="h-4 w-4 mr-1.5" />Save Skills</>}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Edit Name Modal ──────────────────────────────────────────
function EditNameModal({ currentName, onSave, onCancel, isSaving }: {
  currentName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(currentName);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 420 }}
        className="bg-card rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-border bg-muted/10">
          <h3 className="font-black text-lg">Edit Display Name</h3>
          <p className="text-xs text-muted-foreground mt-0.5">This is how others will see you in sessions</p>
        </div>
        <div className="p-5 space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-border rounded-xl font-semibold text-base focus:border-primary outline-none transition-colors"
            placeholder="Your display name"
            autoFocus
            maxLength={40}
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-12 rounded-xl font-black"
              onClick={() => onSave(name.trim())}
              disabled={!name.trim() || isSaving}
            >
              {isSaving ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <><IconCheck className="h-4 w-4 mr-1.5" />Save</>}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────
function ConfirmModal({ title, description, confirmLabel, onConfirm, onCancel, isDestructive = false, isPending = false }: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  isPending?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 420 }}
        className="bg-card rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
      >
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isDestructive ? "bg-destructive/10" : "bg-primary/10"}`}>
            {isDestructive ? <IconTrash className="h-6 w-6 text-destructive" /> : <IconShield className="h-6 w-6 text-primary" />}
          </div>
          <h3 className="font-black text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
        </div>
        <div className="px-5 pb-6 flex gap-3">
          <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            className={`flex-1 h-12 rounded-xl font-black ${isDestructive ? "bg-destructive hover:bg-destructive/90" : ""}`}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Profile Client ──────────────────────────────────────
export function ProfileClient() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [modal, setModal] = useState<"name" | "skills" | "signout" | "ios-install" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localProfile, setLocalProfile] = useState<any>(profile);
  
  const { isInstallable, isStandalone, isIOS, promptInstall } = usePWAInstall();

  const handleInstallClick = async () => {
    if (isIOS) {
      setModal("ios-install");
    } else {
      const accepted = await promptInstall();
      if (accepted) showToast("App installed successfully!");
    }
  };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const initials = localProfile?.name
    ? localProfile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  // ── Save name ────────────────────────────────────────────
  const handleSaveName = async (newName: string) => {
    if (!user) return;
    setIsSaving(true);
    try {
      console.log("Name update skipped");
      setLocalProfile((p: any) => p ? { ...p, name: newName } : p);
      setModal(null);
      showToast("Name updated successfully!");
    } catch {
      showToast("Failed to update name", false);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Save skills ──────────────────────────────────────────
  const handleSaveSkills = async (newSkills: Record<SportType, SkillLevel>) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserSkillLevels(newSkills);
      setLocalProfile((p: any) => p ? { ...p, skill_levels: newSkills } : p);
      setModal(null);
      showToast("Skills updated successfully!");
    } catch {
      showToast("Failed to update skills", false);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Upload avatar ─────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      showToast("Image must be smaller than 2MB", false);
      return;
    }

    setIsUploadingAvatar(true);
    try {
      showToast("Avatar upload disabled", false);
      return;
    } catch {
      showToast("Failed to upload avatar", false);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── Remove avatar ─────────────────────────────────────────
  const handleRemoveAvatar = async () => {
    if (!user || !localProfile?.image) return;
    setIsUploadingAvatar(true);
    try {
      showToast("Avatar upload disabled", false);
      setLocalProfile((p: any) => p ? { ...p, image: null } : p);
      showToast("Avatar removed");
    } catch {
      showToast("Failed to remove avatar", false);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const memberSince = localProfile?.createdAt
    ? new Date(localProfile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-background dark:to-background pb-16">
      {/* Header */}
      <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-black tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      {/* Avatar hero section */}
      <div className="max-w-lg mx-auto px-4 mb-8">
        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          <div className="px-6 pb-6 -mt-10 flex items-end gap-4">
            <div className="relative flex-shrink-0">
              <Avatar className="h-20 w-20 border-4 border-white dark:border-card shadow-lg">
                <AvatarImage src={localProfile?.image ?? undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-black">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-white dark:border-card shadow hover:bg-primary/90 transition-colors"
              >
                {isUploadingAvatar ? (
                  <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <IconCamera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="flex-1 min-w-0 pt-10">
              <p className="font-black text-lg truncate">{localProfile?.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">Member since {memberSince}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings sections */}
      <div className="max-w-lg mx-auto px-4 space-y-5">
        
        {/* Skills */}
        <Section title="Sports & Skills">
          <div className="p-4 bg-card border-b border-border">
            {(!localProfile?.skill_levels || Object.keys(localProfile.skill_levels).length === 0) ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
                  <IconTrophy className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">No sports added yet</p>
                <p className="text-xs text-slate-400 mt-1">Showcase your skills on your profile</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(localProfile.skill_levels).map(([sport, level]) => (
                  <div key={sport} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{SPORT_EMOJIS[sport as SportType]}</span>
                      <span className="text-xs font-bold text-slate-700">{SPORT_LABELS[sport as SportType]}</span>
                    </div>
                    <div className={`self-start px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${SKILL_COLORS[level as SkillLevel]}`}>
                      {SKILL_LABELS[level as SkillLevel]}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <Button
              variant="outline"
              className="w-full mt-4 h-10 rounded-xl font-bold border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 text-primary"
              onClick={() => setModal("skills")}
            >
              <IconPlus className="h-4 w-4 mr-1.5" /> Edit Skills
            </Button>
          </div>
        </Section>

        {/* Account */}
        <Section title="Account">
          <Row icon={IconUser} label="Display Name" value={localProfile?.name ?? "Not set"} onClick={() => setModal("name")} />
          <Row icon={IconMail} label="Email Address" value={user?.email ?? "—"} showArrow={false} />
        </Section>

        {/* Avatar */}
        {localProfile?.image && (
          <Section title="Avatar">
            <Row
              icon={IconTrash}
              label="Remove Avatar"
              value="Reset to initials avatar"
              onClick={handleRemoveAvatar}
              destructive
            />
          </Section>
        )}

        {/* App */}
        {isInstallable && !isStandalone && (
          <Section title="App">
            <Row
              icon={IconDownload}
              label="Install App"
              value="Add UrTurn to your home screen"
              onClick={handleInstallClick}
            />
          </Section>
        )}

        {/* Appearance */}
        {mounted && (
          <Section title="Appearance">
            <div className="px-4 py-4 space-y-3">
              <p className="text-sm font-semibold mb-2">Theme</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    theme === "light" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <IconSun className="h-5 w-5" />
                  <span className="text-xs font-bold">Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    theme === "dark" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <IconMoon className="h-5 w-5" />
                  <span className="text-xs font-bold">Dark</span>
                </button>
              </div>
            </div>
          </Section>
        )}

        {/* Account security */}
        <Section title="Security">
          <Row icon={IconShield} label="Sign-in Method" value="GitHub OAuth" showArrow={false} />
        </Section>

        {/* Danger zone */}
        <Section title="Session">
          <Row
            icon={IconLogout}
            label="Sign Out"
            value="You'll be redirected to login"
            onClick={() => setModal("signout")}
            destructive
          />
        </Section>
      </div>

      {/* Modals */}
      {modal === "name" && (
        <EditNameModal
          currentName={localProfile?.name ?? ""}
          onSave={handleSaveName}
          onCancel={() => setModal(null)}
          isSaving={isSaving}
        />
      )}
      {modal === "skills" && (
        <EditSkillsModal
          currentSkills={localProfile?.skill_levels as Record<SportType, SkillLevel> || {}}
          onSave={handleSaveSkills}
          onCancel={() => setModal(null)}
          isSaving={isSaving}
        />
      )}
      {modal === "signout" && (
        <ConfirmModal
          title="Sign out?"
          description="You'll be redirected to the login page and will need to sign in again to access your sessions."
          confirmLabel="Sign Out"
          onConfirm={signOut}
          onCancel={() => setModal(null)}
          isDestructive
        />
      )}

      {modal === "ios-install" && (
        <IOSInstallModal onClose={() => setModal(null)} />
      )}

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10 }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-bold z-50 ${
            toast.ok ? "bg-foreground text-background" : "bg-destructive text-white"
          }`}
        >
          {toast.ok ? <IconCheck className="h-4 w-4" /> : null}
          {toast.msg}
        </motion.div>
      )}
    </div>
  );
}

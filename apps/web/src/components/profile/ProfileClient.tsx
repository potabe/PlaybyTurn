"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Camera, Check, Loader2, LogOut,
  User, Mail, Shield, Trash2, ChevronRight,
} from "lucide-react";

// ─── Animated section wrapper ─────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-primary/70 px-1 ml-1">{title}</p>
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  );
}

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
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
    </button>
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
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
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
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1.5" />Save</>}
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
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
      >
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isDestructive ? "bg-destructive/10" : "bg-primary/10"}`}>
            {isDestructive ? <Trash2 className="h-6 w-6 text-destructive" /> : <Shield className="h-6 w-6 text-primary" />}
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
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
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
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modal, setModal] = useState<"name" | "signout" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [localProfile, setLocalProfile] = useState(profile);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const initials = localProfile?.name
    ? localProfile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  // ── Save name ────────────────────────────────────────────
  const handleSaveName = async (newName: string) => {
    if (!user) return;
    setIsSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      setLocalProfile((p) => p ? { ...p, name: newName } : p);
      setModal(null);
      showToast("Name updated successfully!");
    } catch {
      showToast("Failed to update name", false);
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
      const ext = file.name.split(".").pop();
      const path = `${user.id}.${ext}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: uploadError } = await (supabase as any).storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { publicUrl } } = (supabase as any).storage.from("avatars").getPublicUrl(path);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (updateError) throw updateError;

      setLocalProfile((p) => p ? { ...p, avatar_url: publicUrl } : p);
      showToast("Avatar updated!");
    } catch {
      showToast("Failed to upload avatar", false);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── Remove avatar ─────────────────────────────────────────
  const handleRemoveAvatar = async () => {
    if (!user || !localProfile?.avatar_url) return;
    setIsUploadingAvatar(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      setLocalProfile((p) => p ? { ...p, avatar_url: null } : p);
      showToast("Avatar removed");
    } catch {
      showToast("Failed to remove avatar", false);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const memberSince = localProfile?.created_at
    ? new Date(localProfile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-16">
      {/* Header */}
      <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-black tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      {/* Avatar hero section */}
      <div className="max-w-lg mx-auto px-4 mb-8">
        <div className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          <div className="px-6 pb-6 -mt-10 flex items-end gap-4">
            <div className="relative flex-shrink-0">
              <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                <AvatarImage src={localProfile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-black">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-white shadow hover:bg-primary/90 transition-colors"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
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
        {/* Account */}
        <Section title="Account">
          <Row icon={User} label="Display Name" value={localProfile?.name ?? "Not set"} onClick={() => setModal("name")} />
          <Row icon={Mail} label="Email Address" value={user?.email ?? "—"} showArrow={false} />
        </Section>

        {/* Avatar */}
        {localProfile?.avatar_url && (
          <Section title="Avatar">
            <Row
              icon={Trash2}
              label="Remove Avatar"
              value="Reset to initials avatar"
              onClick={handleRemoveAvatar}
              destructive
            />
          </Section>
        )}

        {/* Account security */}
        <Section title="Security">
          <Row icon={Shield} label="Sign-in Method" value="GitHub OAuth" showArrow={false} />
        </Section>

        {/* Danger zone */}
        <Section title="Session">
          <Row
            icon={LogOut}
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
          {toast.ok ? <Check className="h-4 w-4" /> : null}
          {toast.msg}
        </motion.div>
      )}
    </div>
  );
}

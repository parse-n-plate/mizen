"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { type Theme, getTheme, setTheme } from "@/lib/theme";
import { getRoundAmounts, setRoundAmounts } from "@/lib/preferences";

type Section = "account" | "appearance" | "about";

const NAV_ITEMS: { id: Section; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "appearance", label: "Appearance" },
  { id: "about", label: "About" },
];

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user, signOut } = useUser();
  const [activeSection, setActiveSection] = useState<Section>("account");

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex min-h-[420px]">
          {/* Sidebar */}
          <nav className="w-52 shrink-0 bg-[var(--color-background-cream)] p-4 flex flex-col">
            <h2 className="font-sans text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider px-2 mb-3">
              Settings
            </h2>
            <ul className="space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <Button
                    variant="ghost"
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full justify-start px-2 py-1.5 h-auto font-sans text-sm ${
                      activeSection === item.id
                        ? "bg-stone-200/70 dark:bg-stone-700/70 text-stone-900 dark:text-stone-100 font-medium hover:bg-stone-200/70 dark:hover:bg-stone-700/70"
                        : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100"
                    }`}
                  >
                    {item.label}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
          <Separator orientation="vertical" className="bg-stone-200 dark:bg-stone-700" />
          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === "account" && (
              <AccountSection
                name={name}
                email={user?.email}
                avatarUrl={user?.user_metadata?.avatar_url}
                onSignOut={handleSignOut}
              />
            )}
            {activeSection === "appearance" && <AppearanceSection />}
            {activeSection === "about" && <AboutSection />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Sections ─────────────────────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
      {children}
    </h3>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="font-sans text-sm font-medium text-stone-800 dark:text-stone-200">
            {label}
          </p>
          {description && (
            <p className="font-sans text-xs text-stone-400 dark:text-stone-500 mt-0.5">
              {description}
            </p>
          )}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
      <Separator className="bg-stone-100 dark:bg-stone-800 last:hidden" />
    </div>
  );
}

/* ─── Account ──────────────────────────────────────────────────────────────── */

function AccountSection({
  name,
  email,
  avatarUrl,
  onSignOut,
}: {
  name: string;
  email?: string;
  avatarUrl?: string;
  onSignOut: () => void;
}) {
  return (
    <div>
      <SectionTitle>Account</SectionTitle>

      {/* Profile card */}
      <div className="flex items-center gap-3 mb-6 pb-4">
        <Avatar size="lg">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="bg-stone-200 dark:bg-stone-700 font-sans font-medium text-stone-600 dark:text-stone-300">
            {name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-sans text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
            {name}
          </p>
          {email && (
            <p className="font-sans text-xs text-stone-400 dark:text-stone-500 truncate">{email}</p>
          )}
        </div>
      </div>
      <Separator className="bg-stone-100 dark:bg-stone-800" />

      <SettingRow label="Email" description="Your account email address">
        <span className="font-sans text-sm text-stone-500 dark:text-stone-400">{email || "—"}</span>
      </SettingRow>

      <div className="mt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="px-0 font-sans text-sm text-red-500 hover:text-red-600 hover:bg-transparent"
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}

/* ─── Appearance ───────────────────────────────────────────────────────────── */

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function AppearanceSection() {
  const [theme, setThemeState] = useState<Theme>(getTheme);
  const [roundAmounts, setRoundAmountsState] = useState(getRoundAmounts);

  const handleThemeChange = (t: Theme) => {
    setThemeState(t);
    setTheme(t);
  };

  const handleRoundAmountsChange = (checked: boolean) => {
    setRoundAmountsState(checked);
    setRoundAmounts(checked);
  };

  return (
    <div>
      <SectionTitle>Appearance</SectionTitle>

      <SettingRow label="Theme" description="Toggle between light and dark mode">
        <ToggleGroup
          type="single"
          variant="outline"
          value={theme}
          onValueChange={(v) => {
            if (v) handleThemeChange(v as Theme);
          }}
          className="rounded-lg"
        >
          {THEME_OPTIONS.map((opt) => (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              className="font-sans text-sm px-3 py-1 h-auto data-[state=on]:bg-stone-900 data-[state=on]:text-white dark:data-[state=on]:bg-stone-100 dark:data-[state=on]:text-stone-900"
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SettingRow>

      <SettingRow label="Round amounts" description="Round ingredient amounts to the nearest ½">
        <Switch checked={roundAmounts} onCheckedChange={handleRoundAmountsChange} />
      </SettingRow>

      <SettingRow label="Font" description="Serif font used for headings">
        <Badge
          variant="outline"
          className="rounded-md px-3 py-1 font-serif text-sm text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
        >
          Domine
        </Badge>
      </SettingRow>
    </div>
  );
}

/* ─── About ────────────────────────────────────────────────────────────────── */

function AboutSection() {
  return (
    <div>
      <SectionTitle>About</SectionTitle>

      <SettingRow label="App" description="Baby Mizen — recipe parser">
        <Badge variant="secondary" className="font-sans text-sm text-stone-500 dark:text-stone-400">
          v0.1.0
        </Badge>
      </SettingRow>

      <SettingRow label="Stack">
        <Badge
          variant="outline"
          className="font-sans text-xs text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700"
        >
          Next.js, Supabase, Groq
        </Badge>
      </SettingRow>

      <p className="mt-6 font-sans text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
        Paste a URL, get a clean recipe. Built as the simplified version of Mizen.
      </p>
    </div>
  );
}

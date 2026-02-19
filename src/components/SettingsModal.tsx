"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { type Theme, getTheme, setTheme } from "@/lib/theme";

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

  const name =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Guest";

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl p-0 gap-0 overflow-hidden"
      >
        <div className="flex min-h-[420px]">
          {/* Sidebar */}
          <nav className="w-52 shrink-0 border-r border-stone-200 dark:border-stone-700 bg-[var(--color-background-cream)] p-4 flex flex-col">
            <h2 className="font-sans text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider px-2 mb-3">
              Settings
            </h2>
            <ul className="space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-md font-sans text-sm transition-colors ${
                      activeSection === item.id
                        ? "bg-stone-200/70 dark:bg-stone-700/70 text-stone-900 dark:text-stone-100 font-medium"
                        : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100"
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

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
    <div className="flex items-center justify-between gap-4 py-3 border-b border-stone-100 dark:border-stone-800 last:border-b-0">
      <div className="min-w-0">
        <p className="font-sans text-sm font-medium text-stone-800 dark:text-stone-200">{label}</p>
        {description && (
          <p className="font-sans text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
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
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100 dark:border-stone-800">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-700 font-sans text-sm font-medium text-stone-600 dark:text-stone-300">
            {name[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-sans text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
            {name}
          </p>
          {email && (
            <p className="font-sans text-xs text-stone-400 dark:text-stone-500 truncate">
              {email}
            </p>
          )}
        </div>
      </div>

      <SettingRow label="Email" description="Your account email address">
        <span className="font-sans text-sm text-stone-500 dark:text-stone-400">
          {email || "—"}
        </span>
      </SettingRow>

      <div className="mt-6">
        <button
          onClick={onSignOut}
          className="font-sans text-sm text-red-500 hover:text-red-600 transition-colors"
        >
          Sign out
        </button>
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
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  const handleThemeChange = (t: Theme) => {
    setThemeState(t);
    setTheme(t);
  };

  return (
    <div>
      <SectionTitle>Appearance</SectionTitle>

      <SettingRow label="Theme" description="Toggle between light and dark mode">
        <div className="inline-flex rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleThemeChange(opt.value)}
              className={`px-3 py-1 font-sans text-sm transition-colors ${
                theme === opt.value
                  ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                  : "bg-white text-stone-500 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow label="Font" description="Serif font used for headings">
        <span className="inline-flex items-center rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1 font-serif text-sm text-stone-500 dark:text-stone-400">
          Domine
        </span>
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
        <span className="font-sans text-sm text-stone-500 dark:text-stone-400">v0.1.0</span>
      </SettingRow>

      <SettingRow label="Stack">
        <span className="font-sans text-xs text-stone-400 dark:text-stone-500">
          Next.js, Supabase, Groq
        </span>
      </SettingRow>

      <p className="mt-6 font-sans text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
        Paste a URL, get a clean recipe. Built as the simplified version of Mizen.
      </p>
    </div>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Github } from "lucide-react";
import Moon from "@solar-icons/react/csr/weather/Moon";
import Sun from "@solar-icons/react/csr/weather/Sun";
import { Button } from "@/components/ui/button";
import { getTheme, setTheme } from "@/lib/theme";

function getResolvedDarkMode() {
  if (typeof window === "undefined") return false;

  const theme = getTheme();
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function subscribeToThemeChanges(onChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => onChange();

  mediaQuery.addEventListener("change", handleChange);
  window.addEventListener("storage", handleChange);
  window.addEventListener("mizen-theme-change", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("mizen-theme-change", handleChange);
  };
}

export function DesignSystemNavActions() {
  const isDark = useSyncExternalStore(subscribeToThemeChanges, getResolvedDarkMode, () => false);

  const handleThemeToggle = () => {
    const nextIsDark = !isDark;
    setTheme(nextIsDark ? "dark" : "light");
    window.dispatchEvent(new Event("mizen-theme-change"));
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        asChild
        variant="ghost"
        size="icon-sm"
        className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
      >
        <Link
          href="https://github.com/parse-n-plate/mizen"
          target="_blank"
          rel="noreferrer"
          aria-label="Open Mizen on GitHub"
        >
          <Github className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={isDark}
        onClick={handleThemeToggle}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </Button>
      <Button asChild size="sm" className="press-scale">
        <Link href="/">Open app</Link>
      </Button>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

function hasScrolled() {
  return window.scrollY > 0;
}

function initialScrollState() {
  return false;
}

export function PublicBrand() {
  return (
    <Link
      href="/homepage"
      className="flex shrink-0 items-center gap-2 rounded-md font-serif text-lg font-semibold text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mizen-blue dark:text-stone-50 transition-none"
    >
      <Image
        src="/apple-touch-icon.png"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0"
      />
      Mizen
    </Link>
  );
}

export function PublicHeader({
  action,
  fullWidth = false,
}: {
  action?: ReactNode;
  fullWidth?: boolean;
}) {
  const scrolled = useSyncExternalStore(subscribeToScroll, hasScrolled, initialScrollState);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 shrink-0 border-b bg-white/95 backdrop-blur dark:bg-[var(--color-dark-surface)]",
        scrolled ? "border-stone-200 dark:border-stone-800" : "border-transparent"
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full min-w-0 items-center justify-between gap-6 py-4 sm:py-5",
          fullWidth ? "px-8 lg:px-12 xl:px-16" : "max-w-[1120px] px-5 sm:px-8"
        )}
      >
        <PublicBrand />
        <div className="min-h-7 min-w-[88px]">
          {action ?? (
            <Link
              href="/"
              prefetch={false}
              className="inline-flex rounded-lg bg-stone-100 px-3 py-1.5 font-sans text-sm font-medium text-stone-600 hover:bg-stone-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mizen-blue dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 transition-none"
            >
              Open app
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

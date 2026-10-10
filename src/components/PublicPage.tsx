import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { WhoMadeIt } from "@/components/WhoMadeIt";
import { cn } from "@/lib/utils";

export const publicPageWidths = {
  wide: "max-w-[1120px]",
  compact: "max-w-[800px]",
  document: "max-w-2xl",
};

export const publicPageContainer = "mx-auto w-full min-w-0 px-5 sm:px-8";
const publicLink =
  "rounded-md font-sans text-sm text-stone-500 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mizen-blue dark:text-stone-400 dark:hover:text-stone-100 transition-none";
const publicNavigation = [
  { href: "/get-started", label: "Get started" },
  { href: "/changelog", label: "Updates" },
  { href: "/links", label: "Links" },
];

export function PublicBrand() {
  return (
    <Link
      href="/"
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

export function PublicPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "landing-scroll flex min-h-screen min-w-0 flex-col bg-white text-stone-900 dark:bg-[var(--color-dark-surface)] dark:text-stone-100",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PublicHeader({
  currentPath,
  action,
}: {
  currentPath?: string;
  action?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-[var(--color-dark-surface)]">
      <div
        className={cn(
          publicPageContainer,
          publicPageWidths.wide,
          "grid grid-cols-2 items-center gap-x-6 gap-y-4 py-4 sm:grid-cols-[auto_1fr_auto] sm:py-5"
        )}
      >
        <PublicBrand />
        <nav
          aria-label="Public pages"
          className="order-3 col-span-2 flex flex-wrap items-center gap-6 sm:order-none sm:col-span-1 sm:justify-center"
        >
          {publicNavigation.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={currentPath === href ? "page" : undefined}
              className={cn(
                publicLink,
                currentPath === href && "font-medium text-stone-900 dark:text-stone-100"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="justify-self-end">
          {action ?? (
            <Link
              href="/"
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

export function PublicPageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-balance font-serif text-4xl font-bold leading-tight tracking-[-0.02em] text-stone-950 dark:text-stone-50 sm:text-5xl">
      {children}
    </h1>
  );
}

export function PublicFooter({
  children,
  compact = false,
  className,
}: {
  children?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <footer className={cn("border-t border-stone-200 py-6 dark:border-stone-800", className)}>
      <div
        className={cn(
          !compact && [publicPageContainer, publicPageWidths.wide],
          "flex flex-wrap items-center justify-between gap-x-8 gap-y-4"
        )}
      >
        <div className="flex flex-wrap items-center gap-4">
          {children}
          <WhoMadeIt />
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Link href="/changelog" className={publicLink}>
            Updates
          </Link>
          <Link href="/links" className={publicLink}>
            Links
          </Link>
          <Link href="/privacy" className={publicLink}>
            Privacy
          </Link>
          <Link href="/terms" className={publicLink}>
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}

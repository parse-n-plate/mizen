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
export { PublicHeader, PublicBrand } from "@/components/PublicHeader";

const PUBLIC_FOOTER_LINKS = [
  { href: "/get-started", label: "Get started" },
  { href: "/changelog", label: "What’s New" },
  { href: "/faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function PublicFooterNav({
  className,
  linkClassName,
}: {
  className?: string;
  linkClassName?: string;
}) {
  return (
    <nav
      aria-label="Footer"
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-3", className)}
    >
      {PUBLIC_FOOTER_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className={cn(publicLink, linkClassName)}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function PublicPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "landing-scroll flex min-h-0 min-w-0 flex-1 flex-col bg-white text-stone-900 dark:bg-[var(--color-dark-surface)] dark:text-stone-100",
        className
      )}
    >
      {children}
    </div>
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
        <PublicFooterNav />
      </div>
    </footer>
  );
}

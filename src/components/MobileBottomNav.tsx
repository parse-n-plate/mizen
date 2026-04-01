"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  id: "add" | "cookbook" | "profile";
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "add", href: "/#search", label: "Add Recipe" },
  { id: "cookbook", href: "/cookbook", label: "Cookbook" },
  { id: "profile", href: "/profile", label: "Profile" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const activeHash = pathname === "/" ? hash : "";

  useEffect(() => {
    if (pathname !== "/") return;

    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  return (
    <nav className="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border-light)]/90 bg-[var(--color-surface)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.id === "profile"
              ? pathname === "/profile"
              : item.id === "cookbook"
                ? pathname === "/cookbook"
                : pathname === "/" && activeHash === "#search";

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 font-sans text-[11px] font-medium transition-colors ${
                isActive
                  ? "text-[var(--color-blue)]"
                  : "text-[var(--color-text-muted)] active:text-[var(--color-text-heading)]"
              }`}
            >
              {item.id === "add" ? (
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              ) : item.id === "cookbook" ? (
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="8" r="4" />
                </svg>
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AddCircle from "@solar-icons/react/csr/ui/AddCircle";
import BookBookmark from "@solar-icons/react/csr/school/BookBookmark";
import User from "@solar-icons/react/csr/users/User";

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
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border-light)]/90 bg-[var(--color-surface)]/95 backdrop-blur-md">
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
                <AddCircle size={20} aria-hidden="true" />
              ) : item.id === "cookbook" ? (
                <BookBookmark size={20} aria-hidden="true" />
              ) : (
                <User size={20} aria-hidden="true" />
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

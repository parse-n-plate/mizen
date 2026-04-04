"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { RecipeProvider } from "@/context/RecipeContext";
import { useUser } from "@/hooks/useUser";
import { Sidebar } from "@/components/Sidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isHomePage = pathname === "/";
  // Treat loading state as landing on homepage so sidebar don't flash
  // before auth resolves
  const isLanding = isHomePage && (loading || !user);
  const showMobileNav = !!user && ["/", "/cookbook", "/profile"].includes(pathname);

  return (
    <RecipeProvider>
      {isLanding ? (
        <div className="min-h-screen lg:min-h-0 lg:h-screen flex flex-col">{children}</div>
      ) : (
        <div className="flex h-screen bg-[#FAFAF9] dark:bg-stone-950">
          <div className="flex h-full w-full gap-3 px-6">
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <main className="relative flex-1 min-w-0 overflow-y-auto flex flex-col">
              {/* Expand sidebar button – fades in when sidebar is collapsed */}
              <button
                onClick={() => setSidebarCollapsed(false)}
                className={cn(
                  "absolute top-6 left-0 z-40 flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-[opacity] duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
                  sidebarCollapsed ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                aria-label="Expand sidebar"
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18" />
                </svg>
              </button>
              {children}
            </main>
          </div>
          {showMobileNav && <MobileBottomNav />}
        </div>
      )}
    </RecipeProvider>
  );
}

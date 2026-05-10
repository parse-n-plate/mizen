"use client";

import { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import { RecipeProvider } from "@/context/RecipeContext";
import { useUser } from "@/hooks/useUser";
import { Sidebar } from "@/components/Sidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { cn } from "@/lib/utils";
import SidebarMinimalistic from "@solar-icons/react/csr/it/SidebarMinimalistic";
import type { ReactNode } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  return useContext(SidebarContext) ?? { collapsed: false, setCollapsed: () => {} };
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isHomePage = pathname === "/";
  // Treat loading state as landing on homepage so sidebar don't flash
  // before auth resolves
  const isLanding = isHomePage && (loading || !user);
  const showMobileNav = !!user && ["/", "/cookbook", "/profile"].includes(pathname);
  // Pages that render their own inline expand button — suppress the shell-level gutter
  const hasInlineExpand = pathname.startsWith("/recipe");

  return (
    <SidebarContext.Provider
      value={{ collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed }}
    >
      <RecipeProvider>
        {isLanding ? (
          <div className="landing-scroll min-h-screen lg:min-h-0 lg:h-screen flex flex-col">
            {children}
          </div>
        ) : (
          <div className="flex h-screen bg-[#FAFAF9] dark:bg-stone-950">
            <div className="flex h-full w-full max-w-[1100px] mx-auto gap-3 max-md:gap-0 max-md:pl-0 max-md:pr-0 pl-6 pr-6">
              <div className="hidden md:flex shrink-0">
                <Sidebar
                  collapsed={sidebarCollapsed}
                  onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
                {/* Expand-sidebar gutter — animates in from 0 when sidebar collapses, never overlaps content */}
                <div
                  className={cn(
                    "shrink-0 pt-6 overflow-hidden transition-[width] ease-[cubic-bezier(0.165,0.84,0.44,1)] motion-reduce:transition-none motion-reduce:duration-0",
                    hasInlineExpand
                      ? "w-0 duration-0"
                      : sidebarCollapsed
                        ? "w-7 duration-[220ms]"
                        : "w-0 duration-[180ms]"
                  )}
                >
                  <button
                    onClick={() => setSidebarCollapsed(false)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-[opacity] ease-out motion-reduce:transition-none",
                      sidebarCollapsed
                        ? "opacity-100 duration-150 delay-100"
                        : "opacity-0 pointer-events-none duration-75"
                    )}
                    aria-label="Expand sidebar"
                    aria-expanded={!sidebarCollapsed}
                    aria-controls="primary-sidebar"
                    tabIndex={sidebarCollapsed ? 0 : -1}
                  >
                    <SidebarMinimalistic size={14} />
                  </button>
                </div>
              </div>
              <main
                className="group/shell relative flex-1 min-w-0 overflow-y-auto flex flex-col"
                data-sidebar-collapsed={sidebarCollapsed}
              >
                {children}
              </main>
            </div>
            {showMobileNav && <MobileBottomNav />}
          </div>
        )}
      </RecipeProvider>
    </SidebarContext.Provider>
  );
}

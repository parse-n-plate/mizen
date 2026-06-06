"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { RecipeProvider } from "@/context/RecipeContext";
import { useUser } from "@/hooks/useUser";
import { Sidebar } from "@/components/Sidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SplashScreen } from "@/components/SplashScreen";
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
  const isDesignSystemPage =
    pathname === "/design-system" || pathname.startsWith("/design-system/");
  const isPublicStandalonePage =
    pathname === "/get-started" ||
    pathname === "/homepage" ||
    pathname === "/links" ||
    isDesignSystemPage;
  // Tall, document-scrolling landing pages must NOT be locked to viewport height. A fixed-height
  // (lg:h-screen) wrapper whose taller content overflows visibly relies on <html> scrolling that
  // overflow — but when a dialog opens, react-remove-scroll sets body{overflow:hidden}, which
  // clips that overflow, collapses the html scroll area, and snaps the page to the top. Letting
  // the wrapper grow with its content keeps body tall so the lock can't collapse the scroll.
  const isScrollingLanding = pathname === "/get-started" || isDesignSystemPage;
  // Treat loading state as landing on homepage so sidebar don't flash
  // before auth resolves
  const isLanding = isPublicStandalonePage || (isHomePage && (loading || !user));
  const showMobileNav = !!user && ["/", "/cookbook", "/profile"].includes(pathname);
  // Pages that render their own inline expand button — suppress the shell-level gutter
  const hasInlineExpand = pathname.startsWith("/recipe");
  const showSplash = !!user && !isLanding;

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem("mizen:core-app-seen", "true");
        document.documentElement.removeAttribute("data-early-splash");
      } else if (!loading) {
        localStorage.removeItem("mizen:core-app-seen");
        document.documentElement.removeAttribute("data-early-splash");
      }
    } catch {
      document.documentElement.removeAttribute("data-early-splash");
    }
  }, [loading, user]);

  return (
    <SidebarContext.Provider
      value={{ collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed }}
    >
      <RecipeProvider>
        <SplashScreen enabled={showSplash} ready={!loading} />
        {isLanding ? (
          <div
            className={cn(
              "landing-scroll flex flex-col",
              isScrollingLanding ? "min-h-screen" : "min-h-screen lg:min-h-0 lg:h-screen"
            )}
          >
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

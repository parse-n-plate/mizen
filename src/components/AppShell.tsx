"use client";

import { usePathname } from "next/navigation";
import { RecipeProvider } from "@/context/RecipeContext";
import { useUser } from "@/hooks/useUser";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const isHomePage = pathname === "/";
  // Treat loading state as landing on homepage so TopBar/Footer don't flash
  // before auth resolves
  const isLanding = isHomePage && (loading || !user);
  const showMobileNav = !!user && ["/", "/cookbook", "/profile"].includes(pathname);

  return (
    <RecipeProvider>
      <div
        className={
          isLanding
            ? "min-h-screen lg:min-h-0 lg:h-screen flex flex-col"
            : "min-h-screen bg-white dark:bg-stone-950"
        }
      >
        {!isLanding && <TopBar />}
        {isLanding ? (
          children
        ) : (
          <main className={showMobileNav ? "pb-24 sm:pb-0" : ""}>{children}</main>
        )}
        {!isLanding && <Footer />}
        {!isLanding && <FeedbackDialog />}
        {showMobileNav && <MobileBottomNav />}
      </div>
    </RecipeProvider>
  );
}

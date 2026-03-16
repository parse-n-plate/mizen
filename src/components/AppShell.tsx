"use client";

import { usePathname } from "next/navigation";
import { RecipeProvider } from "@/context/RecipeContext";
import { useUser } from "@/hooks/useUser";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const isHomePage = pathname === "/";
  const isLanding = isHomePage && !loading && !user;

  return (
    <RecipeProvider>
      <div className={isLanding ? "min-h-screen lg:min-h-0 lg:h-screen flex flex-col" : "min-h-screen bg-white dark:bg-stone-950"}>
        {!isLanding && <TopBar />}
        {isLanding ? children : <main>{children}</main>}
        {!isLanding && <Footer />}
        {!isLanding && <FeedbackDialog />}
      </div>
    </RecipeProvider>
  );
}

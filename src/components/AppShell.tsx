"use client";

import { usePathname } from "next/navigation";
import { RecipeProvider } from "@/context/RecipeContext";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <RecipeProvider>
      <div className={isHomePage ? "" : "min-h-screen bg-white dark:bg-stone-950"}>
        {!isHomePage && <TopBar />}
        {isHomePage ? children : <main>{children}</main>}
        {!isHomePage && <Footer />}
      </div>
    </RecipeProvider>
  );
}

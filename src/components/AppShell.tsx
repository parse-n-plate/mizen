"use client";

import { RecipeProvider } from "@/context/RecipeContext";
import { TopBar } from "@/components/TopBar";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <RecipeProvider>
      <div className="min-h-screen bg-white dark:bg-stone-950">
        <TopBar />
        <main>{children}</main>
      </div>
    </RecipeProvider>
  );
}

import type { ReactNode } from "react";
import { PublicSiteHeader } from "@/components/PublicSiteHeader";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="landing-scroll flex min-h-screen flex-col bg-white dark:bg-[var(--color-dark-surface)]">
      <PublicSiteHeader />
      {children}
    </div>
  );
}

import type { ReactNode } from "react";
import {
  PublicPage,
  PublicPageTitle,
  PublicFooter,
  publicPageContainer,
  publicPageWidths,
} from "@/components/PublicPage";
import { cn } from "@/lib/utils";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PublicPage>
      <main className={cn(publicPageContainer, publicPageWidths.wide, "flex-1 py-10 sm:py-14")}>
        <PublicPageTitle>{title}</PublicPageTitle>
        {children}
      </main>
      <PublicFooter />
    </PublicPage>
  );
}

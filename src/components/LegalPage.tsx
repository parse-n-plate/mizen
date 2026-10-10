import type { ReactNode } from "react";
import {
  PublicPage,
  PublicHeader,
  PublicPageTitle,
  PublicFooter,
  publicPageContainer,
  publicPageWidths,
} from "@/components/PublicPage";
import { cn } from "@/lib/utils";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PublicPage>
      <PublicHeader />
      <main className={cn(publicPageContainer, publicPageWidths.document, "flex-1 py-10 sm:py-14")}>
        <PublicPageTitle>{title}</PublicPageTitle>
        {children}
      </main>
      <PublicFooter />
    </PublicPage>
  );
}

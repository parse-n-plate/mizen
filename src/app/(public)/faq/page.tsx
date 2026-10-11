import type { Metadata } from "next";
import { Faq } from "@/components/faq/Faq";
import {
  PublicPage,
  PublicPageTitle,
  PublicFooter,
  publicPageContainer,
  publicPageWidths,
} from "@/components/PublicPage";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FAQ | Mizen",
  description:
    "Answers to common questions about getting started, importing recipes, and using Mizen.",
};

export default function FaqPage() {
  return (
    <PublicPage>
      <main className={cn(publicPageContainer, publicPageWidths.document, "flex-1 py-10 sm:py-14")}>
        <PublicPageTitle>Frequently asked questions</PublicPageTitle>
        <p className="mt-6 font-sans text-base leading-7 text-stone-600 dark:text-stone-400">
          Getting started, saving recipes, and cooking with Mizen.
        </p>
        <div className="mt-10">
          <Faq />
        </div>
      </main>
      <PublicFooter />
    </PublicPage>
  );
}

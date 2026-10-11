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
        <PublicPageTitle>FAQ</PublicPageTitle>
        <p className="mt-6 font-sans text-base leading-7 text-stone-600 dark:text-stone-400">
          Getting started, saving recipes, and cooking with Mizen.
        </p>
        <div className="mt-10">
          <Faq />
        </div>
        <section aria-labelledby="more-questions" className="mt-10 sm:mt-12">
          <h2
            id="more-questions"
            className="font-serif text-2xl font-semibold text-stone-950 dark:text-stone-50"
          >
            Have more questions?
          </h2>
          <p className="mt-3 font-sans text-base leading-7 text-stone-600 dark:text-stone-400">
            Need a hand with Mizen, or have an idea to share?{" "}
            <a
              href="mailto:hello@mizen.recipes"
              className="rounded-md underline underline-offset-4 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mizen-blue dark:hover:text-stone-100 transition-none"
            >
              Send us a note.
            </a>
          </p>
        </section>
      </main>
      <PublicFooter />
    </PublicPage>
  );
}

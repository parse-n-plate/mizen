import Image from "next/image";
import {
  PublicPage,
  PublicHeader,
  PublicPageTitle,
  PublicFooter,
  publicPageContainer,
  publicPageWidths,
} from "@/components/PublicPage";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { ChangelogGitHub } from "./changelog-github";
import { appVersion } from "@/lib/app-version";

export const metadata: Metadata = {
  title: "Changelog | Mizen",
  description: "Recent Mizen product updates and fixes.",
};

export default function ChangelogPage() {
  return (
    <PublicPage>
      <PublicHeader currentPath="/changelog" />
      <main className={cn(publicPageContainer, publicPageWidths.wide, "flex-1 py-10 sm:py-14")}>
        <section className="grid gap-8 pb-12 md:grid-cols-[minmax(0,0.82fr)_minmax(280px,0.55fr)] md:items-end lg:pb-16">
          <div className="max-w-2xl">
            <PublicPageTitle>What changed in Mizen</PublicPageTitle>
            <p className="mt-6 max-w-xl font-sans text-lg leading-8 text-stone-600 dark:text-stone-400">
              Product updates, fixes, and early access notes pulled from merged GitHub history on
              the main branch.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_18px_40px_rgba(44,42,37,0.10)] dark:border-stone-800 dark:bg-stone-900 dark:shadow-none">
            <Image
              src="/assets/changelog-notice-header.png"
              alt="Recipe view preview"
              width={640}
              height={444}
              className="aspect-[1.45] w-full object-cover"
              priority
            />
          </div>
        </section>

        <ChangelogGitHub appVersion={appVersion} />
      </main>
      <PublicFooter />
    </PublicPage>
  );
}

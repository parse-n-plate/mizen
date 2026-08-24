import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ChangelogGitHub } from "./changelog-github";
import { appVersion } from "@/lib/app-version";

export const metadata: Metadata = {
  title: "Changelog | Mizen",
  description: "Recent Mizen product updates and fixes.",
};

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-white text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2 font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
          >
            <Image
              src="/apple-touch-icon.png"
              alt=""
              aria-hidden
              width={28}
              height={28}
              className="h-7 w-7 transition-transform duration-200 ease-out group-hover:rotate-[-8deg] group-hover:scale-110 motion-reduce:transition-none"
            />
            Mizen
          </Link>
          <Link
            href="/get-started"
            className="rounded-lg px-3 py-2 font-sans text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100"
          >
            Get started
          </Link>
        </header>

        <section className="grid gap-8 py-12 md:grid-cols-[minmax(0,0.82fr)_minmax(280px,0.55fr)] md:items-end lg:py-16">
          <div className="max-w-2xl">
            <h1 className="text-balance font-serif text-[clamp(34px,5vw,56px)] font-bold leading-[1.05] text-stone-950 dark:text-stone-50">
              What changed in Mizen
            </h1>
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
      </div>
    </main>
  );
}

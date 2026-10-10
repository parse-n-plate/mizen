import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-2xl px-6 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif text-lg font-semibold transition-none"
          >
            <Image src="/apple-touch-icon.png" alt="" width={28} height={28} className="h-7 w-7" />
            Mizen
          </Link>
          <Link
            href="/get-started"
            className="rounded-lg px-3 py-2 font-sans text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100 transition-none"
          >
            Get started
          </Link>
        </header>
        <main className="py-12">
          <h1 className="font-serif text-3xl font-bold">{title}</h1>
          {children}
        </main>
        <footer className="border-t border-stone-200 py-6 dark:border-stone-800">
          <nav
            aria-label="Legal"
            className="flex flex-wrap gap-4 font-sans text-sm text-stone-500 dark:text-stone-400"
          >
            <Link
              href="/privacy"
              className="hover:text-stone-900 dark:hover:text-stone-100 transition-none"
            >
              Privacy policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-stone-900 dark:hover:text-stone-100 transition-none"
            >
              Terms of service
            </Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}

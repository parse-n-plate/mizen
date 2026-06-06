import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DesignSystemAreaSwitcher } from "./area-switcher";
import { DesignSystemHashRedirect } from "./hash-redirect";
import { DesignSystemNavActions } from "./nav-actions";
import { DesignSystemSidebar } from "./sidebar";

const designSystemSearchEnabled = process.env.NEXT_PUBLIC_DESIGN_SYSTEM_SEARCH_ENABLED === "true";

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing-scroll min-h-screen bg-[var(--color-background-cream)] text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <DesignSystemHashRedirect />
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/80 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/80">
        <nav className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/apple-touch-icon.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded"
              />
              <span className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
                Mizen
              </span>
            </Link>
            <div className="hidden sm:block">
              <DesignSystemAreaSwitcher />
            </div>
          </div>
          {designSystemSearchEnabled && (
            <div className="hidden w-full max-w-[240px] items-center md:flex">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  readOnly
                  value=""
                  placeholder="Search docs..."
                  className="h-8 rounded-lg bg-white pl-9 text-sm dark:bg-stone-900"
                />
              </div>
            </div>
          )}
          <DesignSystemNavActions />
        </nav>
      </header>

      <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-10 px-5 pb-20 sm:px-8 lg:grid-cols-[240px_minmax(0,720px)] lg:items-start">
        <DesignSystemSidebar />
        <main className="min-w-0 pt-8">{children}</main>
      </div>
    </div>
  );
}

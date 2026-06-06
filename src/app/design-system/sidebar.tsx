"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AddCircle from "@solar-icons/react/csr/ui/AddCircle";
import ChefHat from "@solar-icons/react/csr/food/ChefHat";
import Lightbulb from "@solar-icons/react/csr/devices/Lightbulb";
import Tuning2 from "@solar-icons/react/csr/settings/Tuning2";
import { cn } from "@/lib/utils";
import {
  BRAND_GUIDELINES_GROUPS,
  type BrandGuidelinesSlug,
  getBrandGuidelinesPath,
} from "./brand-nav";
import { DESIGN_SYSTEM_GROUPS, type DesignSystemSlug, getDesignSystemPath } from "./nav";

function getGroupIcon(title: string) {
  switch (title) {
    case "Foundations":
    case "Identity":
      return Tuning2;
    case "UI primitives":
    case "Resources":
      return AddCircle;
    case "Product components":
      return ChefHat;
    case "Patterns":
    case "Expression":
      return Lightbulb;
    default:
      return Tuning2;
  }
}

export function DesignSystemSidebar() {
  const pathname = usePathname();
  const isBrandRoute = pathname.startsWith("/design-system/brand");
  const groups = isBrandRoute ? BRAND_GUIDELINES_GROUPS : DESIGN_SYSTEM_GROUPS;
  const getPath = (slug: string) =>
    isBrandRoute
      ? getBrandGuidelinesPath(slug as BrandGuidelinesSlug)
      : getDesignSystemPath(slug as DesignSystemSlug);

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] lg:block">
      <div className="scrollbar-hide h-full overflow-y-auto overscroll-contain py-8 pr-3">
        <div className="space-y-7 pb-10">
          {groups.map((group) => {
            const GroupIcon = getGroupIcon(group.title);

            return (
              <section key={group.title}>
                <h2 className="mb-2 flex items-center gap-2 px-2.5 text-sm font-semibold text-stone-800 dark:text-stone-200">
                  <GroupIcon size={14} />
                  {group.title}
                </h2>
                <div className="space-y-px">
                  {group.items.map((item) => {
                    const href = getPath(item.slug);
                    const isActive = pathname === href;

                    return (
                      <Link
                        key={item.slug}
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "block rounded-lg px-2.5 py-2 text-sm leading-5 transition-none",
                          isActive
                            ? "bg-stone-200/60 font-medium text-stone-900 dark:bg-stone-700/35 dark:text-stone-100"
                            : "text-stone-500 hover:bg-stone-200/60 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-700/35 dark:hover:text-stone-300"
                        )}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--color-background-cream)] via-[var(--color-background-cream)]/90 to-transparent dark:from-stone-950 dark:via-stone-950/90"
      />
    </aside>
  );
}

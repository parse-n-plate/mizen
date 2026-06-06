"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const areas = [
  { title: "Design System", href: "/design-system", key: "system" },
  { title: "Brand", href: "/design-system/brand", key: "brand" },
] as const;

export function DesignSystemAreaSwitcher() {
  const pathname = usePathname();
  const activeArea = pathname.startsWith("/design-system/brand") ? "brand" : "system";
  const activeTitle = areas.find((area) => area.key === activeArea)?.title ?? "Design System";

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-lg font-medium text-stone-300 dark:text-stone-700">/</span>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1 rounded-md px-1.5 font-sans text-sm font-semibold text-stone-900 outline-none transition-colors hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] focus-visible:ring-offset-2 dark:text-stone-100 dark:hover:bg-stone-800 dark:focus-visible:ring-offset-stone-950">
          {activeTitle}
          <ChevronDown className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {areas.map((area) => (
            <DropdownMenuItem key={area.key} asChild>
              <Link href={area.href}>
                <span>{area.title}</span>
                {activeArea === area.key ? (
                  <span className="ml-auto text-[var(--color-blue)]">Current</span>
                ) : null}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

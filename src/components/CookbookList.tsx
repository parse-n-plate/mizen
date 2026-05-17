"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useRecipe } from "@/context/RecipeContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import LinkSquare from "@solar-icons/react/csr/text-formatting/LinkSquare";
import TrashBinMinimalistic from "@solar-icons/react/csr/ui/TrashBinMinimalistic";
import MenuDots from "@solar-icons/react/csr/ui/MenuDots";
import Book from "@solar-icons/react/csr/school/Book";

import type { SavedRecipe } from "@/lib/types";

function getTimeGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  // Start of today (midnight)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Day of week (0=Sun), shift so Mon=0
  const dayOfWeek = (startOfToday.getDay() + 6) % 7;
  const startOfThisWeek = new Date(startOfToday);
  startOfThisWeek.setDate(startOfToday.getDate() - dayOfWeek);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (date >= startOfThisWeek) return "This week";
  if (date >= startOfLastWeek) return "Last week";
  if (date >= startOfThisMonth) return "Earlier this month";

  // Named month + year for older
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function groupRecipes(recipes: SavedRecipe[]) {
  const groups: { label: string; items: SavedRecipe[] }[] = [];
  let currentLabel = "";

  for (const recipe of recipes) {
    const label = getTimeGroup(recipe.created_at);
    if (label !== currentLabel) {
      groups.push({ label, items: [recipe] });
      currentLabel = label;
    } else {
      groups[groups.length - 1].items.push(recipe);
    }
  }

  return groups;
}

interface CookbookListProps {
  initialRecipes: SavedRecipe[];
}

export function CookbookList({ initialRecipes }: CookbookListProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const { setRecipe, setSavedMeta } = useRecipe();
  const router = useRouter();
  const groups = groupRecipes(recipes);

  const handleOpen = (item: SavedRecipe) => {
    setRecipe(item.recipe);
    setSavedMeta({ id: item.id, slug: item.slug });
    router.push("/recipe");
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRecipes((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      // Silent fail
    }
  };

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-wheat)]">
          <Book size={28} className="text-[var(--color-orange)]" aria-hidden="true" />
        </div>
        <p className="mt-4 font-sans text-sm text-stone-500">No recipes saved yet</p>
        <p className="mt-1 font-sans text-xs text-stone-400 dark:text-stone-600">
          Parse a recipe and save it to build your cookbook
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {groups.map((group, groupIndex) => (
        <div key={group.label}>
          <h3
            className={`font-sans text-xs font-medium text-stone-400 dark:text-stone-500 px-0 ${groupIndex === 0 ? "pb-2" : "pt-6 pb-2"}`}
          >
            {group.label}
          </h3>
          {group.items.map((item) => {
            let domain: string | null = null;
            if (item.source_url) {
              try {
                domain = new URL(item.source_url).hostname.replace("www.", "");
              } catch {
                // Malformed URL — skip domain display
              }
            }

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => handleOpen(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpen(item);
                  }
                }}
                className={`group -mx-3 flex items-center justify-between rounded-xl px-3 py-3.5 cursor-pointer outline-none hover:bg-stone-200/60 dark:hover:bg-stone-700/35 focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] focus-visible:ring-offset-2 ${menuOpenId === item.id ? "bg-stone-200/60 dark:bg-stone-700/35" : ""}`}
              >
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  {domain && (
                    <Image
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                      alt=""
                      width={16}
                      height={16}
                      unoptimized
                      className="shrink-0 rounded-sm"
                    />
                  )}
                  <div className="min-w-0 flex items-baseline">
                    <span className="truncate font-serif text-base font-semibold leading-snug text-stone-900 dark:text-stone-50">
                      {item.recipe.title}
                    </span>
                    {domain && (
                      <span className="ml-2 shrink-0 font-sans text-[13px] text-stone-400 dark:text-stone-500">
                        {domain}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center ml-4">
                  <DropdownMenu onOpenChange={(open) => setMenuOpenId(open ? item.id : null)}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-stone-400 dark:text-stone-500 hover:bg-stone-300 dark:hover:bg-stone-600 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                        aria-label="More actions"
                        suppressHydrationWarning
                      >
                        <MenuDots className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700"
                    >
                      <DropdownMenuItem
                        onSelect={() => handleOpen(item)}
                        className="text-stone-700 dark:text-stone-300 focus:bg-stone-100 dark:focus:bg-stone-800 focus:text-stone-900 dark:focus:text-stone-50"
                      >
                        Open recipe
                        <Book className="ml-auto h-4 w-4" />
                      </DropdownMenuItem>
                      {item.source_url && (
                        <DropdownMenuItem
                          onSelect={() => window.open(item.source_url!, "_blank", "noopener")}
                          className="text-stone-700 dark:text-stone-300 focus:bg-stone-100 dark:focus:bg-stone-800 focus:text-stone-900 dark:focus:text-stone-50"
                        >
                          Open original
                          <LinkSquare className="ml-auto h-4 w-4" />
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-stone-200 dark:bg-stone-700" />
                      <DropdownMenuItem
                        onSelect={() => handleDelete(item.id)}
                        className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950 focus:text-red-700 dark:focus:text-red-300"
                      >
                        Delete
                        <TrashBinMinimalistic className="ml-auto h-4 w-4" />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <Link
        href="/"
        className="-mx-3 flex items-center gap-3 rounded-xl px-3 py-3.5 text-stone-400 dark:text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-700/35 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        <span className="font-sans text-[13px]">Add Recipe</span>
      </Link>
    </div>
  );
}

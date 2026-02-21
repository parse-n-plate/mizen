"use client";

import { useRouter } from "next/navigation";
import { useRecipe } from "@/context/RecipeContext";
import type { HistoryEntry } from "@/context/RecipeContext";

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `${hrs} hr${hrs > 1 ? "s" : ""} ${mins} mins`;
}

export function RecentRecipes() {
  const { history, setRecipe } = useRecipe();
  const router = useRouter();

  if (history.length === 0) return null;

  const handleClick = (entry: HistoryEntry) => {
    setRecipe(entry.recipe);
    router.push("/recipe");
  };

  return (
    <section className="page-fade-in-up page-fade-delay-3 w-full max-w-2xl">
      <div className="mb-4">
        <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">
          Recent Recipes
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {history.map((entry) => {
          const time =
            entry.recipe.totalTimeMinutes ||
            ((entry.recipe.prepTimeMinutes || 0) +
              (entry.recipe.cookTimeMinutes || 0)) ||
            null;

          return (
            <button
              key={entry.parsedAt}
              onClick={() => handleClick(entry)}
              className="flex min-w-[180px] max-w-[220px] shrink-0 flex-col gap-1.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-[var(--color-white)] px-4 py-4 text-left transition-colors hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              <p className="w-full truncate font-sans text-[15px] font-medium text-stone-900 dark:text-stone-100">
                {entry.recipe.title}
              </p>
              {time ? (
                <p className="font-sans text-sm text-stone-500 dark:text-stone-400">
                  {formatTime(time)}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

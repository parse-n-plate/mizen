"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRecipe } from "@/context/RecipeContext";
import type { HistoryEntry } from "@/context/RecipeContext";
import AltArrowDown from "@solar-icons/react/csr/arrows/AltArrowDown";

const COLLAPSED_COUNT = 3;

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `${hrs} hr${hrs > 1 ? "s" : ""} ${mins} mins`;
}

function RecipeRow({ entry, onClick }: { entry: HistoryEntry; onClick: () => void }) {
  const time =
    entry.recipe.totalTimeMinutes ||
    (entry.recipe.prepTimeMinutes || 0) + (entry.recipe.cookTimeMinutes || 0) ||
    null;

  return (
    <button
      onClick={onClick}
      className="press-scale -mx-3 flex items-baseline justify-between gap-4 rounded-xl px-3 py-2.5 text-left transition hover:bg-stone-200/60 dark:hover:bg-stone-700/35"
    >
      <p className="truncate font-sans text-[15px] font-medium text-stone-900 dark:text-stone-100">
        {entry.recipe.title}
      </p>
      {time ? (
        <p className="shrink-0 font-sans text-sm text-stone-400 dark:text-stone-500">
          {formatTime(time)}
        </p>
      ) : null}
    </button>
  );
}

export function RecentRecipes() {
  const { history, setRecipe } = useRecipe();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  if (history.length === 0) return null;

  const canExpand = history.length > COLLAPSED_COUNT;
  const hiddenCount = history.length - COLLAPSED_COUNT;

  const handleClick = (entry: HistoryEntry) => {
    setRecipe(entry.recipe);
    router.push("/recipe");
  };

  return (
    <section className="w-full max-w-3xl">
      <div className="mb-4">
        <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">
          Recent Recipes
        </h2>
      </div>

      <div className="flex flex-col">
        {history.slice(0, COLLAPSED_COUNT).map((entry) => (
          <RecipeRow key={entry.parsedAt} entry={entry} onClick={() => handleClick(entry)} />
        ))}

        {canExpand && (
          <>
            <div
              className="-mx-3 grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
              style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
            >
              <div className="flex flex-col overflow-hidden px-3">
                {history.slice(COLLAPSED_COUNT).map((entry) => (
                  <RecipeRow
                    key={entry.parsedAt}
                    entry={entry}
                    onClick={() => handleClick(entry)}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="press-scale -mx-3 mt-1 flex items-center gap-1.5 rounded-xl px-3 py-2 font-sans text-sm font-medium text-stone-400 dark:text-stone-500 transition hover:text-stone-600 dark:hover:text-stone-300"
            >
              <AltArrowDown
                size={14}
                className="transition-transform duration-200"
                style={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
              />
              {expanded ? "Show less" : `${hiddenCount} more`}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

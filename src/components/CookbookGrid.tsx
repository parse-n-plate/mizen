"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRecipe } from "@/context/RecipeContext";
import type { SavedRecipe } from "@/lib/types";

interface CookbookGridProps {
  initialRecipes: SavedRecipe[];
}

export function CookbookGrid({ initialRecipes }: CookbookGridProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const { setRecipe, setSavedMeta } = useRecipe();
  const router = useRouter();

  const handleClick = (item: SavedRecipe) => {
    setRecipe(item.recipe);
    setSavedMeta({ id: item.id, slug: item.slug });
    router.push("/recipe");
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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
          <svg
            className="h-7 w-7 text-[var(--color-orange)]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
          </svg>
        </div>
        <p className="mt-4 font-sans text-sm text-stone-400 dark:text-stone-500">
          No recipes saved yet
        </p>
        <p className="mt-1 font-sans text-xs text-stone-300 dark:text-stone-600">
          Parse a recipe and save it to build your cookbook
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((item) => (
        <CookbookCard
          key={item.id}
          item={item}
          onClick={() => handleClick(item)}
          onDelete={(e) => handleDelete(e, item.id)}
        />
      ))}
    </div>
  );
}

function CookbookCard({
  item,
  onClick,
  onDelete,
}: {
  item: SavedRecipe;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const { recipe, source_url, created_at } = item;

  const domain = source_url ? new URL(source_url).hostname.replace("www.", "") : null;

  const date = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(created_at));

  const timeLabel = recipe.totalTimeMinutes
    ? formatTime(recipe.totalTimeMinutes)
    : recipe.cookTimeMinutes
      ? formatTime(recipe.cookTimeMinutes)
      : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex flex-col rounded-2xl border border-stone-150 dark:border-stone-800 bg-[var(--color-white)] p-5 text-left transition-colors hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50/50 dark:hover:bg-stone-800/50 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] focus-visible:ring-offset-2 outline-none"
    >
      {/* Delete button */}
      <button
        type="button"
        onClick={onDelete}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-stone-300 dark:text-stone-600 opacity-0 transition-[color,background-color,opacity] hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-500 dark:hover:text-stone-400 group-hover:opacity-100 focus-visible:opacity-100"
        aria-label="Delete recipe"
      >
        <svg
          className="h-3.5 w-3.5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>

      {/* Title */}
      <h3 className="font-serif text-base font-semibold leading-snug pr-6 line-clamp-2">
        {recipe.title}
      </h3>

      {/* Meta row */}
      <div className="mt-auto pt-4 flex items-center gap-1.5 font-sans text-xs text-stone-400 dark:text-stone-500">
        {domain && (
          <>
            <span className="truncate max-w-[120px]">{domain}</span>
            <span>·</span>
          </>
        )}
        <span>{date}</span>
        {timeLabel && (
          <>
            <span>·</span>
            <span>{timeLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

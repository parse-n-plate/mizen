"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRecipe } from "@/context/RecipeContext";
import type { SavedRecipe } from "@/lib/types";

interface RecipeCardProps {
  item: SavedRecipe;
  onDelete: (id: string) => void;
}

export function RecipeCard({ item, onDelete }: RecipeCardProps) {
  const { setRecipe, setSavedMeta } = useRecipe();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleClick = () => {
    setRecipe(item.recipe);
    setSavedMeta({ id: item.id, slug: item.slug });
    router.push("/recipe");
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(item.id);
      }
    } catch {
      // Silent fail
    } finally {
      setDeleting(false);
    }
  };

  const domain = item.source_url ? new URL(item.source_url).hostname.replace("www.", "") : null;

  const date = new Date(item.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={handleClick}
      className="group flex w-full items-center justify-between rounded-xl border border-stone-100 dark:border-stone-800 px-4 py-3 text-left transition-colors hover:border-stone-200 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-base font-semibold">{item.recipe.title}</p>
        <p className="mt-0.5 font-sans text-xs text-stone-400 dark:text-stone-500">
          {domain && <span>{domain}</span>}
          {domain && " · "}
          {date}
        </p>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="ml-3 flex-shrink-0 rounded-lg p-1.5 text-stone-300 dark:text-stone-600 opacity-0 transition-[color,background-color,opacity] hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-500 dark:hover:text-stone-400 group-hover:opacity-100"
        aria-label="Delete recipe"
      >
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>
    </button>
  );
}

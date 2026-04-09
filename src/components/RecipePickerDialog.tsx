"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Magnifer from "@solar-icons/react/csr/search/Magnifer";
import type { SavedRecipe } from "@/lib/types";

interface RecipePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (recipe: SavedRecipe) => void;
}

export function RecipePickerDialog({ open, onOpenChange, onSelect }: RecipePickerDialogProps) {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recipes");
      const data = await res.json();
      if (Array.isArray(data)) setRecipes(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchRecipes();
  }, [open, fetchRecipes]);

  const filtered = search.trim()
    ? recipes.filter((r) => r.recipe.title.toLowerCase().includes(search.toLowerCase()))
    : recipes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-serif text-lg">Choose a recipe</DialogTitle>
          <DialogDescription className="sr-only">
            Select a saved recipe to add to your meal plan
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 px-2.5 py-2 focus-within:border-stone-400 dark:focus-within:border-stone-500 transition-colors">
            <Magnifer size={15} className="text-stone-400 dark:text-stone-500 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes..."
              className="flex-1 bg-transparent font-sans text-sm text-stone-700 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none"
            />
          </div>
        </div>

        {/* Recipe list */}
        <div className="flex-1 overflow-y-auto px-2 pb-3 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center font-sans text-sm text-stone-400 dark:text-stone-500">
              {search.trim() ? "No recipes match your search" : "No saved recipes yet"}
            </p>
          ) : (
            <div className="flex flex-col gap-px">
              {filtered.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => {
                    onSelect(recipe);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-none",
                    "hover:bg-stone-100 dark:hover:bg-stone-800/50"
                  )}
                >
                  {recipe.recipe.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={recipe.recipe.imageUrl}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-stone-100 dark:bg-stone-800 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
                      {recipe.recipe.title}
                    </p>
                    {recipe.recipe.totalTimeMinutes && (
                      <p className="font-sans text-xs text-stone-400 dark:text-stone-500">
                        {recipe.recipe.totalTimeMinutes} min
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

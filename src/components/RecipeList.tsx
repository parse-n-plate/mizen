"use client";

import { useState } from "react";
import { RecipeCard } from "@/components/RecipeCard";
import type { SavedRecipe } from "@/lib/types";

interface RecipeListProps {
  initialRecipes: SavedRecipe[];
}

export function RecipeList({ initialRecipes }: RecipeListProps) {
  const [recipes, setRecipes] = useState(initialRecipes);

  const handleDelete = (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  if (recipes.length === 0) {
    return (
      <p className="mt-3 font-sans text-sm text-stone-400 dark:text-stone-500">
        No saved recipes yet.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {recipes.map((item) => (
        <RecipeCard key={item.id} item={item} onDelete={handleDelete} />
      ))}
    </div>
  );
}

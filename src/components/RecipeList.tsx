"use client";

import { EmptyState } from "@/components/EmptyState";

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

  if (recipes.length === 0) return <EmptyState variant="recipes" />;

  return (
    <div className="mt-3 space-y-2">
      {recipes.map((item) => (
        <RecipeCard key={item.id} item={item} onDelete={handleDelete} />
      ))}
    </div>
  );
}

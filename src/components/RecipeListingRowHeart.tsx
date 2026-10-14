import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Wrapper for HeartButton on recipe listing rows (home + meal plan). */
export function recipeListingRowHeartSlotClass(isFavorite: boolean, className?: string) {
  return cn(
    "recipe-listing-row-heart-slot",
    !isFavorite && "recipe-listing-row-heart-slot--hover-only",
    className
  );
}

interface RecipeListingRowHeartProps {
  isFavorite: boolean;
  className?: string;
  children: ReactNode;
}

export function RecipeListingRowHeart({
  isFavorite,
  className,
  children,
}: RecipeListingRowHeartProps) {
  return (
    <div
      className={recipeListingRowHeartSlotClass(isFavorite, className)}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  );
}

import type { ReactNode } from "react";
import Heart from "@solar-icons/react/csr/like/Heart";
import { cn } from "@/lib/utils";

/** Wrapper for HeartButton on recipe listing rows (home + meal plan). */
export function recipeListingRowHeartSlotClass(isFavorite: boolean, className?: string) {
  return cn(
    "recipe-listing-row-heart-slot recipe-listing-row-heart-slot--desktop-interactive",
    !isFavorite && "recipe-listing-row-heart-slot--hover-only",
    className
  );
}

/** Favorite via row ⋯ menu on touch / coarse pointer (matches @media in globals.css). */
export const recipeListingRowTouchMenuItemClass = "recipe-listing-row-touch-only";

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
    <>
      {isFavorite ? (
        <span
          className="recipe-listing-row-favorite-indicator mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center text-red-500 dark:text-red-400"
          aria-hidden="true"
        >
          <Heart size={16} weight="Bold" className="shrink-0" />
        </span>
      ) : null}
      <div
        className={recipeListingRowHeartSlotClass(isFavorite, className)}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}

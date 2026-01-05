'use client';

import { useState } from 'react';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useRouter } from 'next/navigation';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * HomepageRecentRecipes Component
 * 
 * Displays recent recipes as a vertical list under the search bar.
 * Each recipe shows: name, preparation time pill, and bookmark icon.
 * Based on Figma design - clean, minimal vertical list.
 */
export default function HomepageRecentRecipes() {
  const { recentRecipes, getRecipeById, removeRecipe, clearRecipes, isBookmarked, toggleBookmark } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);

  // Determine which recipes to display
  // Show 5 by default, or all if showAll is true
  const displayRecipes = showAll ? recentRecipes : recentRecipes.slice(0, 5);
  const hasMoreThanFive = recentRecipes.length > 5;

  // Format time display (e.g., "35m", "3h 30m", "48m")
  const formatTime = (minutes?: number): string => {
    if (!minutes) return '';
    
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  };

  // Get time to display (prefer totalTime, then prepTime + cookTime, then prepTime or cookTime)
  const getDisplayTime = (recipe: typeof recentRecipes[0]): string => {
    if (recipe.totalTimeMinutes) {
      return formatTime(recipe.totalTimeMinutes);
    }
    
    if (recipe.prepTimeMinutes && recipe.cookTimeMinutes) {
      return formatTime(recipe.prepTimeMinutes + recipe.cookTimeMinutes);
    }
    
    if (recipe.prepTimeMinutes) {
      return formatTime(recipe.prepTimeMinutes);
    }
    
    if (recipe.cookTimeMinutes) {
      return formatTime(recipe.cookTimeMinutes);
    }
    
    return '';
  };

  // Handle recipe click - navigate to parsed recipe page
  const handleRecipeClick = (recipeId: string) => {
    try {
      const fullRecipe = getRecipeById(recipeId);
      if (fullRecipe && fullRecipe.ingredients && fullRecipe.instructions) {
        setParsedRecipe({
          title: fullRecipe.title,
          ingredients: fullRecipe.ingredients,
          instructions: fullRecipe.instructions,
          author: fullRecipe.author,
          sourceUrl: fullRecipe.sourceUrl || fullRecipe.url,
          summary: fullRecipe.description || fullRecipe.summary,
          cuisine: fullRecipe.cuisine,
          imageData: fullRecipe.imageData, // Include image data if available (for uploaded images)
          imageFilename: fullRecipe.imageFilename, // Include image filename if available
          prepTimeMinutes: fullRecipe.prepTimeMinutes, // Include prep time if available
          cookTimeMinutes: fullRecipe.cookTimeMinutes, // Include cook time if available
          totalTimeMinutes: fullRecipe.totalTimeMinutes, // Include total time if available
          servings: fullRecipe.servings, // Include servings if available
        });
        router.push('/parsed-recipe-page');
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    }
  };

  // Handle bookmark toggle - shows confirmation dialog if currently bookmarked
  const handleBookmarkToggle = (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation(); // Prevent triggering the recipe click
    
    // Check if recipe is currently bookmarked
    const isCurrentlyBookmarked = isBookmarked(recipeId);
    
    if (isCurrentlyBookmarked) {
      // If bookmarked, show confirmation dialog
      const confirmed = window.confirm(
        'Are you sure you want to remove this recipe from your bookmarks? You can bookmark it again later.'
      );
      
      if (confirmed) {
        toggleBookmark(recipeId);
      }
    } else {
      // If not bookmarked, just add the bookmark directly
      toggleBookmark(recipeId);
    }
  };

  // Handle individual recipe deletion
  const handleDeleteRecipe = (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation(); // Prevent triggering the recipe click
    
    // Show confirmation dialog before deleting
    const confirmed = window.confirm(
      'Are you sure you want to delete this recipe? This action cannot be undone.'
    );

    if (confirmed) {
      // Remove recipe from storage and context
      // Note: If recipe was bookmarked, it will be removed from bookmarks automatically
      // when the recipe is deleted (bookmarks reference recipe IDs that no longer exist)
      removeRecipe(recipeId);
    }
  };

  // Handle clearing all recipes
  const handleClearAll = () => {
    // Show confirmation dialog before clearing
    const confirmed = window.confirm(
      'Are you sure you want to clear all recent recipes? This action cannot be undone.'
    );

    if (confirmed) {
      // Clear all recipes from storage and context
      // Note: Bookmarks will remain, but they'll reference recipes that no longer exist
      // This is intentional - bookmarks persist independently
      clearRecipes();
    }
  };

  // Don't render if no recipes
  if (displayRecipes.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Section Title and Clear All Button */}
      <div className="flex items-center justify-between mb-4 pl-4 group">
        <h2 className="font-albert text-base text-stone-500 text-left font-medium">
          Recent Recipes
        </h2>
        {displayRecipes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="font-albert text-xs text-stone-500 hover:text-stone-700 mr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Recipe List */}
      <div className="space-y-3">
        {displayRecipes.map((recipe) => {
          const isBookmarkedState = isBookmarked(recipe.id);
          const displayTime = getDisplayTime(recipe);

          return (
            <div
              key={recipe.id}
              className="
                w-full flex items-center justify-between
                py-2 pr-2
                hover:bg-stone-50 rounded-lg
                transition-colors duration-200
                group
              "
            >
              {/* Left: Bookmark Icon (always visible), Recipe Name and Time */}
              <div className="flex items-center gap-3 flex-1 min-w-0 pl-4">
                {/* Bookmark Icon - Always visible */}
                <button
                  onClick={(e) => handleBookmarkToggle(e, recipe.id)}
                  className="
                    flex-shrink-0 p-1
                    rounded-full
                    transition-colors duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-1
                  "
                  aria-label={isBookmarkedState ? 'Remove bookmark' : 'Bookmark recipe'}
                >
                  <Bookmark
                    className={`
                      w-5 h-5 transition-colors duration-200
                      ${isBookmarkedState 
                        ? 'fill-[#78716C] text-[#78716C]' 
                        : 'fill-[#D6D3D1] text-[#D6D3D1] hover:fill-[#A8A29E] hover:text-[#A8A29E]'
                      }
                    `}
                  />
                </button>

                {/* Recipe Name and Time - Clickable */}
                <button
                  onClick={() => handleRecipeClick(recipe.id)}
                  className="
                    flex items-center gap-3 flex-1 min-w-0
                    text-left
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2 rounded-lg
                  "
                >
                  <span className="font-albert text-xl text-stone-800 text-left truncate" style={{ fontSize: '16px' }}>
                    {recipe.title}
                  </span>
                  {displayTime && (
                    <span className="
                      font-albert text-sm text-stone-600
                      bg-stone-100 px-2.5 py-1 rounded-full
                      flex-shrink-0
                    ">
                      {displayTime}
                    </span>
                  )}
                </button>
              </div>

              {/* Right: Delete Icon - Only visible on hover */}
              <div className="flex items-center gap-1 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {/* Delete Icon */}
                <button
                  onClick={(e) => handleDeleteRecipe(e, recipe.id)}
                  className="
                    flex-shrink-0 p-1
                    rounded-full
                    transition-colors duration-200
                    text-stone-400 hover:text-stone-600
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-1
                  "
                  aria-label="Delete recipe"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        
        {/* See More Button - Only shows if more than 5 recipes and not already showing all */}
        {hasMoreThanFive && !showAll && (
          <div className="pl-4 group">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="font-albert text-xs text-stone-500 hover:text-stone-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              See more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


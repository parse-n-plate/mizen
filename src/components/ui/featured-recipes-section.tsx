'use client';

import { getRecipesByCategory, MockRecipe } from '@/lib/mockRecipeData';
import RecipeCard from './recipe-card';
import PotIcon from './pot-icon';

interface FeaturedRecipesSectionProps {
  selectedCuisine: string;
}

/**
 * FeaturedRecipesSection Component
 * 
 * Displays featured recipes organized by cuisine category.
 * Shows a category header with icon and recipe cards in a grid layout.
 * 
 * Responsive design:
 * - Mobile: Single column
 * - Tablet: 2 columns
 * - Desktop: 3 columns
 * 
 * @param selectedCuisine - Currently selected cuisine category (empty string for "all")
 */
export default function FeaturedRecipesSection({
  selectedCuisine,
}: FeaturedRecipesSectionProps) {
  // Get recipes filtered by selected category
  const filteredRecipes = getRecipesByCategory(selectedCuisine);

  // Display category name or "All Recipes" if no category selected
  const displayCategory = selectedCuisine || 'All Recipes';

  // Category Icon - using pot/cooking icon from assets

  return (
    <div className="w-full space-y-6">
      {/* Category Header */}
      <div className="flex gap-2.5 items-center justify-start">
        <PotIcon />
        <h2 className="font-domine leading-[1.1] text-[24px] md:text-[32px] text-black">
          {displayCategory}
        </h2>
      </div>

      {/* Recipe Cards Grid - Using a 2-column grid for the new long rectangle layout */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRecipes.map((recipe) => (
            <RecipeCard 
              key={recipe.id} 
              recipe={{
                id: recipe.id,
                title: recipe.name,
                author: recipe.author,
                imageUrl: recipe.image,
                cuisine: [recipe.category]
              }} 
            />
          ))}
        </div>
      ) : (
        // Empty state when no recipes match the filter
        <div className="text-center py-12">
          <p className="font-albert text-[16px] text-stone-600">
            No recipes found in this category.
          </p>
        </div>
      )}
    </div>
  );
}


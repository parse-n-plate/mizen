import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function RecentRecipesList() {
  const { recentRecipes, getRecipeById, clearRecipes } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();

  // Get the 3 most recent recipes
  const displayRecipes = recentRecipes.slice(0, 3);

  // Handle clearing all recipes with confirmation
  const handleClearRecipes = () => {
    // Show confirmation dialog before clearing
    const confirmed = window.confirm(
      'Are you sure you want to clear all parsed recipes? This action cannot be undone.',
    );

    if (confirmed) {
      // Call the clearRecipes function from context
      clearRecipes();
    }
  };

  const handleRecipeClick = (recipeId: string) => {
    try {
      // Get the full recipe data from storage
      const fullRecipe = getRecipeById(recipeId);

      if (fullRecipe && fullRecipe.ingredients && fullRecipe.instructions) {
        // Load the recipe into the RecipeContext for the parsed recipe page
        setParsedRecipe({
          title: fullRecipe.title,
          ingredients: fullRecipe.ingredients,
          instructions: fullRecipe.instructions,
          author: fullRecipe.author, // Include author if available
          sourceUrl: fullRecipe.sourceUrl || fullRecipe.url, // Include source URL if available
          summary: fullRecipe.description || fullRecipe.summary, // Use AI summary if available, fallback to card summary
          cuisine: fullRecipe.cuisine, // Include cuisine tags if available
        });

        // Navigate to the parsed recipe page
        router.push('/parsed-recipe-page');
      } else {
        console.error('Recipe data not found or incomplete:', fullRecipe);
        // You could show an error message here if needed
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    }
  };

  if (displayRecipes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="font-albert text-[16px] text-[#757575]">
          No recent recipes yet.
        </p>
        <p className="font-albert text-[14px] text-[#757575] mt-2">
          Parse your first recipe to see it here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Recipe buttons */}
      <div className="flex flex-wrap gap-2">
        {displayRecipes.map((recipe) => (
          <button
            key={recipe.id}
            className="
              bg-black text-white font-albert text-[14.495px] leading-[23.889px]
              px-4 py-3 rounded-[26.842px] 
              hover:bg-gray-800 transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50
            "
            onClick={() => handleRecipeClick(recipe.id)}
          >
            {recipe.title}
          </button>
        ))}
      </div>

      {/* Clear All button - only show if there are recipes */}
      {recentRecipes.length > 0 && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearRecipes}
            className="font-albert text-[12px] text-[#757575] hover:text-[#1e1e1e]"
          >
            Clear all recipes
          </Button>
        </div>
      )}
    </div>
  );
}

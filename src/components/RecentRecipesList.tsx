import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useRouter } from 'next/navigation';

export default function RecentRecipesList() {
  const { recentRecipes, clearRecipes, getRecipeById } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();

  // Get the 3 most recent recipes
  const displayRecipes = recentRecipes.slice(0, 3);

  // Debug: Log the recipes to console
  console.log('RecentRecipesList - recentRecipes:', recentRecipes);
  console.log('RecentRecipesList - displayRecipes:', displayRecipes);

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

  const handleClearAll = () => {
    clearRecipes();
    console.log('All recent recipes cleared');
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
    <div className="space-y-2">
      {/* Debug: Clear All Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleClearAll}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-albert transition-colors"
        >
          🗑️ Clear All (Debug)
        </button>
      </div>

      {displayRecipes.map((recipe) => (
        <div
          key={recipe.id}
          className="bg-white rounded-lg border border-[#d9d9d9] p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleRecipeClick(recipe.id)}
        >
          <div className="space-y-2">
            <h3 className="font-albert text-[16px] text-[#1e1e1e] leading-[1.4]">
              {recipe.title}
            </h3>
            <p className="font-albert text-[16px] text-[#757575] leading-[1.4]">
              {recipe.summary}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useRouter } from 'next/navigation';

export default function RecentRecipesList() {
  const { recentRecipes, getRecipeById } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();

  // Get the 3 most recent recipes
  const displayRecipes = recentRecipes.slice(0, 3);

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
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParsedRecipes } from "@/contexts/ParsedRecipesContext";
import { formatRelativeTime } from "@/lib/utils";

export default function RecentRecipesList() {
  const { recentRecipes, clearRecipes } = useParsedRecipes();
  
  // Get the 3 most recent recipes
  const displayRecipes = recentRecipes.slice(0, 3);

  // Debug: Log the recipes to console
  console.log('RecentRecipesList - recentRecipes:', recentRecipes);
  console.log('RecentRecipesList - displayRecipes:', displayRecipes);

  if (displayRecipes.length === 0) {
    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Recipes</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No recent recipes yet.</p>
          <p className="text-gray-400 text-sm mt-2">
            Parse your first recipe to see it here!
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recent Recipes</h2>
        <Button
          onClick={clearRecipes}
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          Clear All
        </Button>
      </div>
      <div className="space-y-4">
        {displayRecipes.map((recipe) => (
          <Card key={recipe.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-bold text-gray-900">
                  {recipe.title}
                </CardTitle>
                <span className="text-sm text-gray-400 flex-shrink-0 ml-4">
                  {formatRelativeTime(recipe.parsedAt)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                {recipe.summary}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
} 
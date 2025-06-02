
import { useState } from 'react';

interface Recipe {
  title: string;
  image?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
  ingredients: string[];
  instructions: string[];
  source?: string;
}

export const useRecipeParser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseRecipe = async (url: string): Promise<Recipe | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // For now, we'll return mock data since we don't have a backend
      // In a real implementation, this would call a recipe parsing API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      // Mock recipe data for demonstration
      const mockRecipe: Recipe = {
        title: "Classic Chocolate Chip Cookies",
        image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&h=300&fit=crop",
        prepTime: "15 mins",
        cookTime: "10 mins",
        totalTime: "25 mins",
        servings: "24 cookies",
        ingredients: [
          "2¼ cups all-purpose flour",
          "1 tsp baking soda",
          "1 tsp salt",
          "1 cup butter, softened",
          "¾ cup granulated sugar",
          "¾ cup packed brown sugar",
          "2 large eggs",
          "2 tsp vanilla extract",
          "2 cups chocolate chips"
        ],
        instructions: [
          "Preheat oven to 375°F. Line baking sheets with parchment paper.",
          "In a medium bowl, whisk together flour, baking soda, and salt. Set aside.",
          "In a large bowl, cream together softened butter and both sugars until light and fluffy, about 3-4 minutes.",
          "Beat in eggs one at a time, then stir in vanilla extract.",
          "Gradually blend in the flour mixture until just combined.",
          "Fold in chocolate chips with a wooden spoon or spatula.",
          "Drop rounded tablespoons of dough onto prepared baking sheets, spacing 2 inches apart.",
          "Bake for 9-11 minutes or until golden brown around the edges.",
          "Cool on baking sheet for 2 minutes, then transfer to a wire rack to cool completely."
        ],
        source: url
      };

      return mockRecipe;
    } catch (err) {
      setError('Failed to parse recipe. Please check the URL and try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    parseRecipe,
    isLoading,
    error
  };
};

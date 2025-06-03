
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      console.log('Sending URL to parse-recipe function:', url);
      
      const { data, error: functionError } = await supabase.functions.invoke('parse-recipe', {
        body: { url }
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || 'Failed to parse recipe');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Parsed recipe data:', data);
      return data as Recipe;

    } catch (err) {
      console.error('Recipe parsing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse recipe. Please check the URL and try again.';
      setError(errorMessage);
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

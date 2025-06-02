
import React, { useState } from 'react';
import UrlInput from '@/components/UrlInput';
import RecipeDisplay from '@/components/RecipeDisplay';
import { useRecipeParser } from '@/hooks/useRecipeParser';
import { toast } from '@/hooks/use-toast';

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

const Index = () => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const { parseRecipe, isLoading, error } = useRecipeParser();

  const handleParseRecipe = async (url: string) => {
    console.log('Parsing recipe from URL:', url);
    
    const parsedRecipe = await parseRecipe(url);
    
    if (parsedRecipe) {
      setRecipe(parsedRecipe);
      toast({
        title: "Recipe parsed successfully!",
        description: "Your clean recipe is ready to view.",
      });
    } else if (error) {
      toast({
        title: "Failed to parse recipe",
        description: error,
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setRecipe(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {recipe ? (
        <RecipeDisplay recipe={recipe} onBack={handleBack} />
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <UrlInput onParseRecipe={handleParseRecipe} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
};

export default Index;

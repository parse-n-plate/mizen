
import React, { useState, useEffect } from 'react';
import UrlInput from '@/components/UrlInput';
import RecipeDisplay from '@/components/RecipeDisplay';
import RecentSearches from '@/components/RecentSearches';
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

interface RecentSearch {
  id: string;
  title: string;
  time: string;
  ingredients: number;
}

const Index = () => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const { parseRecipe, isLoading, error } = useRecipeParser();

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    } else {
      // Set default recent searches to match the design
      const defaultSearches = [
        { id: '1', title: 'Pesto Pasta', time: '45 minutes', ingredients: 5 },
        { id: '2', title: 'Shrimp Fried Rice', time: '20 minutes', ingredients: 3 },
        { id: '3', title: 'Red Velvet Cupcakes', time: '1 hour', ingredients: 10 }
      ];
      setRecentSearches(defaultSearches);
      localStorage.setItem('recentSearches', JSON.stringify(defaultSearches));
    }
  }, []);

  const handleParseRecipe = async (url: string) => {
    console.log('Parsing recipe from URL:', url);
    
    const parsedRecipe = await parseRecipe(url);
    
    if (parsedRecipe) {
      setRecipe(parsedRecipe);
      
      // Add to recent searches
      const newSearch: RecentSearch = {
        id: Date.now().toString(),
        title: parsedRecipe.title,
        time: parsedRecipe.totalTime || parsedRecipe.cookTime || 'Unknown time',
        ingredients: parsedRecipe.ingredients.length
      };
      
      const updatedSearches = [newSearch, ...recentSearches.slice(0, 2)];
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      
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
    <div className="min-h-screen bg-gray-50">
      {recipe ? (
        <RecipeDisplay recipe={recipe} onBack={handleBack} />
      ) : (
        <div className="min-h-screen">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-xl">🍽️</span>
                  </div>
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900">Parse & Plate</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="text-sm font-medium">📖 COOKBOOK</span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-4xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                What are you whipping up in your kitchen today?
              </h1>
              <p className="text-lg text-gray-500">
                Clean, ad-free recipes from any cooking website
              </p>
            </div>

            <UrlInput onParseRecipe={handleParseRecipe} isLoading={isLoading} />
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                Try with popular recipe sites like AllRecipes, Food Network, or Bon Appétit
              </p>
            </div>

            {recentSearches.length > 0 && (
              <RecentSearches searches={recentSearches} />
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default Index;

'use client';

import HomepageSkeleton from '@/components/ui/homepage-skeleton';
import CuisinePills from '@/components/ui/cuisine-pills';
import RecipeCard, { RecipeCardData } from '@/components/ui/recipe-card';
import Footer from '@/components/ui/footer';
import { useState, useEffect, Suspense } from 'react';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useRouter } from 'next/navigation';
import type { CuisineType } from '@/components/ui/cuisine-pills';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

// Placeholder recipe data matching the prototype
const PLACEHOLDER_RECIPES: RecipeCardData[] = [
  {
    id: '1',
    title: 'Beef Udon',
    author: 'Namiko Hirasawa Chen',
    cuisine: 'Asian',
  },
  {
    id: '2',
    title: 'Garlic Shrimp Ramen',
    author: 'Cameron Tillman',
    cuisine: 'Asian',
  },
  {
    id: '3',
    title: 'Mushroom Risotto',
    author: 'Darrell Schroeder',
    cuisine: 'Italian',
  },
  {
    id: '4',
    title: 'Chicken Tikka Masala',
    author: 'Priya Sharma',
    cuisine: 'Indian',
  },
  {
    id: '5',
    title: 'Coq au Vin',
    author: 'Jean-Pierre Dubois',
    cuisine: 'French',
  },
  {
    id: '6',
    title: 'Tacos al Pastor',
    author: 'Maria Rodriguez',
    cuisine: 'Mexican',
  },
  {
    id: '7',
    title: 'Pad Thai',
    author: 'Somsak Wong',
    cuisine: 'Asian',
  },
  {
    id: '8',
    title: 'Margherita Pizza',
    author: 'Giuseppe Rossi',
    cuisine: 'Italian',
  },
  {
    id: '9',
    title: 'Bibimbap',
    author: 'Kim Soo-jin',
    cuisine: 'Korean',
  },
];

function HomeContent() {
  const { isLoaded, recentRecipes, getRecipeById, clearRecipes } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType>('Asian');
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeCardData[]>([]);

  // Filter recipes based on selected cuisine
  useEffect(() => {
    if (selectedCuisine === 'All' || selectedCuisine === 'More 12+') {
      setFilteredRecipes(PLACEHOLDER_RECIPES);
    } else {
      const filtered = PLACEHOLDER_RECIPES.filter(
        (recipe) => recipe.cuisine === selectedCuisine,
      );
      setFilteredRecipes(filtered);
    }
  }, [selectedCuisine]);

  // Initialize filtered recipes on mount
  useEffect(() => {
    setFilteredRecipes(
      PLACEHOLDER_RECIPES.filter((recipe) => recipe.cuisine === 'Asian'),
    );
  }, []);

  const handleCuisineChange = (cuisine: CuisineType) => {
    setSelectedCuisine(cuisine);
  };

  // Handler for clearing all recipes with confirmation
  const handleClearRecipes = () => {
    // Show confirmation dialog before clearing
    const confirmed = window.confirm(
      'Are you sure you want to clear all recent recipes? This action cannot be undone.',
    );

    if (confirmed) {
      // Call the clearRecipes function from context
      clearRecipes();
    }
  };

  // Handle recent recipe click - navigate to parsed recipe page
  const handleRecentRecipeClick = (recipeId: string) => {
    try {
      const fullRecipe = getRecipeById(recipeId);
      if (fullRecipe && fullRecipe.ingredients && fullRecipe.instructions) {
        setParsedRecipe({
          title: fullRecipe.title,
          ingredients: fullRecipe.ingredients,
          instructions: fullRecipe.instructions,
          author: fullRecipe.author, // Include author if available
          sourceUrl: fullRecipe.sourceUrl || fullRecipe.url, // Include source URL if available
        });
        router.push('/parsed-recipe-page');
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    }
  };

  // Convert ParsedRecipe to RecipeCardData format
  const convertToRecipeCardData = (recipe: typeof recentRecipes[0]): RecipeCardData => {
    // Extract domain name from URL as a simple "author" placeholder
    let author = 'Recipe';
    try {
      if (recipe.url) {
        const urlObj = new URL(recipe.url);
        author = urlObj.hostname.replace('www.', '').split('.')[0];
        // Capitalize first letter
        author = author.charAt(0).toUpperCase() + author.slice(1);
      }
    } catch {
      // If URL parsing fails, use default
    }

    return {
      id: recipe.id,
      title: recipe.title,
      author: author,
      imageUrl: undefined, // Recent recipes don't have images
      cuisine: undefined,
    };
  };

  // Get recent recipes for display (limit to 6 most recent)
  const displayRecentRecipes = recentRecipes.slice(0, 6).map(convertToRecipeCardData);

  if (!isLoaded) {
    return <HomepageSkeleton />;
  }

  return (
    <div className="bg-stone-50 min-h-screen relative flex flex-col">

      <div className="transition-opacity duration-300 ease-in-out opacity-100 relative z-10 flex-1">
        {/* Main Content Container */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-8">
          {/* Hero Section */}
          <div className="mb-10 md:mb-12">
            <div className="text-center mb-6">
              {/* App Name */}
              <p className="font-domine text-[24px] font-normal text-black leading-[1.1] mb-6">
                Parse & Plate
              </p>
              <h1 className="font-domine text-[64px] font-normal text-black leading-[1.1] mb-3">
                Clean recipes,
                <br />
                fast cooking.
              </h1>
              <p className="font-albert text-[14px] text-stone-900 leading-[1.4] max-w-2xl mx-auto">
                Spend less time on ad-filled recipes and more time cooking.
              </p>
            </div>
          </div>

          {/* Cuisine Filter Pills */}
          <div className="mb-6 md:mb-8">
            <CuisinePills onCuisineChange={handleCuisineChange} />
          </div>

          {/* Recent Recipes Section */}
          {displayRecentRecipes.length > 0 && (
            <div className="mb-8 md:mb-12">
              <div className="mb-4 md:mb-6">
                {/* Header with title and Clear All button */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-domine text-[24px] font-normal text-black leading-[1.1]">
                    Recent Recipes
                  </h2>
                  {/* Clear All button - positioned to the right */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearRecipes}
                    className="flex items-center gap-2 font-albert text-[12px] text-[#757575] hover:text-[#1e1e1e]"
                    aria-label="Clear all recent recipes"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear All</span>
                  </Button>
                </div>
                <p className="font-albert text-[14px] text-stone-600 leading-[1.4]">
                  Your recently parsed recipes
                </p>
              </div>

              {/* Recent Recipe Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayRecentRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => handleRecentRecipeClick(recipe.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Trending Recipes Section */}
          <div className="mb-8 md:mb-12">
            <div className="mb-4 md:mb-6">
              <h2 className="font-domine text-[24px] font-normal text-black leading-[1.1] mb-3">
                Trending Recipes
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl">🍅</span>
                <h3 className="font-domine text-[32px] font-normal text-black leading-[1.1]">
                  {selectedCuisine}
                </h3>
              </div>
            </div>

            {/* Recipe Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>

            {/* Show message if no recipes match filter */}
            {filteredRecipes.length === 0 && (
              <div className="text-center py-12">
                <p className="font-albert text-[16px] text-stone-600">
                  No recipes found for {selectedCuisine}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomepageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

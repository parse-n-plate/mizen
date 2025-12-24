'use client';

import HomepageSkeleton from '@/components/ui/homepage-skeleton';
import CuisinePills from '@/components/ui/cuisine-pills';
import RecipeCard, { RecipeCardData } from '@/components/ui/recipe-card';
import { useState, useEffect, Suspense, use } from 'react';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useAdminSettings } from '@/contexts/AdminSettingsContext';
import { useRouter } from 'next/navigation';
import type { CuisineType } from '@/components/ui/cuisine-pills';
import { Button } from '@/components/ui/button';
import { Trash2, Link as LinkIcon, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { useCommandK } from '@/contexts/CommandKContext';

// Placeholder recipe data matching the prototype
const PLACEHOLDER_RECIPES: RecipeCardData[] = [
  {
    id: '1',
    title: 'Beef Udon',
    author: 'Namiko Hirasawa Chen',
    cuisine: 'Asian',
    // Use the beef udon placeholder image so the card reflects the recipe
    imageUrl: '/assets/recipeImagePlaceholders/Image (Beef Udon).webp',
  },
  {
    id: '2',
    title: 'Garlic Shrimp Ramen',
    author: 'Cameron Tillman',
    cuisine: 'Asian',
    // Match the ramen card with its placeholder image
    imageUrl: '/assets/recipeImagePlaceholders/Image (Garlic Shrimp Ramen).webp',
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
    // Pair the Pad Thai card with the Pad Thai placeholder image
    imageUrl: '/assets/recipeImagePlaceholders/Image (Pad Thai).webp',
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
  const {
    isLoaded,
    recentRecipes,
    getRecipeById,
    clearRecipes,
    removeRecipe,
  } = useParsedRecipes();
  const { settings } = useAdminSettings();
  const { setParsedRecipe } = useRecipe();
  const { open: openCommandK } = useCommandK();
  const router = useRouter();
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType>('Asian');
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeCardData[]>([]);
  const [keyboardShortcut, setKeyboardShortcut] = useState<string>('⌘K');
  
  // Detect platform for keyboard shortcut display (client-side only to avoid hydration issues)
  useEffect(() => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    setKeyboardShortcut(isMac ? '⌘K' : 'Ctrl+K');
  }, []);

  // Filter recipes based on selected cuisine
  useEffect(() => {
    if (selectedCuisine === 'All') {
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
          summary: fullRecipe.description || fullRecipe.summary, // Use AI summary if available, fallback to card summary
        });
        router.push('/parsed-recipe-page');
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    }
  };

  const handleRemoveRecentRecipe = (recipeId: string) => {
    removeRecipe(recipeId);
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
      imageUrl: recipe.imageUrl, // Optional image support when available
      cuisine: undefined,
    };
  };

  // Get recent recipes for display (limit to 6 most recent)
  const displayRecentRecipes = recentRecipes.slice(0, 6).map(convertToRecipeCardData);

  if (!isLoaded) {
    return <HomepageSkeleton />;
  }

  return (
    <div className="bg-white min-h-screen relative flex flex-col">

      <div className="transition-opacity duration-300 ease-in-out opacity-100 relative z-10 flex-1">
        {/* Main Content Container */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-12 md:pb-16 flex flex-col gap-16 md:gap-20">
          {/* Hero Section */}
          <div className="text-center space-y-5 md:space-y-6">
              <h1 className="font-domine text-[48px] md:text-[56px] font-normal text-black leading-[1.05]">
                Clean recipes, fast cooking.
              </h1>
              <>
    <p className="font-albert text-[16px] md:text-[17px] text-stone-600 leading-[1.6] max-w-2xl mx-auto">
        No distractions. No clutter. Just clear, elegant recipes designed<span className="responsive-break"></span> for people who love to cook.
    </p>
</>

              
              {/* Command K Search Bar - Opens Command K modal */}
              <div className="max-w-lg mx-auto mt-8 md:mt-10">
                <button
                  onClick={openCommandK}
                  className="w-full bg-stone-100 rounded-lg border border-[#d9d9d9] 
                    transition-all duration-300 ease-in-out
                    hover:border-[#4F46E5] hover:border-opacity-80
                    focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-opacity-50"
                >
                  <div className="flex items-center px-4 py-3 relative">
                    <LinkIcon className="w-5 h-5 text-stone-600 flex-shrink-0" />
                    <div className="flex-1 ml-3 text-left">
                      <span className="font-albert text-[14px] text-stone-500">
                        Enter a recipe URL
                      </span>
                    </div>
                    <div className="ml-2 flex items-center gap-1 text-stone-400">
                      <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-albert border border-stone-300 rounded bg-white text-stone-600">
                        {keyboardShortcut}
                      </kbd>
                    </div>
                  </div>
                </button>
              </div>
          </div>

          {/* Recent Recipes Section */}
          {displayRecentRecipes.length > 0 && (
            <div className="space-y-8 md:space-y-10">
              <div className="space-y-4 md:space-y-5">
                {/* Header with title and Clear All button */}
                <div className="flex items-center justify-between">
                  <h2 className="font-domine text-[28px] md:text-[36px] font-normal text-black leading-[1.1] tracking-tight">
                    Recent Recipes
                  </h2>
                  {/* Clear All button - positioned to the right */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearRecipes}
                    className="flex items-center gap-2 font-albert text-[14px] text-[#757575] hover:text-[#1e1e1e]"
                    aria-label="Clear all recent recipes"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear All</span>
                  </Button>
                </div>
                <p className="font-albert text-[15px] md:text-[16px] text-stone-500 leading-[1.5]">
                  Fresh pulls from your kitchen queue
                </p>
              </div>

              {/* Recent Recipe Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayRecentRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    showImage={settings.showRecentRecipeImages}
                    onClick={() => handleRecentRecipeClick(recipe.id)}
                    showDelete
                    onDelete={() => handleRemoveRecentRecipe(recipe.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Trending Recipes Section */}
          <div className="space-y-8 md:space-y-10">
            <div className="space-y-4 md:space-y-5">
              <h2 className="font-domine text-[28px] md:text-[36px] font-normal text-black leading-[1.1] tracking-tight">
                Trending Recipes
              </h2>
            </div>

            {/* Cuisine Filter Pills now sit below the Trending header */}
            <div className="mb-6 md:mb-8">
              <CuisinePills onCuisineChange={handleCuisineChange} />
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
    </div>
  );
}

export default function Home({
  params,
  searchParams,
}: {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
} = {} as any) {
  // For Next.js 15: Unwrap params/searchParams if provided to prevent enumeration warnings
  // This prevents React DevTools/error serialization from enumerating these props
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (params) use(params);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (searchParams) use(searchParams);
  
  return (
    <Suspense fallback={<HomepageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

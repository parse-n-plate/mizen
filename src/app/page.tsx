'use client';

import HomepageSkeleton from '@/components/ui/homepage-skeleton';
import CuisinePills from '@/components/ui/cuisine-pills';
import RecipeCard, { RecipeCardData } from '@/components/ui/recipe-card';
import HomepageSearch from '@/components/ui/homepage-search';
import HomepageRecentRecipes from '@/components/ui/homepage-recent-recipes';
import HomepageBanner from '@/components/ui/homepage-banner';
import { useState, useEffect, useMemo, Suspense, use } from 'react';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useRouter } from 'next/navigation';
import type { CuisineType } from '@/components/ui/cuisine-pills';
import Image from 'next/image';
import { CUISINE_ICON_MAP } from '@/config/cuisineConfig';

function HomeContent() {
  const {
    isLoaded,
    recentRecipes,
    getBookmarkedRecipes,
    getRecipeById,
  } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType>('All');
  const [isPageLoaded, setIsPageLoaded] = useState<boolean>(false);

  // Trigger onload animation when component mounts and data is loaded
  useEffect(() => {
    if (isLoaded) {
      // Small delay to ensure smooth animation start
      const timer = setTimeout(() => {
        setIsPageLoaded(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  const handleCuisineChange = (cuisine: CuisineType) => {
    setSelectedCuisine(cuisine);
  };

  // Handle recipe click - navigate to parsed recipe page
  const handleRecipeClick = (recipeId: string) => {
    try {
      const fullRecipe = getRecipeById(recipeId);
      if (fullRecipe && fullRecipe.ingredients && fullRecipe.instructions) {
        setParsedRecipe({
          title: fullRecipe.title,
          ingredients: fullRecipe.ingredients,
          instructions: fullRecipe.instructions,
          author: fullRecipe.author,
          sourceUrl: fullRecipe.sourceUrl || fullRecipe.url,
          summary: fullRecipe.description || fullRecipe.summary,
          cuisine: fullRecipe.cuisine,
          imageData: fullRecipe.imageData, // Include image data if available (for uploaded images)
          imageFilename: fullRecipe.imageFilename, // Include image filename if available
          prepTimeMinutes: fullRecipe.prepTimeMinutes, // Include prep time if available
          cookTimeMinutes: fullRecipe.cookTimeMinutes, // Include cook time if available
          totalTimeMinutes: fullRecipe.totalTimeMinutes, // Include total time if available
        });
        router.push('/parsed-recipe-page');
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    }
  };

  // Convert ParsedRecipe to RecipeCardData format
  const convertToRecipeCardData = (recipe: typeof recentRecipes[0]): RecipeCardData => {
    // Use actual author from recipe data if available, try URL parsing as fallback
    // If no author is found, leave it undefined - the card component will handle the empty state
    let author: string | undefined = recipe.author;
    
    if (!author && recipe.url) {
      try {
        const urlObj = new URL(recipe.url);
        const extractedAuthor = urlObj.hostname.replace('www.', '').split('.')[0];
        // Capitalize first letter
        author = extractedAuthor.charAt(0).toUpperCase() + extractedAuthor.slice(1);
      } catch {
        // If URL parsing fails, author remains undefined
      }
    }

    return {
      id: recipe.id,
      title: recipe.title,
      author: author, // Can be undefined - card component handles empty state
      imageUrl: recipe.imageUrl, // Optional image support when available
      cuisine: recipe.cuisine, // Include cuisine tags if available
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      totalTimeMinutes: recipe.totalTimeMinutes,
    };
  };

  // Get bookmarked recipes for the Saved Recipes section
  const bookmarkedRecipes = useMemo(() => {
    return getBookmarkedRecipes().map(convertToRecipeCardData);
  }, [getBookmarkedRecipes]);

  // Filter bookmarked recipes by selected cuisine
  const filteredRecipes = useMemo(() => {
    console.log('[Homepage] 🍽️ Filtering bookmarked recipes by cuisine:', selectedCuisine);
    console.log('[Homepage] Available bookmarked recipes:', bookmarkedRecipes.map(r => ({ title: r.title, cuisine: r.cuisine })));
    
    if (selectedCuisine === 'All') {
      console.log('[Homepage] Showing all bookmarked recipes (All selected)');
      return bookmarkedRecipes;
    }
    
    const filtered = bookmarkedRecipes.filter(recipe => {
      const hasMatchingCuisine = recipe.cuisine && recipe.cuisine.includes(selectedCuisine);
      console.log(`[Homepage] Recipe "${recipe.title}": cuisine=${recipe.cuisine}, matches=${hasMatchingCuisine}`);
      return hasMatchingCuisine;
    });
    
    console.log('[Homepage] Filtered results:', filtered.length, 'bookmarked recipes match', selectedCuisine);
    return filtered;
  }, [selectedCuisine, bookmarkedRecipes]);

  if (!isLoaded) {
    return <HomepageSkeleton />;
  }

  return (
    <div className="bg-white min-h-screen relative flex flex-col">
      {/* Homepage Banner - Only on landing page */}
      <HomepageBanner />

      <div className="transition-opacity duration-300 ease-in-out opacity-100 relative z-10 flex-1">
        {/* Main Content Container */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-12 md:pb-16 flex flex-col gap-16 md:gap-20">
          {/* Hero Section */}
          <div className={`text-center space-y-5 md:space-y-6 ${isPageLoaded ? 'page-fade-in-up' : 'opacity-0'}`}>
              <h1 className="font-domine text-[57.6px] sm:text-[67.2px] md:text-[76.8px] font-bold text-black leading-[1.05] flex flex-col items-center justify-center gap-2 md:gap-3">
                <span className="flex items-center gap-2 md:gap-3">
                  Clean recipes,
                  <img 
                    src="/assets/Illustration Icons/Tomato_Icon.png" 
                    alt="" 
                    className="hidden md:block w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex-shrink-0 object-contain"
                    aria-hidden="true"
                  />
                </span>
                <span className="flex items-center gap-2 md:gap-3">
                  <img 
                    src="/assets/Illustration Icons/Pan_Icon.png" 
                    alt="" 
                    className="hidden md:block w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex-shrink-0 object-contain"
                    aria-hidden="true"
                  />
                  calm cooking.
                </span>
              </h1>
              <p className="font-albert text-[16px] sm:text-[18px] md:text-[20px] text-stone-600 leading-[1.6] max-w-2xl mx-auto">
                No distractions. No clutter. Just clear, elegant recipes<span className="responsive-break"></span> designed for people who love to cook.
              </p>
              
              {/* Homepage Search Bar */}
              <div className={`${isPageLoaded ? 'page-fade-in-up page-fade-delay-1' : 'opacity-0'}`}>
                <HomepageSearch />
              </div>
              
              {/* Recent Recipes - Under Search Bar */}
              <div className={`${isPageLoaded ? 'page-fade-in-up page-fade-delay-1' : 'opacity-0'}`}>
                <HomepageRecentRecipes />
              </div>
          </div>

          {/* Saved Recipes Section */}
          <div className={`space-y-8 md:space-y-10 ${isPageLoaded ? 'page-fade-in-up page-fade-delay-2' : 'opacity-0'}`}>
            <div className="space-y-4 md:space-y-5">
              <h2 className="font-domine text-[28px] md:text-[24px] font-normal text-black leading-[1.1] tracking-tight">
                Saved Recipes
              </h2>
            </div>

            {/* Cuisine Filter Pills now sit below the Trending header */}
            <div className="mb-6 md:mb-8">
              <CuisinePills onCuisineChange={handleCuisineChange} />
            </div>

            {/* Recipe Cards Grid - Adjusted for horizontal long cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  onClick={() => handleRecipeClick(recipe.id)}
                />
              ))}
            </div>

            {/* Show message if no recipes match filter (but only if there are bookmarked recipes available) */}
            {filteredRecipes.length === 0 && bookmarkedRecipes.length > 0 && (
              <div className="text-center py-12">
                {/* Display cuisine icon if a specific cuisine is selected (not "All") */}
                {selectedCuisine !== 'All' && CUISINE_ICON_MAP[selectedCuisine] && (
                  <div className="flex justify-center mb-6">
                    <Image
                      src={CUISINE_ICON_MAP[selectedCuisine]}
                      alt={`${selectedCuisine} cuisine icon`}
                      width={80}
                      height={80}
                      quality={100}
                      unoptimized={true}
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                )}
                <p className="font-albert text-[16px] text-stone-600">
                  No bookmarked recipes found for {selectedCuisine === 'All' ? 'this filter' : selectedCuisine}
                </p>
              </div>
            )}
            
            {/* Show message if no bookmarked recipes at all */}
            {bookmarkedRecipes.length === 0 && (
              <div className="text-center py-12">
                <p className="font-albert text-[16px] text-stone-600">
                  No saved recipes yet. Bookmark a recipe to see it here!
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

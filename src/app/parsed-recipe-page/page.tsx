'use client';
import { useRecipe } from '@/contexts/RecipeContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import RecipeSkeleton from '@/components/ui/recipe-skeleton';
import * as Tabs from '@radix-ui/react-tabs';

// Helper function to format ingredient
const formatIngredient = (
  ingredient: string | { amount?: string; units?: string; ingredient: string },
): string => {
  if (typeof ingredient === 'string') {
    return ingredient;
  }

  if (
    typeof ingredient === 'object' &&
    ingredient.amount &&
    ingredient.ingredient
  ) {
    const parts = [];
    if (ingredient.amount && ingredient.amount !== 'as much as you like') {
      parts.push(ingredient.amount);
    }
    if (ingredient.units) {
      parts.push(ingredient.units);
    }
    parts.push(ingredient.ingredient);
    return parts.join(' ');
  }

  return String(ingredient);
};

export default function ParsedRecipePage() {
  const { parsedRecipe, isLoaded } = useRecipe();
  const router = useRouter();

  // Redirect if loaded and no recipe
  useEffect(() => {
    if (isLoaded && !parsedRecipe) {
      router.push('/');
    }
  }, [isLoaded, parsedRecipe, router]);

  if (!isLoaded) {
    return <RecipeSkeleton />;
  }

  if (!parsedRecipe) {
    return (
      <div className="bg-[#fbf7f2] min-h-screen flex items-center justify-center">
        <div className="font-albert text-[16px] text-[#1e1e1e]">
          No recipe data found. Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen relative max-w-full overflow-x-hidden">
      <div className="transition-opacity duration-300 ease-in-out opacity-100">
        {/* Hero Section with Full-Width Image */}
        <div className="relative h-[360px] w-full">
          {/* Recipe Image with Gradient Overlay */}
          <div
            className="w-full h-full bg-cover bg-center rounded-b-[24px] flex items-end justify-between p-4 md:p-6"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0) 57.5%, rgba(0, 0, 0, 0.6) 74.5%), linear-gradient(90deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.1) 100%), url('https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop')`,
            }}
          >
            {/* Left Side - Title and Author */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col">
                <h1 className="font-domine text-[40px] text-stone-50 leading-[1.1] mb-1">
                  {parsedRecipe.title || 'Beef Udon'}
                </h1>
                <div className="flex items-center">
                  <span className="font-albert text-[14px] text-stone-50 leading-[1.4]">
                    Gage Minamoto
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-1 items-start">
                <div className="bg-stone-100 border border-stone-200 rounded-full px-2 py-1 flex items-center gap-1">
                  <span className="text-stone-600 text-xs">⏱️</span>
                  <span className="font-albert-medium text-[12px] text-stone-600">
                    10min
                  </span>
                </div>
                <div className="bg-stone-100 border border-stone-200 rounded-full px-2 py-1 flex items-center gap-1">
                  <span className="text-stone-600 text-xs">🥢</span>
                  <span className="font-albert-medium text-[12px] text-stone-600">
                    Japanese
                  </span>
                </div>
                <div className="bg-stone-100 border border-stone-200 rounded-full px-2 py-1 flex items-center gap-1">
                  <span className="text-stone-600 text-xs">🥢</span>
                  <span className="font-albert-medium text-[12px] text-stone-600">
                    Japanese
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side - Bookmark Button */}
            <div className="bg-[#FFBA25] rounded-full p-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <span className="text-white text-lg">🔖</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 md:px-8 py-6 space-y-6">
          {/* Tabs Section */}
          <Tabs.Root defaultValue="prep" className="w-full">
            {/* Tab List */}
            <Tabs.List className="flex gap-1 items-center justify-start mb-6">
              <Tabs.Trigger
                value="prep"
                className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 flex items-center justify-center gap-2 data-[state=active]:bg-stone-100 data-[state=active]:border-stone-300 data-[state=inactive]:bg-stone-50 data-[state=inactive]:border-stone-200 transition-all duration-200 hover:bg-stone-100 hover:border-stone-300"
              >
                <span className="text-stone-700 data-[state=active]:text-stone-900 text-lg">
                  🔪
                </span>
                <span className="font-albert-semibold text-[15px] text-stone-700 data-[state=active]:text-stone-900">
                  Prep
                </span>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="cook"
                className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 flex items-center justify-center gap-2 data-[state=active]:bg-stone-100 data-[state=active]:border-stone-300 data-[state=inactive]:bg-stone-50 transition-all duration-200 hover:bg-stone-100 hover:border-stone-300"
              >
                <span className="text-stone-700 data-[state=active]:text-stone-900 text-lg">
                  🍳
                </span>
                <span className="font-albert-semibold text-[15px] text-stone-700 data-[state=active]:text-stone-900">
                  Cook
                </span>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="plate"
                className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 flex items-center justify-center gap-2 data-[state=active]:bg-stone-100 data-[state=active]:border-stone-300 data-[state=inactive]:bg-stone-50 transition-all duration-200 hover:bg-stone-100 hover:border-stone-300"
              >
                <span className="text-stone-700 data-[state=active]:text-stone-900 text-lg">
                  🍽️
                </span>
                <span className="font-albert-semibold text-[15px] text-stone-700 data-[state=active]:text-stone-900">
                  Plate
                </span>
              </Tabs.Trigger>
            </Tabs.List>

            {/* Prep Tab Content */}
            <Tabs.Content value="prep" className="space-y-6">
              {/* Recipe Description Card */}
              <div className="bg-stone-100 rounded-lg p-4 space-y-4">
                <p className="font-albert text-[14px] text-stone-600 leading-[1.4]">
                  A steaming bowl of fragrant broth surrounds chewy noodles,
                  creating a satisfying texture. Tender slices of beef add a
                  sweet-savory flavor, enhancing the dish and offering a
                  comforting balance of taste.
                </p>

                {/* Timing and Rating Info */}
                <div className="flex gap-1.5 items-start">
                  <div className="flex-1 flex flex-col items-start">
                    <span className="font-albert text-[10px] text-stone-400 uppercase leading-[1.4]">
                      Cook
                    </span>
                    <span className="font-albert-semibold text-[16px] text-stone-950 leading-[1.2]">
                      35min
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-start">
                    <span className="font-albert text-[10px] text-stone-400 uppercase leading-[1.4]">
                      Overall
                    </span>
                    <span className="font-albert-semibold text-[16px] text-stone-950 leading-[1.2]">
                      50min
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-start">
                    <span className="font-albert text-[10px] text-stone-400 uppercase leading-[1.4]">
                      Ready
                    </span>
                    <span className="font-albert-semibold text-[16px] text-stone-950 leading-[1.2]">
                      6:27pm
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-start justify-between">
                    <span className="font-albert text-[10px] text-stone-400 uppercase leading-[1.4]">
                      Rating
                    </span>
                    <div className="flex items-center gap-0.5">
                      <span className="text-stone-600 text-sm">⭐</span>
                      <span className="text-stone-600 text-sm">⭐</span>
                      <span className="text-stone-600 text-sm">⭐</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipe Skills Section */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <h2 className="font-domine text-[20px] text-stone-950 leading-[1.1]">
                    Recipe Skills
                  </h2>
                  <p className="font-albert text-[14px] text-stone-600 leading-[1.4]">
                    Skills you need to know to cook this recipe
                  </p>
                </div>

                {/* Cooking Techniques */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="font-albert-medium text-[10px] text-stone-950 opacity-40 uppercase leading-[1.8]">
                        Cooking Techniques
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-5 bg-stone-200 rounded"></div>
                        <span className="font-albert text-[14px] text-stone-600">
                          Simmering
                        </span>
                      </div>
                    </div>
                    <button className="bg-stone-100 rounded-full px-5 py-2">
                      <span className="font-albert text-[14px] text-stone-600">
                        Learn More
                      </span>
                    </button>
                  </div>

                  {/* Knife Skills */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="font-albert-medium text-[10px] text-stone-950 opacity-40 uppercase leading-[1.8]">
                        Knife Skills
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-5 bg-stone-200 rounded"></div>
                        <span className="font-albert text-[14px] text-stone-600">
                          Chopping
                        </span>
                      </div>
                    </div>
                    <button className="bg-stone-100 rounded-full px-5 py-2">
                      <span className="font-albert text-[14px] text-stone-600">
                        Learn More
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div className="bg-stone-100 rounded-lg p-6">
                <h2 className="font-domine text-[20px] text-stone-950 mb-6 leading-[1.1]">
                  Ingredients
                </h2>
                {Array.isArray(parsedRecipe.ingredients) &&
                  parsedRecipe.ingredients.map(
                    (
                      group: {
                        groupName: string;
                        ingredients: Array<
                          | string
                          | {
                              amount?: string;
                              units?: string;
                              ingredient: string;
                            }
                        >;
                      },
                      groupIdx: number,
                    ) => (
                      <div key={groupIdx} className="mb-6 last:mb-0">
                        <h3 className="font-domine text-[18px] text-[#1e1e1e] mb-3 leading-none">
                          {group.groupName}
                        </h3>
                        <ul className="space-y-2">
                          {Array.isArray(group.ingredients) &&
                            group.ingredients.map(
                              (
                                ingredient:
                                  | string
                                  | {
                                      amount?: string;
                                      units?: string;
                                      ingredient: string;
                                    },
                                index: number,
                              ) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <span className="text-[#757575] text-sm mt-1">
                                    •
                                  </span>
                                  <span className="font-albert text-[16px] text-[#1e1e1e] leading-[1.4]">
                                    {formatIngredient(ingredient)}
                                  </span>
                                </li>
                              ),
                            )}
                        </ul>
                      </div>
                    ),
                  )}
              </div>
            </Tabs.Content>

            {/* Cook Tab Content */}
            <Tabs.Content value="cook" className="space-y-6">
              <div className="bg-stone-100 rounded-lg p-6">
                <h2 className="font-domine text-[20px] text-stone-950 mb-6 leading-[1.1]">
                  Instructions
                </h2>
                <ol className="space-y-4">
                  {Array.isArray(parsedRecipe.instructions) &&
                    parsedRecipe.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="bg-[#FFBA25] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0 font-albert">
                          {index + 1}
                        </span>
                        <span className="font-albert text-[16px] text-stone-950 leading-[1.4]">
                          {instruction}
                        </span>
                      </li>
                    ))}
                </ol>
              </div>
            </Tabs.Content>

            {/* Plate Tab Content */}
            <Tabs.Content value="plate" className="space-y-6">
              <div className="bg-stone-100 rounded-lg p-6">
                <h2 className="font-domine text-[20px] text-stone-950 mb-6 leading-[1.1]">
                  Plate & Serve
                </h2>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🍽️</div>
                  <p className="font-albert text-[18px] text-stone-600">
                    Coming soon...
                  </p>
                  <p className="font-albert text-[14px] text-stone-600 mt-2">
                    Plating suggestions and serving tips will be available here.
                  </p>
                </div>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>

        {/* Bottom Toolbar */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[345px] h-[88px] flex items-center justify-center">
          <div className="bg-stone-100 rounded-full w-full h-[88px] border border-[#ebebeb] border-[1.5px] shadow-[0px_4px_8px_0px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-between px-6 py-4 h-full">
              <div className="w-6 h-6 flex items-center justify-center">
                <span className="text-stone-600 text-lg">⏱️</span>
              </div>
              <div className="w-6 h-6 flex items-center justify-center">
                <span className="text-stone-600 text-lg">✅</span>
              </div>
              <div className="w-6 h-6 flex items-center justify-center">
                <span className="text-stone-600 text-lg">✨</span>
              </div>
              <div className="w-6 h-6 flex items-center justify-center">
                <span className="text-stone-600 text-lg">|</span>
              </div>
              <span className="font-albert-semibold text-[16px] text-stone-950">
                Serves 2x
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

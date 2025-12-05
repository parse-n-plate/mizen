'use client';
import { useRecipe } from '@/contexts/RecipeContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import RecipeSkeleton from '@/components/ui/recipe-skeleton';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus, Minus } from 'lucide-react';
import { scaleIngredients } from '@/utils/ingredientScaler';
import ClassicSplitView from '@/components/ClassicSplitView';

// Helper function to format ingredient
const formatIngredient = (
  ingredient: string | { amount?: string; units?: string; ingredient: string } | null | undefined,
): string => {
  // Handle null or undefined
  if (ingredient === null || ingredient === undefined) {
    return '';
  }

  // Handle string ingredients
  if (typeof ingredient === 'string') {
    return ingredient;
  }

  // Handle object ingredients
  if (typeof ingredient === 'object') {
    // Check if it's an array (shouldn't happen, but handle it)
    if (Array.isArray(ingredient)) {
      return ingredient.join(', ');
    }

    // Handle ingredient objects with proper structure
    // Even if amount is missing, we should still try to format it
    if ('ingredient' in ingredient && ingredient.ingredient) {
      const parts = [];
      
      // Add amount if it exists and is valid
      if (ingredient.amount && ingredient.amount.trim() && ingredient.amount !== 'as much as you like') {
        parts.push(ingredient.amount.trim());
      }
      
      // Add units if they exist
      if (ingredient.units && ingredient.units.trim()) {
        parts.push(ingredient.units.trim());
      }
      
      // Always add the ingredient name
      parts.push(ingredient.ingredient.trim());
      
      return parts.join(' ');
    }

    // If it's an object but doesn't match expected structure, try to extract what we can
    // This handles edge cases where the structure might be different
    if ('ingredient' in ingredient) {
      return String(ingredient.ingredient || '');
    }
  }

  // Fallback: try to convert to string safely
  try {
    return String(ingredient);
  } catch {
    return '';
  }
};

export default function ParsedRecipePage() {
  const { parsedRecipe, isLoaded } = useRecipe();
  const router = useRouter();
  const [servings, setServings] = useState<number>(parsedRecipe?.servings || 4);
  const [multiplier, setMultiplier] = useState<string>('1x');

  // Redirect if loaded and no recipe
  useEffect(() => {
    if (isLoaded && !parsedRecipe) {
      router.push('/');
    }
  }, [isLoaded, parsedRecipe, router]);

  // Initialize servings from recipe when loaded
  useEffect(() => {
    if (parsedRecipe?.servings) {
      setServings(parsedRecipe.servings);
    } else {
      // Default to 4 if not specified, usually a safe bet for recipes
      setServings(4);
    }
  }, [parsedRecipe]);

  // Calculate scaled ingredients
  const scaledIngredients = useMemo(() => {
    if (!parsedRecipe || !parsedRecipe.ingredients) return [];
    
    // Get multiplier value (1x = 1, 2x = 2, 3x = 3)
    const multiplierValue = parseInt(multiplier.replace('x', ''));
    
    // Calculate effective servings: base servings * multiplier
    const effectiveServings = servings * multiplierValue;
    
    // Cast the ingredients to the expected type for the scaler
    // The context type is slightly different but compatible structure-wise
    return scaleIngredients(
      parsedRecipe.ingredients as any, 
      parsedRecipe.servings || 4, 
      effectiveServings
    );
  }, [parsedRecipe, servings, multiplier]);

  const handleIncrementServings = () => {
    if (servings < 10) {
      setServings(prev => prev + 1);
    }
  };

  const handleDecrementServings = () => {
    if (servings > 1) {
      setServings(prev => prev - 1);
    }
  };

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
        {/* Hero Section - Title and Author */}
        <div className="w-full px-4 md:px-8 pt-6 pb-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col">
              <h1 className="font-domine text-[40px] text-black leading-[1.1] mb-1">
                {parsedRecipe.title || 'Beef Udon'}
              </h1>
              <div className="flex items-center">
                <span className="font-albert text-[14px] text-black leading-[1.4]">
                  {parsedRecipe.author || 'Unknown Author'}
                </span>
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
              {/* Servings Adjuster and Multiplier Container */}
              <div className="servings-controls-container">
                {/* Servings Adjuster */}
                <div className="control-card">
                  <button
                    onClick={handleDecrementServings}
                    disabled={servings <= 1}
                    className="control-button"
                  >
                    <Minus className="control-button-icon" />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="servings-label">
                      serving:
                    </span>
                    <span className="servings-value">
                      {servings}
                    </span>
                  </div>
                  <button
                    onClick={handleIncrementServings}
                    disabled={servings >= 10}
                    className="control-button"
                  >
                    <Plus className="control-button-icon" />
                  </button>
                </div>

                {/* Multiplier Component */}
                <div className="multiplier-container">
                  {['1x', '2x', '3x'].map((mult) => (
                    <button
                      key={mult}
                      onClick={() => setMultiplier(mult)}
                      className={`multiplier-button ${
                        multiplier === mult ? 'multiplier-button-selected' : ''
                      }`}
                    >
                      {mult}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              <div className="bg-stone-100 rounded-lg p-6">
                <h2 className="font-domine text-[20px] text-stone-950 mb-6 leading-[1.1]">
                  Ingredients
                </h2>
                {Array.isArray(scaledIngredients) &&
                  scaledIngredients.map(
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
              <div className="flex justify-center w-full">
                <ClassicSplitView
                  title={parsedRecipe.title}
                  steps={
                    Array.isArray(parsedRecipe.instructions)
                      ? parsedRecipe.instructions
                          .map((instruction, index) => {
                            let instructionText = '';
                            if (typeof instruction === 'string') {
                              instructionText = instruction;
                            } else if (
                              instruction === null ||
                              instruction === undefined
                            ) {
                              instructionText = '';
                            } else if (
                              typeof instruction === 'object' &&
                              instruction !== null
                            ) {
                              const instructionObj = instruction as Record<
                                string,
                                unknown
                              >;
                              if (
                                'text' in instructionObj &&
                                typeof instructionObj.text === 'string'
                              ) {
                                instructionText = instructionObj.text;
                              } else if (
                                'name' in instructionObj &&
                                typeof instructionObj.name === 'string'
                              ) {
                                instructionText = instructionObj.name;
                              } else {
                                instructionText = '';
                              }
                            } else {
                              instructionText = String(instruction || '');
                            }
                            return instructionText;
                          })
                          .filter((text) => text.trim())
                          .map((text, index) => ({
                            step: `Step ${index + 1}`,
                            detail: text,
                            time: 0,
                            ingredients: [],
                            tips: '',
                          }))
                      : []
                  }
                />
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
      </div>
    </div>
  );
}

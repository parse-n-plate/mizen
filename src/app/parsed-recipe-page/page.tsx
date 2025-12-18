'use client';
import { useRecipe } from '@/contexts/RecipeContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, use } from 'react';
import RecipeSkeleton from '@/components/ui/recipe-skeleton';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus, Minus, X, ArrowLeft } from 'lucide-react';
import { scaleIngredients } from '@/utils/ingredientScaler';
import ClassicSplitView from '@/components/ClassicSplitView';
import IngredientCard from '@/components/ui/ingredient-card';

// Helper function to extract step title from instruction text
const extractStepTitle = (text: string): string => {
  if (!text || text.trim() === '') return 'Step';
  
  // Remove leading/trailing whitespace
  const trimmed = text.trim();
  
  // Try to extract first sentence (up to period, exclamation, or question mark)
  const firstSentenceMatch = trimmed.match(/^([^.!?]+[.!?]?)/);
  if (firstSentenceMatch) {
    const firstSentence = firstSentenceMatch[1].trim();
    // Return the full first sentence without truncation
    return firstSentence.replace(/[.!?]+$/, '');
  }
  
  // Fallback: return the full text (no truncation)
  return trimmed;
};

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

export default function ParsedRecipePage({
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
    <div className="bg-white min-h-screen relative max-w-full overflow-x-hidden">
      <div className="transition-opacity duration-300 ease-in-out opacity-100">
        {/* Tabs Root - wraps both navigation and content */}
        <Tabs.Root defaultValue="prep" className="w-full">
          {/* Header Section with #F8F8F4 Background */}
          <div className="bg-[#f8f8f4]">
            {/* Main Content Container with max-width */}
            <div className="max-w-6xl mx-auto px-4 md:px-8">
              {/* Header Section with Navigation */}
              <div className="w-full pt-6 pb-0">
                <div className="flex flex-col gap-3">
                  {/* Responsive Navigation: Breadcrumb for desktop, X button for mobile */}
                  <div className="flex gap-3 items-center justify-between">
                    {/* Desktop: Back to Home breadcrumb */}
                    <button
                      onClick={() => router.push('/')}
                      className="hidden md:flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors"
                      aria-label="Back to Home"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="font-albert text-[14px]">Back to Home</span>
                    </button>
                    
                    {/* Mobile: X close button */}
                    <button
                      onClick={() => router.push('/')}
                      className="md:hidden bg-white rounded-full p-4 flex items-center justify-center shrink-0 w-12 h-12 hover:bg-stone-50 transition-colors ml-auto"
                      aria-label="Close and return to homepage"
                    >
                      <X className="w-6 h-6 text-stone-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recipe Info Section */}
              <div className="w-full pt-6 pb-0">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <h1 className="font-domine text-[36px] text-[#193d34] leading-[1.2] font-bold">
                      {parsedRecipe.title || 'Beef Udon'}
                    </h1>
                    {parsedRecipe.author?.trim() && (
                      <p className="font-albert text-[16px] text-stone-400 leading-[1.4]">
                        by {parsedRecipe.author.trim()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <p className="font-albert text-[16px] text-stone-500 leading-[1.4]">
                      {(() => {
                        const time =
                          parsedRecipe.totalTimeMinutes ??
                          parsedRecipe.prepTimeMinutes ??
                          parsedRecipe.cookTimeMinutes;
                        const servingsDisplay = parsedRecipe.servings ?? servings;
                        const timeText =
                          typeof time === 'number' ? `${time} min` : undefined;

                        if (timeText) {
                          return `${timeText} • ${servingsDisplay} servings`;
                        }
                        return `${servingsDisplay} servings`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="w-full">
                {/* Tab List */}
                <Tabs.List className="flex items-start border-b border-stone-200 w-full">
                  <Tabs.Trigger
                    value="prep"
                    className="flex-1 h-[58px] flex items-center justify-center gap-2 px-0 py-0 relative data-[state=active]:border-b-2 data-[state=active]:border-[#193d34] transition-all duration-200"
                  >
                    <div className="relative shrink-0 w-9 h-9">
                      <img 
                        alt="Prep icon" 
                        className="absolute inset-0 w-full h-full object-contain"
                        src="/assets/icons/Prep_Icon.png"
                      />
                    </div>
                    <span className="font-albert font-medium text-[16px] data-[state=active]:text-[#193d34] data-[state=inactive]:text-[#79716b]">
                      Prep
                    </span>
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="cook"
                    className="flex-1 h-[58px] flex items-center justify-center gap-2 px-0 py-0 relative data-[state=active]:border-b-2 data-[state=active]:border-[#193d34] transition-all duration-200"
                  >
                    <div className="relative shrink-0 w-9 h-9">
                      <img 
                        alt="Cook icon" 
                        className="absolute inset-0 w-full h-full object-contain"
                        src="/assets/icons/Cook_Icon.png"
                      />
                    </div>
                    <span className="font-albert font-medium text-[16px] data-[state=active]:text-[#193d34] data-[state=inactive]:text-[#79716b]">
                      Cook
                    </span>
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="plate"
                    className="flex-1 h-[58px] flex items-center justify-center gap-2 px-0 py-0 relative data-[state=active]:border-b-2 data-[state=active]:border-[#193d34] transition-all duration-200"
                  >
                    <div className="relative shrink-0 w-9 h-9">
                      <img 
                        alt="Plate icon" 
                        className="absolute inset-0 w-full h-full object-contain"
                        src="/assets/icons/Plate_Icon.png"
                      />
                    </div>
                    <span className="font-albert font-medium text-[16px] data-[state=active]:text-[#193d34] data-[state=inactive]:text-[#79716b]">
                      Plate
                    </span>
                  </Tabs.Trigger>
                </Tabs.List>
              </div>
            </div>
          </div>

          {/* Main Content - Tab Content Sections */}
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            {/* Prep Tab Content */}
            <Tabs.Content value="prep" className="space-y-0">
              <div className="bg-white border-t border-stone-200">
                <div className="p-6 space-y-6">
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
                  <div className="bg-white">
                    <h2 className="font-domine text-[20px] text-[#193d34] mb-6 leading-[1.1]">
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
                            <h3 className="font-domine text-[18px] text-[#193d34] mb-3 leading-none">
                              {group.groupName}
                            </h3>
                            <div className="ingredient-list-container">
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
                                  ) => {
                                    const isLast = index === group.ingredients.length - 1;
                                    return (
                                      <IngredientCard
                                        key={index}
                                        ingredient={ingredient}
                                        description={undefined} // Empty state - not connected to backend yet
                                        isLast={isLast}
                                      />
                                    );
                                  },
                                )}
                            </div>
                          </div>
                        ),
                      )}
                  </div>
                </div>
              </div>
            </Tabs.Content>

            {/* Cook Tab Content */}
            <Tabs.Content value="cook" className="space-y-0">
              <div className="w-full">
                <ClassicSplitView
                  title={parsedRecipe.title}
                  steps={
                    Array.isArray(parsedRecipe.instructions)
                      ? parsedRecipe.instructions
                          .map((instruction) => {
                            // Normalize instruction into object with title/detail
                            if (typeof instruction === 'string') {
                              const detail = instruction.trim();
                              if (!detail) return null;
                              return {
                                step: extractStepTitle(detail),
                                detail,
                                time: 0,
                                ingredients: [],
                                tips: '',
                              };
                            }

                            if (
                              instruction &&
                              typeof instruction === 'object'
                            ) {
                              const instructionObj = instruction as Record<
                                string,
                                unknown
                              >;
                              const detail = (() => {
                                if (
                                  typeof instructionObj.detail === 'string'
                                ) {
                                  return instructionObj.detail.trim();
                                }
                                if (
                                  typeof instructionObj.text === 'string'
                                ) {
                                  return instructionObj.text.trim();
                                }
                                if (
                                  typeof instructionObj.name === 'string'
                                ) {
                                  return instructionObj.name.trim();
                                }
                                return '';
                              })();

                              if (!detail) return null;

                              const title =
                                typeof instructionObj.title === 'string'
                                  ? instructionObj.title.trim()
                                  : '';

                              const time =
                                typeof instructionObj.timeMinutes === 'number'
                                  ? instructionObj.timeMinutes
                                  : 0;

                              const ingredients =
                                Array.isArray(instructionObj.ingredients) &&
                                instructionObj.ingredients.every(
                                  (item) => typeof item === 'string',
                                )
                                  ? (instructionObj.ingredients as string[])
                                  : [];

                              const tips =
                                typeof instructionObj.tips === 'string'
                                  ? instructionObj.tips
                                  : '';

                              return {
                                step: title || extractStepTitle(detail),
                                detail,
                                time,
                                ingredients,
                                tips,
                              };
                            }

                            return null;
                          })
                          .filter(
                            (step): step is {
                              step: string;
                              detail: string;
                              time: number;
                              ingredients: string[];
                              tips: string;
                            } => Boolean(step),
                          )
                      : []
                  }
                />
              </div>
            </Tabs.Content>

            {/* Plate Tab Content */}
            <Tabs.Content value="plate" className="space-y-0">
              <div className="bg-white border-t border-stone-200">
                <div className="p-6">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🍽️</div>
                    <p className="font-albert text-[18px] text-stone-500">
                      Coming soon...
                    </p>
                    <p className="font-albert text-[16px] text-stone-500 mt-2">
                      Plating suggestions and serving tips will be available here.
                    </p>
                  </div>
                </div>
              </div>
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </div>
    </div>
  );
}

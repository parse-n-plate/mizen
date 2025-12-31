'use client';
import { useRecipe } from '@/contexts/RecipeContext';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, use } from 'react';
import RecipeSkeleton from '@/components/ui/recipe-skeleton';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, Link, Copy, Check } from 'lucide-react';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import { motion, AnimatePresence } from 'framer-motion';
import { scaleIngredients } from '@/utils/ingredientScaler';
import ClassicSplitView from '@/components/ClassicSplitView';
import IngredientCard from '@/components/ui/ingredient-card';
import { IngredientGroup } from '@/components/ui/ingredient-group';
import { ServingsControls } from '@/components/ui/servings-controls';
import { UISettingsProvider } from '@/contexts/UISettingsContext';
import { AdminPrototypingPanel } from '@/components/ui/admin-prototyping-panel';
import { CUISINE_ICON_MAP } from '@/config/cuisineConfig';
import Image from 'next/image';
import ImagePreview from '@/components/ui/image-preview';

// Helper function to extract domain from URL for display
const getDomainFromUrl = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    return url;
  }
};

// Helper function to format time display
const formatTimeDisplay = (
  prepTime?: number,
  cookTime?: number,
  totalTime?: number,
  servings?: number,
): string => {
  const parts: string[] = [];
  
  // Show prep and cook times if both available
  if (prepTime && cookTime) {
    parts.push(`${prepTime} min prep`);
    parts.push(`${cookTime} min cook`);
  } 
  // Show total time if available
  else if (totalTime) {
    parts.push(`${totalTime} min total`);
  } 
  // Show individual times if only one is available
  else if (prepTime) {
    parts.push(`${prepTime} min prep`);
  } else if (cookTime) {
    parts.push(`${cookTime} min cook`);
  }
  
  // Always append servings
  if (servings) {
    parts.push(`${servings} servings`);
  }
  
  return parts.join(' • ');
};

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
  const { recentRecipes, isBookmarked, toggleBookmark } = useParsedRecipes();
  const router = useRouter();
  // #region agent log
  if (parsedRecipe) {
    fetch('http://127.0.0.1:7242/ingest/211f35f0-b7c4-4493-a3d1-13dbeecaabb1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'parsed-recipe-page/page.tsx:155',message:'parsedRecipe from context',data:{hasServings:'servings' in parsedRecipe,servings:parsedRecipe.servings,servingsType:typeof parsedRecipe.servings,servingsValue:parsedRecipe.servings,hasAuthor:'author' in parsedRecipe,author:parsedRecipe.author,keys:Object.keys(parsedRecipe)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
  }
  // #endregion
  const [servings, setServings] = useState<number | undefined>(parsedRecipe?.servings);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/211f35f0-b7c4-4493-a3d1-13dbeecaabb1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'parsed-recipe-page/page.tsx:158',message:'servings state initialized',data:{servings,servingsType:typeof servings,parsedRecipeServings:parsedRecipe?.servings,parsedRecipeServingsType:typeof parsedRecipe?.servings,parsedRecipeExists:!!parsedRecipe},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const [multiplier, setMultiplier] = useState<string>('1x');
  const [activeTab, setActiveTab] = useState<string>('prep');
  const [copied, setCopied] = useState(false);

  // Find the recipe ID by matching sourceUrl with recipes in recentRecipes
  // This is needed because RecipeContext's parsedRecipe doesn't have an ID field
  const recipeId = useMemo(() => {
    if (!parsedRecipe?.sourceUrl) return null;
    const matchingRecipe = recentRecipes.find(
      (recipe) => recipe.sourceUrl === parsedRecipe.sourceUrl || recipe.url === parsedRecipe.sourceUrl
    );
    return matchingRecipe?.id || null;
  }, [parsedRecipe?.sourceUrl, recentRecipes]);

  // Check if current recipe is bookmarked
  const isBookmarkedState = recipeId ? isBookmarked(recipeId) : false;

  // Handle bookmark toggle - shows confirmation dialog if currently bookmarked
  const handleBookmarkToggle = () => {
    if (!recipeId) {
      // If recipe doesn't exist in recentRecipes yet, we can't bookmark it
      // This shouldn't happen in normal flow, but handle gracefully
      console.warn('Cannot bookmark recipe: recipe not found in recent recipes');
      return;
    }

    // If recipe is currently bookmarked, show confirmation dialog
    if (isBookmarkedState) {
      const confirmed = window.confirm(
        'Are you sure you want to remove this recipe from your bookmarks? You can bookmark it again later.'
      );
      
      if (confirmed) {
        toggleBookmark(recipeId);
      }
    } else {
      // If not bookmarked, just add the bookmark directly
      toggleBookmark(recipeId);
    }
  };

  // --- Persistence & Progress State ---
  const recipeKey = useMemo(() => {
    if (!parsedRecipe) return '';
    return `recipe-progress-${parsedRecipe.title || 'untitled'}-${parsedRecipe.sourceUrl || ''}`;
  }, [parsedRecipe]);

  // Map of groupName -> array of checked ingredient names
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, string[]>>({});
  // Map of groupName -> isCollapsed (true = collapsed)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  // Track which ingredient is currently expanded (accordion behavior - only one at a time)
  // Format: "groupName:ingredientName" or null if none expanded
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);

  // Load persistence from localStorage
  useEffect(() => {
    if (!recipeKey) return;
    const saved = localStorage.getItem(recipeKey);
    if (saved) {
      try {
        const { checked, collapsed } = JSON.parse(saved);
        if (checked) setCheckedIngredients(checked);
        if (collapsed) setCollapsedGroups(collapsed);
      } catch (e) {
        console.error('Error loading recipe progress:', e);
      }
    }
  }, [recipeKey]);

  // Save persistence to localStorage
  useEffect(() => {
    if (!recipeKey || Object.keys(checkedIngredients).length === 0 && Object.keys(collapsedGroups).length === 0) return;
    const data = { checked: checkedIngredients, collapsed: collapsedGroups };
    localStorage.setItem(recipeKey, JSON.stringify(data));
  }, [recipeKey, checkedIngredients, collapsedGroups]);

  const handleIngredientCheck = (groupName: string, ingredientName: string, isChecked: boolean) => {
    setCheckedIngredients(prev => {
      const groupChecked = prev[groupName] || [];
      const newGroupChecked = isChecked 
        ? [...groupChecked, ingredientName]
        : groupChecked.filter(name => name !== ingredientName);
      
      return {
        ...prev,
        [groupName]: newGroupChecked
      };
    });
  };

  // Handle ingredient expansion (accordion behavior - only one can be expanded at a time)
  const handleIngredientExpand = (groupName: string, ingredientName: string, isExpanding: boolean) => {
    if (isExpanding) {
      // When expanding, set this ingredient as the expanded one (closes any other expanded ingredient)
      setExpandedIngredient(`${groupName}:${ingredientName}`);
    } else {
      // When collapsing, clear the expanded ingredient
      setExpandedIngredient(null);
    }
  };

  const handleGroupToggle = (groupName: string, isExpanded: boolean) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !isExpanded
    }));
  };

  // Handle toggling all ingredients in a group (via progress pie click)
  const handleToggleAllIngredients = (groupName: string, groupIngredients: Array<string | { amount?: string; units?: string; ingredient: string }>) => {
    const groupChecked = checkedIngredients[groupName] || [];
    const allChecked = groupChecked.length === groupIngredients.length;
    
    // Get all ingredient names from the group
    const allIngredientNames = groupIngredients.map(ing => 
      typeof ing === 'string' ? ing : ing.ingredient
    );
    
    // If all are checked, uncheck all; otherwise check all
    if (allChecked) {
      // Uncheck all ingredients in this group
      setCheckedIngredients(prev => ({
        ...prev,
        [groupName]: []
      }));
    } else {
      // Check all ingredients in this group
      setCheckedIngredients(prev => ({
        ...prev,
        [groupName]: allIngredientNames
      }));
    }
  };
  // --- End Persistence & Progress State ---

  // Handle navigation to ingredients from the Cook tab
  useEffect(() => {
    const handleNavigateToIngredient = (event: any) => {
      const { name } = event.detail;
      setActiveTab('prep');
      
      // Wait for tab switch animation to complete
      setTimeout(() => {
        const id = `ingredient-${name.toLowerCase().replace(/\s+/g, '-')}`;
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add a brief highlight effect
          element.classList.add('ingredient-highlight');
          setTimeout(() => {
            element.classList.remove('ingredient-highlight');
          }, 2000);
        }
      }, 100);
    };

    window.addEventListener('navigate-to-ingredient', handleNavigateToIngredient);
    
    const handleNavigateToStep = () => {
      setActiveTab('cook');
    };

    window.addEventListener('navigate-to-step', handleNavigateToStep);

    return () => {
      window.removeEventListener('navigate-to-ingredient', handleNavigateToIngredient);
      window.removeEventListener('navigate-to-step', handleNavigateToStep);
    };
  }, []);

  // Helper function to handle copying the URL
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Redirect if loaded and no recipe
  // Check both state and localStorage to handle race conditions where navigation
  // happens before React state updates complete
  useEffect(() => {
    if (isLoaded && !parsedRecipe) {
      // Check localStorage as a fallback - if recipe was just set, it might be
      // in localStorage but state hasn't updated yet due to React's async updates
      const saved = typeof window !== 'undefined' ? localStorage.getItem('parsedRecipe') : null;
      if (!saved) {
        // No recipe in state or localStorage, redirect to home
        router.push('/');
      }
      // If saved exists, RecipeContext's useEffect will load it and update state
      // So we don't redirect - just wait for the state to update
    }
  }, [isLoaded, parsedRecipe, router]);

  // Initialize servings from recipe when loaded
  useEffect(() => {
    // Only set servings if they exist in the parsed recipe
    // Don't default to 4 - if servings aren't found, leave as undefined
    setServings(parsedRecipe?.servings);
  }, [parsedRecipe]);

  // Calculate scaled ingredients
  const scaledIngredients = useMemo(() => {
    if (!parsedRecipe || !parsedRecipe.ingredients) return [];
    
    // If servings are unknown, return ingredients unscaled
    if (!parsedRecipe.servings || !servings) {
      return parsedRecipe.ingredients;
    }
    
    // Get multiplier value (1x = 1, 2x = 2, 3x = 3)
    const multiplierValue = parseInt(multiplier.replace('x', ''));
    
    // Calculate effective servings: base servings * multiplier
    const effectiveServings = servings * multiplierValue;
    
    // Cast the ingredients to the expected type for the scaler
    // The context type is slightly different but compatible structure-wise
    return scaleIngredients(
      parsedRecipe.ingredients as any, 
      parsedRecipe.servings, 
      effectiveServings
    );
  }, [parsedRecipe, servings, multiplier]);

  // Servings change handler - passed to ServingsControls component
  const handleServingsChange = (newServings: number) => {
    setServings(newServings);
  };

  // Multiplier change handler - passed to ServingsControls component
  const handleMultiplierChange = (newMultiplier: string) => {
    setMultiplier(newMultiplier);
  };

  // Memoize normalized steps for bidirectional linking
  const normalizedSteps = useMemo(() => {
    if (!parsedRecipe || !Array.isArray(parsedRecipe.instructions)) return [];
    
    return parsedRecipe.instructions
      .map((instruction) => {
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

        if (instruction && typeof instruction === 'object') {
          const instructionObj = instruction as unknown as Record<string, unknown>;
          const detail = (() => {
            if (typeof instructionObj.detail === 'string') return instructionObj.detail.trim();
            if (typeof instructionObj.text === 'string') return instructionObj.text.trim();
            if (typeof instructionObj.name === 'string') return instructionObj.name.trim();
            return '';
          })();

          if (!detail) return null;

          return {
            step: typeof instructionObj.title === 'string' ? instructionObj.title.trim() : (typeof instructionObj.step === 'string' ? instructionObj.step.trim() : extractStepTitle(detail)),
            detail,
            time: typeof instructionObj.timeMinutes === 'number' ? instructionObj.timeMinutes : (typeof instructionObj.time === 'number' ? instructionObj.time : 0),
            ingredients: Array.isArray(instructionObj.ingredients) ? instructionObj.ingredients : [],
            tips: typeof instructionObj.tips === 'string' ? instructionObj.tips : '',
          };
        }
        return null;
      })
      .filter((s): s is any => s !== null);
  }, [parsedRecipe]);

  // Memoize flattened ingredients for matching
  const flattenedIngredients = useMemo(() => {
    return scaledIngredients.flatMap(g => g.ingredients.map(i => {
      if (typeof i === 'string') return { name: i };
      return { name: i.ingredient, amount: i.amount, units: i.units, group: g.groupName };
    }));
  }, [scaledIngredients]);

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
    <UISettingsProvider>
      <div className="bg-white min-h-screen relative max-w-full overflow-x-hidden pb-12 md:pb-16">
        <div className="transition-opacity duration-300 ease-in-out opacity-100">
          {/* Tabs Root - wraps both navigation and content */}
          <Tabs.Root 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            {/* Header Section with #F8F8F4 Background */}
            <div className="bg-[#f8f8f4]">
              {/* Main Content Container with max-width */}
              <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-0">
                {/* Header Section with Navigation */}
                <div className="w-full mb-8">
                  <div className="flex flex-col gap-4">
                    {/* Responsive Navigation: Back to Home breadcrumb */}
                    <div className="flex gap-3 items-center justify-between">
                      {/* Desktop: Back to Home breadcrumb */}
                      <button
                        onClick={() => router.push('/')}
                        className="hidden md:flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
                        aria-label="Back to Home"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-albert text-[14px]">Back to Home</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recipe Info Section */}
                <div className="w-full pt-6 pb-0">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-4">
                        <h1 className="font-domine text-[36px] text-[#193d34] leading-[1.2] font-bold flex-1">
                          {parsedRecipe.title || 'Beef Udon'}
                        </h1>
                        {/* Bookmark Button */}
                        {recipeId && (
                          <button
                            onClick={handleBookmarkToggle}
                            className="flex-shrink-0 p-2 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 bg-white/50 backdrop-blur-sm hover:bg-white/80 cursor-pointer"
                            aria-label={isBookmarkedState ? 'Remove bookmark' : 'Bookmark recipe'}
                          >
                            <Bookmark
                              className={`
                                w-6 h-6 transition-colors duration-200
                                ${isBookmarkedState 
                                  ? 'fill-[#78716C] text-[#78716C]' 
                                  : 'fill-[#D6D3D1] text-[#D6D3D1] hover:fill-[#A8A29E] hover:text-[#A8A29E]'
                                }
                              `}
                            />
                          </button>
                        )}
                      </div>
                      
                      {/* Author and Source URL / Image Preview */}
                      {(parsedRecipe.author?.trim() || parsedRecipe.sourceUrl || parsedRecipe.imageData) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {parsedRecipe.author?.trim() && (
                            <p className="font-albert text-[16px] text-stone-400 leading-[1.4]">
                              by {parsedRecipe.author.trim()}
                            </p>
                          )}
                          {/* Show ImagePreview for uploaded images, otherwise show source URL link */}
                          {parsedRecipe.imageData && parsedRecipe.sourceUrl?.startsWith('image:') ? (
                            <>
                              {parsedRecipe.author?.trim() && (
                                <span className="text-stone-400">•</span>
                              )}
                              <ImagePreview
                                imageData={parsedRecipe.imageData}
                                filename={parsedRecipe.imageFilename || 'recipe-image'}
                              />
                            </>
                          ) : parsedRecipe.sourceUrl ? (
                            <>
                              {parsedRecipe.author?.trim() && (
                                <span className="text-stone-400">•</span>
                              )}
                              <div className="flex items-center gap-1 group">
                                <a
                                  href={parsedRecipe.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-albert text-[16px] text-stone-400 hover:text-[#193d34] transition-colors flex items-center gap-1 cursor-pointer"
                                  aria-label={`View original recipe on ${getDomainFromUrl(parsedRecipe.sourceUrl)}`}
                                >
                                  <Link className="w-3 h-3" />
                                  {getDomainFromUrl(parsedRecipe.sourceUrl)}
                                </a>
                                
                                {/* Simple Copy Button - slides out from under URL on hover */}
                                <button
                                  className="opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-150 p-1 flex items-center justify-center cursor-pointer"
                                  onClick={() => handleCopy(parsedRecipe.sourceUrl || '')}
                                  title="Copy recipe URL"
                                >
                                  <AnimatePresence mode="wait">
                                    {copied ? (
                                      <motion.div
                                        key="check"
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.5, opacity: 0 }}
                                        transition={{ duration: 0.1 }}
                                      >
                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        key="copy"
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.5, opacity: 0 }}
                                        transition={{ duration: 0.1 }}
                                      >
                                        <Copy className="w-3.5 h-3.5 text-stone-400" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </button>
                              </div>
                            </>
                          ) : null}
                        </div>
                      )}
                      
                      {/* AI-Generated Summary */}
                      {parsedRecipe.summary?.trim() && (
                        <p className="font-albert text-[16px] text-stone-600 leading-[1.5] italic">
                          {parsedRecipe.summary.trim()}
                        </p>
                      )}
                    </div>
                    
                    {/* Time and Servings */}
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-albert text-[16px] text-stone-500 leading-[1.4]">
                          {formatTimeDisplay(
                            parsedRecipe.prepTimeMinutes,
                            parsedRecipe.cookTimeMinutes,
                            parsedRecipe.totalTimeMinutes,
                            parsedRecipe.servings
                          )}
                        </p>
                        {/* Cuisine Badges */}
                        {parsedRecipe.cuisine && parsedRecipe.cuisine.length > 0 && (
                          <>
                            <span className="text-stone-400">•</span>
                            <div className="flex items-center gap-2 flex-wrap">
                              {parsedRecipe.cuisine.map((cuisineName) => {
                                const iconPath = CUISINE_ICON_MAP[cuisineName];
                                if (!iconPath) {
                                  console.warn(`[ParsedRecipePage] ⚠️ Missing icon for cuisine: "${cuisineName}". Check cuisineConfig.ts and ensure icon file exists.`);
                                  return null;
                                }
                                console.log(`[ParsedRecipePage] 🍽️ Displaying cuisine badge for "${cuisineName}" on recipe "${parsedRecipe.title}"`);
                                return (
                                  <div
                                    key={cuisineName}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-stone-100 border border-stone-200"
                                    title={cuisineName}
                                  >
                                    <Image
                                      src={iconPath}
                                      alt={`${cuisineName} cuisine icon`}
                                      width={16}
                                      height={16}
                                      quality={100}
                                      unoptimized={true}
                                      className="w-4 h-4 object-contain"
                                    />
                                    <span className="font-albert text-[14px] text-stone-700">
                                      {cuisineName}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation - Edge-to-edge on mobile/tablet, padded on desktop */}
              <div className="w-full">
                {/* Tab List Container - Responsive padding: edge-to-edge on mobile/tablet, padded on desktop */}
                <div className="px-0 lg:px-8">
                  <div className="max-w-6xl mx-auto">
                    <Tabs.List className="flex items-start w-full relative">
                      <Tabs.Trigger
                        value="prep"
                        className="group flex-1 h-[58px] flex items-center justify-center gap-2 px-0 py-0 relative transition-all duration-300 outline-none cursor-pointer"
                      >
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: -5 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative shrink-0 w-9 h-9"
                        >
                          <img 
                            alt="Prep icon" 
                            className={`absolute inset-0 w-full h-full object-contain transition-all duration-300 ${activeTab === 'prep' ? 'drop-shadow-sm' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}
                            src="/assets/icons/Prep_Icon.png"
                          />
                        </motion.div>
                        <span className={`font-albert font-medium text-[16px] transition-colors duration-300 ${activeTab === 'prep' ? 'text-[#193d34]' : 'text-[#79716b] group-hover:text-[#193d34]'}`}>
                          Prep
                        </span>
                        {activeTab === 'prep' && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#193d34] z-10"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="cook"
                        className="group flex-1 h-[58px] flex items-center justify-center gap-2 px-0 py-0 relative transition-all duration-300 outline-none cursor-pointer"
                      >
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative shrink-0 w-9 h-9"
                        >
                          <img 
                            alt="Cook icon" 
                            className={`absolute inset-0 w-full h-full object-contain transition-all duration-300 ${activeTab === 'cook' ? 'drop-shadow-sm' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}
                            src="/assets/icons/Cook_Icon.png"
                          />
                        </motion.div>
                        <span className={`font-albert font-medium text-[16px] transition-colors duration-300 ${activeTab === 'cook' ? 'text-[#193d34]' : 'text-[#79716b] group-hover:text-[#193d34]'}`}>
                          Cook
                        </span>
                        {activeTab === 'cook' && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#193d34] z-10"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="plate"
                        className="group flex-1 h-[58px] flex items-center justify-center gap-2 px-0 py-0 relative transition-all duration-300 outline-none cursor-pointer"
                      >
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: -3 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative shrink-0 w-9 h-9"
                        >
                          <img 
                            alt="Plate icon" 
                            className={`absolute inset-0 w-full h-full object-contain transition-all duration-300 ${activeTab === 'plate' ? 'drop-shadow-sm' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}
                            src="/assets/icons/Plate_Icon.png"
                          />
                        </motion.div>
                        <span className={`font-albert font-medium text-[16px] transition-colors duration-300 ${activeTab === 'plate' ? 'text-[#193d34]' : 'text-[#79716b] group-hover:text-[#193d34]'}`}>
                          Plate
                        </span>
                        {activeTab === 'plate' && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#193d34] z-10"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </Tabs.Trigger>
                    </Tabs.List>
                  </div>
                </div>
              </div>
              {/* Full-width border underneath header */}
              <div className="w-full border-b border-[#E7E5E4]"></div>
            </div>

            {/* Main Content - Tab Content Sections */}
            <div className="max-w-6xl mx-auto px-4 md:px-8">
              <AnimatePresence mode="wait">
                {/* Prep Tab Content */}
                {activeTab === 'prep' && (
                  <Tabs.Content value="prep" key="prep" className="space-y-0 outline-none" forceMount>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="bg-white cursor-default"
                    >
                      <div className="p-6 space-y-6">
                        {/* Servings Adjuster and Multiplier Container */}
                        {/* Hidden on mobile */}
                        <div className="servings-controls-desktop-only">
                          <ServingsControls
                            servings={servings}
                            onServingsChange={handleServingsChange}
                            multiplier={multiplier}
                            onMultiplierChange={handleMultiplierChange}
                          />
                        </div>

                        {/* Ingredients */}
                        <div className="bg-white cursor-default">
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
                              ) => {
                                const groupName = group.groupName || 'Main';
                                const groupChecked = checkedIngredients[groupName] || [];
                                const isCollapsed = collapsedGroups[groupName] || false;

                                return (
                                  <IngredientGroup 
                                    key={groupIdx}
                                    title={groupName}
                                    totalCount={group.ingredients.length}
                                    checkedCount={groupChecked.length}
                                    isInitialExpanded={!isCollapsed}
                                    onToggle={(isExpanded) => handleGroupToggle(groupName, isExpanded)}
                                    onToggleAll={() => handleToggleAllIngredients(groupName, group.ingredients)}
                                    pieLayout="inline" // You can test "below" too
                                  >
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
                                            const ingredientName = typeof ingredient === 'string' 
                                              ? ingredient 
                                              : ingredient.ingredient;
                                            
                                            const isChecked = groupChecked.includes(ingredientName);
                                            // Check if this ingredient is currently expanded (accordion behavior)
                                            const ingredientKey = `${groupName}:${ingredientName}`;
                                            const isExpanded = expandedIngredient === ingredientKey;

                                            const ingredientId = `ingredient-group-${groupIdx}-item-${index}`;
                                            return (
                                              <div id={ingredientId} key={index}>
                                                <IngredientCard
                                                  ingredient={ingredient}
                                                  description={undefined}
                                                  isLast={isLast}
                                                  recipeSteps={normalizedSteps.map(s => ({ instruction: s.detail }))}
                                                  groupName={groupName}
                                                  recipeUrl={parsedRecipe?.sourceUrl}
                                                  checked={isChecked}
                                                  onCheckedChange={(checked) => 
                                                    handleIngredientCheck(groupName, ingredientName, checked)
                                                  }
                                                  isExpanded={isExpanded}
                                                  onExpandChange={(expanding) => 
                                                    handleIngredientExpand(groupName, ingredientName, expanding)
                                                  }
                                                />
                                              </div>
                                            );
                                          },
                                        )}
                                    </div>
                                  </IngredientGroup>
                                );
                              },
                            )}
                        </div>
                      </div>
                    </motion.div>
                  </Tabs.Content>
                )}

                {/* Cook Tab Content */}
                {activeTab === 'cook' && (
                  <Tabs.Content value="cook" key="cook" className="space-y-0 outline-none" forceMount>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="w-full"
                    >
                      <ClassicSplitView
                        title={parsedRecipe.title}
                        allIngredients={flattenedIngredients}
                        steps={normalizedSteps}
                      />
                    </motion.div>
                  </Tabs.Content>
                )}

                {/* Plate Tab Content */}
                {activeTab === 'plate' && (
                  <Tabs.Content value="plate" key="plate" className="space-y-0 outline-none" forceMount>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="bg-white border-t border-stone-200"
                    >
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
                    </motion.div>
                  </Tabs.Content>
                )}
              </AnimatePresence>
            </div>
          </Tabs.Root>
        </div>
        
        {/* Admin Panel for Prototyping */}
        <AdminPrototypingPanel />
      </div>
    </UISettingsProvider>
  );
}

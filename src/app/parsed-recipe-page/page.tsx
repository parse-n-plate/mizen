'use client';
import { useRecipe } from '@/contexts/RecipeContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, use } from 'react';
import RecipeSkeleton from '@/components/ui/recipe-skeleton';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, Link, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scaleIngredients } from '@/utils/ingredientScaler';
import ClassicSplitView from '@/components/ClassicSplitView';
import IngredientCard from '@/components/ui/ingredient-card';
import { IngredientGroup } from '@/components/ui/ingredient-group';
import { ServingsControls } from '@/components/ui/servings-controls';
import { MobileToolbar } from '@/components/ui/mobile-toolbar';
import { UISettingsProvider } from '@/contexts/UISettingsContext';
import { AdminPrototypingPanel } from '@/components/ui/admin-prototyping-panel';

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
  const router = useRouter();
  const [servings, setServings] = useState<number>(parsedRecipe?.servings || 4);
  const [multiplier, setMultiplier] = useState<string>('1x');
  const [activeTab, setActiveTab] = useState<string>('prep');
  const [copied, setCopied] = useState(false);

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
      <div className="bg-white min-h-screen relative max-w-full overflow-x-hidden mobile-toolbar-page-padding">
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
                        className="hidden md:flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors"
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
                      <h1 className="font-domine text-[36px] text-[#193d34] leading-[1.2] font-bold">
                        {parsedRecipe.title || 'Beef Udon'}
                      </h1>
                      
                      {/* Author and Source URL */}
                      {(parsedRecipe.author?.trim() || parsedRecipe.sourceUrl) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {parsedRecipe.author?.trim() && (
                            <p className="font-albert text-[16px] text-stone-400 leading-[1.4]">
                              by {parsedRecipe.author.trim()}
                            </p>
                          )}
                          {parsedRecipe.sourceUrl && (
                            <>
                              {parsedRecipe.author?.trim() && (
                                <span className="text-stone-400">•</span>
                              )}
                              <div className="flex items-center gap-1 group">
                                <a
                                  href={parsedRecipe.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-albert text-[16px] text-stone-400 hover:text-[#193d34] transition-colors flex items-center gap-1"
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
                          )}
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
                      <p className="font-albert text-[16px] text-stone-500 leading-[1.4]">
                        {formatTimeDisplay(
                          parsedRecipe.prepTimeMinutes,
                          parsedRecipe.cookTimeMinutes,
                          parsedRecipe.totalTimeMinutes,
                          parsedRecipe.servings ?? servings
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="w-full">
                  {/* Tab List */}
                  <Tabs.List className="flex items-start w-full relative">
                    <Tabs.Trigger
                      value="prep"
                      className="group flex-1 h-[58px] flex items-center justify-center gap-2 px-0 py-0 relative transition-all duration-300 outline-none"
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
                      className="group flex-1 h-[58px] flex items-center justify-center gap-2 px-0 py-0 relative transition-all duration-300 outline-none"
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
                      className="group flex-1 h-[58px] flex items-center justify-center gap-2 px-0 py-0 relative transition-all duration-300 outline-none"
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
                      className="bg-white"
                    >
                      <div className="p-6 space-y-6">
                        {/* Servings Adjuster and Multiplier Container */}
                        {/* Hidden on mobile - available in mobile toolbar instead */}
                        <div className="servings-controls-desktop-only">
                          <ServingsControls
                            servings={servings}
                            onServingsChange={handleServingsChange}
                            multiplier={multiplier}
                            onMultiplierChange={handleMultiplierChange}
                          />
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

                                            return (
                                              <IngredientCard
                                                key={index}
                                                ingredient={ingredient}
                                                description={undefined}
                                                isLast={isLast}
                                                recipeSteps={normalizedSteps.map(s => ({ instruction: s.detail }))}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => 
                                                  handleIngredientCheck(groupName, ingredientName, checked)
                                                }
                                                isExpanded={isExpanded}
                                                onExpandChange={(expanding) => 
                                                  handleIngredientExpand(groupName, ingredientName, expanding)
                                                }
                                              />
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
        
        {/* Mobile Toolbar - Fixed bottom navigation for quick actions */}
        {/* Only visible on mobile screens (< 768px) */}
        <MobileToolbar 
          servings={servings}
          onServingsChange={handleServingsChange}
        />
        
        {/* Admin Panel for Prototyping */}
        <AdminPrototypingPanel />
      </div>
    </UISettingsProvider>
  );
}

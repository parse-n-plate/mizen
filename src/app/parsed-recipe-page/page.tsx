'use client';
import { useRecipe } from '@/contexts/RecipeContext';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, use, useRef } from 'react';
import RecipeSkeleton from '@/components/ui/recipe-skeleton';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, Copy, Check, Clock } from 'lucide-react';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import Settings from '@solar-icons/react/csr/settings/Settings';
import LinkIcon from '@solar-icons/react/csr/text-formatting/Link';
import TrashBinTrash from '@solar-icons/react/csr/ui/TrashBinTrash';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { scaleIngredients } from '@/utils/ingredientScaler';
import { convertIngredientGroupUnits, type UnitSystem } from '@/utils/unitConverter';
import ClassicSplitView from '@/components/ClassicSplitView';
import IngredientCard from '@/components/ui/ingredient-card';
import { IngredientGroup } from '@/components/ui/ingredient-group';
import { IngredientsHeader } from '@/components/ui/ingredients-header';
import { UISettingsProvider } from '@/contexts/UISettingsContext';

import { CUISINE_ICON_MAP } from '@/config/cuisineConfig';
import Image from 'next/image';
import ImagePreview from '@/components/ui/image-preview';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { convertTextFractionsToSymbols } from '@/lib/utils';
import PlatePhotoCapture from '@/components/ui/plate-photo-capture';
import PlatingGuidanceCard from '@/components/ui/plating-guidance-card';
import StorageGuidanceCard from '@/components/ui/storage-guidance-card';
import IngredientsOverlay from '@/components/ui/ingredients-overlay';
import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/useIsMobile';

// Helper function to extract domain from URL for display
const getDomainFromUrl = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    return url;
  }
};

// Helper function to format minutes as hours and minutes
// Converts minutes to a readable format: "11h 15min" for 675 minutes, or "45min" for less than 60 minutes
const formatMinutesAsHours = (minutes: number): string => {
  // If less than 60 minutes, just show minutes
  if (minutes < 60) {
    return `${minutes}min`;
  }
  
  // Calculate hours and remaining minutes
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  // If there are remaining minutes, show both hours and minutes
  if (remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}min`;
  }
  
  // If it's exactly a whole number of hours, just show hours
  return `${hours}h`;
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
  
  // Return formatted string, or "Time not specified" if no time or servings data
  const result = parts.join(' • ');
  return result || 'Time not specified';
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
// Converts text fractions to Unicode symbols (1/2 → ½)
const formatIngredient = (
  ingredient: string | { amount?: string; units?: string; ingredient: string } | null | undefined,
): string => {
  // Handle null or undefined
  if (ingredient === null || ingredient === undefined) {
    return '';
  }

  // Handle string ingredients
  if (typeof ingredient === 'string') {
    return convertTextFractionsToSymbols(ingredient);
  }

  // Handle object ingredients
  if (typeof ingredient === 'object') {
    // Check if it's an array (shouldn't happen, but handle it)
    if (Array.isArray(ingredient)) {
      return convertTextFractionsToSymbols(ingredient.join(', '));
    }

    // Handle ingredient objects with proper structure
    // Even if amount is missing, we should still try to format it
    if ('ingredient' in ingredient && ingredient.ingredient) {
      const parts = [];
      
      // Add amount if it exists and is valid (convert fractions to symbols)
      if (ingredient.amount && ingredient.amount.trim() && ingredient.amount !== 'as much as you like') {
        parts.push(convertTextFractionsToSymbols(ingredient.amount.trim()));
      }
      
      // Add units if they exist
      if (ingredient.units && ingredient.units.trim()) {
        parts.push(ingredient.units.trim());
      }
      
      // Always add the ingredient name (convert fractions to symbols)
      parts.push(convertTextFractionsToSymbols(ingredient.ingredient.trim()));
      
      return parts.join(' ');
    }

    // If it's an object but doesn't match expected structure, try to extract what we can
    // This handles edge cases where the structure might be different
    if ('ingredient' in ingredient) {
      return convertTextFractionsToSymbols(String(ingredient.ingredient || ''));
    }
  }

  // Fallback: try to convert to string safely
  try {
    return convertTextFractionsToSymbols(String(ingredient));
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
  
  const { parsedRecipe, setParsedRecipe, isLoaded } = useRecipe();
  const { recentRecipes, isBookmarked, toggleBookmark, removeRecipe, getBookmarkedRecipes } = useParsedRecipes();
  const router = useRouter();
  const { showMobileNav } = useSidebar();
  const isMobileViewport = useIsMobile();
  // #region agent log
  if (parsedRecipe) {
    fetch('http://127.0.0.1:7242/ingest/211f35f0-b7c4-4493-a3d1-13dbeecaabb1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'parsed-recipe-page/page.tsx:155',message:'parsedRecipe from context',data:{hasServings:'servings' in parsedRecipe,servings:parsedRecipe.servings,servingsType:typeof parsedRecipe.servings,servingsValue:parsedRecipe.servings,hasAuthor:'author' in parsedRecipe,author:parsedRecipe.author,keys:Object.keys(parsedRecipe)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
  }
  // #endregion
  // Store original servings from recipe (never changes) - use useMemo to preserve it
  const originalServings = useMemo(() => parsedRecipe?.servings, [parsedRecipe?.servings]);
  
  const [servings, setServings] = useState<number | undefined>(parsedRecipe?.servings);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/211f35f0-b7c4-4493-a3d1-13dbeecaabb1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'parsed-recipe-page/page.tsx:158',message:'servings state initialized',data:{servings,servingsType:typeof servings,parsedRecipeServings:parsedRecipe?.servings,parsedRecipeServingsType:typeof parsedRecipe?.servings,parsedRecipeExists:!!parsedRecipe},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const [multiplier, setMultiplier] = useState<string>('1x');
  const [activeTab, setActiveTab] = useState<string>('prep');
  const [copied, setCopied] = useState(false);

  // Unit system and scale modal state
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('original');
  const [customMultiplier, setCustomMultiplier] = useState<number>(1);
  const [ingredientScaleOverrides, setIngredientScaleOverrides] = useState<Record<string, number>>({});
  
  // Mobile detection for swipe gestures
  const [isMobile, setIsMobile] = useState(false);
  
  // Settings popover state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPlainText, setCopiedPlainText] = useState(false);
  
  // Bookmark success animation state - tracks when bookmark is just saved
  const [justBookmarked, setJustBookmarked] = useState(false);
  
  // Accessibility: respect user's reduced motion preference
  const shouldReduceMotion = useReducedMotion();

  // Ingredients overlay state
  const [isIngredientsOverlayOpen, setIsIngredientsOverlayOpen] = useState(false);

  // Find the recipe ID by matching sourceUrl across recents and bookmarks
  // This is needed because RecipeContext's parsedRecipe doesn't have an ID field
  const recipeId = useMemo(() => {
    if (!parsedRecipe?.sourceUrl) return null;
    const allRecipes = [...recentRecipes, ...getBookmarkedRecipes()];
    const matchingRecipe = allRecipes.find(
      (recipe) => recipe.sourceUrl === parsedRecipe.sourceUrl || recipe.url === parsedRecipe.sourceUrl
    );
    return matchingRecipe?.id || null;
  }, [parsedRecipe?.sourceUrl, recentRecipes, getBookmarkedRecipes]);

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
        'Are you sure you want to remove this recipe from your Cookbook? You can add it back later.'
      );
      
      if (confirmed) {
        toggleBookmark(recipeId);
      }
    } else {
      // If not bookmarked, just add the bookmark directly
      toggleBookmark(recipeId);
      // Trigger success animation when bookmarking (not when removing)
      setJustBookmarked(true);
      // Reset animation state after animation completes (400ms for the full animation)
      setTimeout(() => {
        setJustBookmarked(false);
      }, 400);
    }
  };

  // Keyboard shortcuts for tab navigation
  // Command+1: Prep, Command+2: Cook, Command+3: Plate
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Command (Mac) or Ctrl (Windows/Linux) is pressed
      const isModifierPressed = event.metaKey || event.ctrlKey;
      
      // Only handle shortcuts if modifier is pressed and not typing in an input/textarea
      if (isModifierPressed && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
        // Command+1: Switch to Prep tab
        if (event.key === '1') {
          event.preventDefault();
          setActiveTab('prep');
        }
        // Command+2: Switch to Cook tab
        else if (event.key === '2') {
          event.preventDefault();
          setActiveTab('cook');
        }
        // Command+3: Switch to Plate tab
        else if (event.key === '3') {
          event.preventDefault();
          setActiveTab('plate');
        }
      }
    };

    // Add event listener when component mounts
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup: remove event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Mobile detection for swipe gestures
  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === 'undefined') return;
    
    // Initial check
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on mount
    checkMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Swipe handlers for mobile tab navigation
  const handleSwipeLeft = () => {
    // Swipe left: navigate to next tab (prep → cook → plate)
    if (activeTab === 'prep') {
      setActiveTab('cook');
    } else if (activeTab === 'cook') {
      setActiveTab('plate');
    }
    // If already on plate, do nothing (stop at edge)
  };

  const handleSwipeRight = () => {
    // Swipe right: navigate to previous tab (plate → cook → prep)
    if (activeTab === 'plate') {
      setActiveTab('cook');
    } else if (activeTab === 'cook') {
      setActiveTab('prep');
    }
    // If already on prep, do nothing (stop at edge)
  };

  // Configure swipe handlers for mobile only
  // useSwipeable will recreate handlers when callbacks change
  const swipeHandlers = useSwipeable({
    onSwipedLeft: isMobile ? handleSwipeLeft : undefined,
    onSwipedRight: isMobile ? handleSwipeRight : undefined,
    preventScrollOnSwipe: true,
    trackMouse: false, // Only track touch events, not mouse
  });

  // --- Persistence & Progress State ---
  const recipeKey = useMemo(() => {
    if (!parsedRecipe) return '';
    return `recipe-progress-${parsedRecipe.title || 'untitled'}-${parsedRecipe.sourceUrl || ''}`;
  }, [parsedRecipe]);

  // Generate unique key for this recipe's scale settings
  const scaleSettingsKey = useMemo(() => {
    if (!parsedRecipe) return '';
    return `recipe-scale-${parsedRecipe.title || 'untitled'}-${parsedRecipe.sourceUrl || ''}`;
  }, [parsedRecipe]);

  // Map of groupName -> array of checked ingredient names
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, string[]>>({});
  // Map of groupName -> isCollapsed (true = collapsed)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  // Track which ingredient is currently expanded (accordion behavior - only one at a time)
  // Format: "groupName:ingredientName" or null if none expanded
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);
  // Search query for filtering ingredients
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState<string>('');

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

  // Load scale settings from localStorage
  useEffect(() => {
    if (!scaleSettingsKey) return;
    const saved = localStorage.getItem(scaleSettingsKey);
    if (saved) {
      try {
        const { unitSystem: savedUnitSystem, customMultiplier: savedCustomMultiplier, ingredientScaleOverrides: savedOverrides } = JSON.parse(saved);
        if (savedUnitSystem) setUnitSystem(savedUnitSystem);
        if (savedCustomMultiplier !== undefined) setCustomMultiplier(savedCustomMultiplier);
        if (savedOverrides) setIngredientScaleOverrides(savedOverrides);
      } catch (e) {
        console.error('Error loading scale settings:', e);
      }
    }
  }, [scaleSettingsKey]);

  // Save scale settings to localStorage
  useEffect(() => {
    if (!scaleSettingsKey) return;
    const data = { unitSystem, customMultiplier, ingredientScaleOverrides };
    localStorage.setItem(scaleSettingsKey, JSON.stringify(data));
  }, [scaleSettingsKey, unitSystem, customMultiplier, ingredientScaleOverrides]);

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


  // Handle copy link to original recipe
  const handleCopyLink = async () => {
    if (!parsedRecipe?.sourceUrl) return;

    try {
      await navigator.clipboard.writeText(parsedRecipe.sourceUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Handle copy recipe as plain text
  const handleCopyPlainText = async () => {
    if (!parsedRecipe) return;
    
    // Format recipe as plain text (similar to recipe-card.tsx)
    let text = '';
    
    // Title
    if (parsedRecipe.title) {
      text += `${parsedRecipe.title}\n\n`;
    }
    
    // Metadata
    if (parsedRecipe.author) {
      text += `By ${parsedRecipe.author}\n`;
    }
    if (parsedRecipe.sourceUrl) {
      text += `Source: ${parsedRecipe.sourceUrl}\n`;
    }
    if (parsedRecipe.prepTimeMinutes || parsedRecipe.cookTimeMinutes || parsedRecipe.servings) {
      text += '\n';
      if (parsedRecipe.prepTimeMinutes) text += `Prep: ${parsedRecipe.prepTimeMinutes} min\n`;
      if (parsedRecipe.cookTimeMinutes) text += `Cook: ${parsedRecipe.cookTimeMinutes} min\n`;
      if (parsedRecipe.servings) text += `Servings: ${parsedRecipe.servings}\n`;
    }
    
    // Ingredients
    if (scaledIngredients && scaledIngredients.length > 0) {
      text += '\n--- INGREDIENTS ---\n\n';
      scaledIngredients.forEach((group) => {
        if (group.groupName && group.groupName !== 'Main') {
          text += `${group.groupName}:\n`;
        }
        group.ingredients.forEach((ing) => {
          if (typeof ing === 'string') {
            text += `  ${ing}\n`;
          } else {
            const parts = [];
            if (ing.amount) parts.push(ing.amount);
            if (ing.units) parts.push(ing.units);
            parts.push(ing.ingredient);
            text += `  ${parts.join(' ')}\n`;
          }
        });
        text += '\n';
      });
    }
    
    // Instructions (convert fractions to symbols)
    if (parsedRecipe.instructions && parsedRecipe.instructions.length > 0) {
      text += '--- INSTRUCTIONS ---\n\n';
      parsedRecipe.instructions.forEach((instruction, index) => {
        if (typeof instruction === 'string') {
          text += `${index + 1}. ${convertTextFractionsToSymbols(instruction)}\n\n`;
        } else if (typeof instruction === 'object' && instruction !== null) {
          const inst = instruction as any;
          const title = convertTextFractionsToSymbols(inst.title || inst.step || `Step ${index + 1}`);
          const detail = convertTextFractionsToSymbols(inst.detail || inst.text || '');
          text += `${index + 1}. ${title}\n   ${detail}\n\n`;
        }
      });
    }
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPlainText(true);
      setTimeout(() => setCopiedPlainText(false), 2000);
    } catch (err) {
      console.error('Failed to copy recipe:', err);
    }
  };

  // Handle delete recipe - shows confirmation dialog before deleting
  const handleDeleteRecipe = () => {
    if (!recipeId) {
      // If recipe doesn't exist in recentRecipes, we can't delete it
      console.warn('Cannot delete recipe: recipe not found in recent recipes');
      return;
    }

    // Show confirmation dialog before deleting
    const confirmed = window.confirm(
      'Are you sure you want to delete this recipe? This action cannot be undone.'
    );

    if (confirmed) {
      // Remove recipe from storage and context
      removeRecipe(recipeId);

      // Navigate back to home page after deletion
      router.push('/');
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

    // If servings are unknown, return ingredients unscaled (but still apply unit conversion)
    if (!parsedRecipe.servings || !servings) {
      const unscaled = parsedRecipe.ingredients;
      // Apply unit conversion even if not scaling
      return convertIngredientGroupUnits(unscaled as any, unitSystem);
    }

    // Get multiplier value (1x = 1, 2x = 2, 3x = 3)
    const multiplierValue = parseInt(multiplier.replace('x', ''));

    // Calculate effective servings: base servings * multiplier * customMultiplier
    const effectiveServings = servings * multiplierValue * customMultiplier;

    // Cast the ingredients to the expected type for the scaler
    // The context type is slightly different but compatible structure-wise
    let scaled = scaleIngredients(
      parsedRecipe.ingredients as any,
      parsedRecipe.servings,
      effectiveServings
    );

    // Apply ingredient-specific overrides (not yet implemented in this iteration)
    // TODO: Apply ingredientScaleOverrides here if needed

    // Apply unit conversion
    scaled = convertIngredientGroupUnits(scaled as any, unitSystem);

    return scaled;
  }, [parsedRecipe, servings, multiplier, customMultiplier, unitSystem, ingredientScaleOverrides]);

  // Filter ingredients based on search query (searches name, amount, and units)
  const filteredIngredients = useMemo(() => {
    if (!ingredientSearchQuery.trim()) {
      return scaledIngredients;
    }

    const queryLower = ingredientSearchQuery.toLowerCase().trim();
    
    return scaledIngredients.map((group) => {
      const filteredGroupIngredients = group.ingredients.filter((ingredient) => {
        // Handle string format (just ingredient name)
        if (typeof ingredient === 'string') {
          return ingredient.toLowerCase().includes(queryLower);
        }
        
        // Handle object format - search across name, amount, and units
        const ingredientName = (ingredient.ingredient || '').toLowerCase();
        const amount = (ingredient.amount || '').toLowerCase();
        const units = (ingredient.units || '').toLowerCase();
        
        // Check if search query matches any part of the ingredient
        return (
          ingredientName.includes(queryLower) ||
          amount.includes(queryLower) ||
          units.includes(queryLower)
        );
      });

      // Only include groups that have matching ingredients
      if (filteredGroupIngredients.length === 0) {
        return null;
      }

      return {
        ...group,
        ingredients: filteredGroupIngredients,
      };
    }).filter((group): group is NonNullable<typeof group> => group !== null);
  }, [scaledIngredients, ingredientSearchQuery]);

  // Servings change handler - passed to ServingsControls component
  const handleServingsChange = (newServings: number) => {
    setServings(newServings);
  };

  // Multiplier change handler - passed to ServingsControls component
  const handleMultiplierChange = (newMultiplier: string) => {
    setMultiplier(newMultiplier);
  };

  // Reset to original servings handler - resets both servings and multiplier
  const handleResetServings = () => {
    if (originalServings !== undefined) {
      setServings(originalServings);
      setMultiplier('1x');
    }
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
      <TooltipProvider>
        <div className="bg-white min-h-screen relative max-w-full overflow-x-hidden pb-12 md:pb-16">
          <div className="transition-opacity duration-300 ease-in-out opacity-100">
            {/* Tabs Root - wraps both navigation and content */}
            <Tabs.Root 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
            {/* Header Section with #FAFAF9 Background */}
            <div className="bg-[#FAFAF9]">
              {/* Main Content Container with max-width */}
              <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-0">
                {/* Top Navigation Bar - Back arrow on left, Bookmark/Settings on right */}
                <div className="w-full mb-6 md:mb-8">
                  <div className="flex items-center justify-between">
                    {/* Back Button - Visible on all screen sizes */}
                    <button
                      onClick={() => {
                        if (isMobileViewport) {
                          showMobileNav();
                        } else {
                          router.push('/');
                        }
                      }}
                      className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors cursor-pointer group"
                      aria-label="Back to Home"
                    >
                      <ArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
                      {/* Desktop: Show "Back to Home" text, Mobile: Show "Menu" */}
                      <span className="hidden md:inline font-albert text-[14px] font-medium">Back to Home</span>
                      <span className="md:hidden font-albert text-[14px] font-medium">Menu</span>
                    </button>
                    
                    {/* Bookmark and Settings Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Bookmark Button */}
                      {recipeId && (
                        <motion.button
                          onClick={handleBookmarkToggle}
                          className={`flex-shrink-0 p-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 cursor-pointer ${justBookmarked && !shouldReduceMotion ? 'bookmark-just-saved' : ''}`}
                          aria-label={isBookmarkedState ? 'Remove from Cookbook' : 'Add to Cookbook'}
                          initial={{ scale: 1, rotate: 0 }}
                          whileHover={shouldReduceMotion ? {} : { 
                            scale: 1.08,
                            rotate: -3,
                            transition: { 
                              duration: 0.2, 
                              ease: [0.25, 0.46, 0.45, 0.94] // ease-out-quad
                            }
                          }}
                          whileTap={shouldReduceMotion ? {} : { 
                            scale: 0.97,
                            rotate: 0,
                            transition: { duration: 0.1 }
                          }}
                          animate={justBookmarked && !shouldReduceMotion ? {
                            scale: [1, 1.15, 1.05, 1],
                            rotate: [0, -8, 6, -2, 0],
                            transition: {
                              duration: 0.4,
                              ease: [0.23, 1, 0.32, 1] // ease-out-quint for playful feel
                            }
                          } : { scale: 1, rotate: 0 }}
                        >
                          <Bookmark
                            className={`
                              w-6 h-6 transition-colors duration-200
                              ${isBookmarkedState
                                ? 'fill-stone-600 text-stone-600'
                                : 'fill-none text-stone-400 hover:text-stone-600'
                              }
                            `}
                          />
                        </motion.button>
                      )}
                      
                      {/* Settings Button and Popover */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <motion.button
                            className="p-2 rounded-full transition-colors text-stone-400 hover:bg-stone-50 data-[state=open]:bg-stone-100 data-[state=open]:text-stone-900"
                            aria-label="Recipe settings"
                            initial={{ scale: 1, rotate: 0 }}
                            whileHover={shouldReduceMotion ? {} : {
                              scale: 1.08,
                              rotate: 3,
                              transition: {
                                duration: 0.2,
                                ease: [0.25, 0.46, 0.45, 0.94]
                              }
                            }}
                            whileTap={shouldReduceMotion ? {} : {
                              scale: 0.97,
                              rotate: 0,
                              transition: { duration: 0.1 }
                            }}
                            animate={{ scale: 1, rotate: 0 }}
                          >
                            <Settings weight="Bold" className="w-6 h-6" />
                          </motion.button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60">
                          <DropdownMenuItem onSelect={handleCopyLink}>
                            <span className={copiedLink ? 'text-green-600 font-medium' : ''}>
                              {copiedLink ? 'Link copied' : 'Copy link'}
                            </span>
                            {copiedLink && <Check className="w-4 h-4 text-green-600 ml-auto" />}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={handleCopyPlainText}>
                            <span className={copiedPlainText ? 'text-green-600 font-medium' : ''}>
                              {copiedPlainText ? 'Recipe copied' : 'Copy recipe'}
                            </span>
                            {copiedPlainText && <Check className="w-4 h-4 text-green-600 ml-auto" />}
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            <span className="text-stone-400">Download Recipe as JPG</span>
                          </DropdownMenuItem>
                          {recipeId && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={handleDeleteRecipe} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                <span>Delete Recipe</span>
                                <TrashBinTrash weight="Bold" className="w-4 h-4 ml-auto" style={{ fill: 'currentColor' }} />
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Recipe Info Section - Reordered to match Figma layout */}
                <div className="w-full pb-8 md:pb-12">
                  <div className="flex flex-col gap-4 md:gap-5">
                    {/* Recipe Title - Full width, on its own line */}
                    <h1 className="font-domine text-[32px] md:text-[42px] text-[#0C0A09] leading-[1.15] font-bold tracking-tight">
                      {parsedRecipe.title || 'Untitled Recipe'}
                    </h1>
                    
                    {/* Author - Below title */}
                    {parsedRecipe.author?.trim() && (
                      <p className="font-albert text-[15px] md:text-[16px] text-stone-500 leading-[1.4] font-medium">
                        <span className="text-stone-400 font-normal">by</span> {parsedRecipe.author.trim()}
                      </p>
                    )}
                    
                    {/* AI-Generated Summary/Description - Below author */}
                    {parsedRecipe.summary?.trim() && (
                      <p className="font-albert text-[16px] md:text-[17px] text-stone-600 leading-[1.6] italic max-w-3xl">
                        {parsedRecipe.summary.trim()}
                      </p>
                    )}
                    
                    {/* Source URL / Image Preview - Below description */}
                    {(parsedRecipe.sourceUrl || parsedRecipe.imageData) && (
                      <div className="flex items-center gap-1 group">
                        {/* Show ImagePreview for uploaded images, otherwise show source URL link */}
                        {parsedRecipe.imageData && parsedRecipe.sourceUrl?.startsWith('image:') ? (
                          <ImagePreview
                            imageData={parsedRecipe.imageData}
                            filename={parsedRecipe.imageFilename || 'recipe-image'}
                          />
                        ) : parsedRecipe.sourceUrl ? (
                          <>
                            <a
                              href={parsedRecipe.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-albert text-[15px] md:text-[16px] text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer underline-offset-4 hover:underline decoration-stone-300"
                              aria-label={`View original recipe on ${getDomainFromUrl(parsedRecipe.sourceUrl)}`}
                            >
                              <LinkIcon className="w-3.5 h-3.5 text-stone-400" />
                              {getDomainFromUrl(parsedRecipe.sourceUrl)}
                            </a>
                            
                            {/* Simple Copy Button - slides out from under URL on hover */}
                            <button
                              className="opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-150 p-1 flex items-center justify-center cursor-pointer ml-1"
                              onClick={() => handleCopy(parsedRecipe.sourceUrl || '')}
                              title="Copy recipe URL"
                            >
                              <AnimatePresence mode="wait">
                                {copied ? (
                                  <motion.div
                                    key="check"
                                    initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                  >
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="copy"
                                    initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                  >
                                    <Copy className="w-3.5 h-3.5 text-stone-400" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </button>
                          </>
                        ) : null}
                      </div>
                    )}
                    
                    {/* Time, Servings and Cuisine - Below source link, no border-top */}
                    <div className="flex items-center gap-3 flex-wrap pt-2">
                      {/* Time and Servings Cards - Vertical layout with label on top, value below */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Prep Time Card */}
                        {parsedRecipe.prepTimeMinutes !== undefined && parsedRecipe.prepTimeMinutes !== null && parsedRecipe.prepTimeMinutes > 0 && (
                          <div className="flex flex-col bg-stone-200/30 px-3 py-2 rounded-lg border border-stone-200/50 min-w-[80px]">
                            <p className="font-albert text-[12px] md:text-[13px] text-stone-500 leading-tight mb-0.5">
                              Prep
                            </p>
                            <p className="font-albert text-[15px] md:text-[16px] text-stone-700 leading-tight font-semibold">
                              {parsedRecipe.prepTimeMinutes} min
                            </p>
                          </div>
                        )}
                        
                        {/* Cook Time Card */}
                        {parsedRecipe.cookTimeMinutes !== undefined && parsedRecipe.cookTimeMinutes !== null && parsedRecipe.cookTimeMinutes > 0 && (
                          <div className="flex flex-col bg-stone-200/30 px-3 py-2 rounded-lg border border-stone-200/50 min-w-[80px]">
                            <p className="font-albert text-[12px] md:text-[13px] text-stone-500 leading-tight mb-0.5">
                              Cooking
                            </p>
                            <p className="font-albert text-[15px] md:text-[16px] text-stone-700 leading-tight font-semibold">
                              {parsedRecipe.cookTimeMinutes} min
                            </p>
                          </div>
                        )}
                        
                        {/* Total Time Card - only show if prep and cook aren't both available */}
                        {parsedRecipe.totalTimeMinutes !== undefined && parsedRecipe.totalTimeMinutes !== null && parsedRecipe.totalTimeMinutes > 0 && !parsedRecipe.prepTimeMinutes && !parsedRecipe.cookTimeMinutes && (
                          <div className="flex flex-col bg-stone-200/30 px-3 py-2 rounded-lg border border-stone-200/50 min-w-[80px]">
                            <p className="font-albert text-[12px] md:text-[13px] text-stone-500 leading-tight mb-0.5">
                              Total
                            </p>
                            <p className="font-albert text-[15px] md:text-[16px] text-stone-700 leading-tight font-semibold">
                              {formatMinutesAsHours(parsedRecipe.totalTimeMinutes)}
                            </p>
                          </div>
                        )}
                        
                        {/* Servings Card - shows current servings (updated when scaled) */}
                        {/* Only show if originalServings is defined (we know the actual serving count) */}
                        {originalServings !== undefined && originalServings !== null && originalServings > 0 && servings !== undefined && servings !== null && servings > 0 && (
                          <div className="flex flex-col bg-stone-200/30 px-3 py-2 rounded-lg border border-stone-200/50 min-w-[80px]">
                            <p className="font-albert text-[12px] md:text-[13px] text-stone-500 leading-tight mb-0.5">
                              Servings
                            </p>
                            <p className="font-albert text-[15px] md:text-[16px] text-stone-700 leading-tight font-semibold">
                              {servings}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Cuisine Badges */}
                      {parsedRecipe.cuisine && parsedRecipe.cuisine.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {parsedRecipe.cuisine.map((cuisineName) => {
                            const iconPath = CUISINE_ICON_MAP[cuisineName];
                            if (!iconPath) return null;
                            return (
                              <div
                                key={cuisineName}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-200/30 border border-stone-200/50 hover:border-stone-300 transition-colors"
                                title={cuisineName}
                              >
                                <Image
                                  src={iconPath}
                                  alt={`${cuisineName} cuisine icon`}
                                  width={18}
                                  height={18}
                                  quality={100}
                                  unoptimized={true}
                                  className="w-4.5 h-4.5 object-contain"
                                />
                                <span className="font-albert text-[14px] font-medium text-stone-700">
                                  {cuisineName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation - Edge-to-edge on mobile/tablet, padded on desktop */}
              <div className="w-full">
                {/* Tab List Container - Responsive padding: edge-to-edge on mobile/tablet, padded on desktop */}
                <div className="md:px-8">
                  <div className="max-w-6xl mx-auto">
                    <Tabs.List className="flex items-end w-full relative">
                      <Tabs.Trigger
                        value="prep"
                        className="folder-tab-trigger group flex-1 h-[58px] md:h-[64px]"
                      >
                        <motion.div
                          className="relative shrink-0 w-8 h-8 md:w-9 md:h-9 group-hover:scale-105 group-hover:rotate-[-5deg] transition-transform duration-200"
                        >
                          <img
                            alt="Prep icon"
                            className={`absolute inset-0 w-full h-full object-contain ${activeTab === 'prep' ? '' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}
                            src="/assets/icons/Prep_Icon.png"
                          />
                        </motion.div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`font-albert font-medium text-[15px] md:text-[16px] ${activeTab === 'prep' ? 'text-[#0C0A09]' : 'text-[#79716b] group-hover:text-[#0C0A09]'}`}>
                              Prep
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <span>⌘1</span>
                          </TooltipContent>
                        </Tooltip>
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="cook"
                        className="folder-tab-trigger group flex-1 h-[58px] md:h-[64px]"
                      >
                        <motion.div
                          className="relative shrink-0 w-8 h-8 md:w-9 md:h-9 group-hover:scale-105 group-hover:rotate-[5deg] transition-transform duration-200"
                        >
                          <img
                            alt="Cook icon"
                            className={`absolute inset-0 w-full h-full object-contain ${activeTab === 'cook' ? '' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}
                            src="/assets/icons/Cook_Icon.png"
                          />
                        </motion.div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`font-albert font-medium text-[15px] md:text-[16px] ${activeTab === 'cook' ? 'text-[#0C0A09]' : 'text-[#79716b] group-hover:text-[#0C0A09]'}`}>
                              Cook
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <span>⌘2</span>
                          </TooltipContent>
                        </Tooltip>
                      </Tabs.Trigger>
                      <Tabs.Trigger
                        value="plate"
                        className="folder-tab-trigger group flex-1 h-[58px] md:h-[64px]"
                      >
                        <motion.div
                          className="relative shrink-0 w-8 h-8 md:w-9 md:h-9 group-hover:scale-105 group-hover:rotate-[-3deg] transition-transform duration-200"
                        >
                          <img
                            alt="Plate icon"
                            className={`absolute inset-0 w-full h-full object-contain ${activeTab === 'plate' ? '' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}
                            src="/assets/icons/Plate_Icon.png"
                          />
                        </motion.div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`font-albert font-medium text-[15px] md:text-[16px] ${activeTab === 'plate' ? 'text-[#0C0A09]' : 'text-[#79716b] group-hover:text-[#0C0A09]'}`}>
                              Plate
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <span>⌘3</span>
                          </TooltipContent>
                        </Tooltip>
                      </Tabs.Trigger>
                    </Tabs.List>
                  </div>
                </div>
              </div>
              {/* Full-width border underneath header */}
              <div className="w-full"></div>
            </div>

            {/* Main Content - Tab Content Sections */}
            <div 
              {...swipeHandlers}
              className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12"
            >
              <AnimatePresence mode="wait">
                {/* Prep Tab Content */}
                {activeTab === 'prep' && (
                  <Tabs.Content value="prep" key="prep" className="space-y-0 outline-none" forceMount>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="bg-white cursor-default"
                    >
                      <div className="max-w-[700px] mx-auto space-y-6">
                        {/* Ingredients Header with Servings Slider */}
                        <IngredientsHeader
                          unitSystem={unitSystem}
                          onUnitSystemChange={setUnitSystem}
                          servings={servings}
                          originalServings={originalServings}
                          onServingsChange={handleServingsChange}
                          searchQuery={ingredientSearchQuery}
                          onSearchChange={setIngredientSearchQuery}
                        />

                        {/* Ingredients */}
                        <div className="bg-white cursor-default">
                          {Array.isArray(filteredIngredients) &&
                            filteredIngredients.map(
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
                                                  recipeSteps={normalizedSteps.map(s => ({ instruction: s.detail, title: s.step }))}
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
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="w-full -mx-4 md:-mx-8 flex flex-col items-center"
                    >
                      <div className="w-full max-w-[700px]">
                        <ClassicSplitView
                          title={parsedRecipe.title}
                          allIngredients={flattenedIngredients}
                          steps={normalizedSteps}
                        />
                      </div>
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
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="bg-white"
                    >
                      <div className="max-w-[700px] mx-auto space-y-6">
                        {/* Plating Suggestions - use top-level plating from initial parse, fallback to plate for backward compat */}
                        <PlatingGuidanceCard
                          platingNotes={parsedRecipe.platingNotes || parsedRecipe.plate?.platingNotes}
                          servingVessel={parsedRecipe.servingVessel || parsedRecipe.plate?.servingVessel}
                          servingTemp={parsedRecipe.servingTemp || parsedRecipe.plate?.servingTemp}
                          onNotesChange={(notes) => {
                            setParsedRecipe({
                              ...parsedRecipe,
                              id: parsedRecipe.id || recipeId || undefined,
                              plate: {
                                ...parsedRecipe.plate,
                                platingNotes: notes,
                              },
                            });
                          }}
                        />

                        {/* Storage Guidance - use top-level storage from initial parse, fallback to plate for backward compat */}
                        <StorageGuidanceCard
                          storageGuide={parsedRecipe.storageGuide || parsedRecipe.plate?.storageGuide}
                          shelfLife={parsedRecipe.shelfLife || parsedRecipe.plate?.shelfLife}
                          storedAt={parsedRecipe.plate?.storedAt}
                          onMarkAsStored={() => {
                            setParsedRecipe({
                              ...parsedRecipe,
                              id: parsedRecipe.id || recipeId || undefined,
                              plate: {
                                ...parsedRecipe.plate,
                                storedAt: new Date().toISOString(),
                              },
                            });
                          }}
                          onResetStorage={() => {
                            setParsedRecipe({
                              ...parsedRecipe,
                              id: parsedRecipe.id || recipeId || undefined,
                              plate: {
                                ...parsedRecipe.plate,
                                storedAt: undefined,
                              },
                            });
                          }}
                        />

                        {/* Photo Capture Section */}
                        <PlatePhotoCapture
                          photos={(() => {
                            // Use new photos array if available, otherwise migrate legacy photoData
                            const existingPhotos = parsedRecipe.plate?.photos || [];

                            // If we have legacy photoData but no photos array, migrate it
                            if (existingPhotos.length === 0 && parsedRecipe.plate?.photoData) {
                              return [{
                                data: parsedRecipe.plate.photoData,
                                filename: parsedRecipe.plate.photoFilename || 'dish.jpg',
                                capturedAt: parsedRecipe.plate.capturedAt || new Date().toISOString(),
                              }];
                            }

                            return existingPhotos;
                          })()}
                          recipeTitle={parsedRecipe.title}
                          recipeAuthor={parsedRecipe.author}
                          cuisine={parsedRecipe.cuisine}
                          onShare={() => {
                            // Track share
                            const sharedAt = parsedRecipe.plate?.sharedAt || [];
                            const shareCount = (parsedRecipe.plate?.shareCount || 0) + 1;
                            setParsedRecipe({
                              ...parsedRecipe,
                              id: parsedRecipe.id || recipeId || undefined,
                              plate: {
                                ...parsedRecipe.plate,
                                sharedAt: [...sharedAt, new Date().toISOString()],
                                shareCount,
                              },
                            });
                          }}
                          onPhotoCapture={async (photoData, filename, rating) => {
                            console.log('[RecipePage] 📸 Photo captured:', {
                              parsedRecipeId: parsedRecipe.id,
                              computedRecipeId: recipeId,
                              hasRecipeId: !!parsedRecipe.id || !!recipeId,
                              photoDataLength: photoData.length,
                              filename,
                            });

                            // Get existing photos array or migrate legacy data
                            const existingPhotos = parsedRecipe.plate?.photos || [];
                            const legacyPhoto = parsedRecipe.plate?.photoData && !existingPhotos.length
                              ? [{
                                  data: parsedRecipe.plate.photoData,
                                  filename: parsedRecipe.plate.photoFilename || 'dish.jpg',
                                  capturedAt: parsedRecipe.plate.capturedAt || new Date().toISOString(),
                                }]
                              : [];

                            const currentPhotos = existingPhotos.length > 0 ? existingPhotos : legacyPhoto;

                            // Add new photo to the array with rating
                            const newPhoto = {
                              data: photoData,
                              filename,
                              capturedAt: new Date().toISOString(),
                              rating, // Include rating from the flow
                            };
                            const updatedPhotos = [...currentPhotos, newPhoto];

                            // Immediately update with new photo
                            setParsedRecipe({
                              ...parsedRecipe,
                              id: parsedRecipe.id || recipeId || undefined,
                              plate: {
                                ...parsedRecipe.plate,
                                photos: updatedPhotos,
                                // Clear legacy fields after migration
                                photoData: undefined,
                                photoFilename: undefined,
                                capturedAt: undefined,
                              },
                            });

                            // Generate AI guidance only for first photo
                            if (currentPhotos.length === 0) {
                              try {
                                const response = await fetch('/api/generatePlatingGuidance', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    recipeTitle: parsedRecipe.title,
                                    ingredients: parsedRecipe.ingredients,
                                    instructions: parsedRecipe.instructions,
                                  }),
                                });

                                if (response.ok) {
                                  const { data } = await response.json();
                                  console.log('[RecipePage] 🤖 AI guidance generated:', data);

                                  // Update recipe with AI-generated guidance
                                  setParsedRecipe({
                                    ...parsedRecipe,
                                    id: parsedRecipe.id || recipeId || undefined,
                                    plate: {
                                      ...parsedRecipe.plate,
                                      photos: updatedPhotos,
                                      platingNotes: data.platingNotes,
                                      servingVessel: data.servingVessel,
                                      servingTemp: data.servingTemp,
                                      storageGuide: data.storageGuide,
                                      shelfLife: data.shelfLife,
                                    },
                                  });
                                }
                              } catch (error) {
                                console.error('[RecipePage] ❌ Failed to generate AI guidance:', error);
                                // Photo is already saved, just continue without AI guidance
                              }
                            }
                          }}
                          onPhotoRemove={(index) => {
                            // Get current photos array
                            const existingPhotos = parsedRecipe.plate?.photos || [];

                            // Remove photo at index
                            const updatedPhotos = existingPhotos.filter((_, i) => i !== index);

                            setParsedRecipe({
                              ...parsedRecipe,
                              id: parsedRecipe.id || recipeId || undefined,
                              plate: {
                                ...parsedRecipe.plate,
                                photos: updatedPhotos,
                              },
                            });
                          }}
                          onPhotoRatingUpdate={(index, rating) => {
                            // Get current photos array
                            const existingPhotos = parsedRecipe.plate?.photos || [];

                            // Update photo rating at index
                            const updatedPhotos = existingPhotos.map((photo, i) => 
                              i === index ? { ...photo, rating } : photo
                            );

                            setParsedRecipe({
                              ...parsedRecipe,
                              id: parsedRecipe.id || recipeId || undefined,
                              plate: {
                                ...parsedRecipe.plate,
                                photos: updatedPhotos,
                              },
                            });
                          }}
                        />
                      </div>
                    </motion.div>
                  </Tabs.Content>
                )}
              </AnimatePresence>
            </div>
          </Tabs.Root>
        </div>

        {/* Ingredients Overlay - Modal (desktop) / Drawer (mobile) */}
        <IngredientsOverlay
          isOpen={isIngredientsOverlayOpen}
          onClose={() => setIsIngredientsOverlayOpen(false)}
          ingredients={scaledIngredients}
        />
      </div>
      </TooltipProvider>
    </UISettingsProvider>
  );
}

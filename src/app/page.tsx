'use client';

import HomepageSkeleton from '@/components/ui/homepage-skeleton';
import CuisinePills from '@/components/ui/cuisine-pills';
import { RecipeCardData } from '@/components/ui/recipe-card';
import HomepageSearch from '@/components/ui/homepage-search';
import HomepageRecentRecipes from '@/components/ui/homepage-recent-recipes';
import HomepageBanner from '@/components/ui/homepage-banner';
import { useState, useEffect, useMemo, Suspense, use, useRef } from 'react';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useRouter } from 'next/navigation';
import type { CuisineType } from '@/components/ui/cuisine-pills';
import Image from 'next/image';
import { CUISINE_ICON_MAP } from '@/config/cuisineConfig';
import { Search, X, Camera } from 'lucide-react';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import MenuDotsCircle from '@solar-icons/react/csr/ui/MenuDotsCircle';
import Pen from '@solar-icons/react/csr/messages/Pen';
import ClipboardText from '@solar-icons/react/csr/notes/ClipboardText';

// Recipe List Item Component for List View
interface RecipeListItemProps {
  recipe: RecipeCardData;
  onClick: () => void;
  isBookmarked: boolean;
  onBookmarkToggle: () => void;
  getRecipeById: (id: string) => any;
  onEdit?: () => void;
  onUnsave?: () => void;
}

function RecipeListItem({
  recipe,
  onClick,
  isBookmarked,
  onBookmarkToggle,
  getRecipeById,
  onEdit,
  onUnsave,
}: RecipeListItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copiedRecipe, setCopiedRecipe] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ vertical: 'top' | 'bottom'; horizontal: 'left' | 'right' }>({
    vertical: 'bottom',
    horizontal: 'right',
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Format time display
  const formatTime = (minutes?: number) => {
    if (!minutes) return '-- min';
    return `${minutes} min`;
  };
  
  // Determine which time to show (prefer totalTime, fallback to cookTime, then prepTime)
  // Returns null if no time data is available (so we can conditionally render the pill)
  const displayTime = recipe.totalTimeMinutes 
    ? formatTime(recipe.totalTimeMinutes)
    : recipe.cookTimeMinutes 
    ? formatTime(recipe.cookTimeMinutes)
    : recipe.prepTimeMinutes 
    ? formatTime(recipe.prepTimeMinutes)
    : null;

  // Calculate menu position based on available viewport space
  useEffect(() => {
    if (!isMenuOpen || !buttonRef.current) return;

    const calculatePosition = () => {
      if (!buttonRef.current) return;
      
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate available space
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const spaceRight = viewportWidth - buttonRect.right;
      const spaceLeft = buttonRect.left;
      
      // Menu dimensions
      const menuHeight = 150; // Approximate height for 3 items + padding
      const menuWidth = 240; // w-60 = 240px
      const offset = 8; // Gap between button and menu
      
      // Determine vertical position - prefer bottom, but flip to top if not enough space
      const vertical = spaceBelow >= menuHeight + offset || spaceBelow >= spaceAbove ? 'bottom' : 'top';
      
      // Determine horizontal position - prefer right, but flip to left if not enough space
      // Check if menu would overflow on the right side
      const horizontal = spaceRight >= menuWidth || (spaceRight < menuWidth && spaceLeft >= menuWidth) ? 'right' : 'left';
      
      setMenuPosition({ vertical, horizontal });
    };

    // Small delay to ensure DOM is ready, then calculate position
    const timeoutId = setTimeout(calculatePosition, 0);
    
    // Recalculate on window resize or scroll
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [isMenuOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Handle bookmark toggle
  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBookmarkToggle();
  };

  // Handle menu toggle
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle edit
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    onEdit?.();
  };

  // Handle unsave
  const handleUnsave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onUnsave) {
      onUnsave();
    } else {
      // Fallback to bookmark toggle if onUnsave not provided
      onBookmarkToggle();
    }
  };

  // Handle copy recipe
  const handleCopyRecipe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    
    const fullRecipe = getRecipeById(recipe.id);
    if (!fullRecipe) {
      console.warn('Recipe not found for copying');
      return;
    }
    
    // Format recipe as plain text
    let text = '';
    
    if (fullRecipe.title) {
      text += `${fullRecipe.title}\n\n`;
    }
    
    if (fullRecipe.author) {
      text += `By ${fullRecipe.author}\n`;
    }
    if (fullRecipe.sourceUrl) {
      text += `Source: ${fullRecipe.sourceUrl}\n`;
    }
    if (fullRecipe.prepTimeMinutes || fullRecipe.cookTimeMinutes || fullRecipe.servings) {
      text += '\n';
      if (fullRecipe.prepTimeMinutes) text += `Prep: ${fullRecipe.prepTimeMinutes} min\n`;
      if (fullRecipe.cookTimeMinutes) text += `Cook: ${fullRecipe.cookTimeMinutes} min\n`;
      if (fullRecipe.servings) text += `Servings: ${fullRecipe.servings}\n`;
    }
    
    if (fullRecipe.ingredients && fullRecipe.ingredients.length > 0) {
      text += '\n--- INGREDIENTS ---\n\n';
      fullRecipe.ingredients.forEach((group: any) => {
        if (group.groupName && group.groupName !== 'Main') {
          text += `${group.groupName}:\n`;
        }
        group.ingredients.forEach((ing: any) => {
          const parts = [];
          if (ing.amount) parts.push(ing.amount);
          if (ing.units) parts.push(ing.units);
          parts.push(ing.ingredient);
          text += `  ${parts.join(' ')}\n`;
        });
        text += '\n';
      });
    }
    
    if (fullRecipe.instructions && fullRecipe.instructions.length > 0) {
      text += '--- INSTRUCTIONS ---\n\n';
      fullRecipe.instructions.forEach((instruction: any, index: number) => {
        if (typeof instruction === 'string') {
          text += `${index + 1}. ${instruction}\n\n`;
        } else if (typeof instruction === 'object' && instruction !== null) {
          const inst = instruction as any;
          const title = inst.title || `Step ${index + 1}`;
          const detail = inst.detail || inst.text || '';
          text += `${index + 1}. ${title}\n   ${detail}\n\n`;
        }
      });
    }
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRecipe(true);
      setTimeout(() => setCopiedRecipe(false), 2000);
    } catch (err) {
      console.error('Failed to copy recipe:', err);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-4 py-4 px-4 -mx-4 group hover:bg-stone-50 rounded-lg transition-colors">
        {/* Cuisine Icon - Removed for saved recipes list view */}
        
        {/* Recipe Info - Clickable */}
        <button
          onClick={onClick}
          className="flex-1 flex items-center justify-between min-w-0 text-left"
        >
          <div className="flex-1 min-w-0">
            <h3 className="font-albert text-[16px] text-stone-900 font-medium group-hover:text-stone-700 transition-colors">
              {recipe.title}
            </h3>
            {recipe.author && (
              <p className="font-albert text-[14px] text-stone-500 mt-0.5">
                By {recipe.author}
              </p>
            )}
          </div>
        </button>
        
        {/* Right Side: Time Pill, Bookmark, More Options */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Time Display in Pill - only show if time data is available */}
          {displayTime && (
            <div className="px-3 py-1.5 bg-stone-100 rounded-full">
              <p className="font-albert text-[14px] text-stone-700">
                {displayTime}
              </p>
            </div>
          )}
          
          {/* Bookmark Button */}
          <button
            onClick={handleBookmarkToggle}
            className="p-1.5 rounded-full transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark recipe'}
          >
            <Bookmark
              className={`w-5 h-5 transition-colors ${
                isBookmarked 
                  ? 'fill-[#78716C] text-[#78716C]' 
                  : 'fill-[#D6D3D1] text-[#D6D3D1] hover:fill-[#A8A29E] hover:text-[#A8A29E]'
              }`}
            />
          </button>
          
          {/* More Options Button */}
          <div ref={menuRef} className="relative">
            <button
              ref={buttonRef}
              onClick={handleMenuToggle}
              className="p-1.5 rounded-full transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
              aria-label="More options"
              aria-expanded={isMenuOpen}
            >
              <MenuDotsCircle
                className={`w-5 h-5 transition-colors ${
                  isMenuOpen 
                    ? 'text-stone-500' 
                    : 'text-stone-300 hover:text-stone-400'
                }`}
              />
            </button>
            
            {/* Dropdown Menu - Origin-aware positioning */}
            {isMenuOpen && (
              <div
                ref={dropdownRef}
                onPointerDownCapture={(e) => e.stopPropagation()}
                onPointerUpCapture={(e) => e.stopPropagation()}
                className={`absolute w-60 bg-white rounded-lg border border-stone-200 shadow-xl p-1.5 z-[100] animate-in fade-in duration-200 ${
                  menuPosition.vertical === 'bottom'
                    ? 'top-[calc(100%+8px)] slide-in-from-top-2'
                    : 'bottom-[calc(100%+8px)] slide-in-from-bottom-2'
                } ${
                  menuPosition.horizontal === 'right'
                    ? 'right-0'
                    : 'left-0'
                }`}
              >
                {/* Edit Option */}
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors font-albert rounded-md"
                  >
                    <Pen weight="Bold" className="w-4 h-4 text-stone-500 flex-shrink-0" />
                    <span className="font-albert font-medium whitespace-nowrap">Edit</span>
                  </button>
                )}

                {/* Copy Recipe to Clipboard Option */}
                <button
                  onClick={handleCopyRecipe}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors font-albert rounded-md"
                >
                  <ClipboardText weight="Bold" className={`w-4 h-4 flex-shrink-0 ${copiedRecipe ? 'text-green-600' : 'text-stone-500'}`} />
                  <span className={`font-albert font-medium whitespace-nowrap ${copiedRecipe ? 'text-green-600' : ''}`}>
                    {copiedRecipe ? 'Copied to Clipboard' : 'Copy Recipe to Clipboard'}
                  </span>
                </button>

                {/* Unsave Option */}
                <button
                  onClick={handleUnsave}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors font-albert rounded-md"
                >
                  <Bookmark weight="Bold" className="w-4 h-4 text-stone-500 flex-shrink-0" />
                  <span className="font-albert font-medium whitespace-nowrap">Unsave</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeContent() {
  const {
    isLoaded,
    recentRecipes,
    getBookmarkedRecipes,
    getRecipeById,
    isBookmarked,
    toggleBookmark,
  } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPageLoaded, setIsPageLoaded] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [showCookedOnly, setShowCookedOnly] = useState<boolean>(false);

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
          id: fullRecipe.id, // Include recipe ID for syncing
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
          servings: fullRecipe.servings, // Include servings if available
          plate: fullRecipe.plate, // Include plate data if available
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
      platePhotoData: recipe.plate?.photoData, // Include plate photo if available
    };
  };

  // Get bookmarked recipes for the Saved Recipes section
  const bookmarkedRecipes = useMemo(() => {
    const recipes = getBookmarkedRecipes();
    console.log('[Homepage] 📚 Loading bookmarked recipes:', {
      count: recipes.length,
      recipesWithPhotos: recipes.filter(r => r.plate?.photoData).length,
      recipes: recipes.map(r => ({
        id: r.id,
        title: r.title,
        hasPlate: !!r.plate,
        hasPhoto: !!r.plate?.photoData,
        photoLength: r.plate?.photoData?.length || 0,
      })),
    });
    return recipes.map(convertToRecipeCardData);
  }, [getBookmarkedRecipes]);

  // Filter bookmarked recipes by selected cuisine, search query, and cooked status
  const filteredRecipes = useMemo(() => {
    console.log('[Homepage] 🍽️ Filtering bookmarked recipes by cuisine:', selectedCuisine);
    console.log('[Homepage] 🔍 Search query:', searchQuery);
    console.log('[Homepage] 📸 Show cooked only:', showCookedOnly);
    console.log('[Homepage] Available bookmarked recipes:', bookmarkedRecipes.map(r => ({ title: r.title, cuisine: r.cuisine, hasPlatePhoto: !!r.platePhotoData })));

    let filtered = bookmarkedRecipes;

    // Filter by cooked status (plate photo existence)
    if (showCookedOnly) {
      filtered = filtered.filter(recipe => {
        return !!recipe.platePhotoData;
      });
    }

    // Filter by cuisine (only if a cuisine is selected)
    if (selectedCuisine !== null) {
      filtered = filtered.filter(recipe => {
        const hasMatchingCuisine = recipe.cuisine && recipe.cuisine.includes(selectedCuisine);
        console.log(`[Homepage] Recipe "${recipe.title}": cuisine=${recipe.cuisine}, matches=${hasMatchingCuisine}`);
        return hasMatchingCuisine;
      });
    }

    // Filter by search query (title and author)
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(recipe => {
        const titleMatch = recipe.title.toLowerCase().includes(queryLower);
        const authorMatch = recipe.author?.toLowerCase().includes(queryLower) || false;
        return titleMatch || authorMatch;
      });
    }

    console.log('[Homepage] Filtered results:', filtered.length, 'bookmarked recipes match filters');
    return filtered;
  }, [selectedCuisine, searchQuery, showCookedOnly, bookmarkedRecipes]);

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
                    draggable="false"
                  />
                </span>
                <span className="flex items-center gap-2 md:gap-3">
                  <img 
                    src="/assets/Illustration Icons/Pan_Icon.png" 
                    alt="" 
                    className="hidden md:block w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex-shrink-0 object-contain"
                    aria-hidden="true"
                    draggable="false"
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

            {/* Search Bar - positioned between header and filter pills */}
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                {/* Search Bar Container */}
                <div className="relative flex-1">
                  {/* Pill-shaped container matching HomepageSearch design */}
                  <div 
                    className={`bg-[#fafaf9] flex h-10 items-center px-4 py-2 relative rounded-[999px] w-full transition-all group ${
                      isSearchFocused ? 'bg-white shadow-[0_0_0_3px_rgba(0,114,251,0.15)]' : ''
                    }`}
                  >
                    {/* Border overlay - changes color on focus */}
                    <div 
                      aria-hidden="true" 
                      className={`absolute border-2 border-solid inset-0 pointer-events-none rounded-[999px] transition-all ${
                        isSearchFocused ? 'border-[#0072fb]' : 'border-[#e7e5e4]'
                      }`} 
                    />
                    
                    {/* Search Icon */}
                    <Search className={`h-4 w-4 transition-colors flex-shrink-0 ${
                      isSearchFocused ? 'text-[#0072fb]' : 'text-[#78716c]'
                    }`} />
                    
                    {/* Input Field */}
                    <input
                      type="text"
                      placeholder="Search saved recipes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      className="flex-1 ml-3 bg-transparent font-albert text-[14px] text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-0 h-full leading-none"
                    />
                    
                    {/* Clear Button */}
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="ml-2 flex-shrink-0 text-stone-400 hover:text-stone-600 transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Cuisine Filter Pills now sit below the search bar */}
            <div className="mb-6 md:mb-8">
              <CuisinePills onCuisineChange={handleCuisineChange} />
            </div>

            {/* Cooked Dishes Only Toggle */}
            <div className="mb-6 md:mb-8 flex items-center gap-2">
              <button
                onClick={() => setShowCookedOnly(!showCookedOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-albert text-[14px] font-medium transition-all ${
                  showCookedOnly
                    ? 'bg-[#0088ff] text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
                aria-label={showCookedOnly ? 'Show all recipes' : 'Show cooked dishes only'}
              >
                <Camera className="w-4 h-4" />
                <span>Cooked dishes only</span>
              </button>
              {showCookedOnly && (
                <span className="font-albert text-[13px] text-stone-500">
                  Showing recipes you've cooked
                </span>
              )}
            </div>

            {/* Recipe List View */}
            <div className="flex flex-col">
              {filteredRecipes.map((recipe, index) => (
                <RecipeListItem
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => handleRecipeClick(recipe.id)}
                  isBookmarked={isBookmarked(recipe.id)}
                  onBookmarkToggle={() => {
                    if (isBookmarked(recipe.id)) {
                      const confirmed = window.confirm(
                        'Are you sure you want to remove this recipe from your bookmarks? You can bookmark it again later.'
                      );
                      if (confirmed) {
                        toggleBookmark(recipe.id);
                      }
                    } else {
                      toggleBookmark(recipe.id);
                    }
                  }}
                  getRecipeById={getRecipeById}
                />
              ))}
            </div>

            {/* Show message if no recipes match filter (but only if there are bookmarked recipes available) */}
            {filteredRecipes.length === 0 && bookmarkedRecipes.length > 0 && (
              <div className="text-center py-12">
                {/* Display cuisine icon if a specific cuisine is selected */}
                {selectedCuisine !== null && CUISINE_ICON_MAP[selectedCuisine] && (
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
                  No bookmarked recipes found{selectedCuisine !== null ? ` for ${selectedCuisine}` : ''}
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

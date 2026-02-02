'use client';

import { useState, useEffect, useMemo, Suspense, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Camera, Grid3x3, List, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import MenuDotsCircle from '@solar-icons/react/csr/ui/MenuDotsCircle';
import Pen from '@solar-icons/react/csr/messages/Pen';
import ClipboardText from '@solar-icons/react/csr/notes/ClipboardText';
import Magnifer from '@solar-icons/react/csr/search/Magnifer';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import RecipeCard, { type RecipeCardData } from '@/components/ui/recipe-card';
import RecipeQuickViewModal from '@/components/ui/recipe-quick-view-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SUPPORTED_CUISINES, CUISINE_ICON_MAP } from '@/config/cuisineConfig';
import { cn } from '@/lib/utils';
import type { ParsedRecipe } from '@/lib/storage';

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
  const [copiedRecipe, setCopiedRecipe] = useState(false);

  const formatTime = (minutes?: number) => {
    if (!minutes) return '-- min';
    return `${minutes} min`;
  };

  const displayTime = recipe.totalTimeMinutes
    ? formatTime(recipe.totalTimeMinutes)
    : recipe.cookTimeMinutes
    ? formatTime(recipe.cookTimeMinutes)
    : recipe.prepTimeMinutes
    ? formatTime(recipe.prepTimeMinutes)
    : null;

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBookmarkToggle();
  };

  const handleEdit = () => {
    onEdit?.();
  };

  const handleUnsave = () => {
    if (onUnsave) {
      onUnsave();
    } else {
      onBookmarkToggle();
    }
  };

  const handleCopyRecipe = async () => {
    const fullRecipe = getRecipeById(recipe.id);
    if (!fullRecipe) {
      console.warn('Recipe not found for copying');
      return;
    }
    
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
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {recipe.cuisine && recipe.cuisine.length > 0 && (
            <div className="flex items-center gap-1.5">
              {recipe.cuisine.map((cuisine, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 border border-stone-200 rounded-full font-albert text-[12px] text-stone-600"
                >
                  {CUISINE_ICON_MAP[cuisine] && (
                    <Image
                      src={CUISINE_ICON_MAP[cuisine]}
                      alt={`${cuisine} icon`}
                      width={16}
                      height={16}
                      quality={100}
                      unoptimized={true}
                      className="w-4 h-4 object-contain flex-shrink-0"
                      draggable={false}
                    />
                  )}
                  <span>{cuisine}</span>
                </span>
              ))}
            </div>
          )}
          
          {displayTime && (
            <div className="px-3 py-1.5 bg-stone-100 rounded-full">
              <p className="font-albert text-[14px] text-stone-700">
                {displayTime}
              </p>
            </div>
          )}
          
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-full transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                aria-label="More options"
              >
                <MenuDotsCircle className="w-5 h-5 text-stone-300 hover:text-stone-400 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              {onEdit && (
                <DropdownMenuItem onSelect={handleEdit}>
                  <Pen weight="Bold" className="w-4 h-4 text-stone-500 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">Edit</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={handleCopyRecipe}>
                <ClipboardText weight="Bold" className={`w-4 h-4 flex-shrink-0 ${copiedRecipe ? 'text-green-600' : 'text-stone-500'}`} />
                <span className={`font-medium whitespace-nowrap ${copiedRecipe ? 'text-green-600' : ''}`}>
                  {copiedRecipe ? 'Copied to Clipboard' : 'Copy Recipe to Clipboard'}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleUnsave}>
                <Bookmark weight="Bold" className="w-4 h-4 text-stone-500 flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">Unsave</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export type SortOption = 'date-newest' | 'date-oldest' | 'name-asc' | 'name-desc' | 'cuisine';
export type ViewMode = 'grid' | 'list';
type SelectedCuisines = (typeof SUPPORTED_CUISINES)[number][];

function SavedRecipesContent() {
  const {
    isLoaded,
    getBookmarkedRecipes,
    getRecipeById,
    isBookmarked,
    toggleBookmark,
  } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();
  const { showMobileNav } = useSidebar();
  const isMobileViewport = useIsMobile();

  const [selectedCuisines, setSelectedCuisines] = useState<SelectedCuisines>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCookedOnly, setShowCookedOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortOption, setSortOption] = useState<SortOption>('date-newest');
  const [selectedRecipe, setSelectedRecipe] = useState<ParsedRecipe | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState<boolean>(false);

  // Persist view mode to localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('saved-recipes-view-mode') as ViewMode | null;
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      setViewMode(savedViewMode);
    }
  }, []);

  useEffect(() => {
    if (viewMode) {
      localStorage.setItem('saved-recipes-view-mode', viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        setIsPageLoaded(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  const handleRecipeClick = (recipeId: string) => {
    const fullRecipe = getRecipeById(recipeId);
    if (fullRecipe) {
      setSelectedRecipe(fullRecipe);
      setIsQuickViewOpen(true);
    }
  };

  const convertToRecipeCardData = (recipe: ParsedRecipe): RecipeCardData => {
    let author: string | undefined = recipe.author;

    if (!author && recipe.url) {
      try {
        const urlObj = new URL(recipe.url);
        const extractedAuthor = urlObj.hostname.replace('www.', '').split('.')[0];
        author = extractedAuthor.charAt(0).toUpperCase() + extractedAuthor.slice(1);
      } catch {
        // If URL parsing fails, author remains undefined
      }
    }

    return {
      id: recipe.id,
      title: recipe.title,
      author: author,
      imageUrl: recipe.imageUrl,
      cuisine: recipe.cuisine,
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      totalTimeMinutes: recipe.totalTimeMinutes,
      // Check for new multi-photo format first, then fall back to legacy single photo
      platePhotoData: recipe.plate?.photos?.[0]?.data || recipe.plate?.photoData,
    };
  };

  const bookmarkedRecipes = useMemo(() => {
    const recipes = getBookmarkedRecipes();
    return recipes.map(convertToRecipeCardData);
  }, [getBookmarkedRecipes]);

  // Sort recipes
  const sortedRecipes = useMemo(() => {
    const recipes = [...bookmarkedRecipes];
    
    switch (sortOption) {
      case 'date-newest':
        // Recipes are already sorted by date (newest first) from storage
        return recipes;
      case 'date-oldest':
        return recipes.reverse();
      case 'name-asc':
        return recipes.sort((a, b) => a.title.localeCompare(b.title));
      case 'name-desc':
        return recipes.sort((a, b) => b.title.localeCompare(a.title));
      case 'cuisine':
        return recipes.sort((a, b) => {
          const aCuisine = a.cuisine?.[0] || '';
          const bCuisine = b.cuisine?.[0] || '';
          return aCuisine.localeCompare(bCuisine);
        });
      default:
        return recipes;
    }
  }, [bookmarkedRecipes, sortOption]);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    let filtered = sortedRecipes;

    if (showCookedOnly) {
      filtered = filtered.filter(recipe => !!recipe.platePhotoData);
    }

    if (selectedCuisines.length > 0) {
      filtered = filtered.filter(recipe => {
        return recipe.cuisine && recipe.cuisine.some(c => selectedCuisines.includes(c as any));
      });
    }

    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(recipe => {
        const titleMatch = recipe.title.toLowerCase().includes(queryLower);
        const authorMatch = recipe.author?.toLowerCase().includes(queryLower) || false;
        return titleMatch || authorMatch;
      });
    }

    return filtered;
  }, [sortedRecipes, selectedCuisines, searchQuery, showCookedOnly]);

  if (!isLoaded) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-12 md:pb-16">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-stone-200 rounded w-48"></div>
            <div className="h-10 bg-stone-200 rounded"></div>
            <div className="h-12 bg-stone-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header Section with #FAFAF9 Background - matching parsed-recipe-page style */}
      <div className="bg-[#FAFAF9]">
        {/* Main Content Container with max-width */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-0">
          {/* Top Navigation Bar - Back arrow only */}
          <div className="w-full mb-6 md:mb-8">
            <div className="flex items-center justify-between">
              {/* Back Button - Visible on all screen sizes */}
              <button
                onClick={() => {
                  if (isMobileViewport) showMobileNav();
                  router.push('/');
                }}
                className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors cursor-pointer group"
                aria-label="Back to Home"
              >
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                {/* Desktop: Show "Back to Home" text, Mobile: Show "Menu" */}
                <span className="hidden md:inline font-albert text-[14px] font-medium">Back to Home</span>
                <span className="md:hidden font-albert text-[14px] font-medium">Menu</span>
              </button>
            </div>
          </div>

          {/* Title and Subtitle Section */}
          <div className="w-full pb-8 md:pb-12">
            <h1 className="font-domine text-[28px] md:text-[32px] font-normal text-black leading-[1.1] tracking-tight mb-2">
              Cookbook
            </h1>
            <p className="font-albert text-[14px] text-stone-600">
              {bookmarkedRecipes.length} {bookmarkedRecipes.length === 1 ? 'recipe' : 'recipes'} saved
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-12 md:pb-16">
        {/* Search Bar with View Toggle and Sort - Side by Side Layout */}
        <div className={`mb-6 ${isPageLoaded ? 'page-fade-in-up page-fade-delay-1' : 'opacity-0'}`}>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full">
            {/* Search Bar - Left Side */}
            <div className="flex-1 min-w-0">
              <div className="ingredients-search-wrapper">
                <Magnifer className="ingredients-search-icon" />
                <input
                  type="text"
                  placeholder="Search saved recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ingredients-search-input"
                  aria-label="Search saved recipes"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="ml-2 flex-shrink-0 p-1 rounded transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4 text-stone-600 hover:text-stone-900 transition-colors duration-150 ease" />
                  </button>
                )}
              </div>
            </div>

            {/* View Toggle and Sort - Right Side */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
              
              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  >
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                    <DropdownMenuRadioItem value="date-newest">
                      Date (Newest)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="date-oldest">
                      Date (Oldest)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="name-asc">
                      Name (A-Z)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="name-desc">
                      Name (Z-A)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="cuisine">
                      Cuisine
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Browse by Cuisine Grid */}
        <div className={cn('mb-8', isPageLoaded ? 'page-fade-in-up page-fade-delay-1' : 'opacity-0')}>
          <h2 className="font-domine text-[18px] md:text-[20px] font-semibold text-stone-900 mb-4 text-balance">
            Browse by Cuisine
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {SUPPORTED_CUISINES.map((cuisine) => {
              const isSelected = selectedCuisines.includes(cuisine);
              return (
                <button
                  key={cuisine}
                  onClick={() =>
                    setSelectedCuisines(prev =>
                      prev.includes(cuisine)
                        ? prev.filter(c => c !== cuisine)
                        : [...prev, cuisine]
                    )
                  }
                  aria-pressed={isSelected}
                  aria-label={`Filter by ${cuisine} cuisine`}
                  className={cn(
                    'relative overflow-hidden rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 text-left aspect-square',
                    isSelected
                      ? 'bg-stone-200 border-stone-300'
                      : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                  )}
                >
                  <span className="absolute top-3 left-3 font-albert text-[15px] md:text-[17px] font-semibold text-stone-700 z-10">
                    {cuisine}
                  </span>
                  <Image
                    src={CUISINE_ICON_MAP[cuisine] || ''}
                    alt={`${cuisine} cuisine`}
                    width={256}
                    height={256}
                    quality={100}
                    unoptimized={true}
                    className="absolute -bottom-[12%] -right-[15%] w-[100%] h-[100%] object-contain"
                    draggable={false}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Cooked Filter */}
        <div className={cn('mb-6', isPageLoaded ? 'page-fade-in-up page-fade-delay-1' : 'opacity-0')}>
          <button
            onClick={() => setShowCookedOnly(prev => !prev)}
            aria-pressed={showCookedOnly}
            aria-label={showCookedOnly ? 'Show all recipes' : 'Show cooked dishes only'}
            className={cn(
              'px-4 py-2 rounded-full font-albert text-[14px] font-medium border whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300',
              showCookedOnly
                ? 'bg-stone-200 border-stone-300 text-stone-900'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            )}
          >
            Cooked
          </button>
        </div>

        {/* Recipe Display - animate in with delay (main content) */}
        <div className={`${isPageLoaded ? 'page-fade-in-up page-fade-delay-2' : 'opacity-0'}`}>
          {filteredRecipes.length === 0 && bookmarkedRecipes.length > 0 ? (
            <div className="text-center py-12">
              {selectedCuisines.length > 0 && (
                <div className="flex justify-center gap-2 mb-6">
                  {selectedCuisines.slice(0, 3).map(cuisine => (
                    CUISINE_ICON_MAP[cuisine] && (
                      <Image
                        key={cuisine}
                        src={CUISINE_ICON_MAP[cuisine]}
                        alt={`${cuisine} cuisine icon`}
                        width={80}
                        height={80}
                        quality={100}
                        unoptimized={true}
                        className="w-16 h-16 object-contain"
                      />
                    )
                  ))}
                </div>
              )}
              <p className="font-albert text-[16px] text-stone-600">
                No bookmarked recipes found{selectedCuisines.length > 0 ? ` for ${selectedCuisines.join(', ')}` : ''}
              </p>
            </div>
          ) : bookmarkedRecipes.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-albert text-[16px] text-stone-600">
                No saved recipes yet. Bookmark a recipe to see it here!
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col">
              {filteredRecipes.map((recipe) => (
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => handleRecipeClick(recipe.id)}
                  showImage={false}
                  showCuisineIcon={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <RecipeQuickViewModal
        recipe={selectedRecipe}
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setSelectedRecipe(null);
        }}
      />
    </div>
  );
}

export default function SavedRecipesPage({
  params,
  searchParams,
}: {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
} = {} as any) {
  if (params) use(params);
  if (searchParams) use(searchParams);
  
  return (
    <Suspense fallback={
      <div className="bg-white min-h-screen">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-12 md:pb-16">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-stone-200 rounded w-48"></div>
            <div className="h-10 bg-stone-200 rounded"></div>
            <div className="h-12 bg-stone-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <SavedRecipesContent />
    </Suspense>
  );
}

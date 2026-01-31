'use client';

import { useState, useEffect, useMemo, Suspense, use } from 'react';
import { useRouter } from 'next/navigation';
import { X, Grid3x3, List, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Magnifer from '@solar-icons/react/csr/search/Magnifer';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import MenuDotsCircle from '@solar-icons/react/csr/ui/MenuDotsCircle';
import Pen from '@solar-icons/react/csr/messages/Pen';
import ClipboardText from '@solar-icons/react/csr/notes/ClipboardText';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import RecipeCard, { type RecipeCardData } from '@/components/ui/recipe-card';
import RecipeQuickViewModal from '@/components/ui/recipe-quick-view-modal';
import { CUISINE_ICON_MAP } from '@/config/cuisineConfig';
import type { ParsedRecipe } from '@/lib/storage';
import { cn } from '@/lib/utils';
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

type SortOption = 'date-newest' | 'date-oldest' | 'name-asc' | 'name-desc' | 'cuisine';
type TimeFilter = 'all' | 'under30' | '30to60' | 'over60';
type ViewMode = 'grid' | 'list';

// Recipe List Item for list view — follows the same pattern as saved-recipes
interface RecipeListItemProps {
  recipe: RecipeCardData;
  onClick: () => void;
  isBookmarked: boolean;
  onBookmarkToggle: () => void;
  getRecipeById: (id: string) => any;
}

function RecipeListItem({
  recipe,
  onClick,
  isBookmarked,
  onBookmarkToggle,
  getRecipeById,
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

  const handleCopyRecipe = async () => {
    const fullRecipe = getRecipeById(recipe.id);
    if (!fullRecipe) return;

    let text = '';
    if (fullRecipe.title) text += `${fullRecipe.title}\n\n`;
    if (fullRecipe.author) text += `By ${fullRecipe.author}\n`;
    if (fullRecipe.sourceUrl) text += `Source: ${fullRecipe.sourceUrl}\n`;
    if (fullRecipe.prepTimeMinutes || fullRecipe.cookTimeMinutes || fullRecipe.servings) {
      text += '\n';
      if (fullRecipe.prepTimeMinutes) text += `Prep: ${fullRecipe.prepTimeMinutes} min\n`;
      if (fullRecipe.cookTimeMinutes) text += `Cook: ${fullRecipe.cookTimeMinutes} min\n`;
      if (fullRecipe.servings) text += `Servings: ${fullRecipe.servings}\n`;
    }
    if (fullRecipe.ingredients && fullRecipe.ingredients.length > 0) {
      text += '\n--- INGREDIENTS ---\n\n';
      fullRecipe.ingredients.forEach((group: any) => {
        if (group.groupName && group.groupName !== 'Main') text += `${group.groupName}:\n`;
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
          const title = instruction.title || `Step ${index + 1}`;
          const detail = instruction.detail || instruction.text || '';
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
              className={cn(
                'w-5 h-5 transition-colors',
                isBookmarked
                  ? 'fill-[#78716C] text-[#78716C]'
                  : 'fill-[#D6D3D1] text-[#D6D3D1] hover:fill-[#A8A29E] hover:text-[#A8A29E]'
              )}
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
              <DropdownMenuItem onSelect={handleCopyRecipe}>
                <ClipboardText weight="Bold" className={cn('w-4 h-4 flex-shrink-0', copiedRecipe ? 'text-green-600' : 'text-stone-500')} />
                <span className={cn('font-medium whitespace-nowrap', copiedRecipe && 'text-green-600')}>
                  {copiedRecipe ? 'Copied to Clipboard' : 'Copy Recipe to Clipboard'}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onBookmarkToggle()}>
                <Bookmark weight="Bold" className="w-4 h-4 text-stone-500 flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">
                  {isBookmarked ? 'Unsave' : 'Save'}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function SearchPageContent() {
  const {
    recentRecipes,
    isLoaded,
    getRecipeById,
    isBookmarked,
    toggleBookmark,
  } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();
  const { showMobileNav } = useSidebar();
  const isMobileViewport = useMediaQuery('(max-width: 767px)');

  const [searchQuery, setSearchQuery] = useState('');

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [showCookedOnly, setShowCookedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('date-newest');
  const [selectedRecipe, setSelectedRecipe] = useState<ParsedRecipe | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Persist view mode
  useEffect(() => {
    const saved = localStorage.getItem('search-view-mode') as ViewMode | null;
    if (saved === 'grid' || saved === 'list') setViewMode(saved);
  }, []);

  useEffect(() => {
    if (viewMode) localStorage.setItem('search-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => setIsPageLoaded(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  const convertToRecipeCardData = (recipe: ParsedRecipe): RecipeCardData => {
    let author: string | undefined = recipe.author;
    if (!author && recipe.url) {
      try {
        const urlObj = new URL(recipe.url);
        const extracted = urlObj.hostname.replace('www.', '').split('.')[0];
        author = extracted.charAt(0).toUpperCase() + extracted.slice(1);
      } catch {
        // URL parse failed
      }
    }
    return {
      id: recipe.id,
      title: recipe.title,
      author,
      imageUrl: recipe.imageUrl,
      cuisine: recipe.cuisine,
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      totalTimeMinutes: recipe.totalTimeMinutes,
      platePhotoData: recipe.plate?.photos?.[0]?.data || recipe.plate?.photoData,
    };
  };

  const allRecipes = useMemo(() => {
    return recentRecipes.map(convertToRecipeCardData);
  }, [recentRecipes]);

  // Sort
  const sortedRecipes = useMemo(() => {
    const recipes = [...allRecipes];
    switch (sortOption) {
      case 'date-newest':
        return recipes;
      case 'date-oldest':
        return recipes.reverse();
      case 'name-asc':
        return recipes.sort((a, b) => a.title.localeCompare(b.title));
      case 'name-desc':
        return recipes.sort((a, b) => b.title.localeCompare(a.title));
      case 'cuisine':
        return recipes.sort((a, b) => {
          const ac = a.cuisine?.[0] || '';
          const bc = b.cuisine?.[0] || '';
          return ac.localeCompare(bc);
        });
      default:
        return recipes;
    }
  }, [allRecipes, sortOption]);

  // Filter
  const filteredRecipes = useMemo(() => {
    let filtered = sortedRecipes;

    // Time
    if (timeFilter !== 'all') {
      filtered = filtered.filter(r => {
        const time = r.totalTimeMinutes ?? r.cookTimeMinutes ?? r.prepTimeMinutes;
        if (!time) return false;
        switch (timeFilter) {
          case 'under30': return time < 30;
          case '30to60': return time >= 30 && time <= 60;
          case 'over60': return time > 60;
          default: return true;
        }
      });
    }

    // Cooked only
    if (showCookedOnly) {
      filtered = filtered.filter(r => !!r.platePhotoData);
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(r => {
        const titleMatch = r.title.toLowerCase().includes(q);
        const authorMatch = r.author?.toLowerCase().includes(q) || false;
        const cuisineMatch = r.cuisine?.some(c => c.toLowerCase().includes(q)) || false;
        return titleMatch || authorMatch || cuisineMatch;
      });
    }

    return filtered;
  }, [sortedRecipes, timeFilter, showCookedOnly, searchQuery]);

  const handleRecipeClick = (recipeId: string) => {
    const fullRecipe = getRecipeById(recipeId);
    if (fullRecipe) {
      setSelectedRecipe(fullRecipe);
      setIsQuickViewOpen(true);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setTimeFilter('all');
    setShowCookedOnly(false);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || timeFilter !== 'all' || showCookedOnly;

  const timeOptions: { key: TimeFilter; label: string }[] = [
    { key: 'under30', label: 'Under 30 min' },
    { key: '30to60', label: '30–60 min' },
    { key: 'over60', label: '1+ hour' },
  ];

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
      {/* Header */}
      <div className="bg-[#FAFAF9]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-0">
          <div className="w-full mb-6 md:mb-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (isMobileViewport) showMobileNav();
                  router.push('/');
                }}
                className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors cursor-pointer group"
                aria-label="Back to Home"
              >
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="hidden md:inline font-albert text-[14px] font-medium">Back to Home</span>
                <span className="md:hidden font-albert text-[14px] font-medium">Menu</span>
              </button>
            </div>
          </div>

          <div className="w-full pb-8 md:pb-12">
            <h1 className="font-domine text-[28px] md:text-[32px] font-normal text-black leading-[1.1] tracking-tight mb-2 text-balance">
              Search
            </h1>
            <p className="font-albert text-[14px] text-stone-600 text-pretty">
              {recentRecipes.length} {recentRecipes.length === 1 ? 'recipe' : 'recipes'} in your collection
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-12 md:pb-16">
        {/* Quick Filters Row */}
        <div className={cn(
          'flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0',
          isPageLoaded ? 'page-fade-in-up page-fade-delay-1' : 'opacity-0'
        )}>
          {timeOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setTimeFilter(prev => prev === option.key ? 'all' : option.key)}
              aria-pressed={timeFilter === option.key}
              className={cn(
                'cuisine-filter-pill relative flex-shrink-0 px-4 py-2 rounded-full font-albert text-[14px] font-medium border whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300',
                timeFilter === option.key
                  ? 'bg-stone-200 border-stone-300 text-stone-900'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              )}
            >
              {option.label}
            </button>
          ))}

          <div className="w-px h-6 bg-stone-200 flex-shrink-0" aria-hidden="true" />

          <button
            onClick={() => setShowCookedOnly(prev => !prev)}
            aria-pressed={showCookedOnly}
            aria-label={showCookedOnly ? 'Show all recipes' : 'Show cooked dishes only'}
            className={cn(
              'cuisine-filter-pill relative flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-albert text-[14px] font-medium border whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300',
              showCookedOnly
                ? 'bg-stone-200 border-stone-300 text-stone-900'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            )}
          >
            <span>Cooked</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className={cn('mb-8', isPageLoaded ? 'page-fade-in-up page-fade-delay-2' : 'opacity-0')}>
          <div className="ingredients-search-wrapper">
            <Magnifer className="ingredients-search-icon" />
            <input
              type="text"
              placeholder="Search recipes by name, author, or cuisine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ingredients-search-input"
              aria-label="Search recipes"
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

        {/* Results Toolbar */}
        <div className={cn(
          'flex items-center justify-between mb-6',
          isPageLoaded ? 'page-fade-in-up page-fade-delay-2' : 'opacity-0'
        )}>
          <p className="font-albert text-[14px] text-stone-500">
            {filteredRecipes.length} {filteredRecipes.length === 1 ? 'result' : 'results'}
          </p>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'grid'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                )}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'list'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                )}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
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
                  <DropdownMenuRadioItem value="date-newest">Date (Newest)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="date-oldest">Date (Oldest)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="name-asc">Name (A-Z)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="name-desc">Name (Z-A)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="cuisine">Cuisine</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Recipe Results */}
        <div className={cn(isPageLoaded ? 'page-fade-in-up page-fade-delay-3' : 'opacity-0')}>
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-albert text-[16px] text-stone-500 text-pretty">
                {recentRecipes.length === 0
                  ? 'No recipes yet. Parse your first recipe to start building your collection.'
                  : searchQuery
                    ? `No recipes matching "${searchQuery}"`
                    : 'No recipes match your filters'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-4 font-albert text-[14px] text-stone-600 underline underline-offset-4 hover:text-stone-900 transition-colors"
                >
                  Clear filters
                </button>
              )}
              {recentRecipes.length === 0 && (
                <button
                  onClick={() => router.push('/')}
                  className="mt-4 font-albert text-[14px] text-stone-600 underline underline-offset-4 hover:text-stone-900 transition-colors"
                >
                  Parse a recipe
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
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
          ) : (
            <div className="flex flex-col">
              {filteredRecipes.map((recipe) => (
                <RecipeListItem
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => handleRecipeClick(recipe.id)}
                  isBookmarked={isBookmarked(recipe.id)}
                  onBookmarkToggle={() => toggleBookmark(recipe.id)}
                  getRecipeById={getRecipeById}
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

export default function SearchPage({
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
      <SearchPageContent />
    </Suspense>
  );
}

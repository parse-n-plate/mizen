'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSidebarResize } from '@/hooks/useSidebarResize';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import SquareDoubleAltArrowLeft from '@solar-icons/react/csr/arrows/SquareDoubleAltArrowLeft';
import SquareDoubleAltArrowRight from '@solar-icons/react/csr/arrows/SquareDoubleAltArrowRight';
import Magnifer from '@solar-icons/react/csr/search/Magnifer';
import ClockCircle from '@solar-icons/react/csr/time/ClockCircle';
import Book from '@solar-icons/react/csr/school/Book';
import SettingsIcon from '@solar-icons/react/csr/settings/Settings';
import QuestionCircle from '@solar-icons/react/csr/ui/QuestionCircle';
import type { ParsedRecipe } from '@/lib/storage';
import { getCuisineIcon } from '@/config/cuisineConfig';
import RecipeContextMenu from './RecipeContextMenu';
import RecipeHoverCard from './RecipeHoverCard';
import { HoverCardGroup } from '@/components/ui/hover-card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

/**
 * Sidebar Component
 *
 * A collapsible, resizable sidebar navigation for the Mizen app.
 * On mobile (<768px), renders as a full-screen navigation view.
 */
export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAllSaved, setShowAllSaved] = useState(false);
  const { recentRecipes, bookmarkedRecipeIds, getBookmarkedRecipes, isLoaded, getRecipeById } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();
  const pathname = usePathname();

  const isMobile = useMediaQuery('(max-width: 767px)');
  const { hideMobileNav } = useSidebar();

  const { width: sidebarWidth, isDragging, handleMouseDown } = useSidebarResize({
    minWidth: 200,
    maxWidth: 480,
    defaultWidth: 288,
    storageKey: 'sidebar-width',
    isCollapsed: isMobile ? false : isCollapsed,
  });

  const bookmarkedRecipes = getBookmarkedRecipes();
  const bookmarkedIdSet = useMemo(
    () => new Set(bookmarkedRecipeIds),
    [bookmarkedRecipeIds],
  );
  const recentUnbookmarked = useMemo(
    () => recentRecipes.filter((recipe) => !bookmarkedIdSet.has(recipe.id)),
    [recentRecipes, bookmarkedIdSet],
  );

  const formatTime = (minutes?: number): string => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getDisplayTime = (recipe: ParsedRecipe): string => {
    if (recipe.totalTimeMinutes) return formatTime(recipe.totalTimeMinutes);
    if (recipe.prepTimeMinutes && recipe.cookTimeMinutes) {
      return formatTime(recipe.prepTimeMinutes + recipe.cookTimeMinutes);
    }
    if (recipe.prepTimeMinutes) return formatTime(recipe.prepTimeMinutes);
    if (recipe.cookTimeMinutes) return formatTime(recipe.cookTimeMinutes);
    return '';
  };

  const getRecipeIconPath = (recipe: ParsedRecipe): string => {
    if (recipe.cuisine && recipe.cuisine.length > 0) {
      const icon = getCuisineIcon(recipe.cuisine[0]);
      if (icon) return icon;
    }
    return '/assets/cusineIcons/No_Cusine_Icon.png';
  };

  const handleRecipeClick = (recipeId: string) => {
    try {
      const fullRecipe = getRecipeById(recipeId);
      if (fullRecipe && fullRecipe.ingredients && fullRecipe.instructions) {
        setParsedRecipe({
          id: fullRecipe.id,
          title: fullRecipe.title,
          ingredients: fullRecipe.ingredients,
          instructions: fullRecipe.instructions,
          author: fullRecipe.author,
          sourceUrl: fullRecipe.sourceUrl || fullRecipe.url,
          summary: fullRecipe.description || fullRecipe.summary,
          cuisine: fullRecipe.cuisine,
          imageData: fullRecipe.imageData,
          imageFilename: fullRecipe.imageFilename,
          prepTimeMinutes: fullRecipe.prepTimeMinutes,
          cookTimeMinutes: fullRecipe.cookTimeMinutes,
          totalTimeMinutes: fullRecipe.totalTimeMinutes,
          servings: fullRecipe.servings,
          plate: fullRecipe.plate,
        });
        router.push('/parsed-recipe-page');
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    }
  };


  const navItems = [
    { icon: Magnifer, label: 'Search', href: '/search', action: 'search' },
    { icon: ClockCircle, label: 'Timers', href: '/timers', action: 'timers' },
    { icon: Book, label: 'Cookbook', href: '/saved-recipes', action: 'cookbook' },
  ];

  const displayedSavedRecipes = showAllSaved
    ? bookmarkedRecipes
    : bookmarkedRecipes.slice(0, 3);

  // Helper to wrap recipe items — skip HoverCard on mobile (no hover on touch)
  const RecipeItemWrapper = ({ recipe, children }: { recipe: ParsedRecipe; children: React.ReactNode }) => {
    if (isMobile) {
      return (
        <RecipeContextMenu recipe={recipe} onRecipeClick={handleRecipeClick}>
          {children}
        </RecipeContextMenu>
      );
    }
    return (
      <RecipeHoverCard recipe={recipe}>
        <RecipeContextMenu recipe={recipe} onRecipeClick={handleRecipeClick}>
          {children}
        </RecipeContextMenu>
      </RecipeHoverCard>
    );
  };

  return (
    <>
      {/* Floating expand button when collapsed - desktop only */}
      {!isMobile && isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed top-4 left-4 z-50 p-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors shadow-sm"
          aria-label="Expand sidebar"
        >
          <SquareDoubleAltArrowRight weight="Outline" className="w-4 h-4 text-stone-500" />
        </button>
      )}

      <aside
        className={cn(
          'h-screen bg-[#FAFAF9] flex flex-col flex-shrink-0 sticky top-0 overflow-hidden relative',
          // Desktop styles
          !isMobile && [
            'border-r border-stone-200',
            !isDragging && 'transition-[width] duration-200 ease-[cubic-bezier(0.645,0.045,0.355,1)]',
            isCollapsed && 'border-r-0',
          ],
          // Mobile styles
          isMobile && 'w-full border-r-0',
        )}
        style={!isMobile ? { width: isCollapsed ? 0 : sidebarWidth } : undefined}
      >
        {/* Inner container */}
        <div
          className="h-full flex flex-col"
          style={
            !isMobile
              ? { width: sidebarWidth, minWidth: sidebarWidth }
              : { width: '100%', minWidth: '100%' }
          }
        >
          {/* Header */}
          <div className="px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-domine text-xl font-semibold text-stone-900">
              Mizen
            </Link>
            {/* Collapse button - desktop only */}
            {!isMobile && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded-lg hover:bg-stone-100 transition-colors"
                aria-label="Collapse sidebar"
              >
                <SquareDoubleAltArrowLeft weight="Outline" className="w-4 h-4 text-stone-300" />
              </button>
            )}
          </div>

          {/* New Recipe Button */}
          <div className="px-4 mb-2">
            <button
              onClick={() => {
                if (pathname === '/') {
                  // Already on home — just hide the sidebar
                  if (isMobile) hideMobileNav();
                } else {
                  router.push('/');
                  // Sidebar hides automatically via pathname-change effect
                }
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#0072ff] text-white rounded-lg hover:bg-[#0066e6] transition-colors font-albert font-medium"
              aria-label="New Recipe"
            >
              <Plus className="w-5 h-5 flex-shrink-0" />
              <span>New Recipe</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-2 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}

                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-albert text-sm
                    ${isActive
                      ? 'bg-stone-100 text-stone-900 font-medium'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }
                  `}
                  aria-label={item.label}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="mx-4 my-2 border-t border-stone-200" />

          {/* Scrollable recipes section */}
          <HoverCardGroup>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
            {/* Saved Recipes Section */}
            {isLoaded && bookmarkedRecipes.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1.5 flex items-center gap-2">
                  <span className="font-albert text-xs font-medium text-stone-400 uppercase tracking-wider whitespace-nowrap">
                    Saved
                  </span>
                </div>
                <div className="space-y-0.5">
                  {displayedSavedRecipes.map((recipe) => (
                    <RecipeItemWrapper key={recipe.id} recipe={recipe}>
                      <button
                        onClick={() => handleRecipeClick(recipe.id)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-stone-100 text-left group"
                      >
                        <span className="flex items-center gap-2 min-w-0 pr-2">
                          <Image
                            src={getRecipeIconPath(recipe)}
                            alt=""
                            width={28}
                            height={28}
                            className="w-7 h-7 flex-shrink-0 object-contain"
                            unoptimized
                          />
                          <span className="font-albert text-sm text-stone-700 truncate">
                            {recipe.title}
                          </span>
                        </span>
                        {getDisplayTime(recipe) && (
                          <span className="font-albert text-xs text-stone-400 flex-shrink-0">
                            {getDisplayTime(recipe)}
                          </span>
                        )}
                      </button>
                    </RecipeItemWrapper>
                  ))}
                </div>
                {bookmarkedRecipes.length > 3 && (
                  <button
                    onClick={() => setShowAllSaved(!showAllSaved)}
                    className="px-3 py-1.5 font-albert text-xs text-stone-500 hover:text-stone-700"
                  >
                    {showAllSaved ? 'Show Less' : 'See More'}
                  </button>
                )}
              </div>
            )}

            {/* Recent Recipes Section — exclude saved/bookmarked recipes */}
            {isLoaded && recentUnbookmarked.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1.5 flex items-center gap-2">
                  <span className="font-albert text-xs font-medium text-stone-400 uppercase tracking-wider whitespace-nowrap">
                    Recent
                  </span>
                </div>
                <div className="space-y-0.5">
                  {recentUnbookmarked.map((recipe) => (
                    <RecipeItemWrapper key={recipe.id} recipe={recipe}>
                      <button
                        onClick={() => handleRecipeClick(recipe.id)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-stone-100 text-left group"
                      >
                        <span className="flex items-center gap-2 min-w-0 pr-2">
                          <Image
                            src={getRecipeIconPath(recipe)}
                            alt=""
                            width={28}
                            height={28}
                            className="w-7 h-7 flex-shrink-0 object-contain"
                            unoptimized
                          />
                          <span className="font-albert text-sm text-stone-700 truncate">
                            {recipe.title}
                          </span>
                        </span>
                        {getDisplayTime(recipe) && (
                          <span className="font-albert text-xs text-stone-400 flex-shrink-0">
                            {getDisplayTime(recipe)}
                          </span>
                        )}
                      </button>
                    </RecipeItemWrapper>
                  ))}
                </div>
              </div>
            )}
          </div>
          </HoverCardGroup>

          {/* Footer - Settings & Help */}
          <div className="px-4 py-3 border-t border-stone-200 flex items-center justify-end gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
                  aria-label="Help"
                >
                  <QuestionCircle className="w-5 h-5 text-stone-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end">
                <DropdownMenuItem onSelect={() => window.open('mailto:support@mizen.app')}>
                  Contact Support
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Keyboard Shortcuts
                </DropdownMenuItem>
                <DropdownMenuItem>
                  About Mizen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              href="/settings"
              className={`p-2 rounded-lg hover:bg-stone-100 transition-colors ${
                pathname === '/settings' ? 'bg-stone-100' : ''
              }`}
              aria-label="Settings"
            >
              <SettingsIcon className="w-5 h-5 text-stone-400" />
            </Link>
          </div>

        </div>

        {/* Resize handle - desktop only */}
        {!isMobile && !isCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              'absolute top-0 right-0 w-1 h-full z-10 cursor-col-resize',
              'hover:bg-blue-500/20 active:bg-blue-500/30',
              'transition-colors duration-150',
              isDragging && 'bg-blue-500/30',
            )}
          >
            {/* Wider invisible hit target */}
            <div className="absolute top-0 -left-1.5 w-4 h-full" />
          </div>
        )}
      </aside>
    </>
  );
}

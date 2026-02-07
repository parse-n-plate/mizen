'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useCommandK } from '@/contexts/CommandKContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSidebarResize } from '@/hooks/useSidebarResize';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Pin, Plus } from 'lucide-react';
import SquareDoubleAltArrowLeft from '@solar-icons/react/csr/arrows/SquareDoubleAltArrowLeft';
import SquareDoubleAltArrowRight from '@solar-icons/react/csr/arrows/SquareDoubleAltArrowRight';
import Magnifer from '@solar-icons/react/csr/search/Magnifer';
import ClockCircle from '@solar-icons/react/csr/time/ClockCircle';
import BookBookmarkIcon from '@solar-icons/react/csr/school/BookBookmark';
import SettingsIcon from '@solar-icons/react/csr/settings/Settings';
import QuestionCircle from '@solar-icons/react/csr/ui/QuestionCircle';
import ChatRoundLine from '@solar-icons/react/csr/messages/ChatRoundLine';
import Phone from '@solar-icons/react/csr/call/Phone';
import Keyboard from '@solar-icons/react/csr/devices/Keyboard';
import InfoCircle from '@solar-icons/react/csr/ui/InfoCircle';
import { MousePointer2 } from 'lucide-react';
import { usePrototypeLab } from '@/contexts/PrototypeLabContext';
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
import FeedbackDialog from './FeedbackDialog';

// Shared easing for all sidebar transitions — ease-in-out-cubic
const SIDEBAR_EASING = 'cubic-bezier(0.645,0.045,0.355,1)';

/**
 * Sidebar Component
 *
 * A collapsible, resizable sidebar navigation for the Mizen app.
 * On mobile (<768px), renders as a full-screen navigation view.
 * On desktop, collapses to a 64px icon rail instead of fully hiding.
 */
export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { recentRecipes, getBookmarkedRecipes, isLoaded, getRecipeById, isPinned, touchRecipe } = useParsedRecipes();
  const { parsedRecipe, setParsedRecipe } = useRecipe();
  const router = useRouter();
  const pathname = usePathname();

  const isMobile = useIsMobile();
  const { hideMobileNav } = useSidebar();
  const { openSearch } = useCommandK();
  const { openLab } = usePrototypeLab();

  const { width: sidebarWidth, isDragging, handleMouseDown } = useSidebarResize({
    minWidth: 200,
    maxWidth: 480,
    defaultWidth: 288,
    storageKey: 'sidebar-width',
    isCollapsed: isMobile ? false : isCollapsed,
  });

  // Unified recipe list: pinned first (by pinnedAt desc), then unpinned (by lastAccessedAt/parsedAt desc)
  const allRecipes = useMemo(() => {
    const bookmarked = getBookmarkedRecipes();
    const combined = [...recentRecipes, ...bookmarked];
    const pinned = combined.filter((r) => r.pinnedAt);
    const unpinned = combined.filter((r) => !r.pinnedAt);
    pinned.sort((a, b) => new Date(b.pinnedAt!).getTime() - new Date(a.pinnedAt!).getTime());
    return [...pinned, ...unpinned];
  }, [recentRecipes, getBookmarkedRecipes]);

  // Determine which recipe is currently being viewed
  const activeRecipeId = useMemo(() => {
    if (pathname !== '/parsed-recipe-page' || !parsedRecipe) return null;
    if (parsedRecipe.id) return parsedRecipe.id;
    // Fallback: match by sourceUrl
    if (!parsedRecipe.sourceUrl) return null;
    const match = allRecipes.find(
      (r) => r.sourceUrl === parsedRecipe.sourceUrl || r.url === parsedRecipe.sourceUrl,
    );
    return match?.id ?? null;
  }, [pathname, parsedRecipe, allRecipes]);

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
      touchRecipe(recipeId);
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
        if (isMobile) hideMobileNav();
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    }
  };


  const navItems = [
    { icon: ClockCircle, label: 'Timers', href: '/timers', disabled: true },
    { icon: BookBookmarkIcon, label: 'Cookbook', href: '/cookbook', disabled: true },
  ];

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

  // Helper: wrap children in a tooltip only when collapsed (desktop)
  const NavTooltip = ({ label, children }: { label: string; children: React.ReactNode }) => {
    if (!isCollapsed || isMobile) return <>{children}</>;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  };

  // Whether we're showing the desktop collapsed rail
  const isRail = !isMobile && isCollapsed;

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <aside
        className={cn(
          'h-screen bg-[#FAFAF9] flex flex-col flex-shrink-0 sticky top-0 overflow-hidden relative',
          // Desktop styles
          !isMobile && [
            'border-r border-stone-200',
            !isDragging && `transition-[width] duration-200 ease-[${SIDEBAR_EASING}]`,
          ],
          // Mobile styles
          isMobile && 'w-full border-r-0',
        )}
        style={!isMobile ? { width: sidebarWidth } : undefined}
      >
        {/* Inner container — transitions width in sync with aside */}
        <div
          className={cn(
            'h-full flex flex-col',
            !isMobile && !isDragging && `transition-[width,min-width] duration-200 ease-[${SIDEBAR_EASING}]`,
          )}
          style={
            !isMobile
              ? { width: sidebarWidth, minWidth: sidebarWidth }
              : { width: '100%', minWidth: '100%' }
          }
        >
          {/* Header — crossfade between branding and expand arrow */}
          <div className="px-4 py-4 flex items-center justify-between relative">
            {/* Mizen branding — fades out when collapsed */}
            <Link
              href="/"
              className={cn(
                'font-domine text-xl font-semibold text-stone-900 transition-opacity duration-200 whitespace-nowrap',
                isRail ? 'opacity-0 pointer-events-none' : 'opacity-100',
              )}
              tabIndex={isRail ? -1 : undefined}
            >
              Mizen
            </Link>

            {/* Collapse button — fades out when collapsed */}
            {!isMobile && (
              <button
                onClick={() => setIsCollapsed(true)}
                className={cn(
                  'p-1 rounded-lg hover:bg-stone-100 transition-opacity duration-200',
                  isRail ? 'opacity-0 pointer-events-none' : 'opacity-100',
                )}
                aria-label="Collapse sidebar"
                tabIndex={isRail ? -1 : undefined}
              >
                <SquareDoubleAltArrowLeft weight="Outline" className="w-4 h-4 text-stone-300" />
              </button>
            )}

            {/* Expand button — fades in when collapsed, positioned at left edge */}
            {!isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsCollapsed(false)}
                    className={cn(
                      'absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-stone-100 transition-opacity duration-200',
                      isRail ? 'opacity-100' : 'opacity-0 pointer-events-none',
                    )}
                    aria-label="Expand sidebar"
                    tabIndex={isRail ? undefined : -1}
                  >
                    <SquareDoubleAltArrowRight weight="Outline" className="w-5 h-5 text-stone-400" />
                  </button>
                </TooltipTrigger>
                {isRail && <TooltipContent side="right">Expand sidebar</TooltipContent>}
              </Tooltip>
            )}
          </div>

          {/* New Recipe Button — icon stays put, text fades */}
          <div className="px-2 mb-2">
            <NavTooltip label="New Recipe">
              <button
                onClick={() => {
                  if (pathname === '/') {
                    if (isMobile) hideMobileNav();
                  } else {
                    router.push('/');
                  }
                }}
                className="w-full flex items-center px-3 py-2.5 bg-[#0072ff] text-white rounded-lg hover:bg-[#0066e6] transition-colors font-albert font-medium"
                aria-label="New Recipe"
              >
                <Plus className="w-5 h-5 flex-shrink-0" />
                <div className={cn(
                  'overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-200',
                  isRail ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-2',
                )}>
                  <span>New Recipe</span>
                </div>
              </button>
            </NavTooltip>
          </div>

          {/* Navigation — icons stay at fixed left position, text fades */}
          <nav className="px-2 py-2">
            {/* Search — opens command modal */}
            <NavTooltip label="Search  ⌘K">
              <button
                onClick={openSearch}
                className="group w-full flex items-center px-3 py-2 rounded-lg transition-colors font-albert text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                aria-label="Search recipes"
              >
                <Magnifer className="w-5 h-5 flex-shrink-0" />
                <div className={cn(
                  'flex-1 flex items-center overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-200',
                  isRail ? 'max-w-0 opacity-0 ml-0' : 'max-w-[250px] opacity-100 ml-3',
                )}>
                  <span>Search</span>
                  <kbd className="ml-auto hidden md:inline-flex opacity-0 group-hover:opacity-100 font-albert text-[11px] text-stone-400 bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 transition-opacity duration-200">
                    ⌘K
                  </kbd>
                </div>
              </button>
            </NavTooltip>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = !item.disabled && pathname === item.href;

              if (item.disabled) {
                return (
                  <NavTooltip key={item.label} label={item.label}>
                    <span
                      className="group w-full flex items-center px-3 py-2 rounded-lg font-albert text-sm text-stone-300 cursor-not-allowed"
                      aria-label={item.label}
                      aria-disabled="true"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className={cn(
                        'flex-1 flex items-center overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-200',
                        isRail ? 'max-w-0 opacity-0 ml-0' : 'max-w-[250px] opacity-100 ml-3',
                      )}>
                        <span>{item.label}</span>
                        <span className="ml-auto hidden md:inline-flex opacity-0 group-hover:opacity-100 font-albert text-[11px] text-stone-400 bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 transition-opacity duration-200">
                          Coming soon
                        </span>
                      </div>
                    </span>
                  </NavTooltip>
                );
              }

              return (
                <NavTooltip key={item.label} label={item.label}>
                  <Link
                    href={item.href}
                    className={cn(
                      'w-full flex items-center px-3 py-2 rounded-lg transition-colors font-albert text-sm',
                      isActive
                        ? 'bg-stone-100 text-stone-900 font-medium'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className={cn(
                      'overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-200',
                      isRail ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3',
                    )}>
                      <span>{item.label}</span>
                    </div>
                  </Link>
                </NavTooltip>
              );
            })}

            {/* Prototype Lab — dev + preview only */}
            {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') && (
              <NavTooltip label="Prototype Lab">
                <button
                  onClick={openLab}
                  className="w-full flex items-center px-3 py-2 rounded-lg transition-colors font-albert text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  aria-label="Open Prototype Lab"
                >
                  <MousePointer2 className="w-5 h-5 flex-shrink-0" />
                  <div className={cn(
                    'overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-200',
                    isRail ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3',
                  )}>
                    <span>Prototype Lab</span>
                  </div>
                </button>
              </NavTooltip>
            )}
          </nav>

          {/* Divider */}
          <div className="mx-4 my-2 border-t border-stone-200" />

          {/* Scrollable recipes section — hidden when collapsed */}
          {!isRail ? (
            <HoverCardGroup>
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
              {/* Recipes Section — pinned first, then by last accessed */}
              {isLoaded && allRecipes.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1.5 flex items-center gap-2">
                    <span className="font-albert text-xs font-medium text-stone-400 uppercase tracking-wider whitespace-nowrap">
                      Recipes
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {allRecipes.map((recipe) => (
                      <RecipeItemWrapper key={recipe.id} recipe={recipe}>
                        <button
                          onClick={() => handleRecipeClick(recipe.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left group",
                            activeRecipeId === recipe.id
                              ? "bg-stone-200/70"
                              : "hover:bg-stone-100",
                          )}
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
                            <span className={cn(
                              "font-albert text-sm truncate",
                              activeRecipeId === recipe.id ? "text-stone-900 font-medium" : "text-stone-700",
                            )}>
                              {recipe.title}
                            </span>
                            {recipe.pinnedAt && (
                              <Pin className="w-3 h-3 text-stone-400 flex-shrink-0" />
                            )}
                          </span>
                        </button>
                      </RecipeItemWrapper>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </HoverCardGroup>
          ) : (
            /* Spacer to push footer to bottom when collapsed */
            <div className="flex-1" />
          )}

          {/* Footer - Settings & Help */}
          <div className={cn(
            'py-3 border-t border-stone-200 flex items-center',
            isRail ? 'px-2 flex-col gap-2 justify-center' : 'px-4 justify-end gap-1',
          )}>
            <NavTooltip label="Help">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
                    aria-label="Help"
                  >
                    <QuestionCircle className="w-5 h-5 text-stone-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side={isRail ? 'right' : 'top'} align={isRail ? 'start' : 'end'}>
                  <DropdownMenuItem onClick={() => setFeedbackOpen(true)}>
                    <ChatRoundLine className="w-4 h-4 text-stone-400" />
                    Leave Feedback
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Phone className="w-4 h-4 text-stone-300" />
                    Contact Support
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Keyboard className="w-4 h-4 text-stone-300" />
                    Keyboard Shortcuts
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <InfoCircle className="w-4 h-4 text-stone-300" />
                    About Mizen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </NavTooltip>
            <NavTooltip label="Settings">
              <span
                className="p-2 rounded-lg cursor-not-allowed"
                aria-label="Settings"
                aria-disabled="true"
              >
                <SettingsIcon className="w-5 h-5 text-stone-300" />
              </span>
            </NavTooltip>
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
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </TooltipProvider>
  );
}

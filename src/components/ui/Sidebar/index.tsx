'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Reorder, useDragControls, useReducedMotion } from 'framer-motion';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useCommandK } from '@/contexts/CommandKContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSidebarResize } from '@/hooks/useSidebarResize';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { GripVertical, Pin, Plus } from 'lucide-react';
import SquareDoubleAltArrowLeft from '@solar-icons/react/csr/arrows/SquareDoubleAltArrowLeft';
import SquareDoubleAltArrowRight from '@solar-icons/react/csr/arrows/SquareDoubleAltArrowRight';
import Magnifer from '@solar-icons/react/csr/search/Magnifer';
import ClockCircle from '@solar-icons/react/csr/time/ClockCircle';
import BookBookmarkIcon from '@solar-icons/react/csr/school/BookBookmark';
import SettingsIcon from '@solar-icons/react/csr/settings/Settings';
import QuestionCircle from '@solar-icons/react/csr/ui/QuestionCircle';
import ChatRoundLine from '@solar-icons/react/csr/messages/ChatRoundLine';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import FeedbackDialog from './FeedbackDialog';

// Shared easing for all sidebar transitions — ease-in-out-cubic
const SIDEBAR_EASING = 'cubic-bezier(0.645,0.045,0.355,1)';

// Helper: wrap children in a tooltip only when collapsed (desktop)
function NavTooltip({
  label,
  children,
  isCollapsed,
  isMobile,
}: {
  label: string;
  children: React.ReactNode;
  isCollapsed: boolean;
  isMobile: boolean;
}) {
  if (!isCollapsed || isMobile) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Draggable recipe item for the sidebar list */
const DraggableRecipeItem = memo(function DraggableRecipeItem({
  recipe,
  isActive,
  onRecipeClick,
  getRecipeIconPath,
  RecipeItemWrapper,
  dragConstraints,
  onDragEnd,
  reduceMotion,
}: {
  recipe: ParsedRecipe;
  isActive: boolean;
  onRecipeClick: (id: string) => void;
  getRecipeIconPath: (recipe: ParsedRecipe) => string;
  dragConstraints: React.RefObject<HTMLDivElement | null>;
  RecipeItemWrapper: React.ComponentType<{
    recipe: ParsedRecipe;
    children: React.ReactNode;
  }>;
  onDragEnd?: () => void;
  reduceMotion?: boolean;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={recipe}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={dragConstraints}
      onDragEnd={onDragEnd}
      as="div"
      whileDrag={
        reduceMotion
          ? { zIndex: 50 }
          : {
              zIndex: 50,
              scale: 1.03,
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            }
      }
      transition={{
        layout: reduceMotion
          ? { duration: 0 }
          : { type: 'spring', duration: 0.25, bounce: 0 },
      }}
      className="rounded-lg bg-[#FAFAF9]"
      style={{ position: 'relative' }}
    >
      <RecipeItemWrapper recipe={recipe}>
        <button
          onClick={() => onRecipeClick(recipe.id)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left group',
            isActive ? 'bg-stone-200/70' : 'hover:bg-stone-100',
          )}
        >
          <span className="flex items-center gap-2 min-w-0 pr-2 flex-1">
            <span
              className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none opacity-30 mr-0.5"
              onPointerDown={(e) => {
                e.preventDefault();
                dragControls.start(e);
              }}
            >
              <GripVertical className="w-3.5 h-3.5 text-stone-500" />
            </span>
            <Image
              src={getRecipeIconPath(recipe)}
              alt=""
              width={28}
              height={28}
              className="w-7 h-7 flex-shrink-0 object-contain pointer-events-none"
              unoptimized
              draggable={false}
            />
            <span
              className={cn(
                'font-albert text-sm truncate',
                isActive ? 'text-stone-900 font-medium' : 'text-stone-700',
              )}
            >
              {recipe.title}
            </span>
          </span>
        </button>
      </RecipeItemWrapper>
    </Reorder.Item>
  );
});

/**
 * Sidebar Component
 *
 * A collapsible, resizable sidebar navigation for the Mizen app.
 * On mobile (<768px), renders as a full-screen navigation view.
 * On desktop, collapses to a 64px icon rail instead of fully hiding.
 */
export default function Sidebar() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const pinnedListRef = useRef<HTMLDivElement>(null);
  const recipeListRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const {
    recentRecipes,
    getBookmarkedRecipes,
    isLoaded,
    getRecipeById,
    isPinned: _isPinned,
    recipeOrder,
    reorderRecipes,
  } = useParsedRecipes();
  const { parsedRecipe, setParsedRecipe } = useRecipe();
  const router = useRouter();
  const pathname = usePathname();

  const isMobile = useIsMobile();
  const {
    hideMobileNav,
    isCollapsed,
    setIsCollapsed,
  } = useSidebar();
  const { openSearch } = useCommandK();
  const { openLab } = usePrototypeLab();

  const {
    width: sidebarWidth,
    isDragging,
    handleMouseDown,
  } = useSidebarResize({
    minWidth: 200,
    maxWidth: 480,
    defaultWidth: 288,
    storageKey: 'sidebar-width',
    isCollapsed: isMobile ? false : isCollapsed,
  });

  // Stable recipe list derived from context (pinned-first or persisted order)
  const sortedRecipes = useMemo(() => {
    const bookmarked = getBookmarkedRecipes();
    const fromRecents = recentRecipes;
    const bookmarkedOnly = bookmarked.filter(
      (r) => !fromRecents.some((rc) => rc.id === r.id),
    );
    const combined = [...fromRecents, ...bookmarkedOnly];

    // If a manual order exists, use it
    if (recipeOrder.length > 0) {
      const recipeMap = new Map(combined.map((r) => [r.id, r]));
      const ordered: ParsedRecipe[] = [];
      const seen = new Set<string>();

      for (const id of recipeOrder) {
        const recipe = recipeMap.get(id);
        if (recipe) {
          ordered.push(recipe);
          seen.add(id);
        }
      }

      // Keep any recipes missing from persisted order in their canonical order.
      for (const recipe of combined) {
        if (!seen.has(recipe.id)) {
          ordered.push(recipe);
        }
      }

      return ordered;
    }

    // Fallback: pinned first (by pinnedAt desc), then unpinned
    const pinned = combined.filter((r) => r.pinnedAt);
    const unpinned = combined.filter((r) => !r.pinnedAt);
    pinned.sort(
      (a, b) =>
        new Date(b.pinnedAt!).getTime() - new Date(a.pinnedAt!).getTime(),
    );
    return [...pinned, ...unpinned];
  }, [recentRecipes, getBookmarkedRecipes, recipeOrder]);

  // Split into pinned and unpinned for separate sidebar sections
  const pinnedRecipes = useMemo(
    () => sortedRecipes.filter((r) => r.pinnedAt),
    [sortedRecipes],
  );
  const unpinnedRecipes = useMemo(
    () => sortedRecipes.filter((r) => !r.pinnedAt),
    [sortedRecipes],
  );

  // Local drag state — drives Reorder.Group visuals without touching context
  const [localPinnedOrder, setLocalPinnedOrder] = useState<ParsedRecipe[] | null>(null);
  const [localUnpinnedOrder, setLocalUnpinnedOrder] = useState<ParsedRecipe[] | null>(null);
  const displayPinned = localPinnedOrder ?? pinnedRecipes;
  const displayUnpinned = localUnpinnedOrder ?? unpinnedRecipes;
  const allRecipes = [...displayPinned, ...displayUnpinned];

  // Sync local state when the canonical order changes (e.g. recipe added/removed)
  useEffect(() => {
    setLocalPinnedOrder(null);
    setLocalUnpinnedOrder(null);
  }, [sortedRecipes]);

  // Determine which recipe is currently being viewed
  const activeRecipeId = useMemo(() => {
    if (pathname !== '/parsed-recipe-page' || !parsedRecipe) return null;
    if (parsedRecipe.id) return parsedRecipe.id;
    // Fallback: match by sourceUrl
    if (!parsedRecipe.sourceUrl) return null;
    const match = allRecipes.find(
      (r) =>
        r.sourceUrl === parsedRecipe.sourceUrl ||
        r.url === parsedRecipe.sourceUrl,
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

  const _getDisplayTime = (recipe: ParsedRecipe): string => {
    if (recipe.totalTimeMinutes) return formatTime(recipe.totalTimeMinutes);
    if (recipe.prepTimeMinutes && recipe.cookTimeMinutes) {
      return formatTime(recipe.prepTimeMinutes + recipe.cookTimeMinutes);
    }
    if (recipe.prepTimeMinutes) return formatTime(recipe.prepTimeMinutes);
    if (recipe.cookTimeMinutes) return formatTime(recipe.cookTimeMinutes);
    return '';
  };

  const getRecipeIconPath = useCallback((recipe: ParsedRecipe): string => {
    if (recipe.cuisine && recipe.cuisine.length > 0) {
      const icon = getCuisineIcon(recipe.cuisine[0]);
      if (icon) return icon;
    }
    return '/assets/cusineIcons/No_Cusine_Icon.png';
  }, []);

  const handleRecipeClick = useCallback(
    (recipeId: string) => {
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
          if (isMobile) hideMobileNav();
        }
      } catch (error) {
        console.error('Error loading recipe:', error);
      }
    },
    [getRecipeById, setParsedRecipe, router, isMobile, hideMobileNav],
  );

  // Persist the reorder to context/localStorage only when the drag ends.
  // Use refs so the callback stays stable across drag frames.
  const localPinnedRef = useRef(localPinnedOrder);
  localPinnedRef.current = localPinnedOrder;
  const localUnpinnedRef = useRef(localUnpinnedOrder);
  localUnpinnedRef.current = localUnpinnedOrder;
  const pinnedRef = useRef(pinnedRecipes);
  pinnedRef.current = pinnedRecipes;
  const unpinnedRef = useRef(unpinnedRecipes);
  unpinnedRef.current = unpinnedRecipes;

  const handleDragEnd = useCallback(() => {
    const currentPinned = localPinnedRef.current ?? pinnedRef.current;
    const currentUnpinned = localUnpinnedRef.current ?? unpinnedRef.current;
    const merged = [...currentPinned, ...currentUnpinned];
    reorderRecipes(merged.map((r) => r.id));
    setLocalPinnedOrder(null);
    setLocalUnpinnedOrder(null);
  }, [reorderRecipes]);

  const navItems = [
    { icon: ClockCircle, label: 'Timers', href: '/timers', disabled: true },
    {
      icon: BookBookmarkIcon,
      label: 'Cookbook',
      href: '/cookbook',
      disabled: true,
    },
  ];

  // Helper to wrap recipe items — skip HoverCard on mobile (no hover on touch)
  // Memoized to keep a stable reference across renders
  const RecipeItemWrapper = useMemo(() => {
    const Wrapper = ({
      recipe,
      children,
    }: {
      recipe: ParsedRecipe;
      children: React.ReactNode;
    }) => {
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
    Wrapper.displayName = 'RecipeItemWrapper';
    return Wrapper;
  }, [isMobile, handleRecipeClick]);


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
            !isDragging &&
              `transition-[width] duration-200 ease-[${SIDEBAR_EASING}]`,
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
            !isMobile &&
              !isDragging &&
              `transition-[width,min-width] duration-200 ease-[${SIDEBAR_EASING}]`,
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

            {/* Collapse button */}
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
                <SquareDoubleAltArrowLeft
                  weight="Outline"
                  className="w-4 h-4 text-stone-300"
                />
              </button>
            )}

            {/* Expand button — fades in when collapsed */}
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
                    <SquareDoubleAltArrowRight
                      weight="Outline"
                      className="w-5 h-5 text-stone-400"
                    />
                  </button>
                </TooltipTrigger>
                {isRail && (
                  <TooltipContent side="right">Expand sidebar</TooltipContent>
                )}
              </Tooltip>
            )}
          </div>

          {/* New Recipe Button — icon stays put, text fades */}
          <div className="px-2 mb-2">
            <NavTooltip isCollapsed={isCollapsed} isMobile={isMobile} label="New Recipe">
              <button
                onClick={() => {
                  if (pathname === '/') {
                    if (isMobile) hideMobileNav();
                  } else {
                    router.push('/');
                  }
                }}
                className="w-full flex items-center justify-center px-3 py-2.5 bg-[#0072ff] text-white rounded-lg hover:bg-[#0066e6] transition-colors font-albert font-medium"
                aria-label="New Recipe"
              >
                <Plus className="w-5 h-5 flex-shrink-0" />
                <div
                  className={cn(
                    'overflow-hidden whitespace-nowrap min-w-0 transition-[max-width,opacity,margin] duration-200',
                    isRail
                      ? 'max-w-0 opacity-0 ml-0'
                      : 'max-w-[200px] opacity-100 ml-2',
                  )}
                >
                  <span>New Recipe</span>
                </div>
              </button>
            </NavTooltip>
          </div>

          {/* Navigation — icons stay at fixed left position, text fades */}
          <nav className="px-2 py-2">
            {/* Search — opens command modal */}
            <NavTooltip isCollapsed={isCollapsed} isMobile={isMobile} label="Search  ⌘K">
              <button
                onClick={() => {
                  openSearch();
                  if (isMobile) hideMobileNav();
                }}
                className={cn(
                  "group w-full flex items-center px-3 py-2 rounded-lg transition-colors font-albert text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                  isRail && "justify-center"
                )}
                aria-label="Search recipes"
              >
                <Magnifer className="w-5 h-5 flex-shrink-0" />
                <div
                  className={cn(
                    'flex items-center overflow-hidden whitespace-nowrap min-w-0 transition-[max-width,opacity,margin] duration-200',
                    isRail
                      ? 'max-w-0 opacity-0 ml-0'
                      : 'flex-1 max-w-[250px] opacity-100 ml-3',
                  )}
                >
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
                  <NavTooltip key={item.label} isCollapsed={isCollapsed} isMobile={isMobile} label={item.label}>
                    <span
                      className="group w-full flex items-center px-3 py-2 rounded-lg font-albert text-sm text-stone-300 cursor-not-allowed"
                      aria-label={item.label}
                      aria-disabled="true"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div
                        className={cn(
                          'flex-1 flex items-center overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-200',
                          isRail
                            ? 'max-w-0 opacity-0 ml-0'
                            : 'max-w-[250px] opacity-100 ml-3',
                        )}
                      >
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
                <NavTooltip key={item.label} isCollapsed={isCollapsed} isMobile={isMobile} label={item.label}>
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
                    <div
                      className={cn(
                        'overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-200',
                        isRail
                          ? 'max-w-0 opacity-0 ml-0'
                          : 'max-w-[200px] opacity-100 ml-3',
                      )}
                    >
                      <span>{item.label}</span>
                    </div>
                  </Link>
                </NavTooltip>
              );
            })}

            {/* Prototype Lab — dev + preview only */}
            {(process.env.NODE_ENV === 'development' ||
              process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') && (
              <NavTooltip isCollapsed={isCollapsed} isMobile={isMobile} label="Prototype Lab">
                <button
                  onClick={openLab}
                  className={cn(
                    "w-full flex items-center px-3 py-2 rounded-lg transition-colors font-albert text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                    isRail && "justify-center"
                  )}
                  aria-label="Open Prototype Lab"
                >
                  <MousePointer2 className="w-5 h-5 flex-shrink-0" />
                  <div
                    className={cn(
                      'overflow-hidden whitespace-nowrap min-w-0 transition-[max-width,opacity,margin] duration-200',
                      isRail
                        ? 'max-w-0 opacity-0 ml-0'
                        : 'max-w-[200px] opacity-100 ml-3',
                    )}
                  >
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
                {/* Pinned Section */}
                {isLoaded && displayPinned.length > 0 && (
                  <div className="py-2">
                    <div className="px-3 py-1.5 flex items-center gap-2">
                      <Pin className="w-3.5 h-3.5 text-stone-400" />
                      <span className="font-albert text-xs font-medium text-stone-400 uppercase tracking-wider whitespace-nowrap">
                        Pinned
                      </span>
                    </div>
                    <Reorder.Group
                      ref={pinnedListRef}
                      axis="y"
                      values={displayPinned}
                      onReorder={setLocalPinnedOrder}
                      className="space-y-0.5"
                      as="div"
                    >
                      {displayPinned.map((recipe) => (
                        <DraggableRecipeItem
                          key={recipe.id}
                          recipe={recipe}
                          isActive={activeRecipeId === recipe.id}
                          onRecipeClick={handleRecipeClick}
                          getRecipeIconPath={getRecipeIconPath}
                          RecipeItemWrapper={RecipeItemWrapper}
                          dragConstraints={pinnedListRef}
                          onDragEnd={handleDragEnd}
                          reduceMotion={reduceMotion}
                        />
                      ))}
                    </Reorder.Group>
                  </div>
                )}

                {/* Recipes Section — unpinned, reorderable */}
                {isLoaded && displayUnpinned.length > 0 && (
                  <div className="py-2">
                    <div className="px-3 py-1.5 flex items-center gap-2">
                      <span className="font-albert text-xs font-medium text-stone-400 uppercase tracking-wider whitespace-nowrap">
                        Recipes
                      </span>
                    </div>
                    <Reorder.Group
                      ref={recipeListRef}
                      axis="y"
                      values={displayUnpinned}
                      onReorder={setLocalUnpinnedOrder}
                      className="space-y-0.5"
                      as="div"
                    >
                      {displayUnpinned.map((recipe) => (
                        <DraggableRecipeItem
                          key={recipe.id}
                          recipe={recipe}
                          isActive={activeRecipeId === recipe.id}
                          onRecipeClick={handleRecipeClick}
                          getRecipeIconPath={getRecipeIconPath}
                          RecipeItemWrapper={RecipeItemWrapper}
                          dragConstraints={recipeListRef}
                          onDragEnd={handleDragEnd}
                          reduceMotion={reduceMotion}
                        />
                      ))}
                    </Reorder.Group>
                  </div>
                )}
              </div>
            </HoverCardGroup>
          ) : (
            /* Spacer to push footer to bottom when collapsed */
            <div className="flex-1" />
          )}

          {/* Footer - Settings & Help */}
          <div
            className={cn(
              'py-3 border-t border-stone-200 flex items-center',
              isRail
                ? 'px-2 flex-col gap-2 justify-center'
                : 'px-4 justify-end gap-1',
            )}
          >
            <NavTooltip isCollapsed={isCollapsed} isMobile={isMobile} label="Help">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
                    aria-label="Help"
                  >
                    <QuestionCircle className="w-5 h-5 text-stone-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side={isRail ? 'right' : 'top'}
                  align={isRail ? 'start' : 'end'}
                >
                  <DropdownMenuItem onClick={() => setFeedbackOpen(true)}>
                    <ChatRoundLine className="w-4 h-4 text-stone-400" />
                    Leave Feedback
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <InfoCircle className="w-4 h-4 text-stone-300" />
                    About Mizen
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-[11px] text-stone-400 font-albert leading-relaxed">
                    <div>Mizen v0.1.0</div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </NavTooltip>
            <NavTooltip isCollapsed={isCollapsed} isMobile={isMobile} label="Settings">
              <button
                disabled
                className="p-2 rounded-lg cursor-not-allowed"
                aria-label="Settings"
              >
                <SettingsIcon className="w-5 h-5 text-stone-300" />
              </button>
            </NavTooltip>
          </div>
        </div>

        {/* Resize handle - desktop expanded only */}
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

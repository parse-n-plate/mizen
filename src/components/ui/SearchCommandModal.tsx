'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronRight, Link, Upload, X } from 'lucide-react';
import { Drawer } from 'vaul';
import UndoLeftRound from '@solar-icons/react/csr/arrows-action/UndoLeftRound';
import ClockCircle from '@solar-icons/react/csr/time/ClockCircle';
import BookBookmarkIcon from '@solar-icons/react/csr/school/BookBookmark';
import SettingsIcon from '@solar-icons/react/csr/settings/Settings';
import ChatRoundLine from '@solar-icons/react/csr/messages/ChatRoundLine';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getCuisineIcon } from '@/config/cuisineConfig';
import { cn } from '@/lib/utils';
import { isUrl } from '@/utils/searchUtils';
import FeedbackDialog, {
  CATEGORIES as FEEDBACK_CATEGORIES,
  type FeedbackType,
} from '@/components/ui/Sidebar/FeedbackDialog';
import type { ParsedRecipe } from '@/lib/storage';

interface SearchCommandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchCommandModal({
  open,
  onOpenChange,
}: SearchCommandModalProps) {
  const {
    recentRecipes,
    getRecipeById,
    getBookmarkedRecipes,
  } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [feedbackExpanded, setFeedbackExpanded] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('Bug Report');

  const isUrlInput = search.trim().length > 0 && isUrl(search);

  // Collapse feedback sub-items when search changes
  useEffect(() => {
    setFeedbackExpanded(false);
  }, [search]);

  const allRecipes = useMemo(() => {
    const bookmarkedRecipes = getBookmarkedRecipes();
    const mergedRecipes: ParsedRecipe[] = [];
    const seenRecipeIds = new Set<string>();

    for (const recipe of [...recentRecipes, ...bookmarkedRecipes]) {
      if (seenRecipeIds.has(recipe.id)) continue;
      seenRecipeIds.add(recipe.id);
      mergedRecipes.push(recipe);
    }

    return mergedRecipes;
  }, [recentRecipes, getBookmarkedRecipes]);

  const displayedRecipes = search ? allRecipes : allRecipes.slice(0, 3);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setSearch('');
        setFeedbackExpanded(false);
      }
      onOpenChange(open);
    },
    [onOpenChange],
  );

  const formatTime = (minutes?: number): string => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    if (rem === 0) return `${hours}h`;
    return `${hours}h ${rem}m`;
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

  const handleSelectRecipe = useCallback(
    (recipeId: string) => {
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
          storageGuide: fullRecipe.storageGuide,
          shelfLife: fullRecipe.shelfLife,
          platingNotes: fullRecipe.platingNotes,
          servingVessel: fullRecipe.servingVessel,
          servingTemp: fullRecipe.servingTemp,
          plate: fullRecipe.plate,
        });
        handleOpenChange(false);
        router.push('/parsed-recipe-page');
      }
    },
    [getRecipeById, setParsedRecipe, router, handleOpenChange],
  );

  const handleAddViaUrl = useCallback(() => {
    handleOpenChange(false);
    router.push('/');
  }, [handleOpenChange, router]);

  const handleAddViaImage = useCallback(() => {
    handleOpenChange(false);
    router.push('/?action=upload-image');
  }, [handleOpenChange, router]);

  const handleParseDetectedUrl = useCallback(() => {
    const url = search.trim();
    handleOpenChange(false);
    router.push(`/?url=${encodeURIComponent(url)}`);
  }, [handleOpenChange, router, search]);

  const handleSelectFeedbackType = useCallback(
    (type: FeedbackType) => {
      setFeedbackType(type);
      setFeedbackDialogOpen(true);
      handleOpenChange(false);
    },
    [handleOpenChange],
  );

  const renderRecipeItem = (recipe: ParsedRecipe) => (
    <CommandItem
      key={recipe.id}
      value={`${recipe.title} ${recipe.author || ''} ${(recipe.cuisine || []).join(' ')}`}
      onSelect={() => handleSelectRecipe(recipe.id)}
      className="group flex items-center gap-3 px-3 py-3 rounded-xl font-albert cursor-pointer data-[selected=true]:bg-stone-100/80 data-[selected=true]:text-stone-900"
    >
      <Image
        src={getRecipeIconPath(recipe)}
        alt=""
        width={32}
        height={32}
        className="w-8 h-8 flex-shrink-0 object-contain"
        unoptimized
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-stone-900 font-medium truncate block">
          {recipe.title}
        </span>
        <span className="text-sm text-stone-500 truncate block">
          {[recipe.author, recipe.cuisine?.[0], getDisplayTime(recipe)]
            .filter(Boolean)
            .join(' \u00b7 ')}
        </span>
      </div>
      <div className="hidden group-data-[selected=true]:flex items-center gap-1.5 text-stone-400 flex-shrink-0 ml-2">
        <UndoLeftRound size={20} className="!size-5 text-stone-400" aria-hidden="true" />
        <span className="text-sm font-albert">Jump to</span>
      </div>
    </CommandItem>
  );

  const searchInputSuffix = search.length > 0 ? (
    <button
      onClick={() => setSearch('')}
      className="flex items-center justify-center size-6 rounded-full text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
      aria-label="Clear search"
    >
      <X className="size-3.5" />
    </button>
  ) : null;

  const commandListContent = (
    <>
      <CommandEmpty className="font-albert text-stone-400 px-4 py-10 text-center">
        No results found.
      </CommandEmpty>

      {/* URL detected: show parse action */}
      {isUrlInput ? (
        <CommandGroup heading="Add Recipe" className="font-albert pt-2">
          <CommandItem
            value={`parse add recipe url ${search}`}
            onSelect={handleParseDetectedUrl}
            className="flex items-center gap-3 px-3 py-3 rounded-xl font-albert cursor-pointer data-[selected=true]:bg-stone-100/80 data-[selected=true]:text-stone-900"
          >
            <Link className="w-6 h-6 text-stone-400 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-stone-900 font-medium truncate block">
                Parse recipe from URL
              </span>
              <span className="text-sm text-stone-400 truncate block mt-1">
                {search.trim()}
              </span>
            </div>
          </CommandItem>
        </CommandGroup>
      ) : !search ? (
        /* Default: show add via URL and add via image */
        <CommandGroup heading="Add Recipe" className="font-albert pt-2">
          <CommandItem
            value="add recipe via url link paste"
            onSelect={handleAddViaUrl}
            className="flex items-center gap-3 px-3 py-3 rounded-xl font-albert cursor-pointer data-[selected=true]:bg-stone-100/80 data-[selected=true]:text-stone-900"
          >
            <Link className="w-6 h-6 text-stone-400 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-stone-900 font-medium">
                Add via URL
              </span>
              <span className="text-sm text-stone-400 block mt-1">
                Paste a recipe link
              </span>
            </div>
          </CommandItem>
          <CommandItem
            value="add recipe via image upload photo scan"
            onSelect={handleAddViaImage}
            className="flex items-center gap-3 px-3 py-3 rounded-xl font-albert cursor-pointer data-[selected=true]:bg-stone-100/80 data-[selected=true]:text-stone-900"
          >
            <Upload className="w-6 h-6 text-stone-400 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-stone-900 font-medium">
                Add via Image
              </span>
              <span className="text-sm text-stone-400 block mt-1">
                Upload a recipe photo
              </span>
            </div>
          </CommandItem>
        </CommandGroup>
      ) : null}

      {/* Navigation: Quick links to Timers and Cookbook */}
      {!search && (
        <CommandGroup heading="Navigation" className="font-albert pt-3">
          <CommandItem
            value="timers timer navigation"
            disabled
            className="flex items-center gap-3 px-3 py-3 rounded-xl font-albert cursor-pointer data-[selected=true]:bg-stone-100/80 data-[selected=true]:text-stone-900"
          >
            <ClockCircle className="w-6 h-6 text-stone-400 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-stone-900 font-medium">
                Timers
              </span>
              <span className="text-sm text-stone-400 block mt-1">
                Coming soon
              </span>
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-stone-400 border border-stone-300 rounded-full px-2 py-0.5">
              Soon
            </span>
          </CommandItem>
          <CommandItem
            value="cookbook saved recipes bookmarks"
            disabled
            className="flex items-center gap-3 px-3 py-3 rounded-xl font-albert cursor-pointer data-[selected=true]:bg-stone-100/80 data-[selected=true]:text-stone-900"
          >
            <BookBookmarkIcon className="w-6 h-6 text-stone-400 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-stone-900 font-medium">
                Cookbook
              </span>
              <span className="text-sm text-stone-400 block mt-1">
                Coming soon
              </span>
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-stone-400 border border-stone-300 rounded-full px-2 py-0.5">
              Soon
            </span>
          </CommandItem>
        </CommandGroup>
      )}

      {/* Settings & Feedback — only visible when searching */}
      {search.length > 0 && !isUrlInput && (
        <CommandGroup heading="Quick Actions" className="font-albert pt-3">
          <CommandItem
            value="settings preferences configuration"
            disabled
            className="flex items-center gap-3 px-3 py-3 rounded-xl font-albert cursor-pointer data-[selected=true]:bg-stone-100/80 data-[selected=true]:text-stone-900"
          >
            <SettingsIcon className="w-6 h-6 text-stone-400 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-stone-900 font-medium">
                Settings
              </span>
              <span className="text-sm text-stone-400 block mt-1">
                Coming soon
              </span>
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-stone-400 border border-stone-300 rounded-full px-2 py-0.5">
              Soon
            </span>
          </CommandItem>

          <CommandItem
            value="feedback report bug feature idea message"
            onSelect={() => setFeedbackExpanded((prev) => !prev)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl font-albert cursor-pointer data-[selected=true]:bg-stone-100/80 data-[selected=true]:text-stone-900"
          >
            <ChatRoundLine className="w-6 h-6 text-stone-400 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-stone-900 font-medium">
                Feedback
              </span>
              <span className="text-sm text-stone-400 block mt-1">
                Send us a message
              </span>
            </div>
            <ChevronRight
              className={cn(
                'w-4 h-4 text-stone-400 flex-shrink-0 transition-transform duration-200',
                feedbackExpanded && 'rotate-90',
              )}
            />
          </CommandItem>

          {feedbackExpanded &&
            FEEDBACK_CATEGORIES.map(({ type, icon: Icon, subtitle }) => (
              <CommandItem
                key={type}
                value={`${type.toLowerCase()} feedback`}
                onSelect={() => handleSelectFeedbackType(type)}
                className="flex items-center gap-3 px-3 py-3 pl-9 rounded-xl font-albert cursor-pointer data-[selected=true]:bg-stone-100/80 data-[selected=true]:text-stone-900"
              >
                <Icon className="w-5 h-5 text-stone-400 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-stone-900 font-medium">
                    {type}
                  </span>
                  <span className="text-sm text-stone-400 block mt-1">
                    {subtitle}
                  </span>
                </div>
              </CommandItem>
            ))}
        </CommandGroup>
      )}

      {/* Recipes: 3 recent when idle, all for search filtering */}
      {displayedRecipes.length > 0 && (
        <CommandGroup
          heading={search ? 'Recipes' : 'Recent'}
          className="font-albert pt-3"
        >
          {displayedRecipes.map(renderRecipeItem)}
        </CommandGroup>
      )}

      {/* Empty state when no recipes exist */}
      {allRecipes.length === 0 && !search && (
        <div className="px-4 py-10 text-center">
          <p className="font-albert text-sm text-stone-400">
            No recipes yet
          </p>
          <p className="font-albert text-sm text-stone-300 mt-1">
            Add your first recipe via URL or image
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      {isMobile ? (
        // ── Mobile: Vaul bottom-sheet drawer ──
        <Drawer.Root
          open={open}
          onOpenChange={handleOpenChange}
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
            <Drawer.Content
              className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-white rounded-t-[32px] shadow-2xl h-[85dvh] outline-none"
            >
              <Drawer.Handle className="mt-3 mb-2 !w-12 !h-1 !bg-stone-200" />

              <div className="flex items-center justify-between px-5 pb-1 flex-shrink-0">
                <Drawer.Title className="font-albert text-base font-medium text-stone-500">
                  Search
                </Drawer.Title>
                <Drawer.Close
                  className="flex items-center justify-center size-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition-colors"
                  aria-label="Close search"
                >
                  <X className="size-4" />
                </Drawer.Close>
              </div>

              <Command className="flex flex-col flex-1 min-h-0 [&_[cmdk-group-heading]]:text-stone-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-14 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                <CommandInput
                  placeholder="Search or paste a URL\u2026"
                  value={search}
                  onValueChange={setSearch}
                  className="font-albert text-base text-stone-800 placeholder:text-stone-400"
                  suffix={searchInputSuffix}
                />
                <CommandList
                  className="overflow-y-auto px-2 pb-2 flex-1 max-h-none overscroll-contain"
                  data-vaul-no-drag
                >
                  {commandListContent}
                </CommandList>
              </Command>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        // ── Desktop: existing CommandDialog (unchanged) ──
        <CommandDialog
          open={open}
          onOpenChange={handleOpenChange}
          title="Search Recipes"
          description="Find a recipe by name, author, or cuisine"
          showCloseButton={false}
          overlayClassName="search-command-overlay"
          className="sm:max-w-[44rem] search-command-modal [&_[data-slot=command-input-wrapper]]:border-stone-200 [&_[data-slot=command-input-wrapper]_svg]:text-stone-400 [&_[data-slot=command-input-wrapper]_svg]:opacity-100 [&_[cmdk-group-heading]]:text-stone-400"
        >
          <CommandInput
            placeholder="Search or paste a URL\u2026"
            value={search}
            onValueChange={setSearch}
            className="font-albert text-base text-stone-800 placeholder:text-stone-400"
            suffix={searchInputSuffix}
          />
          <CommandList
            className="overflow-y-auto px-2 pb-2 max-h-none transition-[height] duration-150 ease-[cubic-bezier(0.215,0.61,0.355,1)] motion-reduce:transition-none"
            style={{
              height: 'clamp(320px, var(--cmdk-list-height, 320px), 640px)',
            }}
          >
            {commandListContent}
          </CommandList>
          <div className="border-t border-stone-100 px-4 py-2 flex items-center justify-end gap-1">
            <kbd className="font-albert text-xs text-stone-400 bg-stone-100 border border-stone-200 rounded px-2 py-1">
              Esc
            </kbd>
            <span className="font-albert text-xs text-stone-400">to close</span>
          </div>
        </CommandDialog>
      )}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
        initialType={feedbackType}
        initialStep={2}
      />
    </>
  );
}

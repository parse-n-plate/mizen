'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { XIcon, Link, Upload } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { getCuisineIcon } from '@/config/cuisineConfig';
import { isUrl } from '@/utils/searchUtils';
import type { ParsedRecipe } from '@/lib/storage';

interface SearchCommandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchCommandModal({ open, onOpenChange }: SearchCommandModalProps) {
  const { recentRecipes, getRecipeById, getBookmarkedRecipes, bookmarkedRecipeIds, touchRecipe } =
    useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const isUrlInput = search.trim().length > 0 && isUrl(search);

  const bookmarkedRecipes = getBookmarkedRecipes();

  const bookmarkedIdSet = useMemo(
    () => new Set(bookmarkedRecipeIds),
    [bookmarkedRecipeIds],
  );

  const recentUnbookmarked = useMemo(
    () => recentRecipes.filter((recipe) => !bookmarkedIdSet.has(recipe.id)),
    [recentRecipes, bookmarkedIdSet],
  );

  const displayedRecentRecipes = search ? recentUnbookmarked : recentUnbookmarked.slice(0, 3);

  const hasAnyRecipes = recentUnbookmarked.length > 0 || bookmarkedRecipes.length > 0;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) setSearch('');
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
          plate: fullRecipe.plate,
        });
        onOpenChange(false);
        router.push('/parsed-recipe-page');
      }
    },
    [getRecipeById, setParsedRecipe, router, onOpenChange, touchRecipe],
  );

  const handleAddViaUrl = useCallback(() => {
    onOpenChange(false);
    router.push('/');
  }, [onOpenChange, router]);

  const handleAddViaImage = useCallback(() => {
    onOpenChange(false);
    router.push('/?action=upload-image');
  }, [onOpenChange, router]);

  const handleParseDetectedUrl = useCallback(() => {
    const url = search.trim();
    onOpenChange(false);
    router.push(`/?url=${encodeURIComponent(url)}`);
  }, [onOpenChange, router, search]);

  const renderRecipeItem = (recipe: ParsedRecipe) => (
    <CommandItem
      key={recipe.id}
      value={`${recipe.title} ${recipe.author || ''} ${(recipe.cuisine || []).join(' ')}`}
      onSelect={() => handleSelectRecipe(recipe.id)}
      className="flex items-center gap-3 px-3 py-3 rounded-xl font-albert cursor-pointer data-[selected=true]:bg-stone-100/80 data-[selected=true]:text-stone-900"
    >
      <Image
        src={getRecipeIconPath(recipe)}
        alt=""
        width={28}
        height={28}
        className="w-7 h-7 flex-shrink-0 object-contain"
        unoptimized
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-stone-900 font-medium truncate block">
          {recipe.title}
        </span>
        <span className="text-xs text-stone-500 truncate block">
          {[recipe.author, recipe.cuisine?.[0], getDisplayTime(recipe)]
            .filter(Boolean)
            .join(' \u00b7 ')}
        </span>
      </div>
    </CommandItem>
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Search Recipes"
      description="Find a recipe by name, author, or cuisine"
      showCloseButton={false}
      overlayClassName="search-command-overlay"
      className="sm:max-w-xl search-command-modal max-md:inset-0 max-md:top-0 max-md:left-0 max-md:translate-x-0 max-md:translate-y-0 max-md:max-w-none max-md:w-full max-md:h-dvh max-md:rounded-none max-md:border-0 max-md:shadow-none [&_[data-slot=command-input-wrapper]]:border-stone-200 [&_[data-slot=command-input-wrapper]_svg]:text-stone-400 [&_[data-slot=command-input-wrapper]_svg]:opacity-100 [&_[cmdk-group-heading]]:text-stone-400"
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-1 md:hidden">
        <span className="font-albert text-sm font-medium text-stone-500">Search</span>
        <button
          onClick={() => onOpenChange(false)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition-colors"
          aria-label="Close search"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
      <CommandInput
        placeholder="Search or paste a URL..."
        value={search}
        onValueChange={setSearch}
        className="font-albert text-base text-stone-800 placeholder:text-stone-400"
      />
      <CommandList className="h-[400px] max-md:h-auto max-md:flex-1 px-2 pb-2">
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
              <Link className="w-5 h-5 text-stone-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-stone-900 font-medium truncate block">
                  Parse recipe from URL
                </span>
                <span className="text-xs text-stone-400 truncate block mt-0.5">
                  {search.trim()}
                </span>
              </div>
            </CommandItem>
          </CommandGroup>
        ) : (
          /* Default: show add via URL and add via image */
          <CommandGroup heading="Add Recipe" className="font-albert pt-2">
            <CommandItem
              value="add recipe via url link paste"
              onSelect={handleAddViaUrl}
              className="flex items-center gap-3 px-3 py-3 rounded-xl font-albert cursor-pointer data-[selected=true]:bg-stone-100/80 data-[selected=true]:text-stone-900"
            >
              <Link className="w-5 h-5 text-stone-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-stone-900 font-medium">Add via URL</span>
                <span className="text-xs text-stone-400 block mt-0.5">Paste a recipe link</span>
              </div>
            </CommandItem>
            <CommandItem
              value="add recipe via image upload photo scan"
              onSelect={handleAddViaImage}
              className="flex items-center gap-3 px-3 py-3 rounded-xl font-albert cursor-pointer data-[selected=true]:bg-stone-100/80 data-[selected=true]:text-stone-900"
            >
              <Upload className="w-5 h-5 text-stone-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-stone-900 font-medium">Add via Image</span>
                <span className="text-xs text-stone-400 block mt-0.5">Upload a recipe photo</span>
              </div>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Recent recipes */}
        {displayedRecentRecipes.length > 0 && (
          <CommandGroup heading="Recent" className="font-albert pt-3">
            {displayedRecentRecipes.map(renderRecipeItem)}
          </CommandGroup>
        )}

        {/* Cookbook (bookmarked/saved recipes) */}
        {bookmarkedRecipes.length > 0 && (
          <CommandGroup heading="Cookbook" className="font-albert pt-3">
            {bookmarkedRecipes.map(renderRecipeItem)}
          </CommandGroup>
        )}

        {/* Empty state when no recipes exist */}
        {!hasAnyRecipes && !search && (
          <div className="px-4 py-10 text-center">
            <p className="font-albert text-sm text-stone-400">No recipes yet</p>
            <p className="font-albert text-xs text-stone-300 mt-1.5">
              Add your first recipe via URL or image
            </p>
          </div>
        )}
      </CommandList>
      <div className="border-t border-stone-100 px-4 py-2.5 hidden md:flex items-center justify-end gap-1">
        <kbd className="font-albert text-[11px] text-stone-400 bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5">
          Esc
        </kbd>
        <span className="font-albert text-xs text-stone-400">to close</span>
      </div>
    </CommandDialog>
  );
}

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { XIcon } from 'lucide-react';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
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
import { useToast } from '@/hooks/useToast';
import { getCuisineIcon } from '@/config/cuisineConfig';
import type { ParsedRecipe } from '@/lib/storage';

interface SearchCommandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchCommandModal({ open, onOpenChange }: SearchCommandModalProps) {
  const { recentRecipes, getRecipeById, isBookmarked, toggleBookmark } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const { showSuccess } = useToast();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const displayedRecipes = search ? recentRecipes : recentRecipes.slice(0, 3);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) setSearch('');
      onOpenChange(open);
    },
    [onOpenChange],
  );

  const handleBookmarkToggle = useCallback(
    (e: React.MouseEvent, recipe: ParsedRecipe) => {
      e.stopPropagation();
      const wasBookmarked = isBookmarked(recipe.id);
      toggleBookmark(recipe.id);
      showSuccess(
        wasBookmarked ? 'Removed from Cookbook' : 'Added to Cookbook',
        wasBookmarked
          ? `"${recipe.title}" was removed from your Cookbook.`
          : `"${recipe.title}" was added to your Cookbook.`,
      );
    },
    [isBookmarked, toggleBookmark, showSuccess],
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
          plate: fullRecipe.plate,
        });
        onOpenChange(false);
        router.push('/parsed-recipe-page');
      }
    },
    [getRecipeById, setParsedRecipe, router, onOpenChange],
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
        placeholder="Search recipes..."
        value={search}
        onValueChange={setSearch}
        className="font-albert text-base text-stone-800 placeholder:text-stone-400"
      />
      <CommandList className="max-h-[360px] max-md:max-h-none max-md:flex-1">
        <CommandEmpty className="font-albert text-stone-500 px-3 py-8">
          No recipes found.
        </CommandEmpty>
        <CommandGroup heading={search ? 'Recipes' : 'Recent'} className="font-albert">
          {displayedRecipes.map((recipe) => (
            <CommandItem
              key={recipe.id}
              value={`${recipe.title} ${recipe.author || ''} ${(recipe.cuisine || []).join(' ')}`}
              onSelect={() => handleSelectRecipe(recipe.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-albert cursor-pointer data-[selected=true]:bg-stone-100 data-[selected=true]:text-stone-900"
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
              <button
                onClick={(e) => handleBookmarkToggle(e, recipe)}
                className="p-1.5 rounded-lg flex-shrink-0 transition-colors hover:bg-stone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                aria-label={isBookmarked(recipe.id) ? 'Remove from Cookbook' : 'Save to Cookbook'}
              >
                <Bookmark
                  className={`w-4.5 h-4.5 transition-colors ${
                    isBookmarked(recipe.id)
                      ? 'fill-[#78716C] text-[#78716C]'
                      : 'fill-[#D6D3D1] text-[#D6D3D1] hover:fill-[#A8A29E] hover:text-[#A8A29E]'
                  }`}
                />
              </button>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="border-t border-stone-200 px-3 py-2 hidden md:flex items-center justify-end gap-1">
        <kbd className="font-albert text-[11px] text-stone-400 bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5">
          Esc
        </kbd>
        <span className="font-albert text-xs text-stone-400">to close</span>
      </div>
    </CommandDialog>
  );
}

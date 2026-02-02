'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
import type { ParsedRecipe } from '@/lib/storage';

interface SearchCommandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchCommandModal({ open, onOpenChange }: SearchCommandModalProps) {
  const { recentRecipes, getRecipeById } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();

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
      onOpenChange={onOpenChange}
      title="Search Recipes"
      description="Find a recipe by name, author, or cuisine"
      showCloseButton={false}
      className="sm:max-w-xl search-command-modal [&_[data-slot=command-input-wrapper]]:border-stone-200 [&_[data-slot=command-input-wrapper]_svg]:text-stone-400 [&_[data-slot=command-input-wrapper]_svg]:opacity-100 [&_[cmdk-group-heading]]:text-stone-400"
    >
      <CommandInput
        placeholder="Search recipes..."
        className="font-albert text-base text-stone-800 placeholder:text-stone-400"
      />
      <CommandList className="max-h-[360px]">
        <CommandEmpty className="font-albert text-stone-500 py-8">
          No recipes found.
        </CommandEmpty>
        <CommandGroup heading="Recipes" className="font-albert">
          {recentRecipes.map((recipe) => (
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
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="border-t border-stone-200 px-3 py-2 flex items-center justify-end gap-1">
        <kbd className="font-albert text-[11px] text-stone-400 bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5">
          Esc
        </kbd>
        <span className="font-albert text-xs text-stone-400">to close</span>
      </div>
    </CommandDialog>
  );
}

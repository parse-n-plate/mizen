'use client';

import { useMemo, useState } from 'react';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useRouter } from 'next/navigation';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import History from '@solar-icons/react/csr/time/History';
import { Ellipsis, ExternalLink, Link, PenLine, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import { toast } from 'sonner';

/**
 * HomepageRecentRecipes Component
 * 
 * Displays recent recipes as a vertical list under the search bar.
 * Each recipe shows: name, preparation time pill, and bookmark icon.
 * Based on Figma design - clean, minimal vertical list.
 */
export default function HomepageRecentRecipes() {
  const {
    recentRecipes,
    bookmarkedRecipeIds,
    getRecipeById,
    removeRecipe,
    restoreRecipe,
    isBookmarked,
    toggleBookmark,
    updateRecipe,
  } = useParsedRecipes();
  const { parsedRecipe, setParsedRecipe } = useRecipe();
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const { showSuccess, showInfo } = useToast();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameRecipeId, setRenameRecipeId] = useState<string | null>(null);

  // Filter out bookmarked recipes — they live in Cookbook, not Recent
  const bookmarkedIdSet = useMemo(
    () => new Set(bookmarkedRecipeIds),
    [bookmarkedRecipeIds],
  );
  const unbookmarkedRecipes = useMemo(
    () => recentRecipes.filter((r) => !bookmarkedIdSet.has(r.id)),
    [recentRecipes, bookmarkedIdSet],
  );

  // Determine which recipes to display
  // Show 5 by default, or all if showAll is true
  const displayRecipes = showAll ? unbookmarkedRecipes : unbookmarkedRecipes.slice(0, 5);
  const hasMoreThanFive = unbookmarkedRecipes.length > 5;

  // Format time display (e.g., "35m", "3h 30m", "48m")
  const formatTime = (minutes?: number): string => {
    if (!minutes) return '';
    
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  };

  // Get time to display (prefer totalTime, then prepTime + cookTime, then prepTime or cookTime)
  const getDisplayTime = (recipe: typeof recentRecipes[0]): string => {
    if (recipe.totalTimeMinutes) {
      return formatTime(recipe.totalTimeMinutes);
    }
    
    if (recipe.prepTimeMinutes && recipe.cookTimeMinutes) {
      return formatTime(recipe.prepTimeMinutes + recipe.cookTimeMinutes);
    }
    
    if (recipe.prepTimeMinutes) {
      return formatTime(recipe.prepTimeMinutes);
    }
    
    if (recipe.cookTimeMinutes) {
      return formatTime(recipe.cookTimeMinutes);
    }
    
    return '';
  };

  // Handle recipe click - navigate to parsed recipe page
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
          storageGuide: fullRecipe.storageGuide,
          shelfLife: fullRecipe.shelfLife,
          platingNotes: fullRecipe.platingNotes,
          servingVessel: fullRecipe.servingVessel,
          servingTemp: fullRecipe.servingTemp,
          plate: fullRecipe.plate,
        });
        router.push('/parsed-recipe-page');
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    }
  };

  // Handle bookmark toggle - shows confirmation dialog if currently bookmarked
  const handleBookmarkToggle = (recipeId: string) => {
    // Check if recipe is currently bookmarked
    const isCurrentlyBookmarked = isBookmarked(recipeId);
    
    if (isCurrentlyBookmarked) {
      // If bookmarked, show confirmation dialog
      const confirmed = window.confirm(
        'Are you sure you want to remove this recipe from your Cookbook? You can add it back later.'
      );
      
      if (confirmed) {
        toggleBookmark(recipeId);
      }
    } else {
      // If not bookmarked, just add the bookmark directly
      toggleBookmark(recipeId);
    }
  };

  const getSourceUrl = (recipe: typeof recentRecipes[0]) =>
    recipe.sourceUrl || recipe.url;

  // Handle opening recipe in new tab
  const handleOpenNewTab = (recipe: typeof recentRecipes[0]) => {
    const sourceUrl = getSourceUrl(recipe);
    if (sourceUrl) {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle copy link
  const handleCopyLink = async (recipe: typeof recentRecipes[0]) => {
    const sourceUrl = getSourceUrl(recipe);
    if (sourceUrl) {
      try {
        await navigator.clipboard.writeText(sourceUrl);
        showSuccess('Link copied', 'Recipe URL copied to clipboard.');
      } catch {
        showInfo('Could not copy', 'Your browser blocked clipboard access.');
      }
    } else {
      showInfo('No link available', 'This recipe does not have a source URL.');
    }
  };

  // Handle rename
  const handleRename = (recipe: typeof recentRecipes[0]) => {
    setRenameRecipeId(recipe.id);
    setRenameValue(recipe.title);
    setRenameOpen(true);
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (!trimmed || !renameRecipeId) return;
    updateRecipe(renameRecipeId, { title: trimmed });
    const renamedRecipe = getRecipeById(renameRecipeId);
    const activeRecipeMatches =
      parsedRecipe &&
      renamedRecipe &&
      (parsedRecipe.id === renameRecipeId ||
        (parsedRecipe.sourceUrl &&
          (parsedRecipe.sourceUrl === renamedRecipe.sourceUrl ||
            parsedRecipe.sourceUrl === renamedRecipe.url)));
    if (activeRecipeMatches) {
      setParsedRecipe({ ...parsedRecipe, title: trimmed });
    }
    showSuccess('Renamed', `Recipe renamed to "${trimmed}".`);
    setRenameOpen(false);
    setRenameRecipeId(null);
  };

  // Handle delete with undo toast
  const handleDelete = (recipeId: string) => {
    const savedRecipe = getRecipeById(recipeId);
    const wasBookmarked = isBookmarked(recipeId);
    removeRecipe(recipeId);
    toast('Recipe deleted', {
      description: 'The recipe was removed from your recent recipes.',
      duration: 5000,
      action: savedRecipe
        ? {
            label: 'Undo',
            onClick: () => {
              restoreRecipe(savedRecipe, wasBookmarked);
            },
          }
        : undefined,
    });
  };

  // Don't render if no recipes
  if (displayRecipes.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Section Title */}
      <div className="flex items-center mb-4 pl-4">
        <div className="flex items-center gap-2">
          {/* History Icon - Visual indicator for recent recipes */}
          <History className="w-5 h-5 text-stone-500" />
          <h2 className="font-albert text-base text-stone-500 text-left font-medium">
            Recent Recipes
          </h2>
        </div>
      </div>

      {/* Recipe List */}
      <div className="space-y-3">
        {displayRecipes.map((recipe) => {
          const isBookmarkedState = isBookmarked(recipe.id);
          const displayTime = getDisplayTime(recipe);

          return (
            <div
              key={recipe.id}
              className="
                w-full flex items-center justify-between
                py-2 pr-2
                hover:bg-stone-50 rounded-lg
                group
              "
            >
              {/* Left: Recipe Name and Time */}
              <div className="flex items-center gap-3 flex-1 min-w-0 pl-4">
                {/* Recipe Name and Time - Clickable */}
                <button
                  onClick={() => handleRecipeClick(recipe.id)}
                  className="
                    flex items-center gap-3 flex-1 min-w-0
                    text-left
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2 rounded-lg
                  "
                >
                  <span className="font-albert text-xl text-stone-800 text-left truncate" style={{ fontSize: '16px' }}>
                    {recipe.title}
                  </span>
                  {displayTime && (
                    <span className="
                      font-albert text-sm text-stone-600
                      bg-stone-100 px-2.5 py-1 rounded-full
                      flex-shrink-0
                    ">
                      {displayTime}
                    </span>
                  )}
                </button>
              </div>

              {/* Right: 3-Dot Menu - Always visible */}
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <DropdownMenu open={openMenuId === recipe.id} onOpenChange={(open) => setOpenMenuId(open ? recipe.id : null)}>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="
                        flex-shrink-0 p-1
                        rounded-full
                        text-stone-400 hover:text-stone-600
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-1
                      "
                      aria-label="More options"
                    >
                      <Ellipsis className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {(recipe.sourceUrl || recipe.url) && (
                      <DropdownMenuItem onSelect={() => handleOpenNewTab(recipe)}>
                        <span>Open in new tab</span>
                        <ExternalLink className="w-4 h-4 ml-auto" />
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onSelect={() => handleBookmarkToggle(recipe.id)}>
                      <span>{isBookmarkedState ? 'Remove from Cookbook' : 'Add to Cookbook'}</span>
                      <Bookmark className="w-4 h-4 ml-auto" />
                    </DropdownMenuItem>

                    {(recipe.sourceUrl || recipe.url) && (
                      <DropdownMenuItem onSelect={() => handleCopyLink(recipe)}>
                        <span>Copy link</span>
                        <Link className="w-4 h-4 ml-auto" />
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onSelect={() => handleRename(recipe)}>
                      <span>Rename</span>
                      <PenLine className="w-4 h-4 ml-auto" />
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onSelect={() => handleDelete(recipe.id)}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <span>Delete</span>
                      <Trash2 className="w-4 h-4 ml-auto" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}

        {/* See More Button */}
        {hasMoreThanFive && !showAll && (
          <div className="pl-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="font-albert text-xs text-stone-500 hover:text-stone-700"
            >
              See more
            </Button>
          </div>
        )}
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden" showCloseButton={false}>
          <div className="px-6 pt-6 pb-4">
            <DialogHeader className="mb-4">
              <DialogTitle>Rename Recipe</DialogTitle>
            </DialogHeader>
            <label htmlFor="rename-recent-input" className="block font-albert text-[13px] font-medium text-stone-500 mb-1.5">
              Recipe title
            </label>
            <Input
              id="rename-recent-input"
              name="title"
              autoComplete="off"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleRenameSubmit();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter className="border-t border-stone-100 px-6 py-4 bg-stone-50/50">
            <button
              type="button"
              onClick={() => setRenameOpen(false)}
              className="px-4 py-2 font-albert text-[14px] font-medium text-stone-600 hover:text-stone-800 rounded-lg hover:bg-stone-200/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRenameSubmit}
              disabled={!renameValue.trim()}
              className="px-4 py-2 font-albert text-[14px] font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 active:scale-[0.97] transition-[background-color,transform] disabled:opacity-40 disabled:pointer-events-none"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useToast } from '@/hooks/useToast';
import { toast } from 'sonner';
import type { ParsedRecipe } from '@/lib/storage';
import {
  ExternalLink,
  Pin,
  PenLine,
  Flag,
  Archive,
  Link,
  Trash2,
  Ellipsis,
} from 'lucide-react';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import { cn } from '@/lib/utils';

interface RecipeContextMenuProps {
  children: React.ReactNode;
  recipe: ParsedRecipe;
  onRecipeClick: (id: string) => void;
}

export default function RecipeContextMenu({
  children,
  recipe,
  onRecipeClick,
}: RecipeContextMenuProps) {
  const { isBookmarked, toggleBookmark, removeRecipe, restoreRecipe, getRecipeById, isPinned, togglePin } = useParsedRecipes();
  const { showSuccess, showInfo } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const bookmarked = isBookmarked(recipe.id);
  const pinned = isPinned(recipe.id);
  const sourceUrl = recipe.sourceUrl || recipe.url;

  const handleOpenNewTab = () => {
    if (sourceUrl) {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    } else {
      onRecipeClick(recipe.id);
    }
  };

  const handleToggleBookmark = () => {
    toggleBookmark(recipe.id);
    showSuccess(
      bookmarked ? 'Removed from Cookbook' : 'Added to Cookbook',
      bookmarked
        ? `"${recipe.title}" was removed from your Cookbook.`
        : `"${recipe.title}" was added to your Cookbook.`
    );
  };

  const handlePin = () => {
    togglePin(recipe.id);
    showSuccess(
      pinned ? 'Unpinned' : 'Pinned',
      pinned
        ? `"${recipe.title}" was unpinned.`
        : `"${recipe.title}" was pinned to the top.`
    );
  };

  const handleRename = () => {
    showInfo('Coming soon', 'Renaming recipes will be available in a future update.');
  };

  const handleReport = () => {
    showInfo('Coming soon', 'Reporting recipes will be available in a future update.');
  };

  const handleArchive = () => {
    showInfo('Coming soon', 'Archiving recipes will be available in a future update.');
  };

  const handleCopyLink = async () => {
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

  const handleDelete = () => {
    const savedRecipe = getRecipeById(recipe.id);
    const wasBookmarked = isBookmarked(recipe.id);
    removeRecipe(recipe.id);
    toast('Recipe deleted', {
      description: `"${recipe.title}" was removed.`,
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

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="relative group/item">
            {children}
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full transition-opacity",
                    "text-stone-400 hover:text-stone-600",
                    dropdownOpen ? "opacity-100" : "opacity-0 group-hover/item:opacity-100",
                  )}
                  aria-label="Recipe actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Ellipsis className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-56">
                <DropdownMenuItem onSelect={handleOpenNewTab} disabled={!sourceUrl}>
                  <span>Open in new tab</span>
                  <ExternalLink className="w-4 h-4 ml-auto" />
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={handleToggleBookmark}>
                  <span>{bookmarked ? 'Remove from Cookbook' : 'Add to Cookbook'}</span>
                  <Bookmark className="w-4 h-4 ml-auto" />
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handlePin}>
                  <span>{pinned ? 'Unpin' : 'Pin'}</span>
                  <Pin className={cn("w-4 h-4 ml-auto", pinned && "text-stone-600")} />
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleRename}>
                  <span>Rename</span>
                  <PenLine className="w-4 h-4 ml-auto" />
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={handleReport}>
                  <span>Report</span>
                  <Flag className="w-4 h-4 ml-auto" />
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleArchive}>
                  <span>Archive</span>
                  <Archive className="w-4 h-4 ml-auto" />
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleCopyLink} disabled={!sourceUrl}>
                  <span>Copy link</span>
                  <Link className="w-4 h-4 ml-auto" />
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-red-600 hover:!bg-red-50"
                  onSelect={handleDelete}
                >
                  <span>Delete</span>
                  <Trash2 className="w-4 h-4 ml-auto" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem onSelect={handleOpenNewTab} disabled={!sourceUrl}>
            <span>Open in new tab</span>
            <ExternalLink className="w-4 h-4 ml-auto" />
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onSelect={handleToggleBookmark}>
            <span>{bookmarked ? 'Remove from Cookbook' : 'Add to Cookbook'}</span>
            <Bookmark className="w-4 h-4 ml-auto" />
          </ContextMenuItem>
          <ContextMenuItem onSelect={handlePin}>
            <span>{pinned ? 'Unpin' : 'Pin'}</span>
            <Pin className={cn("w-4 h-4 ml-auto", pinned && "text-stone-600")} />
          </ContextMenuItem>
          <ContextMenuItem onSelect={handleRename}>
            <span>Rename</span>
            <PenLine className="w-4 h-4 ml-auto" />
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onSelect={handleReport}>
            <span>Report</span>
            <Flag className="w-4 h-4 ml-auto" />
          </ContextMenuItem>
          <ContextMenuItem onSelect={handleArchive}>
            <span>Archive</span>
            <Archive className="w-4 h-4 ml-auto" />
          </ContextMenuItem>
          <ContextMenuItem onSelect={handleCopyLink} disabled={!sourceUrl}>
            <span>Copy link</span>
            <Link className="w-4 h-4 ml-auto" />
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            variant="destructive"
            onSelect={handleDelete}
          >
            <span>Delete</span>
            <Trash2 className="w-4 h-4 ml-auto" />
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

    </>
  );
}

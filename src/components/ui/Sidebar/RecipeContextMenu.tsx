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
import { useRecipe } from '@/contexts/RecipeContext';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RecipeContextMenuProps {
  children: React.ReactNode;
  recipe: ParsedRecipe;
  onRecipeClick: (id: string) => void;
  onDialogOpenChange?: (open: boolean) => void;
}

export default function RecipeContextMenu({
  children,
  recipe,
  onRecipeClick,
  onDialogOpenChange,
}: RecipeContextMenuProps) {
  const { isBookmarked, toggleBookmark, removeRecipe, restoreRecipe, getRecipeById, isPinned, togglePin, updateRecipe } = useParsedRecipes();
  const { parsedRecipe, setParsedRecipe } = useRecipe();
  const { showSuccess, showInfo } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

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
    setRenameValue(recipe.title);
    setRenameOpen(true);
    onDialogOpenChange?.(true);
  };

  const closeRenameDialog = () => {
    setRenameOpen(false);
    onDialogOpenChange?.(false);
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    updateRecipe(recipe.id, { title: trimmed });
    const activeRecipeMatches =
      parsedRecipe &&
      (parsedRecipe.id === recipe.id ||
        (parsedRecipe.sourceUrl &&
          (parsedRecipe.sourceUrl === recipe.sourceUrl ||
            parsedRecipe.sourceUrl === recipe.url)));
    if (activeRecipeMatches) {
      setParsedRecipe({ ...parsedRecipe, title: trimmed });
    }
    showSuccess('Renamed', `Recipe renamed to "${trimmed}".`);
    closeRenameDialog();
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
                    "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300",
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
                  className="text-red-600 hover:!bg-red-50 dark:text-red-400 dark:hover:!bg-red-950"
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

      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open);
          onDialogOpenChange?.(open);
        }}
      >
        <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden" showCloseButton={false}>
          <div className="px-6 pt-6 pb-4">
            <DialogHeader className="mb-4">
              <DialogTitle>Rename Recipe</DialogTitle>
            </DialogHeader>
            <label htmlFor="rename-sidebar-input" className="block font-albert text-[13px] font-medium text-stone-500 dark:text-stone-400 mb-1.5">
              Recipe title
            </label>
            <Input
              id="rename-sidebar-input"
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
          <DialogFooter className="border-t border-stone-100 dark:border-stone-700 px-6 py-4 bg-stone-50/50 dark:bg-stone-800">
            <button
              type="button"
              onClick={closeRenameDialog}
              className="px-4 py-2 font-albert text-[14px] font-medium text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-700/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRenameSubmit}
              disabled={!renameValue.trim()}
              className="px-4 py-2 font-albert text-[14px] font-medium text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-[0.97] transition-[background-color,transform] disabled:opacity-40 disabled:pointer-events-none"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

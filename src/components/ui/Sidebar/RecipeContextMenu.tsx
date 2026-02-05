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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useToast } from '@/hooks/useToast';
import type { ParsedRecipe } from '@/lib/storage';
import {
  ExternalLink,
  Pin,
  PenLine,
  Flag,
  Archive,
  Link,
  Trash2,
} from 'lucide-react';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';

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
  const { isBookmarked, toggleBookmark, removeRecipe } = useParsedRecipes();
  const { showSuccess, showInfo } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const bookmarked = isBookmarked(recipe.id);
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
    showInfo('Coming soon', 'Pinning recipes will be available in a future update.');
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

  const handleDeleteConfirm = () => {
    removeRecipe(recipe.id);
    setDeleteDialogOpen(false);
    showSuccess('Recipe deleted', `"${recipe.title}" was removed.`);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
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
            <span>Pin</span>
            <Pin className="w-4 h-4 ml-auto" />
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
            onSelect={() => setDeleteDialogOpen(true)}
          >
            <span>Delete</span>
            <Trash2 className="w-4 h-4 ml-auto" />
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete recipe?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{recipe.title}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

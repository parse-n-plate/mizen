'use client';

import Image from 'next/image';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useToast } from '@/hooks/useToast';
import type { ParsedRecipe } from '@/lib/storage';
import { ExternalLink, Link, Clock } from 'lucide-react';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';

interface RecipeHoverCardProps {
  children: React.ReactNode;
  recipe: ParsedRecipe;
}

export default function RecipeHoverCard({
  children,
  recipe,
}: RecipeHoverCardProps) {
  const { isBookmarked, toggleBookmark } = useParsedRecipes();
  const { showSuccess, showInfo } = useToast();

  const bookmarked = isBookmarked(recipe.id);
  const sourceUrl = recipe.sourceUrl || recipe.url;

  const displayTime = getDisplayTime(recipe);
  const recipeImage = recipe.imageData || recipe.imageUrl;

  const handleOpenSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sourceUrl) {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(recipe.id);
    showSuccess(
      bookmarked ? 'Removed from Cookbook' : 'Saved to Cookbook',
      bookmarked
        ? `"${recipe.title}" was removed from your saved recipes.`
        : `"${recipe.title}" was saved to your Cookbook.`
    );
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sourceUrl) {
      try {
        await navigator.clipboard.writeText(sourceUrl);
        showSuccess('Link copied', 'Recipe URL copied to clipboard.');
      } catch {
        showInfo('Could not copy', 'Your browser blocked clipboard access.');
      }
    }
  };

  const hostname = sourceUrl ? getDomainFromUrl(sourceUrl) : null;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div>{children}</div>
      </HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-72 p-0 overflow-hidden">
        {/* Recipe Image */}
        {recipeImage && (
          <div className="relative w-full h-32 bg-stone-100">
            <Image
              src={recipeImage}
              alt={recipe.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Content */}
        <div className="p-3.5 space-y-2.5">
          {/* Title */}
          <h4 className="font-albert text-base font-medium text-stone-900 line-clamp-2 leading-snug">
            {recipe.title}
          </h4>

          {/* Meta row: time + source */}
          <div className="flex items-center gap-3 text-sm text-stone-500 font-albert">
            {displayTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {displayTime}
              </span>
            )}
            {hostname && (
              <span className="truncate">{hostname}</span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100">
            {sourceUrl && (
              <button
                onClick={handleOpenSource}
                className="p-2 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors duration-150"
                aria-label="Open source URL"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleToggleBookmark}
              className="p-2 rounded-md hover:bg-stone-100 transition-colors duration-150"
              aria-label={bookmarked ? 'Unsave recipe' : 'Save recipe'}
            >
              <Bookmark
                weight={bookmarked ? 'Bold' : 'Linear'}
                className={`w-4 h-4 ${
                  bookmarked
                    ? 'text-stone-500'
                    : 'text-stone-400 hover:text-stone-500'
                }`}
              />
            </button>
            {sourceUrl && (
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors duration-150"
                aria-label="Copy link"
              >
                <Link className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function getDisplayTime(recipe: ParsedRecipe): string {
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    if (rem === 0) return `${hours}h`;
    return `${hours}h ${rem}m`;
  };

  if (recipe.totalTimeMinutes) return formatTime(recipe.totalTimeMinutes);
  if (recipe.prepTimeMinutes && recipe.cookTimeMinutes) {
    return formatTime(recipe.prepTimeMinutes + recipe.cookTimeMinutes);
  }
  if (recipe.prepTimeMinutes) return formatTime(recipe.prepTimeMinutes);
  if (recipe.cookTimeMinutes) return formatTime(recipe.cookTimeMinutes);
  return '';
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

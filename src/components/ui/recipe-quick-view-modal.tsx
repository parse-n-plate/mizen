'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import CameraIcon from '@solar-icons/react/csr/video/Camera';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import MenuDotsCircle from '@solar-icons/react/csr/ui/MenuDotsCircle';
import ClipboardText from '@solar-icons/react/csr/notes/ClipboardText';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CUISINE_ICON_MAP } from '@/config/cuisineConfig';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import type { ParsedRecipe } from '@/lib/storage';

interface RecipeQuickViewModalProps {
  recipe: ParsedRecipe | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RecipeQuickViewModal({
  recipe,
  isOpen,
  onClose,
}: RecipeQuickViewModalProps) {
  const router = useRouter();
  const { getRecipeById: _getRecipeById, isBookmarked, toggleBookmark } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const [copiedRecipe, setCopiedRecipe] = useState(false);

  if (!recipe) return null;

  const isBookmarkedState = isBookmarked(recipe.id);
  const primaryCuisine = recipe.cuisine && recipe.cuisine.length > 0 ? recipe.cuisine[0] : null;
  const cuisineIconPath = primaryCuisine ? CUISINE_ICON_MAP[primaryCuisine] : '/assets/Illustration Icons/Pan_Icon.png';

  // Format time display
  const formatTime = (minutes?: number) => {
    if (!minutes) return null;
    return `${minutes} min`;
  };

  const displayTime = recipe.totalTimeMinutes
    ? formatTime(recipe.totalTimeMinutes)
    : recipe.cookTimeMinutes
    ? formatTime(recipe.cookTimeMinutes)
    : recipe.prepTimeMinutes
    ? formatTime(recipe.prepTimeMinutes)
    : null;

  // Handle bookmark toggle
  const handleBookmarkToggle = () => {
    if (isBookmarkedState) {
      const confirmed = window.confirm(
        'Are you sure you want to remove this recipe from your Cookbook? You can add it back later.'
      );
      if (confirmed) {
        toggleBookmark(recipe.id);
      }
    } else {
      toggleBookmark(recipe.id);
    }
  };

  // Handle view full recipe
  const handleViewFullRecipe = () => {
    setParsedRecipe({
      id: recipe.id,
      title: recipe.title,
      ingredients: recipe.ingredients ?? [],
      instructions: recipe.instructions ?? [],
      author: recipe.author,
      sourceUrl: recipe.sourceUrl || recipe.url,
      summary: recipe.description || recipe.summary,
      cuisine: recipe.cuisine,
      imageData: recipe.imageData,
      imageFilename: recipe.imageFilename,
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      totalTimeMinutes: recipe.totalTimeMinutes,
      servings: recipe.servings,
      plate: recipe.plate,
    });
    onClose();
    router.push('/parsed-recipe-page');
  };

  // Handle copy recipe
  const handleCopyRecipe = async () => {
    let text = '';
    
    if (recipe.title) {
      text += `${recipe.title}\n\n`;
    }
    
    if (recipe.author) {
      text += `By ${recipe.author}\n`;
    }
    if (recipe.sourceUrl) {
      text += `Source: ${recipe.sourceUrl}\n`;
    }
    if (recipe.prepTimeMinutes || recipe.cookTimeMinutes || recipe.servings) {
      text += '\n';
      if (recipe.prepTimeMinutes) text += `Prep: ${recipe.prepTimeMinutes} min\n`;
      if (recipe.cookTimeMinutes) text += `Cook: ${recipe.cookTimeMinutes} min\n`;
      if (recipe.servings) text += `Servings: ${recipe.servings}\n`;
    }
    
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      text += '\n--- INGREDIENTS ---\n\n';
      recipe.ingredients.forEach((group: { groupName?: string; ingredients: { amount?: string; units?: string; ingredient: string }[] }) => {
        if (group.groupName && group.groupName !== 'Main') {
          text += `${group.groupName}:\n`;
        }
        group.ingredients.forEach((ing) => {
          const parts = [];
          if (ing.amount) parts.push(ing.amount);
          if (ing.units) parts.push(ing.units);
          parts.push(ing.ingredient);
          text += `  ${parts.join(' ')}\n`;
        });
        text += '\n';
      });
    }
    
    if (recipe.instructions && recipe.instructions.length > 0) {
      text += '--- INSTRUCTIONS ---\n\n';
      recipe.instructions.forEach((instruction: string | Record<string, unknown>, index: number) => {
        if (typeof instruction === 'string') {
          text += `${index + 1}. ${instruction}\n\n`;
        } else if (typeof instruction === 'object' && instruction !== null) {
          const inst = instruction as Record<string, unknown>;
          const title = inst.title || `Step ${index + 1}`;
          const detail = inst.detail || inst.text || '';
          text += `${index + 1}. ${title}\n   ${detail}\n\n`;
        }
      });
    }
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRecipe(true);
      setTimeout(() => setCopiedRecipe(false), 2000);
    } catch (err) {
      console.error('Failed to copy recipe:', err);
    }
  };

  // Get first few ingredients for preview
  const previewIngredients = recipe.ingredients && recipe.ingredients.length > 0
    ? recipe.ingredients[0]?.ingredients?.slice(0, 5) || []
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Refined dialog with better sizing and rounded corners */}
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto p-0 rounded-2xl">
        {/* Header section with padding */}
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="font-domine text-xl font-bold text-stone-900 leading-tight pr-12">
              {recipe.title}
            </DialogTitle>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Bookmark Button */}
              <button
                onClick={handleBookmarkToggle}
                className="p-1.5 rounded-full transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                aria-label={isBookmarkedState ? 'Remove from Cookbook' : 'Add to Cookbook'}
              >
                <Bookmark
                  className={`w-5 h-5 transition-colors ${
                    isBookmarkedState 
                      ? 'fill-[#78716C] text-[#78716C]' 
                      : 'fill-[#D6D3D1] text-[#D6D3D1] hover:fill-[#A8A29E] hover:text-[#A8A29E]'
                  }`}
                />
              </button>
              
              {/* More Options Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1.5 rounded-full transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                    aria-label="More options"
                  >
                    <MenuDotsCircle className="w-5 h-5 text-stone-300 hover:text-stone-400 transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem onSelect={handleCopyRecipe}>
                    <span className={copiedRecipe ? 'text-green-600' : ''}>
                      {copiedRecipe ? 'Copied to Clipboard' : 'Copy Recipe to Clipboard'}
                    </span>
                    <ClipboardText weight="Bold" className={`w-4 h-4 ml-auto ${copiedRecipe ? 'text-green-600' : ''}`} />
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleBookmarkToggle}>
                    <span>Remove from Cookbook</span>
                    <Bookmark weight="Bold" className="w-4 h-4 ml-auto" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {recipe.author && (
            <p className="font-albert text-sm text-stone-500 mt-1">
              By {recipe.author}
            </p>
          )}
        </DialogHeader>

        {/* Main content with consistent padding */}
        <div className="px-6 pb-6 pt-4 space-y-5">
          {/* Recipe Image or Cuisine Icon - refined styling */}
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-b from-stone-50 to-stone-100 border border-stone-200">
            {recipe.plate?.photoData ? (
              // Show user's cooked dish photo
              <img
                src={recipe.plate.photoData}
                alt="Your dish"
                className="w-full h-full object-cover"
              />
            ) : (
              // Show cuisine icon as placeholder with centered layout
              <div className="w-full h-full flex items-center justify-center">
                <Image
                  src={cuisineIconPath}
                  alt={`${primaryCuisine || 'Recipe'} icon`}
                  width={96}
                  height={96}
                  quality={100}
                  unoptimized={true}
                  className="object-contain opacity-90"
                />
              </div>
            )}
            {/* "Cooked" badge - only shown when user has uploaded a photo */}
            {recipe.plate?.photoData && (
              <div className="absolute top-3 left-3 bg-[#0088ff] text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                <CameraIcon weight="Bold" className="w-3.5 h-3.5" />
                <span className="font-albert text-[11px] font-medium">Cooked</span>
              </div>
            )}
          </div>

          {/* Recipe Metadata - refined pill styling */}
          <div className="flex flex-wrap items-center gap-2">
            {displayTime && (
              <div className="px-3 py-1.5 bg-stone-100 rounded-full border border-stone-200">
                <p className="font-albert text-[13px] font-medium text-stone-700">
                  {displayTime}
                </p>
              </div>
            )}
            
            {recipe.servings && (
              <div className="px-3 py-1.5 bg-stone-100 rounded-full border border-stone-200">
                <p className="font-albert text-[13px] font-medium text-stone-700">
                  Serves {recipe.servings}
                </p>
              </div>
            )}
          </div>

          {/* Ingredients Preview - refined typography and spacing */}
          {previewIngredients.length > 0 && (
            <div>
              <h3 className="font-domine text-base font-semibold text-stone-900 mb-2.5">
                Ingredients Preview
              </h3>
              <ul className="space-y-1.5">
                {previewIngredients.map((ingredient: { amount?: string; units?: string; ingredient: string }, index: number) => (
                  <li key={index} className="font-albert text-[14px] text-stone-600 flex items-start gap-2">
                    <span className="text-stone-300 mt-0.5">•</span>
                    <span>
                      {[ingredient.amount, ingredient.units, ingredient.ingredient]
                        .filter(Boolean)
                        .join(' ')}
                    </span>
                  </li>
                ))}
                {recipe.ingredients && recipe.ingredients[0]?.ingredients?.length > 5 && (
                  <li className="font-albert text-[13px] text-stone-400 italic pl-4">
                    + {recipe.ingredients[0].ingredients.length - 5} more ingredients
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* View Full Recipe Button - refined with better styling */}
          <div className="pt-4 border-t border-stone-100">
            <Button
              onClick={handleViewFullRecipe}
              className="w-full font-albert font-medium h-12 rounded-xl text-[15px] bg-[#FF6F00] hover:bg-[#E56300] text-white transition-colors"
              size="lg"
            >
              View Full Recipe
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X, Camera } from 'lucide-react';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import MenuDotsCircle from '@solar-icons/react/csr/ui/MenuDotsCircle';
import Pen from '@solar-icons/react/csr/messages/Pen';
import ClipboardText from '@solar-icons/react/csr/notes/ClipboardText';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const { getRecipeById, isBookmarked, toggleBookmark } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copiedRecipe, setCopiedRecipe] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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
        'Are you sure you want to remove this recipe from your bookmarks? You can bookmark it again later.'
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
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
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
      recipe.ingredients.forEach((group: any) => {
        if (group.groupName && group.groupName !== 'Main') {
          text += `${group.groupName}:\n`;
        }
        group.ingredients.forEach((ing: any) => {
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
      recipe.instructions.forEach((instruction: any, index: number) => {
        if (typeof instruction === 'string') {
          text += `${index + 1}. ${instruction}\n\n`;
        } else if (typeof instruction === 'object' && instruction !== null) {
          const inst = instruction as any;
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="font-domine text-2xl font-bold text-black pr-8">
              {recipe.title}
            </DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Bookmark Button */}
              <button
                onClick={handleBookmarkToggle}
                className="p-1.5 rounded-full transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                aria-label={isBookmarkedState ? 'Remove bookmark' : 'Bookmark recipe'}
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
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1.5 rounded-full transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                  aria-label="More options"
                  aria-expanded={isMenuOpen}
                >
                  <MenuDotsCircle
                    className={`w-5 h-5 transition-colors ${
                      isMenuOpen 
                        ? 'text-stone-500' 
                        : 'text-stone-300 hover:text-stone-400'
                    }`}
                  />
                </button>
                
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={shouldReduceMotion ? false : { opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ 
                        duration: shouldReduceMotion ? 0 : 0.12,
                        ease: [0.23, 1, 0.32, 1]
                      }}
                      className="absolute right-0 top-[calc(100%+8px)] w-60 bg-white rounded-xl border border-stone-200 shadow-xl p-1.5 z-[100]"
                    >
                      <button
                        onClick={handleCopyRecipe}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors font-albert rounded-md"
                      >
                        <ClipboardText weight="Bold" className={`w-4 h-4 flex-shrink-0 ${copiedRecipe ? 'text-green-600' : 'text-stone-500'}`} />
                        <span className={`font-albert font-medium whitespace-nowrap ${copiedRecipe ? 'text-green-600' : ''}`}>
                          {copiedRecipe ? 'Copied to Clipboard' : 'Copy Recipe to Clipboard'}
                        </span>
                      </button>
                      
                      <button
                        onClick={handleBookmarkToggle}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors font-albert rounded-md"
                      >
                        <Bookmark weight="Bold" className="w-4 h-4 text-stone-500 flex-shrink-0" />
                        <span className="font-albert font-medium whitespace-nowrap">Unsave</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {recipe.author && (
            <p className="font-albert text-sm text-stone-600 mt-2">
              By {recipe.author}
            </p>
          )}
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Recipe Image or Cuisine Icon */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
            {recipe.plate?.photoData ? (
              <img
                src={recipe.plate.photoData}
                alt="Your dish"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image
                  src={cuisineIconPath}
                  alt={`${primaryCuisine || 'Recipe'} icon`}
                  width={120}
                  height={120}
                  quality={100}
                  unoptimized={true}
                  className="object-contain"
                />
              </div>
            )}
            {recipe.plate?.photoData && (
              <div className="absolute top-4 left-4 bg-[#0088ff] text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Camera className="w-3.5 h-3.5" />
                <span className="font-albert text-[11px] font-medium">Cooked</span>
              </div>
            )}
          </div>

          {/* Recipe Metadata */}
          <div className="flex flex-wrap items-center gap-3">
            {recipe.cuisine && recipe.cuisine.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {recipe.cuisine.map((cuisine, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 border border-stone-200 rounded-full font-albert text-[12px] text-stone-600"
                  >
                    {CUISINE_ICON_MAP[cuisine] && (
                      <Image
                        src={CUISINE_ICON_MAP[cuisine]}
                        alt={`${cuisine} icon`}
                        width={16}
                        height={16}
                        quality={100}
                        unoptimized={true}
                        className="w-4 h-4 object-contain flex-shrink-0"
                        draggable={false}
                      />
                    )}
                    <span>{cuisine}</span>
                  </span>
                ))}
              </div>
            )}
            
            {displayTime && (
              <div className="px-3 py-1.5 bg-stone-100 rounded-full">
                <p className="font-albert text-[14px] text-stone-700">
                  {displayTime}
                </p>
              </div>
            )}
            
            {recipe.servings && (
              <div className="px-3 py-1.5 bg-stone-100 rounded-full">
                <p className="font-albert text-[14px] text-stone-700">
                  Serves {recipe.servings}
                </p>
              </div>
            )}
          </div>

          {/* Ingredients Preview */}
          {previewIngredients.length > 0 && (
            <div>
              <h3 className="font-domine text-lg font-semibold text-black mb-3">
                Ingredients Preview
              </h3>
              <ul className="space-y-2">
                {previewIngredients.map((ingredient: any, index: number) => (
                  <li key={index} className="font-albert text-sm text-stone-700 flex items-start gap-2">
                    <span className="text-stone-400 mt-1">•</span>
                    <span>
                      {[ingredient.amount, ingredient.units, ingredient.ingredient]
                        .filter(Boolean)
                        .join(' ')}
                    </span>
                  </li>
                ))}
                {recipe.ingredients && recipe.ingredients[0]?.ingredients?.length > 5 && (
                  <li className="font-albert text-sm text-stone-500 italic">
                    + {recipe.ingredients[0].ingredients.length - 5} more ingredients
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* View Full Recipe Button */}
          <div className="pt-4 border-t border-stone-200">
            <Button
              onClick={handleViewFullRecipe}
              className="w-full font-albert"
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

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Camera } from 'lucide-react';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import MenuDotsCircle from '@solar-icons/react/csr/ui/MenuDotsCircle';
import Pen from '@solar-icons/react/csr/messages/Pen';
import ClipboardText from '@solar-icons/react/csr/notes/ClipboardText';
import { CUISINE_ICON_MAP } from '@/config/cuisineConfig';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface RecipeCardData {
  id: string;
  title: string;
  author?: string; // Optional - recipes parsed from images may not have an author
  imageUrl?: string;
  cuisine?: string[]; // Array of cuisine names (e.g., ["Italian", "Mediterranean"])
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  platePhotoData?: string; // Base64 user plate photo
}

interface RecipeCardProps {
  recipe: RecipeCardData;
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onCopy?: () => void;
  showDelete?: boolean;
  showImage?: boolean;
  showCuisineIcon?: boolean; // Controls visibility of cuisine icon image
}

export default function RecipeCard({
  recipe,
  onClick,
  onDelete,
  onEdit,
  onCopy,
  showDelete = false,
  showImage = false, // Default to false as per new design (using cuisine icons instead)
  showCuisineIcon = true, // Default to true - show cuisine icon unless explicitly hidden
}: RecipeCardProps) {
  const [copiedRecipe, setCopiedRecipe] = useState(false);
  const { getRecipeById, isBookmarked, toggleBookmark } = useParsedRecipes();

  // Get bookmark state from context
  const isBookmarkedState = isBookmarked(recipe.id);

  // Get the first cuisine icon if available, otherwise use a default
  const primaryCuisine = recipe.cuisine && recipe.cuisine.length > 0 ? recipe.cuisine[0] : null;
  const cuisineIconPath = primaryCuisine ? CUISINE_ICON_MAP[primaryCuisine] : '/assets/Illustration Icons/Pan_Icon.png';

  // Handle bookmark toggle - shows confirmation dialog if currently bookmarked
  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If recipe is currently bookmarked, show confirmation dialog
    if (isBookmarkedState) {
      const confirmed = window.confirm(
        'Are you sure you want to remove this recipe from your bookmarks? You can bookmark it again later.'
      );

      if (confirmed) {
        toggleBookmark(recipe.id);
      }
    } else {
      // If not bookmarked, just add the bookmark directly
      toggleBookmark(recipe.id);
    }
  };

  // Handle menu actions
  const handleEdit = () => {
    onEdit?.();
  };

  // Handle copy recipe - formats and copies the full recipe to clipboard
  const handleCopyRecipe = async () => {
    // If onCopy callback is provided, use it (for custom behavior)
    if (onCopy) {
      onCopy();
      return;
    }
    
    // Otherwise, implement default copy recipe functionality
    const fullRecipe = getRecipeById(recipe.id);
    if (!fullRecipe) {
      console.warn('Recipe not found for copying');
      return;
    }
    
    // Format recipe as plain text (similar to ClassicSplitView)
    let text = '';
    
    // Title
    if (fullRecipe.title) {
      text += `${fullRecipe.title}\n\n`;
    }
    
    // Metadata
    if (fullRecipe.author) {
      text += `By ${fullRecipe.author}\n`;
    }
    if (fullRecipe.sourceUrl) {
      text += `Source: ${fullRecipe.sourceUrl}\n`;
    }
    if (fullRecipe.prepTimeMinutes || fullRecipe.cookTimeMinutes || fullRecipe.servings) {
      text += '\n';
      if (fullRecipe.prepTimeMinutes) text += `Prep: ${fullRecipe.prepTimeMinutes} min\n`;
      if (fullRecipe.cookTimeMinutes) text += `Cook: ${fullRecipe.cookTimeMinutes} min\n`;
      if (fullRecipe.servings) text += `Servings: ${fullRecipe.servings}\n`;
    }
    
    // Ingredients
    if (fullRecipe.ingredients && fullRecipe.ingredients.length > 0) {
      text += '\n--- INGREDIENTS ---\n\n';
      fullRecipe.ingredients.forEach((group) => {
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
    
    // Instructions
    if (fullRecipe.instructions && fullRecipe.instructions.length > 0) {
      text += '--- INSTRUCTIONS ---\n\n';
      fullRecipe.instructions.forEach((instruction, index) => {
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

  // Handle unsave recipe - removes recipe from saved/bookmarked recipes
  const handleUnsave = () => {
    // If recipe is currently bookmarked, show confirmation dialog before unsaving
    if (isBookmarkedState) {
      const confirmed = window.confirm(
        'Are you sure you want to remove this recipe from your bookmarks? You can bookmark it again later.'
      );

      if (confirmed) {
        toggleBookmark(recipe.id);
      }
    }
  };

  return (
    <motion.div
      className="group w-full md:basis-0 md:grow min-h-px md:min-w-px relative rounded-[20px] shrink-0 bg-white hover:bg-[#FAFAFA] transition-colors duration-200 cursor-pointer overflow-visible"
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Border */}
      <div
        aria-hidden="true"
        className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[20px]"
      />

      {/* Photo Indicator Badge - shown when plate photo exists */}
      {recipe.platePhotoData && (
        <div
          className="absolute top-4 left-4 z-20 bg-[#0088ff] text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm"
          aria-label="Has plate photo"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="font-albert text-[11px] font-medium">Cooked</span>
        </div>
      )}

      {/* Bookmark Button */}
      <button
        onPointerDownCapture={(e) => e.stopPropagation()}
        onPointerUpCapture={(e) => e.stopPropagation()}
        onClick={handleBookmarkToggle}
        className="absolute top-4 right-12 z-20 p-1.5 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 bg-white/50 backdrop-blur-sm"
        aria-label={isBookmarkedState ? 'Remove bookmark' : 'Bookmark recipe'}
      >
        <Bookmark
          className={`
            w-5 h-5 transition-colors duration-200
            ${isBookmarkedState 
              ? 'fill-[#78716C] text-[#78716C]' 
              : 'fill-[#D6D3D1] text-[#D6D3D1] hover:fill-[#A8A29E] hover:text-[#A8A29E]'
            }
          `}
        />
      </button>

      {/* Ellipsis Menu Button and Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onPointerDownCapture={(e) => e.stopPropagation()}
            onPointerUpCapture={(e) => e.stopPropagation()}
            className="absolute top-4 right-4 z-30 p-1.5 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 bg-white/50 backdrop-blur-sm hover:bg-white/70"
            aria-label="More options"
          >
            <MenuDotsCircle className="w-6 h-6 text-stone-300 hover:text-stone-400 transition-colors duration-200" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem onSelect={handleEdit}>
            <Pen weight="Bold" className="w-4 h-4 text-stone-500 flex-shrink-0" />
            <span className="font-medium whitespace-nowrap">Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleCopyRecipe}>
            <ClipboardText weight="Bold" className={`w-4 h-4 flex-shrink-0 ${copiedRecipe ? 'text-green-600' : 'text-stone-500'}`} />
            <span className={`font-medium whitespace-nowrap ${copiedRecipe ? 'text-green-600' : ''}`}>
              {copiedRecipe ? 'Copied to Clipboard' : 'Copy Recipe to Clipboard'}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleUnsave}>
            <Bookmark weight="Bold" className="w-4 h-4 text-stone-500 flex-shrink-0" />
            <span className="font-medium whitespace-nowrap">Unsave</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="size-full">
        <button
          onClick={onClick}
          className="w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-0 rounded-[inherit]"
        >
          <div className="box-border flex flex-row items-center gap-[14px] md:gap-[20px] p-[16px] md:p-[20px] relative w-full min-h-[120px]">
            {/* Image Display Priority: Plate Photo > Original Recipe Image > Cuisine Icon > Placeholder */}
            {recipe.platePhotoData ? (
              // Priority 1: Show plate photo if user uploaded one (shows "Cooked" badge)
              <div className="relative w-16 h-16 md:w-24 md:h-24 flex-shrink-0">
                <img
                  src={recipe.platePhotoData}
                  alt="Your dish"
                  className="w-full h-full object-cover rounded-[12px] border-2 border-stone-200 pointer-events-none"
                />
              </div>
            ) : recipe.imageUrl ? (
              // Priority 2: Show original recipe image from website if available
              <div className="relative w-16 h-16 md:w-24 md:h-24 flex-shrink-0">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover rounded-[12px] border-2 border-stone-200 pointer-events-none"
                />
              </div>
            ) : (
              // Priority 3: Show cuisine icon (or pan placeholder) if no images available
              showCuisineIcon && (
                <div className="relative w-16 h-16 md:w-24 md:h-24 flex-shrink-0">
                  <Image
                    src={cuisineIconPath}
                    alt={`${primaryCuisine || 'Recipe'} icon`}
                    fill
                    quality={100}
                    unoptimized={true}
                    className="object-contain pointer-events-none"
                  />
                </div>
              )
            )}

            {/* Recipe Info */}
            <div className="flex-1 flex flex-col gap-[4px] min-w-0 pr-4 md:pr-6 items-start">
              <h3 className="font-domine leading-[1.2] text-[18px] md:text-[22px] text-black text-left line-clamp-2 break-words m-0">
                {recipe.title}
              </h3>
              
              {/* Only show author line if author exists and is not empty */}
              {recipe.author && recipe.author.trim() !== '' && (
                <p className="font-albert leading-[1.4] text-[13px] md:text-[15px] text-stone-600 text-left m-0 line-clamp-1">
                  <span className="text-stone-500">By </span>
                  {recipe.author}
                </p>
              )}
            </div>

            {/* Right Side: Time Pill - only show if time data is available */}
            {(() => {
              // Calculate display time: prefer total, else sum prep+cook, else show individual
              const displayTime = recipe.totalTimeMinutes 
                ?? (recipe.prepTimeMinutes && recipe.cookTimeMinutes 
                  ? recipe.prepTimeMinutes + recipe.cookTimeMinutes 
                  : recipe.prepTimeMinutes ?? recipe.cookTimeMinutes);
              
              // Only render the pill if there's actual time data
              return displayTime ? (
                <div className="flex flex-col justify-end self-stretch">
                  <span className="font-albert text-[11px] md:text-[13px] text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full whitespace-nowrap border border-stone-200/50">
                    {displayTime} min
                  </span>
                </div>
              ) : null;
            })()}
          </div>
        </button>
      </div>
      
      {showDelete && (
        <button
          type="button"
          aria-label="Remove recent recipe"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onPointerUpCapture={(e) => e.stopPropagation()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete?.();
          }}
          className="recent-recipe-delete-btn"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}


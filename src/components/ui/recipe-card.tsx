'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import MenuDotsCircle from '@solar-icons/react/csr/ui/MenuDotsCircle';
import Pen from '@solar-icons/react/csr/messages/Pen';
import ClipboardText from '@solar-icons/react/csr/notes/ClipboardText';
import TrashBinTrash from '@solar-icons/react/csr/ui/TrashBinTrash';
import { CUISINE_ICON_MAP } from '@/config/cuisineConfig';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';

export interface RecipeCardData {
  id: string;
  title: string;
  author: string;
  imageUrl?: string;
  cuisine?: string[]; // Array of cuisine names (e.g., ["Italian", "Mediterranean"])
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
}

interface RecipeCardProps {
  recipe: RecipeCardData;
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onCopy?: () => void;
  showDelete?: boolean;
  showImage?: boolean;
}

export default function RecipeCard({
  recipe,
  onClick,
  onDelete,
  onEdit,
  onCopy,
  showDelete = false,
  showImage = false, // Default to false as per new design (using cuisine icons instead)
}: RecipeCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copiedRecipe, setCopiedRecipe] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ vertical: 'top' | 'bottom'; horizontal: 'left' | 'right' }>({
    vertical: 'bottom',
    horizontal: 'right',
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { getRecipeById } = useParsedRecipes();

  // Calculate menu position based on available viewport space
  useEffect(() => {
    if (!isMenuOpen || !buttonRef.current) return;

    const calculatePosition = () => {
      if (!buttonRef.current) return;
      
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate available space
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const spaceRight = viewportWidth - buttonRect.right;
      const spaceLeft = buttonRect.left;
      
      // Menu dimensions
      const menuHeight = 150; // Approximate height for 3 items + padding
      const menuWidth = 240; // w-60 = 240px
      const offset = 8; // Gap between button and menu
      
      // Determine vertical position - prefer bottom, but flip to top if not enough space
      const vertical = spaceBelow >= menuHeight + offset || spaceBelow >= spaceAbove ? 'bottom' : 'top';
      
      // Determine horizontal position - prefer right, but flip to left if not enough space
      // Check if menu would overflow on the right side
      const horizontal = spaceRight >= menuWidth || (spaceRight < menuWidth && spaceLeft >= menuWidth) ? 'right' : 'left';
      
      setMenuPosition({ vertical, horizontal });
    };

    // Small delay to ensure DOM is ready, then calculate position
    const timeoutId = setTimeout(calculatePosition, 0);
    
    // Recalculate on window resize or scroll
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [isMenuOpen]);

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

  // Get the first cuisine icon if available, otherwise use a default
  const primaryCuisine = recipe.cuisine && recipe.cuisine.length > 0 ? recipe.cuisine[0] : null;
  const cuisineIconPath = primaryCuisine ? CUISINE_ICON_MAP[primaryCuisine] : '/assets/Illustration Icons/Pan_Icon.png';

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  // Handle ellipsis menu toggle
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle menu actions
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    onEdit?.();
  };

  // Handle copy recipe - formats and copies the full recipe to clipboard
  const handleCopyRecipe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    
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

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    onDelete?.();
  };

  return (
    <div
      className={`group w-full md:basis-0 md:grow min-h-px md:min-w-px relative rounded-[20px] shrink-0 bg-white hover:bg-gray-50 transition-colors duration-200 cursor-pointer overflow-visible ${isMenuOpen ? 'z-[99]' : ''}`}
    >
      {/* Border */}
      <div
        aria-hidden="true"
        className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[20px]"
      />
      
      {/* Bookmark Button */}
      <button
        onClick={handleBookmarkToggle}
        className="absolute top-4 right-12 z-20 p-1.5 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 bg-white/50 backdrop-blur-sm"
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark recipe'}
      >
        <Bookmark
          className={`
            w-5 h-5 transition-colors duration-200
            ${isBookmarked 
              ? 'fill-[#78716C] text-[#78716C]' 
              : 'fill-[#D6D3D1] text-[#D6D3D1] hover:fill-[#A8A29E] hover:text-[#A8A29E]'
            }
          `}
        />
      </button>

      {/* Ellipsis Menu Button and Dropdown */}
      <div ref={menuRef} className={`absolute top-4 right-4 ${isMenuOpen ? 'z-[100]' : 'z-30'}`}>
        <button
          ref={buttonRef}
          onClick={handleMenuToggle}
          className="p-1.5 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 bg-white/50 backdrop-blur-sm hover:bg-white/70"
          aria-label="More options"
          aria-expanded={isMenuOpen}
        >
          <MenuDotsCircle
            className={`w-6 h-6 transition-colors duration-200 ${
              isMenuOpen 
                ? 'text-stone-500' 
                : 'text-stone-300 hover:text-stone-400'
            }`}
          />
        </button>

        {/* Dropdown Menu - Origin-aware positioning */}
        {isMenuOpen && (
          <div
            ref={dropdownRef}
            className={`absolute w-60 bg-white rounded-lg border border-stone-200 shadow-xl p-1.5 z-[100] animate-in fade-in duration-200 ${
              menuPosition.vertical === 'bottom'
                ? 'top-[calc(100%+8px)] slide-in-from-top-2'
                : 'bottom-[calc(100%+8px)] slide-in-from-bottom-2'
            } ${
              menuPosition.horizontal === 'right'
                ? 'right-0'
                : 'left-0'
            }`}
          >
            {/* Edit Option */}
            <button
              onClick={handleEdit}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors font-albert rounded-md"
            >
              <Pen weight="Bold" className="w-4 h-4 text-stone-500 flex-shrink-0" />
              <span className="font-albert font-medium whitespace-nowrap">Edit</span>
            </button>

            {/* Copy Recipe to Clipboard Option */}
            <button
              onClick={handleCopyRecipe}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors font-albert rounded-md"
            >
              <ClipboardText weight="Bold" className={`w-4 h-4 flex-shrink-0 ${copiedRecipe ? 'text-green-600' : 'text-stone-500'}`} />
              <span className={`font-albert font-medium whitespace-nowrap ${copiedRecipe ? 'text-green-600' : ''}`}>
                {copiedRecipe ? 'Copied to Clipboard' : 'Copy Recipe to Clipboard'}
              </span>
            </button>

            {/* Delete Option */}
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-albert rounded-md"
            >
              <TrashBinTrash weight="Bold" className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="font-albert font-medium whitespace-nowrap">Delete</span>
            </button>
          </div>
        )}
      </div>

      <div className="size-full">
        <button
          onClick={onClick}
          className="w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-0 rounded-[inherit]"
        >
          <div className="box-border flex flex-row items-center gap-[16px] md:gap-[24px] p-[16px] md:p-[20px] relative w-full min-h-[120px]">
            {/* Cuisine Illustration Icon */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
              <Image
                src={cuisineIconPath}
                alt={`${primaryCuisine || 'Recipe'} icon`}
                fill
                quality={100}
                unoptimized={true}
                className="object-contain pointer-events-none"
              />
            </div>

            {/* Recipe Info */}
            <div className="flex-1 flex flex-col gap-[4px] min-w-0 pr-8 items-start">
              <h3 className="font-domine leading-[1.2] text-[18px] md:text-[22px] text-black text-left line-clamp-1 break-words m-0">
                {recipe.title}
              </h3>
              
              <p className="font-albert leading-[1.4] text-[13px] md:text-[15px] text-stone-700 text-left m-0">
                <span className="text-stone-500">By </span>
                {recipe.author}
              </p>
            </div>

            {/* Right Side: Time Pill */}
            <div className="flex flex-col justify-end self-stretch">
              <span className="font-albert text-[11px] md:text-[13px] text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full whitespace-nowrap border border-stone-200/50">
                -- min
              </span>
            </div>
          </div>
        </button>
      </div>
      
      {showDelete && (
        <button
          type="button"
          aria-label="Remove recent recipe"
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
    </div>
  );
}


'use client';

import Image from 'next/image';
import { useState } from 'react';
import { X } from 'lucide-react';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import { CUISINE_ICON_MAP } from '@/config/cuisineConfig';

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
  showDelete?: boolean;
  showImage?: boolean;
}

export default function RecipeCard({
  recipe,
  onClick,
  onDelete,
  showDelete = false,
  showImage = false, // Default to false as per new design (using cuisine icons instead)
}: RecipeCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Get the first cuisine icon if available, otherwise use a default
  const primaryCuisine = recipe.cuisine && recipe.cuisine.length > 0 ? recipe.cuisine[0] : null;
  const cuisineIconPath = primaryCuisine ? CUISINE_ICON_MAP[primaryCuisine] : '/assets/Illustration Icons/Pan_Icon.png';

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  return (
    <div
      className="group w-full md:basis-0 md:grow min-h-px md:min-w-px relative rounded-[20px] shrink-0 bg-white transition-all duration-500 ease-in-out hover:rounded-[36px] recipe-card-hover-shadow cursor-pointer"
    >
      {/* Animated border that matches the rounded corners on hover */}
      <div
        aria-hidden="true"
        className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[20px] transition-all duration-500 group-hover:rounded-[36px]"
      />
      
      {/* Bookmark Button */}
      <button
        onClick={handleBookmarkToggle}
        className="absolute top-4 right-4 z-20 p-1.5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white/50 backdrop-blur-sm"
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark recipe'}
      >
        <Bookmark
          className={`w-6 h-6 transition-colors duration-200 ${
            isBookmarked 
              ? 'fill-stone-500 text-stone-500' 
              : 'text-stone-300 hover:fill-stone-300'
          }`}
        />
      </button>

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
            <div className="flex flex-col justify-end self-stretch pb-1">
              <div className="pt-2">
                <span className="font-albert text-[11px] md:text-[13px] text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full whitespace-nowrap border border-stone-200/50">
                  -- min
                </span>
              </div>
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


'use client';

import Image from 'next/image';
import { X } from 'lucide-react';

export interface RecipeCardData {
  id: string;
  title: string;
  author: string;
  imageUrl?: string;
  cuisine?: string;
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
  showImage = true,
}: RecipeCardProps) {
  // All cards use white background (matching updated design)
  
  const shouldShowImage = showImage !== false;

  return (
    <div
      className="group w-full md:basis-0 md:grow min-h-px md:min-w-px relative rounded-[8px] shrink-0 bg-white transition-all hover:rounded-[24px] cursor-pointer"
    >
      {/* Animated border that matches the rounded corners on hover */}
      <div
        aria-hidden="true"
        className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[8px] transition-all group-hover:rounded-[24px]"
      />
      
      <div className="size-full">
        <button
          onClick={onClick}
          className="w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-0 rounded-[inherit]"
        >
          <div
            className={`box-border content-stretch flex flex-col ${shouldShowImage ? 'gap-[24px]' : 'gap-[16px]'} items-start p-[24px] relative w-full`}
          >
            {/* Recipe Image */}
            {shouldShowImage && (
              <div className="aspect-[282.667/204] relative rounded-[8px] shrink-0 w-full overflow-hidden">
                {recipe.imageUrl ? (
                  <Image
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    fill
                    className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[8px] size-full transition-transform hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center rounded-[8px]">
                    <span className="text-stone-500 font-albert text-sm">No Image</span>
                  </div>
                )}
              </div>
            )}

            {/* Recipe Info */}
            <div className="content-stretch flex flex-col font-normal gap-[8px] items-start justify-center overflow-clip relative shrink-0 w-full whitespace-normal break-words">
              <h3 className="font-domine leading-[1.1] relative text-[24px] text-black text-left line-clamp-1 break-words">
                {recipe.title}
              </h3>
              <p className="font-albert leading-[1.4] relative shrink-0 text-[16px] text-stone-700">
                <span>By </span>
                {recipe.author}
              </p>
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


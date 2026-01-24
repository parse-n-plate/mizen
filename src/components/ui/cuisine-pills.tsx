'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { SUPPORTED_CUISINES, CUISINE_ICON_MAP } from '@/config/cuisineConfig';
// Solar Camera icon with Bold weight = filled style, matching the visual density of cuisine icons
import Camera from '@solar-icons/react/csr/video/Camera';

export type CuisineType = (typeof SUPPORTED_CUISINES)[number] | null;
export type SelectedCuisines = (typeof SUPPORTED_CUISINES)[number][];

interface CuisinePillsProps {
  onCuisineChange?: (cuisines: SelectedCuisines) => void;
  showCookedOnly?: boolean;
  onShowCookedOnlyChange?: (value: boolean) => void;
}

export default function CuisinePills({ onCuisineChange, showCookedOnly, onShowCookedOnlyChange }: CuisinePillsProps) {
  const [selectedCuisines, setSelectedCuisines] = useState<SelectedCuisines>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [justSelected, setJustSelected] = useState<string | null>(null);

  // Keep arrow visibility in sync with scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScrollLeft = scrollWidth - clientWidth;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft < maxScrollLeft - 2);
    };

    updateScrollState();
    el.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({ left: 180, behavior: 'smooth' });
  };

  const handleScrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -180, behavior: 'smooth' });
  };

  const handleCuisineClick = (cuisine: (typeof SUPPORTED_CUISINES)[number]) => {
    // Toggle behavior: add or remove cuisine from selection
    const wasSelected = selectedCuisines.includes(cuisine);
    const newSelection = wasSelected
      ? selectedCuisines.filter(c => c !== cuisine)
      : [...selectedCuisines, cuisine];
    
    setSelectedCuisines(newSelection);
    
    // Trigger selection animation if becoming selected (not unselected)
    if (!wasSelected && newSelection.includes(cuisine)) {
      setJustSelected(cuisine);
      // Remove animation class after animation completes
      setTimeout(() => setJustSelected(null), 250);
    }
    
    if (onCuisineChange) {
      onCuisineChange(newSelection);
    }
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Scroll container extends to edges with proper padding for content */}
      <div className="overflow-x-auto scrollbar-hide" ref={scrollRef}>
        {/* Inner container with consistent padding and refined spacing */}
        <div className="flex items-center gap-2.5 px-4 md:px-8 py-2">
          {/* Cooked Dishes Only Toggle - appears first in the row */}
          {onShowCookedOnlyChange && (
            <button
              onClick={() => onShowCookedOnlyChange(!showCookedOnly)}
              className={`cuisine-filter-pill relative flex-shrink-0 px-5 py-2.5 rounded-full font-albert text-[16px] font-medium leading-[1.4] border whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-0 flex items-center gap-2.5 transition-colors duration-150 ${
                showCookedOnly
                  ? 'bg-stone-200 border-stone-300'
                  : 'bg-white border-stone-200'
              }`}
              aria-label={showCookedOnly ? 'Show all recipes' : 'Show cooked dishes only'}
              aria-pressed={showCookedOnly}
            >
              {/* Camera icon wrapper - matches cuisine icon wrapper structure for consistent alignment */}
              <span className="relative z-10 flex-shrink-0">
                {/* Solar Camera with Bold weight (filled) to match cuisine icon visual density */}
                <Camera 
                  weight="Bold" 
                  className="w-8 h-8 text-stone-500" 
                />
              </span>
              {/* Label text */}
              <span className="relative z-10">Cooked dishes only</span>
            </button>
          )}
          {/* Individual cuisine pills */}
          {SUPPORTED_CUISINES.map((cuisine) => {
            const isSelected = selectedCuisines.includes(cuisine);
            return (
              <button
                key={cuisine}
                aria-pressed={isSelected}
                onClick={() => handleCuisineClick(cuisine)}
                className={`cuisine-filter-pill relative flex-shrink-0 px-5 py-2.5 rounded-full font-albert text-[16px] font-medium leading-[1.4] border whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-0 flex items-center gap-2.5 transition-colors duration-150 ${
                  isSelected
                    ? 'bg-stone-200 border-stone-300'
                    : 'bg-white border-stone-200'
                } ${justSelected === cuisine ? 'pill-just-selected' : ''}`}
              >
                {/* Cuisine Icon - Using higher resolution source (64x64) displayed at 32x32 for sharp retina display */}
                <span className="relative z-10 flex-shrink-0">
                  <Image
                    src={CUISINE_ICON_MAP[cuisine] || ''}
                    alt={`${cuisine} cuisine icon`}
                    width={64}
                    height={64}
                    quality={100}
                    unoptimized={true}
                    className="w-8 h-8 object-contain"
                    draggable={false}
                  />
                </span>
                {/* Cuisine Text */}
                <span className="relative z-10">{cuisine}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Edge gradients hint at more content off-screen; pointer-events-none so scroll still works
          Positioned to match container padding */}
      {canScrollLeft && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-20 bg-gradient-to-r from-white via-white to-transparent z-20"
          aria-hidden
        />
      )}
      {canScrollRight && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-20 bg-gradient-to-l from-white via-white to-transparent z-20"
          aria-hidden
        />
      )}

      {/* Nudge arrows; only show when there is content to reveal in that direction
          Positioned with padding to match container padding and prevent cutoff */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={handleScrollLeft}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-stone-200 text-stone-500 hover:text-stone-700 hover:shadow-lg transition"
          aria-label="Scroll cuisine pills to the left"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={handleScrollRight}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-stone-200 text-stone-500 hover:text-stone-700 hover:shadow-lg transition"
          aria-label="Scroll cuisine pills to the right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}


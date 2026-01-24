'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { SUPPORTED_CUISINES, CUISINE_ICON_MAP } from '@/config/cuisineConfig';

export type CuisineType = (typeof SUPPORTED_CUISINES)[number] | null;

interface CuisinePillsProps {
  onCuisineChange?: (cuisine: CuisineType) => void;
}

export default function CuisinePills({ onCuisineChange }: CuisinePillsProps) {
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const handleCuisineClick = (cuisine: CuisineType) => {
    // Toggle behavior: if clicking the already-selected cuisine, deselect it (set to null)
    // Otherwise, select the clicked cuisine
    const newSelection = selectedCuisine === cuisine ? null : cuisine;
    setSelectedCuisine(newSelection);
    if (onCuisineChange) {
      onCuisineChange(newSelection);
    }
  };

  return (
    <div className="relative w-full">
      {/* Scroll container keeps content aligned to parent padding; overflow only to the right */}
      <div className="overflow-x-auto overflow-y-visible pr-6 py-1.5 scrollbar-hide" ref={scrollRef}>
        <div className="flex items-center gap-2">
          {/* Individual cuisine pills */}
          {SUPPORTED_CUISINES.map((cuisine) => {
            const isSelected = selectedCuisine === cuisine;
            return (
              <motion.button
                key={cuisine}
                aria-pressed={isSelected}
                onClick={() => handleCuisineClick(cuisine)}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`relative flex-shrink-0 px-5 py-2.5 rounded-full font-albert text-[16px] font-medium leading-[1.4] border whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-0 flex items-center gap-2.5 transition-colors duration-150 ${
                  isSelected
                    ? 'bg-stone-200 border-stone-300'
                    : 'bg-white border-stone-200'
                }`}
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
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Edge gradients hint at more content off-screen; pointer-events-none so scroll still works */}
      {canScrollLeft && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white via-white to-transparent z-20"
          aria-hidden
        />
      )}
      {canScrollRight && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white via-white to-transparent z-20"
          aria-hidden
        />
      )}

      {/* Nudge arrows; only show when there is content to reveal in that direction */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={handleScrollLeft}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-stone-200 text-stone-500 hover:text-stone-700 hover:shadow-lg transition"
          aria-label="Scroll cuisine pills to the left"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={handleScrollRight}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-stone-200 text-stone-500 hover:text-stone-700 hover:shadow-lg transition"
          aria-label="Scroll cuisine pills to the right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}


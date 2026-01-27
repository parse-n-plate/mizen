'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronDown, X } from 'lucide-react';
import Image from 'next/image';
import { SUPPORTED_CUISINES, CUISINE_ICON_MAP } from '@/config/cuisineConfig';
import Camera from '@solar-icons/react/csr/video/Camera';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type CuisineType = (typeof SUPPORTED_CUISINES)[number] | null;
export type SelectedCuisines = (typeof SUPPORTED_CUISINES)[number][];

// Grouped filter options (dropdowns)
export const FILTER_GROUPS = {
  cookTime: {
    label: 'Cook Time',
    options: [
      { id: 'under-15', label: 'Under 15 min' },
      { id: 'under-30', label: 'Under 30 min' },
      { id: 'under-1hr', label: 'Under 1 hour' },
      { id: 'over-1hr', label: '1+ hours' },
    ],
  },
  dietary: {
    label: 'Dietary',
    options: [
      { id: 'vegetarian', label: 'Vegetarian' },
      { id: 'vegan', label: 'Vegan' },
      { id: 'gluten-free', label: 'Gluten-Free' },
      { id: 'dairy-free', label: 'Dairy-Free' },
      { id: 'keto', label: 'Keto' },
      { id: 'paleo', label: 'Paleo' },
    ],
  },
  mealType: {
    label: 'Meal Type',
    options: [
      { id: 'breakfast', label: 'Breakfast' },
      { id: 'lunch', label: 'Lunch' },
      { id: 'dinner', label: 'Dinner' },
      { id: 'snack', label: 'Snack' },
      { id: 'dessert', label: 'Dessert' },
    ],
  },
} as const;

// Standalone style filters (individual pills, not grouped)
export const STYLE_FILTERS = [
  { id: 'easy', label: 'Easy' },
  { id: 'one-pot', label: 'One Pot' },
  { id: 'meal-prep', label: 'Meal Prep' },
  { id: 'kid-friendly', label: 'Kid-Friendly' },
  { id: 'budget', label: 'Budget-Friendly' },
] as const;

export type FilterGroupKey = keyof typeof FILTER_GROUPS;
export type StyleFilterId = typeof STYLE_FILTERS[number]['id'];
export type GroupedFilterId = typeof FILTER_GROUPS[FilterGroupKey]['options'][number]['id'];
export type QuickFilterId = GroupedFilterId | StyleFilterId;
export type SelectedQuickFilters = QuickFilterId[];

interface CuisinePillsProps {
  onCuisineChange?: (cuisines: SelectedCuisines) => void;
  onQuickFilterChange?: (filters: SelectedQuickFilters) => void;
  showCookedOnly?: boolean;
  onShowCookedOnlyChange?: (value: boolean) => void;
}

export default function CuisinePills({ onCuisineChange, onQuickFilterChange, showCookedOnly, onShowCookedOnlyChange }: CuisinePillsProps) {
  const [selectedCuisines, setSelectedCuisines] = useState<SelectedCuisines>([]);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<SelectedQuickFilters>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pillsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [justSelected, setJustSelected] = useState<string | null>(null);

  // Check if any filters are active
  const hasActiveFilters = selectedCuisines.length > 0 || selectedQuickFilters.length > 0 || showCookedOnly;

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
    const wasSelected = selectedCuisines.includes(cuisine);
    const newSelection = wasSelected
      ? selectedCuisines.filter(c => c !== cuisine)
      : [...selectedCuisines, cuisine];

    setSelectedCuisines(newSelection);

    if (!wasSelected && newSelection.includes(cuisine)) {
      setJustSelected(cuisine);
      setTimeout(() => setJustSelected(null), 250);
    }

    if (onCuisineChange) {
      onCuisineChange(newSelection);
    }
  };

  const handleQuickFilterToggle = (filterId: QuickFilterId) => {
    const wasSelected = selectedQuickFilters.includes(filterId);
    const newSelection = wasSelected
      ? selectedQuickFilters.filter(f => f !== filterId)
      : [...selectedQuickFilters, filterId];

    setSelectedQuickFilters(newSelection);

    if (onQuickFilterChange) {
      onQuickFilterChange(newSelection);
    }
  };

  const handleClearAll = () => {
    setSelectedCuisines([]);
    setSelectedQuickFilters([]);
    if (onCuisineChange) onCuisineChange([]);
    if (onQuickFilterChange) onQuickFilterChange([]);
    if (onShowCookedOnlyChange) onShowCookedOnlyChange(false);
  };

  const getSelectedCountForGroup = (groupKey: FilterGroupKey): number => {
    const group = FILTER_GROUPS[groupKey];
    return group.options.filter(opt => selectedQuickFilters.includes(opt.id as QuickFilterId)).length;
  };

  const getSelectedLabelsForGroup = (groupKey: FilterGroupKey): string[] => {
    const group = FILTER_GROUPS[groupKey];
    return group.options
      .filter(opt => selectedQuickFilters.includes(opt.id as QuickFilterId))
      .map(opt => opt.label);
  };

  const handleStyleFilterClick = (filterId: StyleFilterId) => {
    const wasSelected = selectedQuickFilters.includes(filterId);
    const newSelection = wasSelected
      ? selectedQuickFilters.filter(f => f !== filterId)
      : [...selectedQuickFilters, filterId];

    setSelectedQuickFilters(newSelection);

    if (onQuickFilterChange) {
      onQuickFilterChange(newSelection);
    }
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Cuisine icons row - with scroll arrows */}
      <div className="relative">
        {/* Scroll container extends to edges with proper padding for content */}
        <div className="overflow-x-auto scrollbar-hide" ref={scrollRef}>
          {/* Inner container - DoorDash style vertical layout */}
          <div className="flex items-start gap-1 px-4 md:px-8 py-2">
            {/* Cooked Dishes Only Toggle - appears first in the row */}
            {onShowCookedOnlyChange && (
              <button
                onClick={() => onShowCookedOnlyChange(!showCookedOnly)}
                className={`cuisine-filter-item group flex-shrink-0 flex flex-col items-center w-[100px] py-3 px-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors duration-150 ${
                  showCookedOnly ? 'bg-stone-100' : 'hover:bg-stone-50'
                }`}
                aria-label={showCookedOnly ? 'Show all recipes' : 'Show cooked dishes only'}
                aria-pressed={showCookedOnly}
              >
                {/* Icon container */}
                <span className="flex items-center justify-center w-14 h-14">
                  <Camera
                    weight="Bold"
                    className="w-14 h-14 text-stone-600"
                  />
                </span>
                {/* Label text */}
                <span className={`mt-2 font-albert text-[13px] leading-tight text-center transition-colors duration-150 ${
                  showCookedOnly ? 'text-stone-900 font-medium' : 'text-stone-600'
                }`}>
                  Cooked
                </span>
              </button>
            )}
            {/* Individual cuisine filters - vertical icon + label layout */}
            {SUPPORTED_CUISINES.map((cuisine) => {
              const isSelected = selectedCuisines.includes(cuisine);
              return (
                <button
                  key={cuisine}
                  aria-pressed={isSelected}
                  onClick={() => handleCuisineClick(cuisine)}
                  className={`cuisine-filter-item group flex-shrink-0 flex flex-col items-center w-[100px] py-3 px-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 transition-colors duration-150 ${
                    isSelected ? 'bg-stone-100' : 'hover:bg-stone-50'
                  } ${justSelected === cuisine ? 'pill-just-selected' : ''}`}
                >
                  {/* Icon container */}
                  <span className="flex items-center justify-center w-14 h-14">
                    <Image
                      src={CUISINE_ICON_MAP[cuisine] || ''}
                      alt={`${cuisine} cuisine icon`}
                      width={64}
                      height={64}
                      quality={100}
                      unoptimized={true}
                      className="w-14 h-14 object-contain"
                      draggable={false}
                    />
                  </span>
                  {/* Label text */}
                  <span className={`mt-2 font-albert text-[13px] leading-tight text-center transition-colors duration-150 ${
                    isSelected ? 'text-stone-900 font-medium' : 'text-stone-600'
                  }`}>
                    {cuisine}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Edge gradients for cuisine row */}
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

        {/* Scroll arrows for cuisine row */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={handleScrollLeft}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-stone-200 text-stone-500 hover:text-stone-700 hover:shadow-lg transition"
            aria-label="Scroll cuisine filters to the left"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            onClick={handleScrollRight}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-stone-200 text-stone-500 hover:text-stone-700 hover:shadow-lg transition"
            aria-label="Scroll cuisine filters to the right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick filter pills row - grouped with dropdowns */}
      <div className="relative px-4 md:px-8 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Scrollable filters container - left aligned */}
          <div className="overflow-x-auto scrollbar-hide" ref={pillsScrollRef}>
            <div className="flex items-center gap-2">
              {/* Grouped filter dropdowns */}
              {(Object.keys(FILTER_GROUPS) as FilterGroupKey[]).map((groupKey) => {
                const group = FILTER_GROUPS[groupKey];
                const selectedCount = getSelectedCountForGroup(groupKey);
                const selectedLabels = getSelectedLabelsForGroup(groupKey);
                const hasSelections = selectedCount > 0;

                return (
                  <DropdownMenu key={groupKey}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full font-albert text-[13px] font-medium transition-colors duration-150 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 ${
                          hasSelections
                            ? 'bg-stone-900 text-white data-[state=open]:bg-stone-800'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200 data-[state=open]:bg-stone-200 data-[state=open]:text-stone-900'
                        }`}
                      >
                        {hasSelections ? (
                          selectedCount === 1 ? selectedLabels[0] : `${group.label} (${selectedCount})`
                        ) : (
                          group.label
                        )}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 [[data-state=open]>&]:rotate-180 ${hasSelections ? 'text-white' : 'text-stone-500'}`} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {group.options.map((option) => (
                        <DropdownMenuCheckboxItem
                          key={option.id}
                          checked={selectedQuickFilters.includes(option.id as QuickFilterId)}
                          onCheckedChange={() => handleQuickFilterToggle(option.id as QuickFilterId)}
                        >
                          {option.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}

              {/* Standalone style filter pills */}
              {STYLE_FILTERS.map((filter) => {
                const isSelected = selectedQuickFilters.includes(filter.id);
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleStyleFilterClick(filter.id)}
                    className={`flex-shrink-0 flex items-center px-3.5 py-2 rounded-full font-albert text-[13px] font-medium transition-colors duration-150 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 ${
                      isSelected
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear all button - right aligned, always visible when filters active */}
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full font-albert text-[13px] font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors duration-150 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear all</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Magnifer from '@solar-icons/react/csr/search/Magnifer';
import CloseCircle from '@solar-icons/react/csr/ui/CloseCircle';
import MenuDotsCircle from '@solar-icons/react/csr/ui/MenuDotsCircle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type SortOption = 'date-newest' | 'date-oldest' | 'name-asc' | 'name-desc' | 'cuisine';
export type ViewMode = 'grid' | 'list';

interface SavedRecipesHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (view: ViewMode) => void;
  onExport: () => void;
  onDeleteAll: () => void;
}

export function SavedRecipesHeader({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  onExport,
  onDeleteAll,
}: SavedRecipesHeaderProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleSearchIconClick = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchClose = () => {
    setIsSearchExpanded(false);
    onSearchChange('');
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Title */}
      <h2 className="font-domine text-[28px] md:text-[24px] font-normal text-black leading-[1.1] tracking-tight">
        Saved Recipes
      </h2>

      {/* Right side: Search and Settings */}
      <div className="flex items-center gap-2">
        {/* Search Bar - Expandable */}
        <div className="flex items-center">
          {!isSearchExpanded ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearchIconClick}
              className="h-9 w-9 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              aria-label="Search Saved Recipes"
            >
              <Magnifer className="h-4 w-4" />
            </Button>
          ) : (
            <div className="saved-recipes-search-container flex items-center gap-2">
              <div className="relative">
                <Magnifer className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="pl-9 pr-9 w-[200px] md:w-[250px] h-9 text-sm"
                  autoFocus
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSearchChange('')}
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    aria-label="Clear search"
                  >
                    <CloseCircle className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSearchClose}
                className="h-9 w-9 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                aria-label="Close search"
              >
                <CloseCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Settings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              aria-label="Recipe settings"
            >
              <MenuDotsCircle className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={sortOption} onValueChange={(value) => onSortChange(value as SortOption)}>
              <DropdownMenuRadioItem value="date-newest">
                Date (Newest)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="date-oldest">
                Date (Oldest)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name-asc">
                Name (A-Z)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name-desc">
                Name (Z-A)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="cuisine">
                Cuisine
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>View</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={viewMode} onValueChange={(value) => onViewModeChange(value as ViewMode)}>
              <DropdownMenuRadioItem value="grid">
                Grid View
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="list">
                List View
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExport} className="cursor-pointer">
              Export Recipes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDeleteAll}
              className="cursor-pointer text-red-600 hover:bg-red-50"
            >
              Delete All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRouter } from 'next/navigation';
import { useRecipe } from '@/contexts/RecipeContext';
import { ParsedRecipe } from '@/lib/storage';

export default function NavbarSearch() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<ParsedRecipe[]>([]);
  const { recentRecipes } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if query looks like a URL
  const isUrl = (text: string) => {
    return (
      text.includes('http') ||
      text.includes('www.') ||
      text.includes('.com') ||
      text.includes('.org')
    );
  };

  // Search through cached recipes
  const searchRecipes = (searchQuery: string) => {
    if (!searchQuery.trim() || isUrl(searchQuery)) {
      setSearchResults([]);
      return;
    }

    const filtered = recentRecipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.summary.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    setSearchResults(filtered.slice(0, 5)); // Show max 5 results
  };

  // Handle input changes
  useEffect(() => {
    searchRecipes(query);
    setShowDropdown(isFocused && query.trim() !== '' && !isUrl(query));
  }, [query, isFocused, recentRecipes]);

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle blur with delay to allow clicking on dropdown items
  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
    }, 200);
  };

  // Handle recipe selection from dropdown
  const handleRecipeSelect = (recipe: ParsedRecipe) => {
    setParsedRecipe({
      title: recipe.title,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
    });
    setQuery('');
    setShowDropdown(false);
    setIsFocused(false);
    router.push('/parsed-recipe-page');
  };

  // Handle form submission (for URLs)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isUrl(query)) {
      // Redirect to homepage with the URL to trigger parsing
      router.push(`/?url=${encodeURIComponent(query)}`);
    }

    setQuery('');
    setIsFocused(false);
    setShowDropdown(false);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Clear input
  const clearInput = () => {
    setQuery('');
    setIsFocused(false);
    setShowDropdown(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div
          className={`
            bg-stone-100 rounded-[9999px] border border-[#d9d9d9] 
            transition-all duration-300 ease-in-out
            hover:border-[#FFA423] hover:border-opacity-80
            ${isFocused ? 'shadow-sm border-[#FFA423] border-opacity-60' : ''}
          `}
        >
          <div className="flex items-center px-4 py-3 relative">
            {/* Search Icon */}
            <Search className="w-4 h-4 text-stone-600 flex-shrink-0" />

            {/* Input */}
            <div className="flex-1 ml-2 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  isFocused
                    ? query && !isUrl(query)
                      ? 'Search recipes...'
                      : 'Try entering recipe URL'
                    : 'Try entering recipe URL'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="w-full bg-transparent font-albert text-[14px] text-stone-600 placeholder:text-stone-500 focus:outline-none border-none"
              />
            </div>

            {/* Clear Button */}
            {query && (
              <button
                type="button"
                onClick={clearInput}
                className="ml-2 p-1 hover:bg-stone-200 rounded-full transition-all duration-200 flex-shrink-0"
              >
                <X className="w-4 h-4 text-stone-600" />
              </button>
            )}

            {/* Parse Button (for URLs) */}
            {query && isUrl(query) && (
              <button
                type="submit"
                className="ml-2 bg-[#FFA423] hover:bg-[#FF9500] text-white font-albert text-[12px] px-3 py-1.5 rounded-full transition-colors duration-200 flex-shrink-0"
              >
                Parse Recipe
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showDropdown && searchResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#d9d9d9] rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          <div className="p-2">
            <div className="text-xs font-albert font-medium text-stone-500 px-3 py-2 border-b border-stone-200">
              Recent Recipes ({searchResults.length})
            </div>
            {searchResults.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleRecipeSelect(recipe)}
                className="w-full text-left p-3 hover:bg-stone-50 transition-colors duration-200 border-b border-stone-100 last:border-b-0"
              >
                <div className="font-albert font-medium text-[14px] text-stone-800 truncate">
                  {recipe.title}
                </div>
                <div className="font-albert text-[12px] text-stone-500 mt-1 line-clamp-2">
                  {recipe.summary}
                </div>
                <div className="font-albert text-[10px] text-stone-400 mt-1">
                  {new Date(recipe.parsedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

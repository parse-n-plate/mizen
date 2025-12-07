'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRouter } from 'next/navigation';
import { useRecipe } from '@/contexts/RecipeContext';
import { ParsedRecipe } from '@/lib/storage';
import {
  recipeScrape,
  validateRecipeUrl,
} from '@/utils/recipe-parse';
import { useRecipeErrorHandler } from '@/hooks/useRecipeErrorHandler';
import { errorLogger } from '@/utils/errorLogger';
import LoadingAnimation from '@/components/ui/loading-animation';

export default function NavbarSearch() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<ParsedRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const { recentRecipes, addRecipe } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const { handle: handleError } = useRecipeErrorHandler();
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
  const searchRecipes = useCallback(
    (searchQuery: string) => {
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
    },
    [recentRecipes],
  );

  // Handle input changes
  useEffect(() => {
    searchRecipes(query);
    setShowDropdown(isFocused && query.trim() !== '' && !isUrl(query));
  }, [query, isFocused, recentRecipes, searchRecipes]);

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
      author: recipe.author, // Include author if available
      sourceUrl: recipe.sourceUrl, // Include source URL if available
    });
    setQuery('');
    setShowDropdown(false);
    setIsFocused(false);
    router.push('/parsed-recipe-page');
  };

  // Handle URL parsing (similar to SearchForm)
  const handleParse = useCallback(async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);

      // Step 1: Quick validation to ensure URL contains recipe-related keywords
      const validUrlResponse = await validateRecipeUrl(query);

      if (!validUrlResponse.success) {
        const errorMessage = handleError(validUrlResponse.error.code);
        errorLogger.log(
          validUrlResponse.error.code,
          validUrlResponse.error.message,
          query,
        );
        // Show error - could add toast notification here
        console.error('Parse error:', errorMessage);
        return;
      }

      if (!validUrlResponse.isRecipe) {
        const errorMessage = handleError('ERR_NO_RECIPE_FOUND');
        errorLogger.log(
          'ERR_NO_RECIPE_FOUND',
          'No recipe found on this page',
          query,
        );
        console.error('Parse error:', errorMessage);
        return;
      }

      // Step 2: Parse recipe using unified AI-based parser
      console.log('[Navbar] Calling unified recipe parser...');
      const response = await recipeScrape(query);

      // Check if parsing failed
      if (!response.success || response.error) {
        const errorCode = response.error?.code || 'ERR_NO_RECIPE_FOUND';
        const errorMessage = handleError(errorCode);
        errorLogger.log(errorCode, response.error?.message || 'Parsing failed', query);
        console.error('Parse error:', errorMessage);
        return;
      }

      console.log('[Navbar] Successfully parsed recipe:', response.title);

      // Step 3: Store parsed recipe in context
      setParsedRecipe({
        title: response.title,
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author, // Include author if available
        sourceUrl: response.sourceUrl || query, // Use sourceUrl from response or fallback to query URL
      });

      // Step 4: Add to recent recipes
      const recipeSummary = Array.isArray(response.instructions)
        ? response.instructions.join(' ').slice(0, 140)
        : response.instructions.slice(0, 140);

      addRecipe({
        title: response.title,
        summary: recipeSummary,
        url: query,
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author, // Include author if available
        sourceUrl: response.sourceUrl || query, // Include source URL if available
      });

      // Step 5: Navigate to the parsed recipe page
      router.push('/parsed-recipe-page');
      setQuery('');
      setIsFocused(false);
      setShowDropdown(false);
    } catch (err) {
      console.error('[Navbar] Parse error:', err);
      errorLogger.log(
        'ERR_UNKNOWN',
        'An unexpected error occurred during parsing',
        query,
      );
    } finally {
      setLoading(false);
    }
  }, [
    query,
    setParsedRecipe,
    addRecipe,
    handleError,
    router,
  ]);

  // Handle form submission (for URLs)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isUrl(query)) {
      handleParse();
    }

    setQuery('');
    setIsFocused(false);
    setShowDropdown(false);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
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
    <>
      <LoadingAnimation isVisible={loading} />
      <div className="relative w-full">
        <form onSubmit={handleSubmit}>
        <div
          className={`
            bg-stone-100 rounded-[9999px] border border-stone-200 
            transition-all duration-300 ease-in-out
            hover:border-[#4F46E5] hover:border-opacity-80
            ${isFocused ? 'shadow-sm border-[#4F46E5] border-opacity-60' : ''}
          `}
        >
          <div className="flex items-center pl-4 pr-1.5 py-1.5 relative">
            {/* Search Icon */}
            <Search className="w-4 h-4 text-stone-600 flex-shrink-0" />

            {/* Input */}
            <div className="flex-1 ml-2 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Try entering recipe URL"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="w-full bg-transparent font-albert text-[14px] text-stone-600 placeholder:text-stone-500 focus:outline-none border-none"
              />
            </div>

            {/* Keyboard Shortcut Indicator (⌘+K) - shown when not focused or no query */}
            {!isFocused && !query && (
              <div className="ml-2 flex items-center gap-1 flex-shrink-0">
                <kbd className="hidden md:inline-flex items-center px-2 py-1 text-[10px] font-albert text-stone-500 bg-white border border-[#d9d9d9] rounded">
                  ⌘K
                </kbd>
              </div>
            )}

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
                disabled={loading}
                className="ml-2 bg-stone-900 hover:bg-stone-800 text-stone-50 font-albert font-medium text-[14px] leading-[1.4] px-5 py-2 rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </>
  );
}

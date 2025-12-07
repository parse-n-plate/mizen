'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRouter, usePathname } from 'next/navigation';
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
  const [isHovered, setIsHovered] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<ParsedRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const { recentRecipes, addRecipe } = useParsedRecipes();
  const { parsedRecipe, setParsedRecipe } = useRecipe();
  const { handle: handleError } = useRecipeErrorHandler();
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect if on parsed recipe page
  const isOnParsedRecipePage = pathname === '/parsed-recipe-page';

  // Helper function to extract domain from URL
  const getDomainFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Helper function to get path from URL
  const getPathFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return '';
    }
  };

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

  // Handle focus - when on parsed recipe page, clear the displayed URL and allow editing
  const handleFocus = () => {
    setIsFocused(true);
    setIsHovered(false);
    // If we're on parsed recipe page and showing the URL, focus the input to allow new input
    if (isOnParsedRecipePage && parsedRecipe?.sourceUrl && !query) {
      // Focus the input so user can immediately start typing or pasting
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  // Handle click on the search container - focus input when showing URL
  const handleContainerClick = () => {
    if (isOnParsedRecipePage && parsedRecipe?.sourceUrl && !isFocused && !query) {
      setIsFocused(true);
      setTimeout(() => {
        inputRef.current?.focus();
        // Select all text if there's any, to make it easy to replace
        inputRef.current?.select();
      }, 0);
    }
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
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleContainerClick}
        >
          <div className="flex items-center pl-4 pr-1.5 py-1.5 relative min-h-[40px]">
            {/* Search Icon */}
            <Search className="w-4 h-4 text-stone-600 flex-shrink-0" />

            {/* Input */}
            <div className="flex-1 ml-2 relative min-h-[20px] flex items-center">
              {/* Show URL display when on parsed recipe page and not focused/editing */}
              {isOnParsedRecipePage && parsedRecipe?.sourceUrl && !isFocused && !query ? (
                <div className="w-full font-albert text-[14px] truncate flex-1 min-w-0 cursor-text h-[20px] flex items-center">
                  <AnimatePresence mode="wait">
                    {isHovered ? (
                      <motion.span
                        key="placeholder"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2 }}
                        className="text-stone-500 block"
                      >
                        Try entering recipe URL
                      </motion.span>
                    ) : (
                      <motion.div
                        key="url"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2 }}
                        className="truncate"
                      >
                        <span className="font-medium text-[#193d34]">
                          {getDomainFromUrl(parsedRecipe.sourceUrl)}
                        </span>
                        <span className="text-stone-400">
                          {getPathFromUrl(parsedRecipe.sourceUrl)}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={isOnParsedRecipePage ? "Try entering recipe URL" : "Try entering recipe URL"}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onPaste={(e) => {
                    // Handle paste - the value will be set automatically by the input
                    // but we ensure focus is maintained
                    setTimeout(() => {
                      const pastedText = e.clipboardData.getData('text');
                      if (pastedText) {
                        setQuery(pastedText);
                      }
                    }, 0);
                  }}
                  className="w-full bg-transparent font-albert text-[14px] text-stone-600 placeholder:text-stone-500 focus:outline-none border-none h-[20px]"
                />
              )}
            </div>

            {/* Keyboard Shortcut Indicator (⌘+K) - shown when not focused or no query, but not on parsed recipe page showing URL */}
            {!isFocused && !query && !(isOnParsedRecipePage && parsedRecipe?.sourceUrl) && (
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

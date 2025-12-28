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
import { errorLogger } from '@/utils/errorLogger';
import { useCommandK } from '@/contexts/CommandKContext';
import { isUrl } from '@/utils/searchUtils';
import LoadingAnimation from '@/components/ui/loading-animation';
import { useToast } from '@/hooks/useToast';
import EmptyState from '@/components/ui/empty-state';

export default function NavbarSearch() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<ParsedRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const { recentRecipes, addRecipe } = useParsedRecipes();
  const { parsedRecipe, setParsedRecipe } = useRecipe();
  const { showError, showSuccess, showInfo } = useToast();
  const { open: openCommandK } = useCommandK();
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
      summary: recipe.description || recipe.summary, // Use AI summary if available, fallback to card summary
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

      // Step 0: Check if input looks like a URL (early validation)
      if (!isUrl(query)) {
        errorLogger.log('ERR_NOT_A_URL', 'Input is not a URL', query);
        showInfo({
          code: 'ERR_NOT_A_URL',
        });
        setLoading(false);
        return;
      }

      // Step 1: Quick validation to ensure URL contains recipe-related keywords
      const validUrlResponse = await validateRecipeUrl(query);

      if (!validUrlResponse.success) {
        errorLogger.log(
          validUrlResponse.error.code,
          validUrlResponse.error.message,
          query,
        );
        showError({
          code: validUrlResponse.error.code,
          message: validUrlResponse.error.message,
        });
        return;
      }

      if (!validUrlResponse.isRecipe) {
        errorLogger.log(
          'ERR_NO_RECIPE_FOUND',
          'No recipe found on this page',
          query,
        );
        showError({
          code: 'ERR_NO_RECIPE_FOUND',
        });
        return;
      }

      // Step 2: Parse recipe using unified AI-based parser
      console.log('[Navbar] Calling unified recipe parser...');
      const response = await recipeScrape(query);

      // Check if parsing failed
      if (!response.success || response.error) {
        const errorCode = response.error?.code || 'ERR_NO_RECIPE_FOUND';
        errorLogger.log(errorCode, response.error?.message || 'Parsing failed', query);
        showError({
          code: errorCode,
          message: response.error?.message,
        });
        return;
      }

      console.log('[Navbar] Successfully parsed recipe:', response.title);

      // Step 3: Store parsed recipe in context
      const recipeToStore = {
        title: response.title,
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author, // Include author if available
        sourceUrl: response.sourceUrl || query, // Use sourceUrl from response or fallback to query URL
        summary: response.summary, // Include AI-generated summary if available
        cuisine: response.cuisine, // Include cuisine tags if available
      };
      
      setParsedRecipe(recipeToStore);
      
      // Ensure localStorage write completes before navigation
      await new Promise(resolve => setTimeout(resolve, 0));

      // Step 4: Add to recent recipes
      const recipeSummary = Array.isArray(response.instructions)
        ? response.instructions
            .map((inst: any) => (typeof inst === 'string' ? inst : inst.detail))
            .join(' ')
            .slice(0, 140)
        : response.instructions.slice(0, 140);

      addRecipe({
        title: response.title,
        summary: recipeSummary,
        description: response.summary, // Store the AI-generated summary
        url: query,
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author, // Include author if available
        sourceUrl: response.sourceUrl || query, // Include source URL if available
        cuisine: response.cuisine, // Include cuisine tags if available
      });

      // Show success toast
      showSuccess('Recipe parsed successfully!', 'Navigating to recipe page...');

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
      showError({
        code: 'ERR_UNKNOWN',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [
    query,
    setParsedRecipe,
    addRecipe,
    showError,
    showSuccess,
    showInfo,
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
          <div className="flex items-center pl-3 md:pl-4 pr-2.5 md:pr-4 py-1.5 md:py-2 relative min-h-[38px] md:min-h-[44px]">
            {/* Search Icon */}
            <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-600 flex-shrink-0" />

            {/* Input */}
            <div className="flex-1 ml-1.5 md:ml-2 relative min-h-[18px] md:min-h-[20px] flex items-center">
              {/* Show URL display when on parsed recipe page and not focused/editing */}
              {isOnParsedRecipePage && parsedRecipe?.sourceUrl && !isFocused && !query ? (
                <div className="w-full font-albert text-[13px] md:text-[14px] truncate flex-1 min-w-0 cursor-text h-[18px] md:h-[20px] flex items-center">
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
                        Enter URL
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
                  placeholder={isFocused ? "Enter URL" : "Enter recipe URL"}
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
                  className="w-full bg-transparent font-albert text-[13px] md:text-[14px] text-stone-600 placeholder:text-stone-500 focus:outline-none border-none h-[18px] md:h-[20px]"
                />
              )}
            </div>

            {/* Keyboard Shortcut Indicator (⌘+K) - shown when not focused or no query, but not on mobile or parsed recipe page showing URL */}
            {!isFocused && !query && !(isOnParsedRecipePage && parsedRecipe?.sourceUrl) && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openCommandK();
                }}
                className="hidden md:flex ml-2 items-center gap-1 flex-shrink-0 cursor-pointer"
                aria-label="Open Command K search"
              >
                <kbd className="inline-flex items-center px-2 py-1 text-[10px] font-albert text-stone-500 bg-white border border-[#d9d9d9] rounded hover:border-[#4F46E5] transition-colors">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Clear Button */}
            {query && (
              <button
                type="button"
                onClick={clearInput}
                className="ml-1 md:ml-2 p-1 hover:bg-stone-200 rounded-full transition-all duration-200 flex-shrink-0"
              >
                <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-600" />
              </button>
            )}

            {/* Parse Button (for URLs) */}
            {query && isUrl(query) && (
              <button
                type="submit"
                disabled={loading}
                className="ml-1 md:ml-2 bg-stone-900 hover:bg-stone-800 text-stone-50 font-albert font-medium text-[11px] md:text-[14px] leading-[1.4] px-2.5 md:px-5 py-1.5 md:py-2 rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="md:hidden">Parse</span>
                <span className="hidden md:inline">Parse Recipe</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#d9d9d9] rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {searchResults.length > 0 ? (
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
          ) : query.trim() && !isUrl(query) ? (
            <EmptyState variant="no-results" compact />
          ) : recentRecipes.length === 0 ? (
            <EmptyState variant="no-recent" compact />
          ) : null}
        </div>
      )}
      </div>
    </>
  );
}

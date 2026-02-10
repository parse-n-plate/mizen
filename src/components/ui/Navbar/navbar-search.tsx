'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
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
// Note: Command+K handling is now done globally via CommandKContext
import { isUrl, normalizeUrl } from '@/utils/searchUtils';
import LoadingAnimation from '@/components/ui/loading-animation';
import { useToast } from '@/hooks/useToast';
import EmptyState from '@/components/ui/empty-state';

export default function NavbarSearch() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectedCuisine, setDetectedCuisine] = useState<string[] | undefined>(undefined);
  const { recentRecipes, addRecipe } = useParsedRecipes();
  const { parsedRecipe, setParsedRecipe } = useRecipe();
  const { showError, showSuccess, showInfo } = useToast();
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

  // Derive search results from query + recentRecipes (no effect needed)
  const searchResults = useMemo(() => {
    if (!query.trim() || isUrl(query)) return [];
    return recentRecipes
      .filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(query.toLowerCase()) ||
          recipe.summary.toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, 5);
  }, [query, recentRecipes]);

  // Derive dropdown visibility (no effect needed)
  const showDropdown = isFocused && query.trim() !== '' && !isUrl(query);

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
      imageData: recipe.imageData, // Include image data if available (for uploaded images)
      imageFilename: recipe.imageFilename, // Include image filename if available
      prepTimeMinutes: recipe.prepTimeMinutes, // Include prep time if available
      cookTimeMinutes: recipe.cookTimeMinutes, // Include cook time if available
      totalTimeMinutes: recipe.totalTimeMinutes, // Include total time if available
      servings: recipe.servings, // Include servings if available
    });
    setQuery('');

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

      // Normalize the URL by adding protocol/www if missing
      // This enables users to type "allrecipes.com/recipe" instead of full URL
      const normalizedUrl = normalizeUrl(query);

      // Step 1: Quick validation to ensure URL contains recipe-related keywords
      const validUrlResponse = await validateRecipeUrl(normalizedUrl);

      if (!validUrlResponse.success) {
        setLoading(false);
        errorLogger.log(
          validUrlResponse.error.code,
          validUrlResponse.error.message,
          normalizedUrl,
        );
        showError({
          code: validUrlResponse.error.code,
          message: validUrlResponse.error.message,
          sourceUrl: normalizedUrl,
        });
        return;
      }

      if (!validUrlResponse.isRecipe) {
        setLoading(false);
        errorLogger.log(
          'ERR_NO_RECIPE_FOUND',
          'No recipe found on this page',
          normalizedUrl,
        );
        showError({
          code: 'ERR_NO_RECIPE_FOUND',
          sourceUrl: normalizedUrl,
        });
        return;
      }

      // Step 2: Parse recipe using unified AI-based parser
      console.log('[Navbar] Calling unified recipe parser...');
      const response = await recipeScrape(normalizedUrl);

      // Check if parsing failed
      if (!response.success || response.error) {
        setLoading(false);
        const errorCode = response.error?.code || 'ERR_NO_RECIPE_FOUND';
        errorLogger.log(errorCode, response.error?.message || 'Parsing failed', normalizedUrl);
        showError({
          code: errorCode,
          message: response.error?.message,
          retryAfter: response.error?.retryAfter, // Pass through retry-after timestamp
          sourceUrl: normalizedUrl,
        });
        return;
      }

      console.log('[Navbar] Successfully parsed recipe:', response.title);

      // Store detected cuisine for reveal
      if (response.cuisine) {
        setDetectedCuisine(response.cuisine);
      }

      // Step 3: Store parsed recipe in context
      const recipeToStore = {
        title: response.title,
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author, // Include author if available
        sourceUrl: response.sourceUrl || normalizedUrl, // Use sourceUrl from response or fallback to normalized URL
        summary: response.summary, // Include AI-generated summary if available
        cuisine: response.cuisine, // Include cuisine tags if available
        ...(response.servings !== undefined && { servings: response.servings }), // Include servings/yield if available
        ...(response.prepTimeMinutes !== undefined && { prepTimeMinutes: response.prepTimeMinutes }), // Include prep time if available
        ...(response.cookTimeMinutes !== undefined && { cookTimeMinutes: response.cookTimeMinutes }), // Include cook time if available
        ...(response.totalTimeMinutes !== undefined && { totalTimeMinutes: response.totalTimeMinutes }), // Include total time if available
      };
      
      setParsedRecipe(recipeToStore);
      
      // Ensure localStorage write completes before navigation
      await new Promise(resolve => setTimeout(resolve, 0));

      // Step 4: Add to recent recipes
      const recipeSummary = Array.isArray(response.instructions)
        ? response.instructions
            .map((inst: string | { detail?: string }) => (typeof inst === 'string' ? inst : inst.detail))
            .join(' ')
            .slice(0, 140)
        : response.instructions.slice(0, 140);

      addRecipe({
        title: response.title,
        summary: recipeSummary,
        description: response.summary, // Store the AI-generated summary
        url: normalizedUrl,
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author, // Include author if available
        sourceUrl: response.sourceUrl || normalizedUrl, // Include source URL if available
        cuisine: response.cuisine, // Include cuisine tags if available
        ...(response.servings !== undefined && { servings: response.servings }), // Include servings/yield if available
        ...(response.prepTimeMinutes !== undefined && { prepTimeMinutes: response.prepTimeMinutes }), // Include prep time if available
        ...(response.cookTimeMinutes !== undefined && { cookTimeMinutes: response.cookTimeMinutes }), // Include cook time if available
        ...(response.totalTimeMinutes !== undefined && { totalTimeMinutes: response.totalTimeMinutes }), // Include total time if available
      });

      // Show success toast
      showSuccess('Recipe parsed successfully!', 'Navigating to recipe page...', normalizedUrl);

      // Step 5: Navigate to the parsed recipe page with delay for reveal
      setTimeout(() => {
        setLoading(false);
        router.push('/parsed-recipe-page');
        setQuery('');
        setIsFocused(false);
    
      }, 1500);
    } catch (err) {
      console.error('[Navbar] Parse error:', err);
      errorLogger.log(
        'ERR_UNKNOWN',
        'An unexpected error occurred during parsing',
        query.trim(),
      );
      showError({
        code: 'ERR_UNKNOWN',
        message: 'An unexpected error occurred. Please try again.',
      });
      setLoading(false);
    } finally {
      // setLoading(false) handled in success/error paths
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

  };

  // Handle keyboard events (Enter to submit, ESC to blur)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      inputRef.current?.blur();
      setIsFocused(false);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }
  };

  // Clear input
  const clearInput = () => {
    setQuery('');
    setIsFocused(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Handle cancel loading
  const handleCancelLoading = () => {
    setLoading(false);
    setDetectedCuisine(undefined);
  };

  return (
    <>
      <LoadingAnimation isVisible={loading} cuisine={detectedCuisine} onCancel={handleCancelLoading} />
      <div className="relative w-full">
        <form onSubmit={handleSubmit}>
        <div
          className={`
            rounded-lg border transition-all duration-200 ease-in-out
            ${isFocused ? 'bg-white border-stone-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'bg-[#f5f5f4] border-transparent'}
          `}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleContainerClick}
        >
          <div className="flex items-center gap-3 px-4 py-3 relative">
            {/* Search Icon */}
            <Search className="w-[18px] h-[18px] text-stone-400 flex-shrink-0" />

            {/* Input */}
            <div className="flex-1 relative flex items-center">
              {/* Show URL display when on parsed recipe page and not focused/editing */}
              {isOnParsedRecipePage && parsedRecipe?.sourceUrl && !isFocused && !query ? (
                <div className="w-full font-albert text-[15px] truncate flex-1 min-w-0 cursor-text flex items-center">
                  <AnimatePresence mode="wait">
                    {isHovered ? (
                      <motion.span
                        key="placeholder"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2 }}
                        className="text-stone-400 block"
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
                        <span className="font-medium text-stone-800">
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
                  data-search-input="navbar"
                  type="text"
                  placeholder={isFocused ? "Enter URL" : "Enter recipe URL"}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
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
                  className="w-full bg-transparent font-albert text-[15px] text-stone-800 placeholder:text-stone-400 focus:outline-none border-none"
                />
              )}
            </div>

            {/* Keyboard Shortcut Indicator (⌘+K) - shown when not focused or no query, but not on mobile or parsed recipe page showing URL */}
            {/* Note: Command+K now focuses this search box directly via CommandKContext */}
            {!isFocused && !query && !(isOnParsedRecipePage && parsedRecipe?.sourceUrl) && (
              <div className="hidden md:flex ml-2 items-center gap-1 flex-shrink-0">
                <kbd className="inline-flex items-center px-2 py-1 text-[10px] font-albert text-stone-500 bg-white border border-[#d9d9d9] rounded">
                  ⌘K
                </kbd>
              </div>
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

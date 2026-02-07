'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { ParsedRecipe } from '@/lib/storage';
import { recipeScrape, validateRecipeUrl } from '@/utils/recipe-parse';
import { errorLogger } from '@/utils/errorLogger';
import { isUrl, normalizeUrl } from '@/utils/searchUtils';
import { addToSearchHistory } from '@/lib/searchHistory';
import { useToast } from '@/hooks/useToast';
import LoadingAnimation from '@/components/ui/loading-animation';

/**
 * InlineSearch Component
 *
 * GitHub-style inline search that expands in the navbar when clicked
 * Shows recent recipes when focused
 */
export default function InlineSearch() {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectedCuisine, setDetectedCuisine] = useState<string[] | undefined>(
    undefined,
  );
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { recentRecipes: contextRecipes } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const { addRecipe } = useParsedRecipes();
  const { showError, showInfo } = useToast();
  const router = useRouter();

  const recentRecipes = useMemo(
    () => contextRecipes.slice(0, 10),
    [contextRecipes],
  );

  const filteredRecipes = useMemo(() => {
    if (!query.trim() || isUrl(query)) {
      return recentRecipes.slice(0, 5);
    }

    const searchQuery = query.toLowerCase().trim();
    return recentRecipes
      .filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(searchQuery) ||
          recipe.summary?.toLowerCase().includes(searchQuery) ||
          recipe.description?.toLowerCase().includes(searchQuery),
      )
      .slice(0, 8);
  }, [query, recentRecipes]);

  const shouldShowRecentsPanel = isExpanded && !isUrl(query);
  const showRecents = shouldShowRecentsPanel && filteredRecipes.length > 0;
  const selectedRecipe = selectedRecipeId
    ? (filteredRecipes.find((recipe) => recipe.id === selectedRecipeId) ?? null)
    : null;

  // Handle clicks outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
        setQuery('');
        setSelectedRecipeId(null);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Handle focus - expand input and reveal filtered recent recipes
  const handleFocus = () => {
    setIsExpanded(true);
  };

  // Handle URL parsing
  const handleParse = useCallback(
    async (url: string) => {
      if (!url.trim()) return;

      try {
        setLoading(true);
        setSelectedRecipeId(null);

        // Step 0: Check if input looks like a URL (early validation)
        if (!isUrl(url)) {
          errorLogger.log('ERR_NOT_A_URL', 'Input is not a URL', url);
          showInfo({
            code: 'ERR_NOT_A_URL',
          });
          setLoading(false);
          return;
        }

        // Normalize the URL by adding protocol/www if missing
        // This enables users to type "allrecipes.com/recipe" instead of full URL
        const normalizedUrl = normalizeUrl(url);

        // Step 1: Validate URL format and check if it's a recipe page
        const validUrlResponse = await validateRecipeUrl(normalizedUrl);

        if (!validUrlResponse.success) {
          errorLogger.log(
            validUrlResponse.error.code,
            validUrlResponse.error.message,
            normalizedUrl,
          );
          showError({
            code: validUrlResponse.error.code,
            message: validUrlResponse.error.message,
          });
          setLoading(false);
          return;
        }

        if (!validUrlResponse.isRecipe) {
          errorLogger.log(
            'ERR_NO_RECIPE_FOUND',
            'No recipe found on this page',
            normalizedUrl,
          );
          showError({
            code: 'ERR_NO_RECIPE_FOUND',
          });
          setLoading(false);
          return;
        }

        // Step 2: Parse recipe using unified AI-based parser
        const response = await recipeScrape(normalizedUrl);

        if (!response.success || response.error) {
          setLoading(false);
          const errorCode = response.error?.code || 'ERR_NO_RECIPE_FOUND';
          errorLogger.log(
            errorCode,
            response.error?.message || 'Parsing failed',
            normalizedUrl,
          );
          showError({
            code: errorCode,
            message: response.error?.message,
            retryAfter: response.error?.retryAfter, // Pass through retry-after timestamp
          });
          return;
        }

        // Store detected cuisine for reveal
        if (response.cuisine) {
          setDetectedCuisine(response.cuisine);
        }

        // Store parsed recipe
        const recipeToStore = {
          title: response.title,
          ingredients: response.ingredients,
          instructions: response.instructions,
          author: response.author,
          sourceUrl: response.sourceUrl || normalizedUrl,
          summary: response.summary,
          cuisine: response.cuisine,
          ...(response.servings !== undefined && {
            servings: response.servings,
          }), // Include servings/yield if available
          ...(response.prepTimeMinutes !== undefined && {
            prepTimeMinutes: response.prepTimeMinutes,
          }), // Include prep time if available
          ...(response.cookTimeMinutes !== undefined && {
            cookTimeMinutes: response.cookTimeMinutes,
          }), // Include cook time if available
          ...(response.totalTimeMinutes !== undefined && {
            totalTimeMinutes: response.totalTimeMinutes,
          }), // Include total time if available
        };

        setParsedRecipe(recipeToStore);

        await new Promise((resolve) => setTimeout(resolve, 0));

        // Add to recent recipes
        const recipeSummary = Array.isArray(response.instructions)
          ? response.instructions
              .map((inst: any) =>
                typeof inst === 'string' ? inst : inst.detail,
              )
              .join(' ')
              .slice(0, 140)
          : response.instructions.slice(0, 140);

        addRecipe({
          title: response.title,
          summary: recipeSummary,
          description: response.summary,
          url: normalizedUrl,
          ingredients: response.ingredients,
          instructions: response.instructions,
          author: response.author,
          sourceUrl: response.sourceUrl || normalizedUrl,
          cuisine: response.cuisine,
          ...(response.servings !== undefined && {
            servings: response.servings,
          }), // Include servings/yield if available
          ...(response.prepTimeMinutes !== undefined && {
            prepTimeMinutes: response.prepTimeMinutes,
          }), // Include prep time if available
          ...(response.cookTimeMinutes !== undefined && {
            cookTimeMinutes: response.cookTimeMinutes,
          }), // Include cook time if available
          ...(response.totalTimeMinutes !== undefined && {
            totalTimeMinutes: response.totalTimeMinutes,
          }), // Include total time if available
        });

        // Add to search history
        addToSearchHistory(normalizedUrl, response.title);

        // Navigate to recipe page with delay for reveal
        setTimeout(() => {
          setLoading(false);
          router.push('/parsed-recipe-page');
          setQuery('');
          setIsExpanded(false);
        }, 1500);
      } catch (err) {
        console.error('[InlineSearch] Parse error:', err);
        errorLogger.log(
          'ERR_UNKNOWN',
          'An unexpected error occurred',
          url.trim(),
        );
        showError({
          code: 'ERR_UNKNOWN',
          message: 'An unexpected error occurred. Please try again.',
        });
        setLoading(false);
      } finally {
        // setLoading(false) handled in success/error paths
      }
    },
    [setParsedRecipe, addRecipe, showError, showInfo, router],
  );

  // Handle recipe selection
  const handleRecipeSelect = (recipe: ParsedRecipe) => {
    setParsedRecipe({
      title: recipe.title,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      author: recipe.author,
      sourceUrl: recipe.sourceUrl,
      summary: recipe.description || recipe.summary,
      imageData: recipe.imageData, // Include image data if available (for uploaded images)
      imageFilename: recipe.imageFilename, // Include image filename if available
      cuisine: recipe.cuisine,
      prepTimeMinutes: recipe.prepTimeMinutes, // Include prep time if available
      cookTimeMinutes: recipe.cookTimeMinutes, // Include cook time if available
      totalTimeMinutes: recipe.totalTimeMinutes, // Include total time if available
      servings: recipe.servings, // Include servings if available
    });
    router.push('/parsed-recipe-page');
    setQuery('');
    setIsExpanded(false);
    setSelectedRecipeId(null);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUrl(query)) {
      handleParse(query);
    }
  };

  // Clear input
  const clearInput = () => {
    setQuery('');
    setSelectedRecipeId(null);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showRecents || filteredRecipes.length === 0) {
      // Handle ESC to close
      if (e.key === 'Escape') {
        setIsExpanded(false);
        setQuery('');
        setSelectedRecipeId(null);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedRecipeId((previousId) => {
          if (!previousId) return filteredRecipes[0].id;
          const currentIndex = filteredRecipes.findIndex(
            (recipe) => recipe.id === previousId,
          );
          const nextIndex =
            currentIndex >= 0 ? (currentIndex + 1) % filteredRecipes.length : 0;
          return filteredRecipes[nextIndex].id;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedRecipeId((previousId) => {
          if (!previousId)
            return filteredRecipes[filteredRecipes.length - 1].id;
          const currentIndex = filteredRecipes.findIndex(
            (recipe) => recipe.id === previousId,
          );
          const previousIndex =
            currentIndex >= 0
              ? (currentIndex - 1 + filteredRecipes.length) %
                filteredRecipes.length
              : filteredRecipes.length - 1;
          return filteredRecipes[previousIndex].id;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedRecipe) {
          handleRecipeSelect(selectedRecipe);
        } else if (isUrl(query)) {
          handleParse(query);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsExpanded(false);
        setQuery('');
        setSelectedRecipeId(null);
        break;
    }
  };

  // Handle cancel loading
  const handleCancelLoading = () => {
    setLoading(false);
    setDetectedCuisine(undefined);
  };

  return (
    <>
      <LoadingAnimation
        isVisible={loading}
        cuisine={detectedCuisine}
        onCancel={handleCancelLoading}
      />
      <div ref={containerRef} className="relative flex-1 max-w-md">
        <form onSubmit={handleSubmit}>
          {/* Search wrapper - uses same styling as IngredientsHeader */}
          <div className="ingredients-search-wrapper">
            {/* Search Icon - matches IngredientsHeader icon styling */}
            <Search className="ingredients-search-icon" />

            {/* Input - matches IngredientsHeader input styling */}
            <input
              ref={inputRef}
              type="text"
              placeholder={isExpanded ? 'Enter recipe URL' : 'Enter recipe URL'}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedRecipeId(null);
              }}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              className="ingredients-search-input"
            />

            {/* Clear Button */}
            {query && (
              <button
                type="button"
                onClick={clearInput}
                className="ml-2 flex-shrink-0 p-1 rounded transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-stone-600 hover:text-stone-900 transition-colors duration-150 ease" />
              </button>
            )}

            {/* ESC hint */}
            {isExpanded && !query && (
              <div className="ml-2 flex-shrink-0">
                <kbd className="px-2 py-0.5 text-xs font-albert text-stone-500 bg-white border border-stone-300 rounded">
                  ESC
                </kbd>
              </div>
            )}
          </div>
        </form>

        {/* Recent Recipes Dropdown - Progressive Disclosure */}
        {showRecents && filteredRecipes.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
            <div className="p-2">
              {/* Show header if filtering */}
              {query.trim() && !isUrl(query) && (
                <div className="px-3 py-2 border-b border-stone-100">
                  <div className="font-albert text-xs font-medium text-stone-500 uppercase tracking-wide">
                    {filteredRecipes.length === 1
                      ? '1 recipe found'
                      : `${filteredRecipes.length} recipes found`}
                  </div>
                </div>
              )}

              {/* Recipe Results */}
              {filteredRecipes.map((recipe) => {
                const isSelected = selectedRecipeId === recipe.id;
                return (
                  <button
                    key={recipe.id}
                    onClick={() => handleRecipeSelect(recipe)}
                    className={`
                      w-full text-left p-3 rounded-md transition-colors group
                      ${
                        isSelected
                          ? 'bg-stone-50 text-stone-900'
                          : 'hover:bg-stone-50'
                      }
                    `}
                    onMouseEnter={() => setSelectedRecipeId(recipe.id)}
                  >
                    <div
                      className={`font-albert font-medium text-sm truncate ${
                        isSelected ? 'text-stone-900' : 'text-stone-800'
                      }`}
                    >
                      {recipe.title}
                    </div>
                    <div
                      className={`font-albert text-xs mt-1 line-clamp-1 ${
                        isSelected ? 'text-stone-600' : 'text-stone-500'
                      }`}
                    >
                      {recipe.summary || recipe.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State - No results found */}
        {shouldShowRecentsPanel &&
          query.trim() &&
          filteredRecipes.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-md shadow-lg z-50">
              <div className="p-4 text-center">
                <p className="font-albert text-sm text-stone-500">
                  No recipes found matching "{query}"
                </p>
                <p className="font-albert text-xs text-stone-400 mt-1">
                  Try a different search term or enter a recipe URL
                </p>
              </div>
            </div>
          )}
      </div>
    </>
  );
}

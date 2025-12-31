'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { ParsedRecipe } from '@/lib/storage';
import {
  recipeScrape,
  validateRecipeUrl,
} from '@/utils/recipe-parse';
import { errorLogger } from '@/utils/errorLogger';
import { isUrl } from '@/utils/searchUtils';
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
  const [recentRecipes, setRecentRecipes] = useState<ParsedRecipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<ParsedRecipe[]>([]);
  const [showRecents, setShowRecents] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { recentRecipes: contextRecipes } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const { addRecipe } = useParsedRecipes();
  const { showError, showInfo } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Load recent recipes
  useEffect(() => {
    const allRecipes = contextRecipes.slice(0, 10); // Load more recipes for searching
    setRecentRecipes(allRecipes);
    setFilteredRecipes(allRecipes.slice(0, 5)); // Initially show last 5
  }, [contextRecipes]);

  // Filter recipes based on query (progressive disclosure)
  useEffect(() => {
    if (!isExpanded) {
      setShowRecents(false);
      return;
    }

    if (!query.trim() || isUrl(query)) {
      // Show recent recipes when empty or URL detected
      setFilteredRecipes(recentRecipes.slice(0, 5));
      setShowRecents(recentRecipes.length > 0 && !isUrl(query));
    } else {
      // Filter recipes by title or summary
      const searchQuery = query.toLowerCase().trim();
      const filtered = recentRecipes.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(searchQuery) ||
          recipe.summary?.toLowerCase().includes(searchQuery) ||
          recipe.description?.toLowerCase().includes(searchQuery)
      );
      setFilteredRecipes(filtered.slice(0, 8)); // Show up to 8 filtered results
      setShowRecents(filtered.length > 0);
    }
    // Reset selected index when query changes
    setSelectedIndex(-1);
  }, [query, recentRecipes, isExpanded]);

  // Handle clicks outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setShowRecents(false);
        setQuery('');
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Handle focus - expand and show recents
  const handleFocus = () => {
    setIsExpanded(true);
    // Show recents will be handled by the useEffect based on query
  };

  // Handle URL parsing
  const handleParse = useCallback(
    async (url: string) => {
      if (!url.trim()) return;

      try {
        setLoading(true);
        setShowRecents(false);

        // Step 0: Check if input looks like a URL (early validation)
        if (!isUrl(url)) {
          errorLogger.log('ERR_NOT_A_URL', 'Input is not a URL', url);
          showInfo({
            code: 'ERR_NOT_A_URL',
          });
          setLoading(false);
          return;
        }

        // Step 1: Validate URL format and check if it's a recipe page
        const validUrlResponse = await validateRecipeUrl(url);

        if (!validUrlResponse.success) {
          errorLogger.log(
            validUrlResponse.error.code,
            validUrlResponse.error.message,
            url,
          );
          showError({
            code: validUrlResponse.error.code,
            message: validUrlResponse.error.message,
          });
          setLoading(false);
          return;
        }

        if (!validUrlResponse.isRecipe) {
          errorLogger.log('ERR_NO_RECIPE_FOUND', 'No recipe found on this page', url);
          showError({
            code: 'ERR_NO_RECIPE_FOUND',
          });
          setLoading(false);
          return;
        }

        // Step 2: Parse recipe using unified AI-based parser
        const response = await recipeScrape(url);

        if (!response.success || response.error) {
          const errorCode = response.error?.code || 'ERR_NO_RECIPE_FOUND';
          errorLogger.log(errorCode, response.error?.message || 'Parsing failed', url);
          showError({
            code: errorCode,
            message: response.error?.message,
          });
          setLoading(false);
          return;
        }

        // Store parsed recipe
        const recipeToStore = {
          title: response.title,
          ingredients: response.ingredients,
          instructions: response.instructions,
          author: response.author,
          sourceUrl: response.sourceUrl || url,
          summary: response.summary,
          cuisine: response.cuisine,
          ...(response.servings !== undefined && { servings: response.servings }), // Include servings/yield if available
        };

        setParsedRecipe(recipeToStore);

        await new Promise((resolve) => setTimeout(resolve, 0));

        // Add to recent recipes
        const recipeSummary = Array.isArray(response.instructions)
          ? response.instructions
              .map((inst: any) => (typeof inst === 'string' ? inst : inst.detail))
              .join(' ')
              .slice(0, 140)
          : response.instructions.slice(0, 140);

        addRecipe({
          title: response.title,
          summary: recipeSummary,
          description: response.summary,
          url: url,
          ingredients: response.ingredients,
          instructions: response.instructions,
          author: response.author,
          sourceUrl: response.sourceUrl || url,
          cuisine: response.cuisine,
          ...(response.servings !== undefined && { servings: response.servings }), // Include servings/yield if available
        });

        // Add to search history
        addToSearchHistory(url, response.title);

        // Navigate to recipe page
        router.push('/parsed-recipe-page');
        setQuery('');
        setIsExpanded(false);
        setShowRecents(false);
      } catch (err) {
        console.error('[InlineSearch] Parse error:', err);
        errorLogger.log('ERR_UNKNOWN', 'An unexpected error occurred', url);
        showError({
          code: 'ERR_UNKNOWN',
          message: 'An unexpected error occurred. Please try again.',
        });
      } finally {
        setLoading(false);
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
    });
    router.push('/parsed-recipe-page');
    setQuery('');
    setIsExpanded(false);
    setShowRecents(false);
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
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showRecents || filteredRecipes.length === 0) {
      // Handle ESC to close
      if (e.key === 'Escape') {
        setIsExpanded(false);
        setShowRecents(false);
        setQuery('');
        setSelectedIndex(-1);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredRecipes.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredRecipes.length) {
          handleRecipeSelect(filteredRecipes[selectedIndex]);
        } else if (isUrl(query)) {
          handleParse(query);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsExpanded(false);
        setShowRecents(false);
        setQuery('');
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <>
      <LoadingAnimation isVisible={loading} />
      <div 
        ref={containerRef}
        className="relative flex-1 max-w-md"
      >
        <form onSubmit={handleSubmit}>
          <div
            className={`
              bg-stone-100 rounded-md border transition-all duration-200
              ${isExpanded 
                ? 'border-[#4F46E5] shadow-sm' 
                : 'border-stone-200 hover:border-stone-300'
              }
            `}
          >
            <div className="flex items-center px-3 py-2">
              {/* Search Icon */}
              <Search className="w-4 h-4 text-stone-600 flex-shrink-0" />

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                placeholder={isExpanded ? "Search recipes or enter URL..." : "Enter recipe URL..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                className="flex-1 ml-2 bg-transparent font-albert text-sm text-stone-800 placeholder:text-stone-500 focus:outline-none"
              />

              {/* Clear Button */}
              {query && (
                <button
                  type="button"
                  onClick={clearInput}
                  className="ml-2 p-1 hover:bg-stone-200 rounded transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-stone-600" />
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
          </div>
        </form>

        {/* Recent Recipes Dropdown - Progressive Disclosure */}
        {showRecents && filteredRecipes.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            <div className="p-2">
              {/* Show header if filtering */}
              {query.trim() && !isUrl(query) && (
                <div className="px-3 py-2 border-b border-stone-100">
                  <div className="font-albert text-xs font-medium text-stone-500 uppercase tracking-wide">
                    {filteredRecipes.length === 1 ? '1 recipe found' : `${filteredRecipes.length} recipes found`}
                  </div>
                </div>
              )}
              
              {/* Recipe Results */}
              {filteredRecipes.map((recipe, index) => (
                <button
                  key={recipe.id}
                  onClick={() => handleRecipeSelect(recipe)}
                  className={`
                    w-full text-left p-3 rounded-md transition-colors group
                    ${selectedIndex === index 
                      ? 'bg-[#4F46E5] text-white' 
                      : 'hover:bg-stone-50'
                    }
                  `}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={`font-albert font-medium text-sm truncate ${
                    selectedIndex === index ? 'text-white' : 'text-stone-800'
                  }`}>
                    {recipe.title}
                  </div>
                  <div className={`font-albert text-xs mt-1 line-clamp-1 ${
                    selectedIndex === index ? 'text-white/80' : 'text-stone-500'
                  }`}>
                    {recipe.summary || recipe.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - No results found */}
        {showRecents && query.trim() && !isUrl(query) && filteredRecipes.length === 0 && (
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


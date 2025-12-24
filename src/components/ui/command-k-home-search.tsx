'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import {
  getSearchHistory,
  clearSearchHistory,
  removeSearchHistoryItem,
  addToSearchHistory,
} from '@/lib/searchHistory';
import {
  recipeScrape,
  validateRecipeUrl,
} from '@/utils/recipe-parse';
import { useRecipeErrorHandler } from '@/hooks/useRecipeErrorHandler';
import { errorLogger } from '@/utils/errorLogger';
import { isUrl, getDomainFromUrl, fuzzyMatch } from '@/utils/searchUtils';
import { Search, X, Clock, Trash2, ExternalLink } from 'lucide-react';
import { ParsedRecipe, InstructionStep } from '@/lib/storage';
import LoadingAnimation from './loading-animation';
import Image from 'next/image';

interface CommandKHomeSearchProps {
  onClose: () => void;
}

/**
 * CommandKHomeSearch Component
 * 
 * Home page search interface showing:
 * - Recent recipes (from ParsedRecipesContext)
 * - Recent URL searches (from searchHistory)
 * - New URL input for parsing
 */
export default function CommandKHomeSearch({
  onClose,
}: CommandKHomeSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardShortcut, setKeyboardShortcut] = useState<string>('⌘K');
  const inputRef = useRef<HTMLInputElement>(null);

  const { recentRecipes: contextRecipes } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const { addRecipe } = useParsedRecipes();
  const { handle: handleError } = useRecipeErrorHandler();
  const router = useRouter();

  // Filter recipes and search history based on query
  const filteredRecipes = useMemo(() => {
    if (!query.trim() || isUrl(query)) {
      return contextRecipes.slice(0, 5);
    }
    const searchTerm = query.toLowerCase();
    return contextRecipes
      .filter(
        (recipe) =>
          fuzzyMatch(searchTerm, recipe.title) ||
          fuzzyMatch(searchTerm, recipe.summary || '') ||
          fuzzyMatch(searchTerm, recipe.description || ''),
      )
      .slice(0, 5);
  }, [contextRecipes, query]);

  const filteredSearchHistory = useMemo(() => {
    if (!query.trim() || isUrl(query)) {
      return getSearchHistory().slice(0, 10);
    }
    const searchTerm = query.toLowerCase();
    return getSearchHistory()
      .filter(
        (item) =>
          fuzzyMatch(searchTerm, item.url) ||
          fuzzyMatch(searchTerm, item.title || ''),
      )
      .slice(0, 10);
  }, [query]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Detect platform for keyboard shortcut display
  useEffect(() => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    setKeyboardShortcut(isMac ? '⌘K' : 'Ctrl+K');
  }, []);

  // Helper function to calculate total recipe time
  const calculateTotalTime = (recipe: ParsedRecipe): number | null => {
    if (!recipe.instructions || !Array.isArray(recipe.instructions)) return null;
    
    const totalMinutes = recipe.instructions.reduce((total, step) => {
      if (typeof step === 'object' && step.timeMinutes) {
        return total + step.timeMinutes;
      }
      return total;
    }, 0);
    
    return totalMinutes > 0 ? totalMinutes : null;
  };

  // Helper function to extract cuisine from URL or use placeholder
  const getCuisine = (recipe: ParsedRecipe): string => {
    // Try to extract from URL domain or use a placeholder
    // For now, we'll use a simple placeholder or extract from domain
    try {
      if (recipe.sourceUrl || recipe.url) {
        const url = recipe.sourceUrl || recipe.url;
        const domain = new URL(url).hostname.toLowerCase();
        // Simple cuisine detection based on domain
        if (domain.includes('indian') || domain.includes('curry')) return 'Indian';
        if (domain.includes('italian') || domain.includes('pasta')) return 'Italian';
        if (domain.includes('chinese') || domain.includes('asian')) return 'Asian';
        if (domain.includes('mexican') || domain.includes('taco')) return 'Mexican';
        if (domain.includes('french')) return 'French';
        if (domain.includes('mediterranean')) return 'Mediterranean';
      }
    } catch {
      // URL parsing failed
    }
    return 'Recipe'; // Default placeholder
  };

  // Handle URL parsing
  const handleParse = useCallback(
    async (url: string) => {
      if (!url.trim()) return;

      try {
        setLoading(true);

        // Validate URL
        const validUrlResponse = await validateRecipeUrl(url);

        if (!validUrlResponse.success) {
          const errorMessage = handleError(validUrlResponse.error.code);
          errorLogger.log(
            validUrlResponse.error.code,
            validUrlResponse.error.message,
            url,
          );
          console.error('Parse error:', errorMessage);
          return;
        }

        if (!validUrlResponse.isRecipe) {
          const errorMessage = handleError('ERR_NO_RECIPE_FOUND');
          errorLogger.log('ERR_NO_RECIPE_FOUND', 'No recipe found on this page', url);
          console.error('Parse error:', errorMessage);
          return;
        }

        // Parse recipe
        const response = await recipeScrape(url);

        if (!response.success || response.error) {
          const errorCode = response.error?.code || 'ERR_NO_RECIPE_FOUND';
          const errorMessage = handleError(errorCode);
          errorLogger.log(errorCode, response.error?.message || 'Parsing failed', url);
          console.error('Parse error:', errorMessage);
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
        });

        // Add to search history
        addToSearchHistory(url, response.title);

        // Navigate to recipe page
        router.push('/parsed-recipe-page');
        onClose();
      } catch (err) {
        console.error('[CommandK] Parse error:', err);
        errorLogger.log('ERR_UNKNOWN', 'An unexpected error occurred', url);
      } finally {
        setLoading(false);
      }
    },
    [setParsedRecipe, addRecipe, handleError, router, onClose],
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
    });
    router.push('/parsed-recipe-page');
    onClose();
  };

  // Handle URL history selection
  const handleUrlSelect = (url: string) => {
    handleParse(url);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUrl(query)) {
      handleParse(query);
    }
  };

  // Clear all search history
  const handleClearHistory = () => {
    if (window.confirm('Clear all search history?')) {
      clearSearchHistory();
    }
  };

  // Remove individual history item
  const handleRemoveHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSearchHistoryItem(id);
  };

  return (
    <>
      <LoadingAnimation isVisible={loading} />
      <div className="flex flex-col h-full">
        {/* Search Input */}
        <div className="p-4 border-b border-[#d9d9d9]">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 bg-stone-50 rounded-lg border border-[#d9d9d9] px-3 py-2.5 focus-within:border-[#4F46E5] focus-within:ring-1 focus-within:ring-[#4F46E5] transition-all">
              <Search className="w-4 h-4 text-stone-500 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search recipes..."
                className="flex-1 bg-transparent font-albert text-sm text-stone-800 placeholder:text-stone-500 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-stone-200 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-stone-500" />
                </button>
              )}
              {!query && (
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-albert text-stone-500 bg-white border border-[#d9d9d9] rounded">
                  {keyboardShortcut}
                </kbd>
              )}
            </div>
          </form>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Recent Recipes */}
          {filteredRecipes.length > 0 && (
            <div>
              <h3 className="font-albert font-medium text-xs text-stone-500 uppercase tracking-wide mb-3">
                {query.trim() && !isUrl(query) ? 'Matching Recipes' : 'Recent Recipes'}
              </h3>
              <div className="space-y-1">
                {filteredRecipes.map((recipe) => {
                  const totalTime = calculateTotalTime(recipe);
                  const cuisine = getCuisine(recipe);
                  const author = recipe.author || 'Recipe';
                  
                  return (
                    <button
                      key={recipe.id}
                      onClick={() => handleRecipeSelect(recipe)}
                      className="w-full text-left p-3 rounded-lg hover:bg-stone-50 transition-colors group flex items-center gap-3"
                    >
                      {/* Recipe Image */}
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-stone-200">
                        {recipe.imageUrl ? (
                          <Image
                            src={recipe.imageUrl}
                            alt={recipe.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
                            <span className="text-stone-400 font-albert text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Recipe Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-albert font-semibold text-sm text-stone-900 truncate">
                          {recipe.title}
                        </div>
                        <div className="font-albert text-xs text-stone-600 mt-0.5">
                          {author} · {cuisine}
                        </div>
                      </div>
                      
                      {/* Time */}
                      {totalTime && (
                        <div className="flex-shrink-0 font-albert text-xs text-stone-500">
                          {totalTime} min
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent URL Searches */}
          {filteredSearchHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-albert font-medium text-xs text-stone-500 uppercase tracking-wide">
                  {query.trim() && !isUrl(query) ? 'Matching Searches' : 'Recent Searches'}
                </h3>
                {!query.trim() && (
                  <button
                    onClick={handleClearHistory}
                    className="font-albert text-xs text-stone-500 hover:text-stone-700 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {filteredSearchHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleUrlSelect(item.url)}
                    className="w-full text-left p-3 rounded-lg hover:bg-stone-50 transition-colors group relative"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-albert font-medium text-sm text-stone-800 truncate">
                          {item.title || getDomainFromUrl(item.url)}
                        </div>
                        <div className="font-albert text-xs text-stone-500 truncate mt-0.5">
                          {item.url}
                        </div>
                        <div className="font-albert text-xs text-stone-400 mt-1">
                          {new Date(item.searchedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400 opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                    <button
                      onClick={(e) => handleRemoveHistoryItem(item.id, e)}
                      className="absolute top-2 right-2 p-1 opacity-0 md:group-hover:opacity-100 md:opacity-100 hover:bg-stone-200 rounded transition-all"
                      aria-label="Remove"
                    >
                      <X className="w-3 h-3 text-stone-500" />
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredRecipes.length === 0 && filteredSearchHistory.length === 0 && (
            <div className="text-center py-12">
              {query.trim() && !isUrl(query) ? (
                <>
                  <p className="font-albert text-sm text-stone-500">
                    No results found for "{query}"
                  </p>
                  <p className="font-albert text-xs text-stone-400 mt-2">
                    Try a different search term or enter a recipe URL above
                  </p>
                </>
              ) : (
                <>
                  <p className="font-albert text-sm text-stone-500">
                    No recent recipes or searches
                  </p>
                  <p className="font-albert text-xs text-stone-400 mt-2">
                    Enter a recipe URL above to get started
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}


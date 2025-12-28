'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { addToSearchHistory } from '@/lib/searchHistory';
import {
  recipeScrape,
  validateRecipeUrl,
} from '@/utils/recipe-parse';
import { useToast } from '@/hooks/useToast';
import { errorLogger } from '@/utils/errorLogger';
import { isUrl } from '@/utils/searchUtils';
import { Search, X } from 'lucide-react';
import { ParsedRecipe } from '@/lib/storage';
import LoadingAnimation from './loading-animation';

interface CommandKHomeSearchProps {
  onClose: () => void;
}

/**
 * CommandKHomeSearch Component
 * 
 * Home page search interface showing:
 * - Recent recipes (from ParsedRecipesContext)
 * - New URL input for parsing
 */
export default function CommandKHomeSearch({
  onClose,
}: CommandKHomeSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentRecipes, setRecentRecipes] = useState<ParsedRecipe[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { recentRecipes: contextRecipes } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const { addRecipe } = useParsedRecipes();
  const { showError, showInfo } = useToast();
  const router = useRouter();

  // Load recent recipes
  useEffect(() => {
    setRecentRecipes(contextRecipes.slice(0, 5)); // Show last 5 recipes
  }, [contextRecipes]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Handle URL parsing
  const handleParse = useCallback(
    async (url: string) => {
      if (!url.trim()) return;

      try {
        setLoading(true);

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
        console.log('[Client CommandK] 🍽️ Received cuisine data from API:', {
          cuisine: response.cuisine,
          hasCuisine: !!response.cuisine,
          cuisineCount: response.cuisine?.length || 0,
        });
        
        const recipeToStore = {
          title: response.title,
          ingredients: response.ingredients,
          instructions: response.instructions,
          author: response.author,
          sourceUrl: response.sourceUrl || url,
          summary: response.summary,
          cuisine: response.cuisine, // Include cuisine tags if available
        };

        console.log('[Client CommandK] 🍽️ Storing recipe with cuisine:', recipeToStore.cuisine || 'none');
        setParsedRecipe(recipeToStore);

        await new Promise((resolve) => setTimeout(resolve, 0));

        // Add to recent recipes
        const recipeSummary = Array.isArray(response.instructions)
          ? response.instructions
              .map((inst: any) => (typeof inst === 'string' ? inst : inst.detail))
              .join(' ')
              .slice(0, 140)
          : response.instructions.slice(0, 140);

        console.log('[Client CommandK] 🍽️ Adding recipe to recent recipes with cuisine:', response.cuisine || 'none');
        addRecipe({
          title: response.title,
          summary: recipeSummary,
          description: response.summary,
          url: url,
          ingredients: response.ingredients,
          instructions: response.instructions,
          author: response.author,
          sourceUrl: response.sourceUrl || url,
          cuisine: response.cuisine, // Include cuisine tags if available
        });

        // Add to search history
        addToSearchHistory(url, response.title);

        // Navigate to recipe page
        router.push('/parsed-recipe-page');
        onClose();
      } catch (err) {
        console.error('[CommandK] Parse error:', err);
        errorLogger.log('ERR_UNKNOWN', 'An unexpected error occurred', url);
        showError({
          code: 'ERR_UNKNOWN',
          message: 'An unexpected error occurred. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    },
    [setParsedRecipe, addRecipe, showError, showInfo, router, onClose],
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
      cuisine: recipe.cuisine, // Include cuisine tags if available
    });
    router.push('/parsed-recipe-page');
    onClose();
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUrl(query)) {
      handleParse(query);
    }
  };

  return (
    <>
      <LoadingAnimation isVisible={loading} />
      <div className="flex flex-col h-full">
        {/* Close Button */}
        <div className="flex items-center justify-end p-4 border-b border-[#d9d9d9]">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-stone-600" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-[#d9d9d9]">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 bg-stone-50 rounded-lg border border-[#d9d9d9] px-3 py-2 focus-within:border-[#4F46E5] focus-within:ring-1 focus-within:ring-[#4F46E5] transition-all">
              <Search className="w-4 h-4 text-stone-500 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter recipe URL..."
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
            </div>
          </form>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Recent Recipes */}
          {recentRecipes.length > 0 && (
            <div>
              <h3 className="font-albert font-medium text-xs text-stone-500 uppercase tracking-wide mb-3">
                Recent Recipes
              </h3>
              <div className="space-y-1">
                {recentRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleRecipeSelect(recipe)}
                    className="w-full text-left p-3 rounded-lg hover:bg-stone-50 transition-colors group"
                  >
                    <div className="font-albert font-medium text-sm text-stone-800 truncate">
                      {recipe.title}
                    </div>
                    <div className="font-albert text-xs text-stone-500 mt-1 line-clamp-1">
                      {recipe.summary}
                    </div>
                    <div className="font-albert text-xs text-stone-400 mt-1">
                      {new Date(recipe.parsedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}


          {/* Empty State */}
          {recentRecipes.length === 0 && (
            <div className="text-center py-12">
              <p className="font-albert text-sm text-stone-500">
                No recent recipes
              </p>
              <p className="font-albert text-xs text-stone-400 mt-2">
                Enter a recipe URL above to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}


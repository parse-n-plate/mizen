'use client';
import { useState, useRef, useEffect } from 'react';
import {
  parseIngredients,
  parseInstructions,
  recipeScrape,
  validateRecipeUrl,
  fetchHtml,
} from '@/utils/recipe-parse';
import { useRouter } from 'next/navigation';
import { useRecipe } from '@/contexts/RecipeContext';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipeErrorHandler } from '@/hooks/useRecipeErrorHandler';
import { errorLogger } from '@/utils/errorLogger';
import { Search, X } from 'lucide-react';
import LoadingAnimation from './loading-animation';

interface SearchFormProps {
  setErrorAction: (error: boolean) => void;
  setErrorMessage?: (message: string) => void;
  initialUrl?: string;
}

export default function SearchForm({
  setErrorAction,
  setErrorMessage,
  initialUrl = '',
}: SearchFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { setParsedRecipe } = useRecipe();
  const { addRecipe } = useParsedRecipes();
  const { handle: handleError } = useRecipeErrorHandler();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle focus state for animation
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Only blur if there's no text and we're not loading
    if (!url.trim() && !loading) {
      setIsFocused(false);
    }
  };

  // Keep focused state when there's text
  useEffect(() => {
    if (url.trim()) {
      setIsFocused(true);
    }
  }, [url]);

  // Handle initialUrl from navbar
  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
      setIsFocused(true);
      // Auto-trigger parsing after a short delay
      setTimeout(() => {
        handleParse();
      }, 500);
    }
  }, [initialUrl]);

  const handleParse = async () => {
    if (!url.trim()) return;

    try {
      setLoading(true);
      setErrorAction(false);
      if (setErrorMessage) setErrorMessage('');

      // Step 1: Validate if URL contains a recipe or not
      const validUrlResponse = await validateRecipeUrl(url);

      if (!validUrlResponse.success) {
        const errorMessage = handleError(validUrlResponse.error.code);
        errorLogger.log(
          validUrlResponse.error.code,
          validUrlResponse.error.message,
          url,
        );
        setErrorAction(true);
        if (setErrorMessage) setErrorMessage(errorMessage);
        return;
      }

      if (!validUrlResponse.isRecipe) {
        const errorMessage = handleError('ERR_NO_RECIPE_FOUND');
        errorLogger.log(
          'ERR_NO_RECIPE_FOUND',
          'No recipe found on this page',
          url,
        );
        setErrorAction(true);
        if (setErrorMessage) setErrorMessage(errorMessage);
        return;
      }

      // Step 2: Scrape with Python
      let scrapedData = await recipeScrape(url);

      // Debug: Log what the Python scraper returned
      console.log('Python scraper response:', scrapedData);

      // Step 3: Parse with AI if python script fails to parse
      if (
        scrapedData.error ||
        !scrapedData.ingredients ||
        scrapedData.ingredients.length === 0
      ) {
        console.log('Python scraper failed, falling back to AI parsing...');

        // Proceed with the rest of steps only if URL was valid
        const htmlRes = await fetchHtml(url);

        if (!htmlRes.success) {
          const errorMessage = handleError(htmlRes.error.code);
          errorLogger.log(htmlRes.error.code, htmlRes.error.message, url);
          setErrorAction(true);
          if (setErrorMessage) setErrorMessage(errorMessage);
          return;
        }

        // Step 3.1: Parse ingredients with AI
        const aiParsedIngredients = await parseIngredients(htmlRes.html);

        if (!aiParsedIngredients.success) {
          const errorMessage = handleError(aiParsedIngredients.error.code);
          errorLogger.log(
            aiParsedIngredients.error.code,
            aiParsedIngredients.error.message,
            url,
          );
          setErrorAction(true);
          if (setErrorMessage) setErrorMessage(errorMessage);
          return;
        }

        // Step 3.2: Parse instructions with AI
        const aiParsedInstructions = await parseInstructions(htmlRes.html);

        if (!aiParsedInstructions.success) {
          const errorMessage = handleError(aiParsedInstructions.error.code);
          errorLogger.log(
            aiParsedInstructions.error.code,
            aiParsedInstructions.error.message,
            url,
          );
          setErrorAction(true);
          if (setErrorMessage) setErrorMessage(errorMessage);
          return;
        }

        // Stitch final scrapedData format
        scrapedData = {
          title: aiParsedIngredients.data[0],
          ingredients: aiParsedIngredients.data[1],
          instructions: Array.isArray(aiParsedInstructions.data)
            ? aiParsedInstructions.data
            : [aiParsedInstructions.data],
        };
      }

      // Step 3: Store in context and redirect
      setParsedRecipe({
        title: scrapedData.title,
        ingredients: scrapedData.ingredients,
        instructions: scrapedData.instructions,
      });

      // Step 4: Add to recent recipes
      const recipeSummary = Array.isArray(scrapedData.instructions)
        ? scrapedData.instructions.join(' ').slice(0, 140)
        : scrapedData.instructions.slice(0, 140);

      addRecipe({
        title: scrapedData.title,
        summary: recipeSummary,
        url: url,
        ingredients: scrapedData.ingredients,
        instructions: scrapedData.instructions,
      });

      // Step 5: Redirect to the parsed recipe page
      router.push('/parsed-recipe-page');
    } catch (err) {
      console.error('Parse error:', err);
      errorLogger.log(
        'ERR_UNKNOWN',
        'An unexpected error occurred during parsing',
        url,
      );
      setErrorAction(true);
      if (setErrorMessage)
        setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleParse();
    }
  };

  const clearInput = () => {
    setUrl('');
    setIsFocused(false);
    // Focus back to input after clearing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <>
      <LoadingAnimation isVisible={loading} />
      <div className="relative">
        {/* New animated search bar design */}
        <div
          className={`
            bg-stone-100 rounded-[9999px] border border-[#d9d9d9] 
            transition-all duration-300 ease-in-out
            hover:border-[#FFA423] hover:border-opacity-80
            ${isFocused ? 'shadow-sm' : ''}
          `}
        >
          <div className="flex items-center px-4 py-4 relative">
            {/* Search Icon - always visible */}
            <Search className="w-4 h-4 text-stone-600 flex-shrink-0" />

            {/* Input Container with smooth animation */}
            <div className="flex-1 ml-2 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={isFocused ? '' : 'Enter recipe URL here'}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={`
                  w-full bg-transparent font-albert text-[14px] text-stone-600 
                  placeholder:text-stone-600 focus:outline-none border-none
                  transition-all duration-300 ease-in-out
                  ${isFocused ? 'text-left' : 'text-center'}
                `}
                disabled={loading}
              />
            </div>

            {/* X Button - appears when there's text */}
            {url && (
              <button
                onClick={clearInput}
                className="ml-2 p-1 hover:bg-stone-200 rounded-full transition-all duration-200 flex-shrink-0"
                disabled={loading}
              >
                <X className="w-4 h-4 text-stone-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

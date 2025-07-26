'use client';
import { useState } from 'react';
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
}

export default function SearchForm({
  setErrorAction,
  setErrorMessage,
}: SearchFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { setParsedRecipe } = useRecipe();
  const { addRecipe } = useParsedRecipes();
  const { handle: handleError } = useRecipeErrorHandler();
  const router = useRouter();

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
  };

  return (
    <>
      <LoadingAnimation isVisible={loading} />
      <div className="relative">
        <div className="bg-white rounded-full border border-[#d9d9d9] flex items-center px-4 py-3">
          <Search className="w-4 h-4 text-[#1e1e1e] mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Enter recipe URL here"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent font-albert text-[14px] text-[#1e1e1e] placeholder:text-[#1e1e1e] focus:outline-none border-none"
            disabled={loading}
          />
          {url && (
            <button
              onClick={clearInput}
              className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-[#1e1e1e]" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

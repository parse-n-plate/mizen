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
import { Search, X } from 'lucide-react';
import LoadingAnimation from './loading-animation';

interface SearchFormProps {
  setErrorAction: (error: boolean) => void;
}

export default function SearchForm({ setErrorAction }: SearchFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { setParsedRecipe } = useRecipe();
  const { addRecipe } = useParsedRecipes();
  const router = useRouter();

  const handleParse = async () => {
    if (!url.trim()) return;

    try {
      setLoading(true);

      // Step 1: Validate if URL is contains a recipe or not
      const validUrl = await validateRecipeUrl(url);

      if (!validUrl) {
        setErrorAction(true);
        throw new Error('Invalid URL: ' + url);
      }

      // Step 2: Scrape with Python
      let scrapedData = await recipeScrape(url);

      // Debug: Log what the Python scraper returned
      console.log('Python scraper response:', scrapedData);

      // Step 3: Parse with AI if python script fails to parse
      if (scrapedData.error || scrapedData.ingredients.length === 0) {
        console.log('Python scraper failed, falling back to AI parsing...');

        // Proceed with the rest of steps only if URL was valid
        const htmlRes = await fetchHtml(url);

        // Step 3.1: Parse ingredients with AI
        const aiParsedIngredients = await parseIngredients(htmlRes.html);

        // Step 3.2: Parse instructions with AI
        const aiParsedInstructions = await parseInstructions(htmlRes.html);

        if (!htmlRes || !aiParsedIngredients || !aiParsedInstructions) {
          setErrorAction(true);
          throw new Error('Error parsing recipe. Please try again.');
        }

        // Stitch final scrapedData format
        scrapedData = {
          title: aiParsedIngredients[0],
          ingredients: aiParsedIngredients[1],
          instructions: Array.isArray(aiParsedInstructions)
            ? aiParsedInstructions
            : [aiParsedInstructions],
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
      setErrorAction(true);
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

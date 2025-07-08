'use client';
import { Button } from '@/components/ui/button';
import { MoveRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { parseIngredients, recipeScrape, validateRecipeUrl, fetchHtml } from '@/utils/recipe-parse';
import { useRouter } from 'next/navigation';
import { useRecipe } from '@/contexts/RecipeContext';

interface SearchFormProps {
  setErrorAction: (error: boolean) => void;
}

export default function SearchForm({ setErrorAction }: SearchFormProps) {
  const [ url, setUrl ] = useState('');
  const [ loading, setLoading ] = useState(false);
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();

  const handleParse = async () => {
    try {
      setLoading(true);

      // Step 1: Validate if URL is contains a recipe or not
      const validUrl = await validateRecipeUrl(url);

      if (!validUrl) {
        setErrorAction(true);
        throw new Error('Invalid URL: ' + url);
      }

      // Step 2: Scrape with Python
      const scrapedData = await recipeScrape(url);
      console.log('Scraped Recipe:', scrapedData);

      // Step 3: Parse with AI if python script fails to parse
      if (scrapedData.error || scrapedData.ingredients.length === 0) {
        console.log("RUN PARSING THROUGH AI")
        // Proceed with the rest of steps only if URL was valid

        const htmlRes = await fetchHtml(url);
        // console.log('HTML:', htmlRes.html);
        // Step 2: Parse ingredients with AI
        const aiResult = await parseIngredients(htmlRes.html);
        console.log('AI Parsed Ingredients:', aiResult);
      }

      // Step 3: Store in context and redirect
      setParsedRecipe({
        title: scrapedData.title,
        ingredients: scrapedData.ingredients,
        instructions: scrapedData.instructions,
      });

      // Step 4: Redirect to the parsed recipe page
      router.push('/parsed-recipe-page');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 w-full">
      <Input
        type="string"
        placeholder="Enter recipe URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Button
        className="bg-yellow-400 hover:bg-yellow-300 cursor-pointer active:scale-90 transition"
        onClick={handleParse}
        disabled={loading}
      >
        {loading ? 'Processing...' : <MoveRight color="black" />}
      </Button>
    </div>
  );
}

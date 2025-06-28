'use client'
import {Button} from "@/components/ui/button";
import {MoveRight} from "lucide-react";
import {Input} from "@/components/ui/input";
import {useState} from "react";
import {parseIngredients, recipeScrape} from "@/functions/recipe-parse";
import { useRouter } from "next/navigation";
import {useRecipe} from "@/contexts/RecipeContext";

export default function SearchForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipeData, setRecipeData] = useState();
  const [ingredients, setIngredients] = useState();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();


  const handleParse = async () => {
    try {
      // setLoading(true)
      // const scrapedRecipe = await recipeScrape(url);
      // setRecipeData(scrapedRecipe);
      // const parsedIngredients = await parseIngredients(scrapedRecipe.ingredients);
      // setIngredients(parsedIngredients);
      setLoading(true);
      console.log("Starting recipe parsing for:", url);

      // Step 1: Scrape with Python
      const scrapedData = await recipeScrape(url);
      console.log("Scraped Recipe:", scrapedData);

      // Step 2: Parse ingredients with AI
      const aiResult = await parseIngredients(scrapedData.ingredients);
      console.log("AI Parsed Ingredients:", aiResult);

      // Step 3: Store in context and redirect
      setParsedRecipe({
        title: scrapedData.title,
        ingredients: scrapedData.ingredients,
        instructions: scrapedData.instructions,
      });

      // Step 4: Redirect to the parsed recipe page
      router.push('/parsed-recipe-page');
    } catch (err) {
      console.error(err)
      alert("Error parsing recipe")
    } finally {
      setLoading(false)
    }
  }

  return(
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
        {loading ? "Processing..." : <MoveRight color="black"/>}
      </Button>
    </div>
  )
}
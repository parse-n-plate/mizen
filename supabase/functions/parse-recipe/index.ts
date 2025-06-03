
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Recipe {
  title: string;
  image?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
  ingredients: string[];
  instructions: string[];
  source?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Parsing recipe from URL:', url);
    
    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      throw new Error('Invalid URL format');
    }

    // Enhanced fetch with better error handling and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    let response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal,
        redirect: 'follow'
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout - the website took too long to respond');
      }
      
      // Try with a simpler fetch as fallback
      try {
        console.log('Trying fallback fetch...');
        response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
          }
        });
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        throw new Error(`Unable to fetch the webpage. The site may be blocking automated requests or experiencing issues.`);
      }
    }
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recipe page: ${response.status} ${response.statusText}`);
    }

    const htmlContent = await response.text();
    console.log('HTML content length:', htmlContent.length);

    if (htmlContent.length < 100) {
      throw new Error('Retrieved content is too short - the page may not have loaded properly');
    }

    // Parse the HTML content to extract recipe data
    const recipe = parseRecipeFromHtml(htmlContent, url);
    
    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Recipe parsing error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to parse recipe. Please check the URL and try again.',
        details: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function parseRecipeFromHtml(htmlContent: string, url: string): Recipe {
  console.log('Starting multi-stage parsing process...');
  
  // Stage 1: Try JSON-LD structured data (most reliable)
  console.log('Stage 1: Parsing JSON-LD structured data...');
  const structuredRecipe = parseStructuredData(htmlContent, url);
  if (structuredRecipe && structuredRecipe.ingredients.length > 0 && structuredRecipe.instructions.length > 0) {
    console.log('✅ Successfully parsed using JSON-LD structured data');
    return structuredRecipe;
  }

  // Stage 2: Try Microdata parsing
  console.log('Stage 2: Parsing Microdata...');
  const microdataRecipe = parseMicrodata(htmlContent, url);
  if (microdataRecipe && microdataRecipe.ingredients.length > 0 && microdataRecipe.instructions.length > 0) {
    console.log('✅ Successfully parsed using Microdata');
    return microdataRecipe;
  }

  // Stage 3: Enhanced CSS selector parsing
  console.log('Stage 3: Enhanced CSS selector parsing...');
  const cssRecipe = parseWithEnhancedSelectors(htmlContent, url);
  if (cssRecipe && cssRecipe.ingredients.length > 0 && cssRecipe.instructions.length > 0) {
    console.log('✅ Successfully parsed using CSS selectors');
    return cssRecipe;
  }

  // Stage 4: Semantic HTML parsing
  console.log('Stage 4: Semantic HTML parsing...');
  const semanticRecipe = parseSemanticHtml(htmlContent, url);
  if (semanticRecipe && semanticRecipe.ingredients.length > 0 && semanticRecipe.instructions.length > 0) {
    console.log('✅ Successfully parsed using semantic HTML');
    return semanticRecipe;
  }

  // Stage 5: Content-based heuristics (last resort)
  console.log('Stage 5: Content-based heuristics...');
  const heuristicRecipe = parseWithHeuristics(htmlContent, url);
  console.log('⚠️ Using heuristic parsing results');
  return heuristicRecipe;
}

function parseStructuredData(htmlContent: string, url: string): Recipe | null {
  const jsonLdMatches = htmlContent.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  
  if (!jsonLdMatches) return null;

  for (const match of jsonLdMatches) {
    try {
      const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      const jsonData = JSON.parse(jsonContent);
      
      // Handle different JSON-LD structures
      const items = Array.isArray(jsonData) ? jsonData : 
                   jsonData['@graph'] ? jsonData['@graph'] : [jsonData];
      
      for (const item of items) {
        if (item['@type'] === 'Recipe' || 
            (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
          return parseRecipeFromStructuredItem(item, url);
        }
        
        // Check for nested recipe in other schema types
        if (item.mainEntity && item.mainEntity['@type'] === 'Recipe') {
          return parseRecipeFromStructuredItem(item.mainEntity, url);
        }
      }
    } catch (e) {
      console.log('Failed to parse JSON-LD:', e);
      continue;
    }
  }
  return null;
}

function parseRecipeFromStructuredItem(data: any, url: string): Recipe {
  const getTextContent = (item: any): string => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      return item.text || item['@value'] || item.name || '';
    }
    return '';
  };

  const getDuration = (duration: any): string => {
    if (!duration) return '';
    if (typeof duration === 'string') {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
      if (match) {
        const hours = match[1] ? parseInt(match[1]) : 0;
        const minutes = match[2] ? parseInt(match[2]) : 0;
        if (hours && minutes) return `${hours}h ${minutes}m`;
        if (hours) return `${hours}h`;
        if (minutes) return `${minutes}m`;
      }
    }
    return getTextContent(duration);
  };

  const ingredients = (data.recipeIngredient || []).map((ing: any) => getTextContent(ing));
  const instructions = (data.recipeInstructions || []).map((instruction: any) => {
    if (typeof instruction === 'string') return instruction;
    return getTextContent(instruction.text || instruction.name || instruction);
  });

  return {
    title: getTextContent(data.name) || 'Untitled Recipe',
    image: data.image?.[0]?.url || data.image?.url || data.image,
    prepTime: getDuration(data.prepTime),
    cookTime: getDuration(data.cookTime),
    totalTime: getDuration(data.totalTime),
    servings: data.recipeYield ? String(data.recipeYield) : undefined,
    ingredients: ingredients.filter((ing: string) => ing.trim().length > 0),
    instructions: instructions.filter((inst: string) => inst.trim().length > 0),
    source: url
  };
}

function parseMicrodata(htmlContent: string, url: string): Recipe | null {
  // Look for microdata Recipe schema
  const recipeMatch = htmlContent.match(/<[^>]*itemtype[^>]*schema\.org\/Recipe[^>]*>/i);
  if (!recipeMatch) return null;

  const extractMicrodataProperty = (property: string): string[] => {
    const regex = new RegExp(`<[^>]*itemprop=["']${property}["'][^>]*>([^<]*)</`, 'gi');
    const matches = [...htmlContent.matchAll(regex)];
    return matches.map(match => match[1].trim()).filter(text => text.length > 0);
  };

  const ingredients = extractMicrodataProperty('recipeIngredient');
  const instructions = extractMicrodataProperty('recipeInstruction');
  const title = extractMicrodataProperty('name')[0] || 'Untitled Recipe';

  if (ingredients.length === 0 && instructions.length === 0) return null;

  return {
    title,
    ingredients: ingredients.length > 0 ? ingredients : ['No ingredients found'],
    instructions: instructions.length > 0 ? instructions : ['No instructions found'],
    source: url
  };
}

function parseWithEnhancedSelectors(htmlContent: string, url: string): Recipe | null {
  console.log('Trying enhanced CSS selectors...');
  
  // Comprehensive ingredient patterns for major recipe sites
  const ingredientSelectors = [
    // AllRecipes
    'span[class*="ingredients-item-name"]',
    'span[class*="recipe-summary__item"]',
    'li[class*="mntl-structured-ingredients__list-item"]',
    // Food Network
    'section[class*="o-RecipeIngredients"] li',
    'div[class*="o-RecipeIngredients__a-Ingredient"]',
    // Bon Appétit
    'div[data-testid="IngredientList"] li',
    'div[class*="ingredient"] p',
    // Serious Eats
    'li[class*="structured-ingredients__list-item"]',
    'div[class*="ingredient-amount"]',
    // NYT Cooking
    'span[class*="ingredient-name"]',
    'li[class*="recipe-ingredients"]',
    // BBC Good Food
    'li[class*="pb-xxs"]',
    'section[class*="recipe-ingredients"] li',
    // Generic patterns
    'li[class*="ingredient"]',
    'div[class*="ingredient"]',
    'p[class*="ingredient"]',
    'span[class*="ingredient"]',
    // Data attributes
    'li[data-ingredient]',
    'div[data-ingredient]'
  ];

  const instructionSelectors = [
    // AllRecipes
    'div[class*="mntl-sc-block-html"] p',
    'li[class*="mntl-sc-block-html"]',
    'div[class*="recipe-instruction"]',
    // Food Network
    'section[class*="o-Method"] li',
    'div[class*="o-Method__a-Step"]',
    // Bon Appétit
    'div[data-testid="InstructionList"] li',
    'div[class*="instruction"] p',
    // Serious Eats
    'li[class*="mntl-sc-block-html"]',
    'div[class*="recipe-procedure-text"]',
    // NYT Cooking
    'li[class*="recipe-instructions"]',
    'ol[class*="recipe-instructions"] li',
    // BBC Good Food
    'li[class*="pb-xs"]',
    'section[class*="recipe-method"] li',
    // Generic patterns
    'li[class*="instruction"]',
    'li[class*="step"]',
    'div[class*="instruction"]',
    'div[class*="step"]',
    'p[class*="step"]',
    'ol[class*="recipe"] li',
    'ul[class*="recipe"] li'
  ];

  let ingredients: string[] = [];
  let instructions: string[] = [];

  // Try ingredient selectors
  for (const selector of ingredientSelectors) {
    const pattern = new RegExp(`<[^>]*class="[^"]*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '[^"]*')}[^"]*"[^>]*>([^<]+)</`, 'gi');
    const matches = [...htmlContent.matchAll(pattern)];
    if (matches.length > 0) {
      ingredients = matches.map(match => match[1].trim()).filter(text => text.length > 0 && text.length < 200);
      if (ingredients.length >= 3) {
        console.log(`Found ${ingredients.length} ingredients using selector pattern`);
        break;
      }
    }
  }

  // Try instruction selectors
  for (const selector of instructionSelectors) {
    const pattern = new RegExp(`<[^>]*class="[^"]*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '[^"]*')}[^"]*"[^>]*>([^<]+)</`, 'gi');
    const matches = [...htmlContent.matchAll(pattern)];
    if (matches.length > 0) {
      instructions = matches.map(match => match[1].trim()).filter(text => text.length > 10 && text.length < 1000);
      if (instructions.length >= 2) {
        console.log(`Found ${instructions.length} instructions using selector pattern`);
        break;
      }
    }
  }

  const title = extractTitle(htmlContent);

  if (ingredients.length === 0 && instructions.length === 0) return null;

  return {
    title,
    image: extractImage(htmlContent),
    ingredients: ingredients.length > 0 ? ingredients : ['No ingredients found'],
    instructions: instructions.length > 0 ? instructions : ['No instructions found'],
    source: url
  };
}

function parseSemanticHtml(htmlContent: string, url: string): Recipe | null {
  console.log('Trying semantic HTML parsing...');
  
  // Look for lists that might contain ingredients or instructions
  const listMatches = htmlContent.match(/<ul[^>]*>([\s\S]*?)<\/ul>/gi) || [];
  const orderedListMatches = htmlContent.match(/<ol[^>]*>([\s\S]*?)<\/ol>/gi) || [];
  
  let ingredients: string[] = [];
  let instructions: string[] = [];
  
  // Parse unordered lists (typically ingredients)
  for (const listMatch of listMatches) {
    const listItems = [...listMatch.matchAll(/<li[^>]*>([^<]+)<\/li>/gi)]
      .map(match => match[1].trim())
      .filter(text => text.length > 0);
    
    if (listItems.length >= 3 && isLikelyIngredientList(listItems)) {
      ingredients = listItems;
      break;
    }
  }
  
  // Parse ordered lists (typically instructions)
  for (const listMatch of orderedListMatches) {
    const listItems = [...listMatch.matchAll(/<li[^>]*>([^<]+)<\/li>/gi)]
      .map(match => match[1].trim())
      .filter(text => text.length > 10);
    
    if (listItems.length >= 2 && isLikelyInstructionList(listItems)) {
      instructions = listItems;
      break;
    }
  }

  if (ingredients.length === 0 && instructions.length === 0) return null;

  return {
    title: extractTitle(htmlContent),
    image: extractImage(htmlContent),
    ingredients: ingredients.length > 0 ? ingredients : ['No ingredients found'],
    instructions: instructions.length > 0 ? instructions : ['No instructions found'],
    source: url
  };
}

function parseWithHeuristics(htmlContent: string, url: string): Recipe {
  console.log('Using content-based heuristics...');
  
  // Extract all text content and analyze it
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const sentences = textContent.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  
  const ingredients: string[] = [];
  const instructions: string[] = [];
  
  // Common ingredient indicators
  const ingredientKeywords = /\b(cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|tbsp|tsp|ounce|ounces|oz|pound|pounds|lb|lbs|gram|grams|g|kilogram|kg|liter|liters|ml|milliliter)\b/i;
  
  // Common instruction indicators
  const instructionKeywords = /\b(heat|cook|bake|mix|stir|add|combine|place|remove|serve|preheat|season|slice|chop|dice|mince)\b/i;
  
  for (const sentence of sentences) {
    if (sentence.length < 200 && ingredientKeywords.test(sentence)) {
      ingredients.push(sentence);
    } else if (sentence.length > 20 && sentence.length < 500 && instructionKeywords.test(sentence)) {
      instructions.push(sentence);
    }
  }

  return {
    title: extractTitle(htmlContent),
    image: extractImage(htmlContent),
    ingredients: ingredients.length > 0 ? ingredients.slice(0, 20) : ['No ingredients found'],
    instructions: instructions.length > 0 ? instructions.slice(0, 15) : ['No instructions found'],
    source: url
  };
}

function isLikelyIngredientList(items: string[]): boolean {
  const ingredientKeywords = /\b(cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|tbsp|tsp|ounce|ounces|oz|pound|pounds|lb|lbs)\b/i;
  const matchingItems = items.filter(item => ingredientKeywords.test(item));
  return matchingItems.length / items.length > 0.3; // At least 30% should contain measurement words
}

function isLikelyInstructionList(items: string[]): boolean {
  const instructionKeywords = /\b(heat|cook|bake|mix|stir|add|combine|place|remove|serve|preheat)\b/i;
  const matchingItems = items.filter(item => instructionKeywords.test(item));
  return matchingItems.length / items.length > 0.4; // At least 40% should contain action words
}

function extractTitle(htmlContent: string): string {
  const titlePatterns = [
    /<title[^>]*>([^<]+)</i,
    /<h1[^>]*class="[^"]*recipe[^"]*"[^>]*>([^<]+)</i,
    /<h1[^>]*>([^<]+)</i,
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = htmlContent.match(pattern);
    if (match) {
      return match[1].trim().replace(/\s*\|\s*.*$/, ''); // Remove site name after |
    }
  }
  
  return 'Untitled Recipe';
}

function extractImage(htmlContent: string): string | undefined {
  const imagePatterns = [
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<img[^>]*class="[^"]*recipe[^"]*"[^>]*src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']*recipe[^"']*)["']/i,
    /<img[^>]*class="[^"]*featured[^"]*"[^>]*src=["']([^"']+)["']/i
  ];
  
  for (const pattern of imagePatterns) {
    const match = htmlContent.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return undefined;
}

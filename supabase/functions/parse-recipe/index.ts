
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
  // Try to find JSON-LD structured data first (most reliable)
  const jsonLdMatches = htmlContent.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
        const jsonData = JSON.parse(jsonContent);
        const recipes = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        for (const item of recipes) {
          if (item['@type'] === 'Recipe' || (item['@graph'] && item['@graph'].some((g: any) => g['@type'] === 'Recipe'))) {
            const recipeData = item['@type'] === 'Recipe' ? item : item['@graph'].find((g: any) => g['@type'] === 'Recipe');
            if (recipeData) {
              console.log('Found structured recipe data');
              return parseStructuredData(recipeData, url);
            }
          }
        }
      } catch (e) {
        console.log('Failed to parse JSON-LD:', e);
        continue;
      }
    }
  }

  // Fallback to HTML parsing if no structured data found
  console.log('No structured data found, parsing HTML');
  return parseHtmlContent(htmlContent, url);
}

function parseStructuredData(data: any, url: string): Recipe {
  const getTextContent = (item: any): string => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && item.text) return item.text;
    if (item && typeof item === 'object' && item['@value']) return item['@value'];
    return '';
  };

  const getDuration = (duration: any): string => {
    if (!duration) return '';
    if (typeof duration === 'string') {
      // Parse ISO 8601 duration (PT15M = 15 minutes)
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

  const ingredients = data.recipeIngredient || [];
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
    ingredients: ingredients.map((ing: any) => getTextContent(ing)),
    instructions: instructions.filter((inst: string) => inst.trim().length > 0),
    source: url
  };
}

function parseHtmlContent(htmlContent: string, url: string): Recipe {
  // Extract title
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)</i) || 
                    htmlContent.match(/<h1[^>]*>([^<]+)</i);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Recipe';

  // Enhanced ingredient patterns for modern recipe sites
  const ingredientPatterns = [
    // AllRecipes and similar sites use spans with specific classes
    /<span[^>]*class="[^"]*ingredients?-item-name[^"]*"[^>]*>([^<]+)</gi,
    /<span[^>]*class="[^"]*recipe-summary__item[^"]*"[^>]*>([^<]+)</gi,
    /<li[^>]*class="[^"]*mntl-structured-ingredients__list-item[^"]*"[^>]*>((?:[^<]|<(?!\/li>))*)<\/li>/gi,
    /<li[^>]*data-ingredient[^>]*>([^<]+)</gi,
    /<p[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)</gi,
    // Generic patterns
    /<li[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)</gi,
    /<div[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)</gi,
  ];
  
  let ingredients: string[] = [];
  for (const pattern of ingredientPatterns) {
    const matches = [...htmlContent.matchAll(pattern)];
    if (matches.length > 0) {
      ingredients = matches.map(match => {
        // Clean up HTML tags and extra whitespace
        return match[1].replace(/<[^>]*>/g, '').trim();
      }).filter(text => text.length > 0 && text.length < 200); // Filter out very long text that's likely not ingredients
      if (ingredients.length > 0) {
        console.log(`Found ${ingredients.length} ingredients using pattern`);
        break;
      }
    }
  }

  // Enhanced instruction patterns
  const instructionPatterns = [
    // AllRecipes and modern sites
    /<p[^>]*class="[^"]*mntl-sc-block-html[^"]*"[^>]*>((?:[^<]|<(?!\/p>))*)<\/p>/gi,
    /<div[^>]*class="[^"]*recipe-summary__item[^"]*"[^>]*>([^<]+)</gi,
    /<li[^>]*class="[^"]*mntl-sc-block-html[^"]*"[^>]*>((?:[^<]|<(?!\/li>))*)<\/li>/gi,
    /<div[^>]*class="[^"]*recipe-instruction[^"]*"[^>]*>((?:[^<]|<(?!\/div>))*)<\/div>/gi,
    // Generic patterns
    /<li[^>]*class="[^"]*instruction[^"]*"[^>]*>([^<]+)</gi,
    /<div[^>]*class="[^"]*instruction[^"]*"[^>]*>([^<]+)</gi,
    /<p[^>]*class="[^"]*step[^"]*"[^>]*>([^<]+)</gi,
    /<ol[^>]*>[^<]*<li[^>]*>([^<]+)</gi,
  ];
  
  let instructions: string[] = [];
  for (const pattern of instructionPatterns) {
    const matches = [...htmlContent.matchAll(pattern)];
    if (matches.length > 0) {
      instructions = matches.map(match => {
        // Clean up HTML tags and extra whitespace
        return match[1].replace(/<[^>]*>/g, '').trim();
      }).filter(text => text.length > 10 && text.length < 1000); // Filter reasonable instruction lengths
      if (instructions.length > 0) {
        console.log(`Found ${instructions.length} instructions using pattern`);
        break;
      }
    }
  }

  // Look for image with better patterns
  const imagePatterns = [
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<img[^>]*class="[^"]*recipe[^"]*"[^>]*src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']*recipe[^"']*)["']/i,
  ];
  
  let image: string | undefined;
  for (const pattern of imagePatterns) {
    const match = htmlContent.match(pattern);
    if (match) {
      image = match[1];
      break;
    }
  }

  console.log(`Parsed ${ingredients.length} ingredients and ${instructions.length} instructions from HTML`);

  return {
    title,
    image,
    ingredients: ingredients.length > 0 ? ingredients : ['No ingredients found'],
    instructions: instructions.length > 0 ? instructions : ['No instructions found'],
    source: url
  };
}

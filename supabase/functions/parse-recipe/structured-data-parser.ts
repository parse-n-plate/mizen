
import type { Recipe } from './types.ts';
import { decodeHtmlEntities } from './html-utils.ts';

export function parseStructuredData(htmlContent: string, url: string): Recipe | null {
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
    if (typeof item === 'string') return decodeHtmlEntities(item);
    if (item && typeof item === 'object') {
      return decodeHtmlEntities(item.text || item['@value'] || item.name || '');
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
    if (typeof instruction === 'string') return decodeHtmlEntities(instruction);
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

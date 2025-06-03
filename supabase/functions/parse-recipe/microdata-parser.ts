
import type { Recipe } from './types.ts';
import { decodeHtmlEntities } from './html-utils.ts';

export function parseMicrodata(htmlContent: string, url: string): Recipe | null {
  // Look for microdata Recipe schema
  const recipeMatch = htmlContent.match(/<[^>]*itemtype[^>]*schema\.org\/Recipe[^>]*>/i);
  if (!recipeMatch) return null;

  const extractMicrodataProperty = (property: string): string[] => {
    const regex = new RegExp(`<[^>]*itemprop=["']${property}["'][^>]*>([^<]*)</`, 'gi');
    const matches = [...htmlContent.matchAll(regex)];
    return matches.map(match => decodeHtmlEntities(match[1].trim())).filter(text => text.length > 0);
  };

  const ingredients = extractMicrodataProperty('recipeIngredient');
  const instructions = extractMicrodataProperty('recipeInstruction');
  const title = extractMicrodataProperty('name')[0] || 'Untitled Recipe';

  if (ingredients.length === 0 && instructions.length === 0) return null;

  return {
    title: decodeHtmlEntities(title),
    ingredients: ingredients.length > 0 ? ingredients : ['No ingredients found'],
    instructions: instructions.length > 0 ? instructions : ['No instructions found'],
    source: url
  };
}

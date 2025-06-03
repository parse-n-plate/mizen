
import type { Recipe } from './types.ts';
import { extractTitle, extractImage } from './html-utils.ts';

export function parseSemanticHtml(htmlContent: string, url: string): Recipe | null {
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

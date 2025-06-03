
import type { Recipe } from './types.ts';
import { extractTitle, extractImage, decodeHtmlEntities } from './html-utils.ts';

export function parseWithHeuristics(htmlContent: string, url: string): Recipe {
  console.log('Using content-based heuristics...');
  
  // Extract all text content and analyze it
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const sentences = textContent.split(/[.!?]+/).map(s => decodeHtmlEntities(s.trim())).filter(s => s.length > 10);
  
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

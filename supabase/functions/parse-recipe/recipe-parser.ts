
import type { Recipe } from './types.ts';
import { parseStructuredData } from './structured-data-parser.ts';
import { parseMicrodata } from './microdata-parser.ts';
import { parseWithEnhancedSelectors } from './css-selector-parser.ts';
import { parseSemanticHtml } from './semantic-html-parser.ts';
import { parseWithHeuristics } from './heuristic-parser.ts';

export function parseRecipeFromHtml(htmlContent: string, url: string): Recipe {
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

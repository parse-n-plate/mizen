
import type { Recipe } from './types.ts';
import { extractTitle, extractImage } from './html-utils.ts';

export function parseWithEnhancedSelectors(htmlContent: string, url: string): Recipe | null {
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

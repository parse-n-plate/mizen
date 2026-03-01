import { RecipeStep } from '@/contexts/RecipeContext';

// Helper to check if instructions are in new format
export function isEnhancedInstructions(instructions: string[] | RecipeStep[]): instructions is RecipeStep[] {
  return instructions.length > 0 && typeof instructions[0] === 'object';
}

// Convert old format to new format (for migration)
export function migrateInstructionsToSteps(instructions: string[]): RecipeStep[] {
  return instructions.map((instruction, index) => ({
    stepNumber: index + 1,
    instruction,
    ingredientsNeeded: [],
    toolsNeeded: [],
  }));
}

/**
 * Remove ingredient quantities and units from instruction text
 * Examples:
 * "Add 1/2 teaspoon salt" → "Add salt"
 * "Mix in 500 grams lean ground beef" → "Mix in lean ground beef"
 * "Stir in 3 tablespoons ketchup" → "Stir in ketchup"
 */
export function removeQuantitiesFromInstructions(instruction: string): string {
  // Pattern matches quantities at word boundaries followed by known ingredient units
  // Captures: amount + unit + following spaces
  const amountPattern =
    String.raw`[\d]+(?:\/[\d]+)?(?:\s+[\d]+\/[\d]+)?|[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+(?:\s*[–-]\s*[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+)?`;
  // Allowlist of ingredient units; intentionally excludes time and temperature units
  const unitPattern =
    String.raw`(?:cup|cups|teaspoon|teaspoons|tsp|tablespoon|tablespoons|tbsp|gram|grams|g|kilogram|kilograms|kg|milligram|milligrams|mg|ounce|ounces|oz|pound|pounds|lb|lbs|milliliter|milliliters|ml|liter|liters|l|pinch|pinches|clove|cloves|slice|slices|can|cans|packet|packets|stick|sticks|piece|pieces)`;
  const quantityPattern = new RegExp(
    String.raw`\b(` + amountPattern + String.raw`)\s+` + unitPattern + String.raw`\s+`,
    'gi',
  );
  return instruction.replace(quantityPattern, '');
}


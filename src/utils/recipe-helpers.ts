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
  // Pattern matches quantities at word boundaries followed by units
  // Captures: amount + unit + following spaces
  const quantityPattern = /\b([\d]+(?:\/[\d]+)?(?:\s+[\d]+\/[\d]+)?|[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+(?:\s*[–-]\s*[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+)?)\s+([a-zA-Z]+)\s+/g;
  
  return instruction.replace(quantityPattern, '');
}


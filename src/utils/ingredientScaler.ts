/**
 * Utility functions for scaling ingredient amounts based on servings
 */

interface Ingredient {
  amount?: string;
  units?: string;
  ingredient: string;
}

interface IngredientGroup {
  groupName: string;
  ingredients: (string | Ingredient)[];
}

// Common fraction characters to decimal map
const FRACTION_MAP: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

// Decimal to fraction map for common cooking measurements
// Now using Unicode fraction symbols instead of text fractions
const DECIMAL_TO_FRACTION: Record<string, string> = {
  '0.25': '¼',
  '0.33': '⅓',
  '0.5': '½',
  '0.66': '⅔',
  '0.75': '¾',
  '0.125': '⅛',
  '0.375': '⅜',
  '0.625': '⅝',
  '0.875': '⅞',
  '0.2': '⅕',
  '0.4': '⅖',
  '0.6': '⅗',
  '0.8': '⅘',
};

/**
 * Parse a string amount into a number
 * Handles: "2", "2.5", "1/2", "1 1/2", "½", "1 ½"
 */
export function parseAmount(amountStr: string): number | null {
  if (!amountStr) return null;
  
  const cleanStr = amountStr.trim();
  if (!cleanStr || cleanStr.toLowerCase() === 'as needed' || cleanStr.toLowerCase() === 'to taste') {
    return null;
  }

  // Check if it's a range (e.g., "2-3") - handle this by returning the average or just the first number?
  // For now, let's return null for ranges in this basic parser, 
  // and handle ranges specifically in the scaling function
  if (cleanStr.includes('-') || cleanStr.toLowerCase().includes(' to ')) {
    return null; 
  }

  // Replace unicode fractions with their decimal values if they stand alone
  if (FRACTION_MAP[cleanStr]) {
    return FRACTION_MAP[cleanStr];
  }

  // Handle mixed numbers with unicode (e.g. "1 ½")
  for (const [char, val] of Object.entries(FRACTION_MAP)) {
    if (cleanStr.includes(char)) {
      const parts = cleanStr.split(char);
      const whole = parts[0].trim() ? parseFloat(parts[0].trim()) : 0;
      return whole + val;
    }
  }

  // Handle standard fractions (e.g., "1/2", "1 1/2")
  if (cleanStr.includes('/')) {
    const parts = cleanStr.split(' ');
    if (parts.length === 2) {
      // Mixed number: "1 1/2"
      const whole = parseFloat(parts[0]);
      const fractionParts = parts[1].split('/');
      const num = parseFloat(fractionParts[0]);
      const den = parseFloat(fractionParts[1]);
      if (!isNaN(whole) && !isNaN(num) && !isNaN(den) && den !== 0) {
        return whole + (num / den);
      }
    } else if (parts.length === 1) {
      // Simple fraction: "1/2"
      const fractionParts = cleanStr.split('/');
      const num = parseFloat(fractionParts[0]);
      const den = parseFloat(fractionParts[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den;
      }
    }
  }

  // Handle simple numbers and decimals
  const num = parseFloat(cleanStr);
  return isNaN(num) ? null : num;
}

/**
 * Format a number back into a readable string
 * Prefers Unicode fraction symbols for common cooking values (½, ¼, ¾, etc.)
 */
export function formatAmount(amount: number): string {
  if (amount === 0) return '0';
  
  // Handle very small numbers - using Unicode fraction symbol
  if (amount < 0.01) return '< ⅛';

  const whole = Math.floor(amount);
  const decimal = amount - whole;
  
  // Close enough to whole number
  if (decimal < 0.02) return whole.toString();
  if (decimal > 0.98) return (whole + 1).toString();

  // Check for common fractions
  // Round decimal to 3 places to check against map
  // Try to find exact match first
  // Note: Unicode fractions are concatenated directly with no space for mixed numbers (e.g., "1½" not "1 ½")
  for (const [dec, frac] of Object.entries(DECIMAL_TO_FRACTION)) {
    if (Math.abs(parseFloat(dec) - decimal) < 0.02) {
      return whole > 0 ? `${whole}${frac}` : frac;
    }
  }

  // Fallback: generic fraction formatting (simplified) using Unicode symbols
  // 1/3 ≈ 0.333
  if (Math.abs(decimal - 1/3) < 0.05) return whole > 0 ? `${whole}⅓` : '⅓';
  if (Math.abs(decimal - 2/3) < 0.05) return whole > 0 ? `${whole}⅔` : '⅔';
  
  // If no fraction match, return decimal formatted to max 2 places
  // Remove trailing zeros
  const formattedDecimal = parseFloat(amount.toFixed(2)).toString();
  return formattedDecimal;
}

/**
 * Parse amount/unit from ingredient string when amount/units fields are empty
 * Handles patterns like "1½ Tbsp soy sauce", "2 cups dashi", etc.
 */
function parseIngredientString(ingredientStr: string): { amount: string; unit: string; name: string } | null {
  // Pattern: matches amount (can include fractions like 1½, 2½, ⅛) + unit + ingredient name
  // Examples: "1½ Tbsp soy sauce", "2½ cups dashi", "1 tsp sugar"
  const match = ingredientStr.match(/^([\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+(?:\s*[–-]\s*[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+)?)\s+([a-zA-Z]+)\s+(.+)$/);
  if (match) {
    return {
      amount: match[1].trim(),
      unit: match[2].trim(),
      name: match[3].trim()
    };
  }
  // Fallback: try simpler pattern without fractions
  const simpleMatch = ingredientStr.match(/^(\d+(?:\s*[–-]\s*\d+)?)\s+([a-zA-Z]+)\s+(.+)$/);
  if (simpleMatch) {
    return {
      amount: simpleMatch[1].trim(),
      unit: simpleMatch[2].trim(),
      name: simpleMatch[3].trim()
    };
  }
  return null;
}

/**
 * Scale a single ingredient
 */
export function scaleIngredient(
  ingredient: string | Ingredient,
  scaleFactor: number
): string | Ingredient {
  // If it's just a string, we can't reliably scale it
  if (typeof ingredient === 'string') {
    return ingredient;
  }

  // If parsed as object but missing amount, try to parse from ingredient string
  if (!ingredient.amount && ingredient.ingredient) {
    const parsed = parseIngredientString(ingredient.ingredient);
    if (parsed && parsed.amount) {
      // Parse and scale the amount
      const val = parseAmount(parsed.amount);
      if (val !== null) {
        const scaledAmount = formatAmount(val * scaleFactor);
        // Return scaled ingredient with parsed amount/unit separated
        return {
          amount: scaledAmount,
          units: parsed.unit,
          ingredient: parsed.name
        };
      }
    }
    // If parsing fails, return as is
    return ingredient;
  }

  // Check for range (e.g., "2-3")
  if (ingredient.amount && ingredient.amount.includes('-')) {
    const parts = ingredient.amount.split('-');
    if (parts.length === 2) {
      const min = parseAmount(parts[0]);
      const max = parseAmount(parts[1]);
      
      if (min !== null && max !== null) {
        const scaledMin = formatAmount(min * scaleFactor);
        const scaledMax = formatAmount(max * scaleFactor);
        return {
          ...ingredient,
          amount: `${scaledMin}-${scaledMax}`
        };
      }
    }
  }
  
  // Check for "to" range (e.g. "2 to 3")
  if (ingredient.amount && ingredient.amount.toLowerCase().includes(' to ')) {
     const parts = ingredient.amount.toLowerCase().split(' to ');
     if (parts.length === 2) {
      const min = parseAmount(parts[0]);
      const max = parseAmount(parts[1]);
      
      if (min !== null && max !== null) {
        const scaledMin = formatAmount(min * scaleFactor);
        const scaledMax = formatAmount(max * scaleFactor);
        return {
          ...ingredient,
          amount: `${scaledMin} to ${scaledMax}`
        };
      }
    }
  }

  // Regular scaling
  if (!ingredient.amount) {
    return ingredient;
  }
  const val = parseAmount(ingredient.amount);
  if (val !== null) {
    return {
      ...ingredient,
      amount: formatAmount(val * scaleFactor)
    };
  }

  // Fallback: return original
  return ingredient;
}

/**
 * Scale a list of ingredient groups
 */
export function scaleIngredients(
  groups: IngredientGroup[],
  originalServings: number,
  newServings: number
): IngredientGroup[] {
  // Avoid division by zero or negative/zero servings
  const validOriginal = Math.max(1, originalServings);
  const validNew = Math.max(1, newServings);
  const scaleFactor = validNew / validOriginal;

  if (scaleFactor === 1) return groups;

  return groups.map(group => ({
    ...group,
    ingredients: group.ingredients.map(ing => scaleIngredient(ing, scaleFactor))
  }));
}


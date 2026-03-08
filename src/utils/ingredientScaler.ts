/**
 * Utility functions for scaling ingredient amounts based on servings
 */

import type { Ingredient, IngredientGroup } from "@/lib/types";

// Common fraction characters to decimal map
export const FRACTION_MAP: Record<string, number> = {
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

  const cleanStr = amountStr.trim().replace(/[–—]/g, '-');
  if (!cleanStr || cleanStr.toLowerCase() === 'as needed' || cleanStr.toLowerCase() === 'to taste') {
    return null;
  }

  if (cleanStr.includes('-') || cleanStr.toLowerCase().includes(' to ')) {
    return null;
  }

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
      const whole = parseFloat(parts[0]);
      const fractionParts = parts[1].split('/');
      const num = parseFloat(fractionParts[0]);
      const den = parseFloat(fractionParts[1]);
      if (!isNaN(whole) && !isNaN(num) && !isNaN(den) && den !== 0) {
        return whole + (num / den);
      }
    } else if (parts.length === 1) {
      const fractionParts = cleanStr.split('/');
      const num = parseFloat(fractionParts[0]);
      const den = parseFloat(fractionParts[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den;
      }
    }
  }

  const num = parseFloat(cleanStr);
  return isNaN(num) ? null : num;
}

/**
 * Format a number back into a readable string
 * Prefers Unicode fraction symbols for common cooking values
 */
export function formatAmount(amount: number): string {
  if (amount === 0) return '0';
  if (amount < 0.01) return '< ⅛';

  const whole = Math.floor(amount);
  const decimal = amount - whole;

  if (decimal < 0.02) return whole.toString();
  if (decimal > 0.98) return (whole + 1).toString();

  for (const [dec, frac] of Object.entries(DECIMAL_TO_FRACTION)) {
    if (Math.abs(parseFloat(dec) - decimal) < 0.02) {
      return whole > 0 ? `${whole}${frac}` : frac;
    }
  }

  if (Math.abs(decimal - 1 / 3) < 0.05) return whole > 0 ? `${whole}⅓` : '⅓';
  if (Math.abs(decimal - 2 / 3) < 0.05) return whole > 0 ? `${whole}⅔` : '⅔';

  const formattedDecimal = parseFloat(amount.toFixed(2)).toString();
  return formattedDecimal;
}

/**
 * Parse amount/unit from ingredient string when amount/units fields are empty
 */
function parseIngredientString(ingredientStr: string): { amount: string; unit: string; name: string } | null {
  const tokens = ingredientStr.trim().split(/\s+/);
  if (tokens.length < 3) return null;

  const maxAmountTokens = Math.min(4, tokens.length - 2);
  for (let i = 1; i <= maxAmountTokens; i += 1) {
    const amountCandidate = tokens.slice(0, i).join(' ');
    const normalized = amountCandidate.replace(/[–—]/g, '-');
    const couldBeAmount =
      parseAmount(normalized) !== null || normalized.includes('-') || normalized.toLowerCase().includes(' to ');

    if (!couldBeAmount) continue;

    const unit = tokens[i];
    if (!/^[a-zA-Z]+$/.test(unit)) continue;

    const name = tokens.slice(i + 1).join(' ');
    if (!name) continue;

    return { amount: amountCandidate.trim(), unit: unit.trim(), name: name.trim() };
  }

  return null;
}

/**
 * Scale a single ingredient
 */
export function scaleIngredient(
  ingredient: Ingredient,
  scaleFactor: number
): Ingredient {
  // If missing amount, try to parse from ingredient string
  if (!ingredient.amount && ingredient.ingredient) {
    const parsed = parseIngredientString(ingredient.ingredient);
    if (parsed && parsed.amount) {
      const val = parseAmount(parsed.amount);
      if (val !== null) {
        return {
          ...ingredient,
          amount: formatAmount(val * scaleFactor),
          units: parsed.unit,
          ingredient: parsed.name,
        };
      }
    }
    return ingredient;
  }

  // Check for range (e.g., "2-3")
  if (ingredient.amount) {
    const normalizedAmount = ingredient.amount.replace(/[–—]/g, '-');
    if (normalizedAmount.includes('-')) {
      const parts = normalizedAmount.split('-');
      if (parts.length === 2) {
        const min = parseAmount(parts[0]);
        const max = parseAmount(parts[1]);
        if (min !== null && max !== null) {
          return { ...ingredient, amount: `${formatAmount(min * scaleFactor)}-${formatAmount(max * scaleFactor)}` };
        }
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
        return { ...ingredient, amount: `${formatAmount(min * scaleFactor)} to ${formatAmount(max * scaleFactor)}` };
      }
    }
  }

  if (!ingredient.amount) return ingredient;

  const val = parseAmount(ingredient.amount);
  if (val !== null) {
    return { ...ingredient, amount: formatAmount(val * scaleFactor) };
  }

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
  const validOriginal = Math.max(1, originalServings);
  const validNew = Math.max(1, newServings);
  const scaleFactor = validNew / validOriginal;

  if (scaleFactor === 1) return groups;

  return groups.map(group => ({
    ...group,
    ingredients: group.ingredients.map(ing => scaleIngredient(ing, scaleFactor)),
  }));
}

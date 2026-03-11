/**
 * Utility functions for scaling ingredient amounts based on servings
 */

import type { Ingredient, IngredientGroup } from "@/lib/types";
import type { NumberFormat } from "@/lib/numberFormat";

// Common fraction characters to decimal map
export const FRACTION_MAP: Record<string, number> = {
  "½": 0.5,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 0.25,
  "¾": 0.75,
  "⅕": 0.2,
  "⅖": 0.4,
  "⅗": 0.6,
  "⅘": 0.8,
  "⅙": 1 / 6,
  "⅚": 5 / 6,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

// Decimal to fraction map for common cooking measurements
const DECIMAL_TO_FRACTION: Record<string, string> = {
  "0.25": "¼",
  "0.33": "⅓",
  "0.5": "½",
  "0.66": "⅔",
  "0.75": "¾",
  "0.125": "⅛",
  "0.375": "⅜",
  "0.625": "⅝",
  "0.875": "⅞",
  "0.2": "⅕",
  "0.4": "⅖",
  "0.6": "⅗",
  "0.8": "⅘",
};

/**
 * Parse a string amount into a number
 * Handles: "2", "2.5", "1/2", "1 1/2", "½", "1 ½"
 */
export function parseAmount(amountStr: string): number | null {
  if (!amountStr) return null;

  const cleanStr = amountStr.trim().replace(/[–—]/g, "-");
  if (
    !cleanStr ||
    cleanStr.toLowerCase() === "as needed" ||
    cleanStr.toLowerCase() === "to taste"
  ) {
    return null;
  }

  if (cleanStr.includes("-") || cleanStr.toLowerCase().includes(" to ")) {
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
  if (cleanStr.includes("/")) {
    const parts = cleanStr.split(" ");
    if (parts.length === 2) {
      const whole = parseFloat(parts[0]);
      const fractionParts = parts[1].split("/");
      const num = parseFloat(fractionParts[0]);
      const den = parseFloat(fractionParts[1]);
      if (!isNaN(whole) && !isNaN(num) && !isNaN(den) && den !== 0) {
        return whole + num / den;
      }
    } else if (parts.length === 1) {
      const fractionParts = cleanStr.split("/");
      const num = parseFloat(fractionParts[0]);
      const den = parseFloat(fractionParts[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den;
      }
    }
  }

  const num = Number(cleanStr);
  return Number.isFinite(num) ? num : null;
}

/**
 * Round a number to the nearest 0.5
 */
function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

/**
 * Format a number back into a readable string
 * Prefers Unicode fraction symbols for common cooking values
 * When round is true, rounds to the nearest 0.5 first
 */
export function formatAmount(amount: number, round?: boolean): string {
  if (round) amount = roundToHalf(amount);
  if (amount === 0) return "0";
  if (amount < 0.01) return "< ⅛";

  const whole = Math.floor(amount);
  const decimal = amount - whole;

  if (decimal < 0.02) return whole.toString();
  if (decimal > 0.98) return (whole + 1).toString();

  for (const [dec, frac] of Object.entries(DECIMAL_TO_FRACTION)) {
    if (Math.abs(parseFloat(dec) - decimal) < 0.02) {
      return whole > 0 ? `${whole}${frac}` : frac;
    }
  }

  if (Math.abs(decimal - 1 / 3) < 0.05) return whole > 0 ? `${whole}⅓` : "⅓";
  if (Math.abs(decimal - 2 / 3) < 0.05) return whole > 0 ? `${whole}⅔` : "⅔";

  const formattedDecimal = parseFloat(amount.toFixed(2)).toString();
  return formattedDecimal;
}

/**
 * Normalize a string amount by converting LLM-generated decimal representations
 * back to unicode fractions. E.g. "0.33333334326744" → "⅓".
 * Only touches strings that are purely a decimal number.
 */
export function normalizeAmount(amountStr: string): string {
  if (!amountStr) return amountStr;
  const trimmed = amountStr.trim();
  if (!/^\d+\.\d+$/.test(trimmed)) return amountStr;
  const num = parseFloat(trimmed);
  if (isNaN(num)) return amountStr;
  return formatAmount(num);
}

/**
 * Replace decimal numbers embedded in running text with unicode fractions.
 * E.g. "Add 0.333 cup of sugar" → "Add ⅓ cup of sugar"
 */
export function normalizeDecimalsInText(text: string): string {
  if (!text) return text;
  return text.replace(/\b(\d+\.\d+)\b/g, (match) => {
    const num = parseFloat(match);
    if (isNaN(num)) return match;
    const formatted = formatAmount(num);
    // Only replace if formatAmount produced a cleaner result (not another decimal)
    return formatted.includes(".") ? match : formatted;
  });
}

/**
 * Format a standalone amount string for display based on user preference.
 * - "fractions": "0.5" → "½", "⅓" stays "⅓"
 * - "decimals": "½" → "0.5", "⅓" → "0.33"
 */
export function displayAmount(amountStr: string, format: NumberFormat): string {
  if (!amountStr) return amountStr;
  const trimmed = amountStr.trim();
  if (!trimmed || trimmed.toLowerCase() === "as needed" || trimmed.toLowerCase() === "to taste") {
    return amountStr;
  }

  // Handle ranges — format each part
  const normalized = trimmed.replace(/[–—]/g, "-");
  if (normalized.includes("-")) {
    const parts = normalized.split("-");
    if (parts.length === 2) {
      return `${displayAmount(parts[0], format)}-${displayAmount(parts[1], format)}`;
    }
  }
  if (trimmed.toLowerCase().includes(" to ")) {
    const parts = trimmed.split(/\s+to\s+/i);
    if (parts.length === 2) {
      return `${displayAmount(parts[0], format)} to ${displayAmount(parts[1], format)}`;
    }
  }

  const val = parseAmount(trimmed);
  if (val === null) return amountStr;

  if (format === "decimals") {
    return parseFloat(val.toFixed(2)).toString();
  }
  return formatAmount(val);
}

/**
 * Format instruction/detail text for display based on user preference.
 * Replaces inline fractions ↔ decimals within prose text.
 */
export function displayText(text: string, format: NumberFormat): string {
  if (!text) return text;

  if (format === "decimals") {
    // Replace unicode fraction characters with decimals
    // Handle mixed numbers like "1⅓" → "1.33" and standalone "⅓" → "0.33"
    let result = text;
    for (const [char, val] of Object.entries(FRACTION_MAP)) {
      // Mixed: "2⅓" → "2.33"
      result = result.replace(new RegExp(`(\\d+)\\s*${char}`, "g"), (_, whole) => {
        const total = parseInt(whole) + val;
        return parseFloat(total.toFixed(2)).toString();
      });
      // Standalone: "⅓" → "0.33"
      result = result.replace(new RegExp(char, "g"), parseFloat(val.toFixed(2)).toString());
    }
    return result;
  }

  // Fractions mode: replace inline decimals with fraction characters
  return normalizeDecimalsInText(text);
}

/**
 * Parse amount/unit from ingredient string when amount/units fields are empty
 */
function parseIngredientString(
  ingredientStr: string
): { amount: string; units: string; ingredient: string } | null {
  const s = ingredientStr.trim();
  if (!s) return null;

  const unicodeFractions = "½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞";
  const numberToken = `(?:\\d+\\s+\\d+/\\d+|\\d+[${unicodeFractions}]|\\d+/\\d+|\\d*\\.\\d+|\\d+|[${unicodeFractions}])`;
  const amountRe = new RegExp(
    `^((?:${numberToken})(?:\\s*(?:[\\-–—]|to)\\s*(?:${numberToken}))?)\\s*`,
    "i"
  );
  const amountMatch = s.match(amountRe);
  if (!amountMatch) return null;

  const amount = amountMatch[1].trim();
  const rest = s.slice(amountMatch[0].length).trim();

  const unitPatterns = [
    "cups?",
    "tablespoons?",
    "tbsps?\\.?",
    "teaspoons?",
    "tsps?\\.?",
    "ounces?",
    "oz\\.?",
    "pounds?",
    "lbs?\\.?",
    "grams?",
    "g",
    "kilograms?",
    "kg",
    "millilit(?:er|re)s?",
    "ml",
    "lit(?:er|re)s?",
    "l",
    "pints?",
    "quarts?",
    "gallons?",
    "pinch(?:es)?",
    "dash(?:es)?",
    "cloves?",
    "slices?",
    "pieces?",
    "stalks?",
    "sprigs?",
    "bunche?s?",
    "cans?",
    "packages?",
    "pkgs?\\.?",
    "sticks?",
    "heads?",
    "ears?",
    "large",
    "medium",
    "small",
    "whole",
  ];
  const unitRe = new RegExp(`^(${unitPatterns.join("|")})(?:\\b|\\.)\\s*`, "i");
  const unitMatch = rest.match(unitRe);

  if (unitMatch) {
    return {
      amount,
      units: unitMatch[1].replace(/\.$/, ""),
      ingredient: rest
        .slice(unitMatch[0].length)
        .replace(/^of\s+/i, "")
        .trim(),
    };
  }

  if (/^[\-–—]/.test(rest)) {
    return null;
  }

  return {
    amount,
    units: "",
    ingredient: rest,
  };
}

function normalizeIngredient(ingredient: Ingredient): Ingredient {
  if (!ingredient.amount || ingredient.units) return ingredient;

  const parsed = parseIngredientString(`${ingredient.amount} ${ingredient.ingredient}`.trim());
  if (!parsed?.amount) return ingredient;

  const amountChanged = parsed.amount !== ingredient.amount.trim();
  const unitsChanged = Boolean(parsed.units);
  const ingredientChanged =
    Boolean(parsed.ingredient) && parsed.ingredient !== ingredient.ingredient.trim();

  if (!amountChanged && !unitsChanged && !ingredientChanged) {
    return ingredient;
  }

  return {
    ...ingredient,
    amount: parsed.amount,
    units: parsed.units || ingredient.units,
    ingredient: ingredientChanged ? parsed.ingredient : ingredient.ingredient,
  };
}

/**
 * Scale a single ingredient
 */
export function scaleIngredient(
  ingredient: Ingredient,
  scaleFactor: number,
  round?: boolean
): Ingredient {
  const normalizedIngredient = normalizeIngredient(ingredient);

  // If missing amount, try to parse from ingredient string
  if (!normalizedIngredient.amount && normalizedIngredient.ingredient) {
    const parsed = parseIngredientString(normalizedIngredient.ingredient);
    if (parsed && parsed.amount) {
      const val = parseAmount(parsed.amount);
      if (val !== null) {
        return {
          ...normalizedIngredient,
          amount: formatAmount(val * scaleFactor, round),
          units: parsed.units,
          ingredient: parsed.ingredient,
        };
      }
    }
    return normalizedIngredient;
  }

  // Check for range (e.g., "2-3")
  if (normalizedIngredient.amount) {
    const normalizedAmount = normalizedIngredient.amount.replace(/[–—]/g, "-");
    if (normalizedAmount.includes("-")) {
      const parts = normalizedAmount.split("-");
      if (parts.length === 2) {
        const min = parseAmount(parts[0]);
        const max = parseAmount(parts[1]);
        if (min !== null && max !== null) {
          return {
            ...normalizedIngredient,
            amount: `${formatAmount(min * scaleFactor, round)}-${formatAmount(max * scaleFactor, round)}`,
          };
        }
      }
    }
  }

  // Check for "to" range (e.g. "2 to 3")
  if (normalizedIngredient.amount && normalizedIngredient.amount.toLowerCase().includes(" to ")) {
    const parts = normalizedIngredient.amount.toLowerCase().split(" to ");
    if (parts.length === 2) {
      const min = parseAmount(parts[0]);
      const max = parseAmount(parts[1]);
      if (min !== null && max !== null) {
        return {
          ...normalizedIngredient,
          amount: `${formatAmount(min * scaleFactor, round)} to ${formatAmount(max * scaleFactor, round)}`,
        };
      }
    }
  }

  if (!normalizedIngredient.amount) return normalizedIngredient;

  const val = parseAmount(normalizedIngredient.amount);
  if (val !== null) {
    return { ...normalizedIngredient, amount: formatAmount(val * scaleFactor, round) };
  }

  return normalizedIngredient;
}

/**
 * Scale a list of ingredient groups
 */
export function scaleIngredients(
  groups: IngredientGroup[],
  originalServings: number,
  newServings: number,
  round?: boolean
): IngredientGroup[] {
  const validOriginal = Math.max(1, originalServings);
  const validNew = Math.max(1, newServings);
  const scaleFactor = validNew / validOriginal;

  if (scaleFactor === 1 && !round) return groups;

  return groups.map((group) => ({
    ...group,
    ingredients: group.ingredients.map((ing) => scaleIngredient(ing, scaleFactor, round)),
  }));
}

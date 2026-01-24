/**
 * Unit conversion utility for ingredients
 * Converts between original, metric, and imperial unit systems
 */

import { parseAmount, formatAmount } from './ingredientScaler';

interface Ingredient {
  amount?: string;
  units?: string;
  ingredient: string;
}

export type UnitSystem = 'original' | 'metric' | 'imperial';

// Volume conversions to mL (base unit for volume)
const VOLUME_TO_ML: Record<string, number> = {
  // Imperial/US volume
  'cup': 240,
  'cups': 240,
  'c': 240,
  'tablespoon': 15,
  'tablespoons': 15,
  'tbsp': 15,
  'tbs': 15,
  'tb': 15,
  'teaspoon': 5,
  'teaspoons': 5,
  'tsp': 5,
  'ts': 5,
  'fluid ounce': 30,
  'fluid ounces': 30,
  'fl oz': 30,
  'fl. oz': 30,
  'floz': 30,
  'ounce': 30, // When referring to liquid, not weight
  'ounces': 30,
  'oz': 30, // Ambiguous - could be weight or volume
  'pint': 473,
  'pints': 473,
  'pt': 473,
  'quart': 946,
  'quarts': 946,
  'qt': 946,
  'gallon': 3785,
  'gallons': 3785,
  'gal': 3785,

  // Metric volume
  'milliliter': 1,
  'milliliters': 1,
  'millilitre': 1,
  'millilitres': 1,
  'ml': 1,
  'liter': 1000,
  'liters': 1000,
  'litre': 1000,
  'litres': 1000,
  'l': 1000,
};

// Weight conversions to grams (base unit for weight)
const WEIGHT_TO_GRAMS: Record<string, number> = {
  // Imperial/US weight
  'pound': 454,
  'pounds': 454,
  'lb': 454,
  'lbs': 454,
  // Note: oz is ambiguous - could be volume or weight
  // If units appear to be weight (not liquid), treat as weight

  // Metric weight
  'gram': 1,
  'grams': 1,
  'g': 1,
  'kilogram': 1000,
  'kilograms': 1000,
  'kg': 1000,
  'milligram': 0.001,
  'milligrams': 0.001,
  'mg': 0.001,
};

// Units that should never be converted (countable items, qualitative measures)
const NON_CONVERTIBLE_UNITS = new Set([
  'piece', 'pieces', 'pc', 'pcs',
  'clove', 'cloves',
  'slice', 'slices',
  'whole', 'wholes',
  'head', 'heads',
  'bunch', 'bunches',
  'sprig', 'sprigs',
  'leaf', 'leaves',
  'stalk', 'stalks',
  'rib', 'ribs',
  'pinch', 'pinches',
  'dash', 'dashes',
  'handful', 'handfuls',
  'package', 'packages', 'pkg',
  'can', 'cans',
  'jar', 'jars',
  'box', 'boxes',
  'bag', 'bags',
  'container', 'containers',
  'to taste', 'as needed',
  'large', 'medium', 'small',
  '', // Empty unit
]);

/**
 * Normalize unit string for comparison
 */
function normalizeUnit(unit: string): string {
  return unit.toLowerCase().trim().replace(/\.$/, ''); // Remove trailing period
}

/**
 * Check if a unit is convertible
 */
function isConvertible(unit: string): boolean {
  if (!unit) return false;
  const normalized = normalizeUnit(unit);
  return !NON_CONVERTIBLE_UNITS.has(normalized);
}

/**
 * Check if a unit is a volume unit
 */
function isVolumeUnit(unit: string): boolean {
  const normalized = normalizeUnit(unit);
  return normalized in VOLUME_TO_ML;
}

/**
 * Check if a unit is a weight unit
 */
function isWeightUnit(unit: string): boolean {
  const normalized = normalizeUnit(unit);
  // Special case: 'oz' could be volume or weight
  // If it's clearly specified as 'fl oz', it's volume
  if (normalized.includes('fl')) return false;
  return normalized in WEIGHT_TO_GRAMS;
}

/**
 * Convert volume from one unit to another
 */
function convertVolume(amount: number, fromUnit: string, toSystem: UnitSystem): { amount: number; unit: string } {
  const normalizedFrom = normalizeUnit(fromUnit);
  const mlValue = amount * (VOLUME_TO_ML[normalizedFrom] || 1);

  if (toSystem === 'metric') {
    // Convert to metric
    if (mlValue >= 1000) {
      // Use liters for large amounts
      return { amount: mlValue / 1000, unit: 'L' };
    } else {
      return { amount: mlValue, unit: 'mL' };
    }
  } else if (toSystem === 'imperial') {
    // Convert to imperial (prefer cups/tbsp/tsp for cooking)
    if (mlValue >= 240) {
      // Use cups for larger amounts
      return { amount: mlValue / 240, unit: 'cup' };
    } else if (mlValue >= 15) {
      // Use tablespoons
      return { amount: mlValue / 15, unit: 'Tbsp' };
    } else {
      // Use teaspoons
      return { amount: mlValue / 5, unit: 'tsp' };
    }
  }

  // Original - return as is
  return { amount, unit: fromUnit };
}

/**
 * Convert weight from one unit to another
 */
function convertWeight(amount: number, fromUnit: string, toSystem: UnitSystem): { amount: number; unit: string } {
  const normalizedFrom = normalizeUnit(fromUnit);
  const gramsValue = amount * (WEIGHT_TO_GRAMS[normalizedFrom] || 1);

  if (toSystem === 'metric') {
    // Convert to metric
    if (gramsValue >= 1000) {
      // Use kilograms for large amounts
      return { amount: gramsValue / 1000, unit: 'kg' };
    } else {
      return { amount: gramsValue, unit: 'g' };
    }
  } else if (toSystem === 'imperial') {
    // Convert to imperial (prefer pounds for large amounts)
    if (gramsValue >= 454) {
      // Use pounds
      return { amount: gramsValue / 454, unit: 'lb' };
    } else {
      // Use ounces (assuming weight oz = 28g)
      return { amount: gramsValue / 28, unit: 'oz' };
    }
  }

  // Original - return as is
  return { amount, unit: fromUnit };
}

/**
 * Handle special case of 'oz' - determine if it's volume or weight based on context
 */
function isOzVolume(ingredientName: string): boolean {
  // Common liquid ingredients
  const liquidKeywords = ['water', 'milk', 'cream', 'juice', 'oil', 'broth', 'stock', 'sauce', 'wine', 'beer', 'vinegar', 'liquid'];
  const lowerName = ingredientName.toLowerCase();
  return liquidKeywords.some(keyword => lowerName.includes(keyword));
}

/**
 * Convert a single ingredient to the target unit system
 */
export function convertIngredientUnits(
  ingredient: Ingredient,
  targetSystem: UnitSystem
): Ingredient {
  // If target is 'original', return as-is
  if (targetSystem === 'original') {
    return ingredient;
  }

  // If no units or amount, return as-is
  if (!ingredient.units || !ingredient.amount) {
    return ingredient;
  }

  const unit = ingredient.units;

  // Check if unit is convertible
  if (!isConvertible(unit)) {
    return ingredient;
  }

  // Handle ranges (e.g., "2-3")
  if (ingredient.amount.includes('-')) {
    const parts = ingredient.amount.split('-');
    if (parts.length === 2) {
      const min = parseAmount(parts[0]);
      const max = parseAmount(parts[1]);

      if (min !== null && max !== null) {
        let convertedMin: { amount: number; unit: string };
        let convertedMax: { amount: number; unit: string };

        // Handle special case: 'oz' could be volume or weight
        if (normalizeUnit(unit) === 'oz') {
          if (isOzVolume(ingredient.ingredient)) {
            convertedMin = convertVolume(min, unit, targetSystem);
            convertedMax = convertVolume(max, unit, targetSystem);
          } else {
            // Treat as weight (28g per oz)
            convertedMin = convertWeight(min, unit, targetSystem);
            convertedMax = convertWeight(max, unit, targetSystem);
          }
        } else if (isVolumeUnit(unit)) {
          convertedMin = convertVolume(min, unit, targetSystem);
          convertedMax = convertVolume(max, unit, targetSystem);
        } else if (isWeightUnit(unit)) {
          convertedMin = convertWeight(min, unit, targetSystem);
          convertedMax = convertWeight(max, unit, targetSystem);
        } else {
          return ingredient; // Unknown unit type
        }

        return {
          ...ingredient,
          amount: `${formatAmount(convertedMin.amount)}-${formatAmount(convertedMax.amount)}`,
          units: convertedMin.unit, // Use the same unit for both
        };
      }
    }
  }

  // Handle "to" ranges (e.g., "2 to 3")
  if (ingredient.amount.toLowerCase().includes(' to ')) {
    const parts = ingredient.amount.toLowerCase().split(' to ');
    if (parts.length === 2) {
      const min = parseAmount(parts[0]);
      const max = parseAmount(parts[1]);

      if (min !== null && max !== null) {
        let convertedMin: { amount: number; unit: string };
        let convertedMax: { amount: number; unit: string };

        // Handle special case: 'oz' could be volume or weight
        if (normalizeUnit(unit) === 'oz') {
          if (isOzVolume(ingredient.ingredient)) {
            convertedMin = convertVolume(min, unit, targetSystem);
            convertedMax = convertVolume(max, unit, targetSystem);
          } else {
            convertedMin = convertWeight(min, unit, targetSystem);
            convertedMax = convertWeight(max, unit, targetSystem);
          }
        } else if (isVolumeUnit(unit)) {
          convertedMin = convertVolume(min, unit, targetSystem);
          convertedMax = convertVolume(max, unit, targetSystem);
        } else if (isWeightUnit(unit)) {
          convertedMin = convertWeight(min, unit, targetSystem);
          convertedMax = convertWeight(max, unit, targetSystem);
        } else {
          return ingredient; // Unknown unit type
        }

        return {
          ...ingredient,
          amount: `${formatAmount(convertedMin.amount)} to ${formatAmount(convertedMax.amount)}`,
          units: convertedMin.unit,
        };
      }
    }
  }

  // Regular single-value amount
  const parsedAmount = parseAmount(ingredient.amount);
  if (parsedAmount === null) {
    return ingredient; // Can't parse amount
  }

  let converted: { amount: number; unit: string };

  // Handle special case: 'oz' could be volume or weight
  if (normalizeUnit(unit) === 'oz') {
    if (isOzVolume(ingredient.ingredient)) {
      converted = convertVolume(parsedAmount, unit, targetSystem);
    } else {
      // Treat as weight (28g per oz)
      converted = convertWeight(parsedAmount, unit, targetSystem);
    }
  } else if (isVolumeUnit(unit)) {
    converted = convertVolume(parsedAmount, unit, targetSystem);
  } else if (isWeightUnit(unit)) {
    converted = convertWeight(parsedAmount, unit, targetSystem);
  } else {
    return ingredient; // Unknown unit type
  }

  return {
    ...ingredient,
    amount: formatAmount(converted.amount),
    units: converted.unit,
  };
}

/**
 * Convert all ingredients in a group to the target unit system
 */
export function convertIngredientGroupUnits(
  groups: Array<{ groupName: string; ingredients: (string | Ingredient)[] }>,
  targetSystem: UnitSystem
): Array<{ groupName: string; ingredients: (string | Ingredient)[] }> {
  if (targetSystem === 'original') {
    return groups;
  }

  return groups.map(group => ({
    ...group,
    ingredients: group.ingredients.map(ing => {
      if (typeof ing === 'string') {
        return ing;
      }
      return convertIngredientUnits(ing, targetSystem);
    }),
  }));
}

import type { Ingredient, IngredientGroup } from "@/lib/types";

export type UnitSystem = "metric" | "imperial";

// Volume conversions (to mL)
const VOLUME_TO_ML: Record<string, number> = {
  tsp: 4.929,
  teaspoon: 4.929,
  teaspoons: 4.929,
  tbsp: 14.787,
  tablespoon: 14.787,
  tablespoons: 14.787,
  "fl oz": 29.574,
  cup: 236.588,
  cups: 236.588,
  pint: 473.176,
  pints: 473.176,
  quart: 946.353,
  quarts: 946.353,
  gallon: 3785.41,
  gallons: 3785.41,
  ml: 1,
  mL: 1,
  milliliter: 1,
  milliliters: 1,
  millilitre: 1,
  millilitres: 1,
  l: 1000,
  L: 1000,
  liter: 1000,
  liters: 1000,
  litre: 1000,
  litres: 1000,
};

// Weight conversions (to grams)
const WEIGHT_TO_GRAMS: Record<string, number> = {
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
};

// Metric volume units (already metric)
const METRIC_VOLUME = new Set(["ml", "mL", "milliliter", "milliliters", "millilitre", "millilitres", "l", "L", "liter", "liters", "litre", "litres"]);
const METRIC_WEIGHT = new Set(["g", "gram", "grams", "kg", "kilogram", "kilograms"]);
const IMPERIAL_VOLUME = new Set(["tsp", "teaspoon", "teaspoons", "tbsp", "tablespoon", "tablespoons", "fl oz", "cup", "cups", "pint", "pints", "quart", "quarts", "gallon", "gallons"]);
const IMPERIAL_WEIGHT = new Set(["oz", "ounce", "ounces", "lb", "lbs", "pound", "pounds"]);

function parseAmount(amount: string): number | null {
  const trimmed = amount.trim();
  if (!trimmed) return null;

  // Handle unicode fractions
  const fractionMap: Record<string, number> = {
    "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75,
    "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
  };

  // "2 ½" or "2½"
  let total = 0;
  let remaining = trimmed;

  // Leading whole number
  const wholeMatch = remaining.match(/^(\d+)\s*/);
  if (wholeMatch) {
    total += parseInt(wholeMatch[1], 10);
    remaining = remaining.slice(wholeMatch[0].length);
  }

  // Unicode fraction
  for (const [char, val] of Object.entries(fractionMap)) {
    if (remaining.includes(char)) {
      total += val;
      remaining = remaining.replace(char, "").trim();
      return total;
    }
  }

  // Slash fraction: "1/2"
  const slashMatch = remaining.match(/^(\d+)\/(\d+)/);
  if (slashMatch) {
    total += parseInt(slashMatch[1], 10) / parseInt(slashMatch[2], 10);
    return total;
  }

  // Plain number
  if (total === 0) {
    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
  }

  return total;
}

function formatAmount(value: number): string {
  // Clean fractions for common values
  const fractions: [number, string][] = [
    [0.125, "⅛"], [0.25, "¼"], [1 / 3, "⅓"], [0.375, "⅜"],
    [0.5, "½"], [0.625, "⅝"], [2 / 3, "⅔"], [0.75, "¾"], [0.875, "⅞"],
  ];

  const whole = Math.floor(value);
  const frac = value - whole;

  if (frac < 0.01) return whole.toString();

  for (const [threshold, symbol] of fractions) {
    if (Math.abs(frac - threshold) < 0.02) {
      return whole > 0 ? `${whole} ${symbol}` : symbol;
    }
  }

  // Round to 1 decimal
  return value % 1 === 0 ? value.toString() : value.toFixed(1);
}

function convertVolume(ml: number, target: "metric" | "imperial"): { amount: number; units: string } {
  if (target === "metric") {
    if (ml >= 1000) return { amount: ml / 1000, units: "L" };
    return { amount: ml, units: "mL" };
  }
  // Imperial
  if (ml >= 3785) return { amount: ml / 3785.41, units: "gallon" };
  if (ml >= 946) return { amount: ml / 946.353, units: "quart" };
  if (ml >= 236) return { amount: ml / 236.588, units: "cup" };
  if (ml >= 14.5) return { amount: ml / 14.787, units: "tbsp" };
  return { amount: ml / 4.929, units: "tsp" };
}

function convertWeight(grams: number, target: "metric" | "imperial"): { amount: number; units: string } {
  if (target === "metric") {
    if (grams >= 1000) return { amount: grams / 1000, units: "kg" };
    return { amount: grams, units: "g" };
  }
  // Imperial
  if (grams >= 453) return { amount: grams / 453.592, units: "lb" };
  return { amount: grams / 28.3495, units: "oz" };
}

/** Detect whether the recipe predominantly uses metric or imperial units. */
export function detectSystem(groups: IngredientGroup[]): UnitSystem {
  let metricCount = 0;
  let imperialCount = 0;

  for (const group of groups) {
    for (const ing of group.ingredients) {
      const unit = ing.units.trim();
      if (!unit) continue;
      if (METRIC_VOLUME.has(unit) || METRIC_WEIGHT.has(unit)) metricCount++;
      else if (IMPERIAL_VOLUME.has(unit) || IMPERIAL_WEIGHT.has(unit)) imperialCount++;
    }
  }

  // If recipe is mostly metric, default to imperial (and vice versa)
  return metricCount > imperialCount ? "imperial" : "metric";
}

export function convertIngredient(ingredient: Ingredient, target: UnitSystem): Ingredient {
  const unit = ingredient.units.trim();
  const numericAmount = parseAmount(ingredient.amount);
  if (numericAmount === null || !unit) return ingredient;

  // Check if already in target system
  if (target === "metric" && (METRIC_VOLUME.has(unit) || METRIC_WEIGHT.has(unit))) return ingredient;
  if (target === "imperial" && (IMPERIAL_VOLUME.has(unit) || IMPERIAL_WEIGHT.has(unit))) return ingredient;

  // Volume conversion
  const volumeFactor = VOLUME_TO_ML[unit];
  if (volumeFactor !== undefined) {
    const ml = numericAmount * volumeFactor;
    const converted = convertVolume(ml, target);
    return { ...ingredient, amount: formatAmount(converted.amount), units: converted.units };
  }

  // Weight conversion
  const weightFactor = WEIGHT_TO_GRAMS[unit];
  if (weightFactor !== undefined) {
    const grams = numericAmount * weightFactor;
    const converted = convertWeight(grams, target);
    return { ...ingredient, amount: formatAmount(converted.amount), units: converted.units };
  }

  // Unknown unit — return as-is
  return ingredient;
}

export function convertGroup(group: IngredientGroup, target: UnitSystem): IngredientGroup {
  return {
    ...group,
    ingredients: group.ingredients.map((ing) => convertIngredient(ing, target)),
  };
}

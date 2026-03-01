import type { Ingredient, IngredientGroup } from "@/lib/types";
import { parseAmount, formatAmount } from "./ingredientScaler";

export type UnitSystem = "metric" | "imperial";

interface Conversion {
  unit: string;
  factor: number;
}

// Imperial → Metric conversions
const IMPERIAL_TO_METRIC: Record<string, Conversion> = {
  // Volume
  cup: { unit: "ml", factor: 236.588 },
  cups: { unit: "ml", factor: 236.588 },
  tbsp: { unit: "ml", factor: 14.787 },
  tablespoon: { unit: "ml", factor: 14.787 },
  tablespoons: { unit: "ml", factor: 14.787 },
  tsp: { unit: "ml", factor: 4.929 },
  teaspoon: { unit: "ml", factor: 4.929 },
  teaspoons: { unit: "ml", factor: 4.929 },
  "fl oz": { unit: "ml", factor: 29.574 },
  "fluid ounce": { unit: "ml", factor: 29.574 },
  "fluid ounces": { unit: "ml", factor: 29.574 },
  quart: { unit: "ml", factor: 946.353 },
  quarts: { unit: "ml", factor: 946.353 },
  pint: { unit: "ml", factor: 473.176 },
  pints: { unit: "ml", factor: 473.176 },
  gallon: { unit: "L", factor: 3.785 },
  gallons: { unit: "L", factor: 3.785 },
  // Weight
  oz: { unit: "g", factor: 28.35 },
  ounce: { unit: "g", factor: 28.35 },
  ounces: { unit: "g", factor: 28.35 },
  lb: { unit: "g", factor: 453.592 },
  lbs: { unit: "g", factor: 453.592 },
  pound: { unit: "g", factor: 453.592 },
  pounds: { unit: "g", factor: 453.592 },
};

// Metric → Imperial conversions
const METRIC_TO_IMPERIAL: Record<string, Conversion> = {
  // Volume
  ml: { unit: "tsp", factor: 1 / 4.929 },
  milliliter: { unit: "tsp", factor: 1 / 4.929 },
  milliliters: { unit: "tsp", factor: 1 / 4.929 },
  millilitre: { unit: "tsp", factor: 1 / 4.929 },
  millilitres: { unit: "tsp", factor: 1 / 4.929 },
  l: { unit: "cups", factor: 1 / 0.237 },
  liter: { unit: "cups", factor: 1 / 0.237 },
  liters: { unit: "cups", factor: 1 / 0.237 },
  litre: { unit: "cups", factor: 1 / 0.237 },
  litres: { unit: "cups", factor: 1 / 0.237 },
  // Weight
  g: { unit: "oz", factor: 1 / 28.35 },
  gram: { unit: "oz", factor: 1 / 28.35 },
  grams: { unit: "oz", factor: 1 / 28.35 },
  kg: { unit: "lbs", factor: 2.205 },
  kilogram: { unit: "lbs", factor: 2.205 },
  kilograms: { unit: "lbs", factor: 2.205 },
};

/**
 * Smartly pick the best metric unit to avoid awkward values
 * e.g. 1 cup = 237 ml (not 0.237 L), but 1 gallon = 3.8 L (not 3785 ml)
 */
function smartMetricUnit(ml: number): { amount: number; unit: string } {
  if (ml >= 1000) return { amount: ml / 1000, unit: "L" };
  return { amount: ml, unit: "ml" };
}

/**
 * Smartly pick the best imperial volume unit
 * e.g. 5 ml = 1 tsp, 15 ml = 1 tbsp, 237 ml = 1 cup
 */
function smartImperialVolume(tsp: number): { amount: number; unit: string } {
  if (tsp >= 48) return { amount: tsp / 48, unit: "cups" };
  if (tsp >= 3) return { amount: tsp / 3, unit: "tbsp" };
  return { amount: tsp, unit: "tsp" };
}

function smartMetricWeight(g: number): { amount: number; unit: string } {
  if (g >= 1000) return { amount: g / 1000, unit: "kg" };
  return { amount: g, unit: "g" };
}

function smartImperialWeight(oz: number): { amount: number; unit: string } {
  if (oz >= 16) return { amount: oz / 16, unit: "lbs" };
  return { amount: oz, unit: "oz" };
}

function formatMetricAmount(value: number): string {
  if (value >= 100) return Math.round(value).toString();
  if (value >= 10) return (Math.round(value * 2) / 2).toString(); // round to nearest 0.5
  return formatAmount(value);
}

/**
 * Detect whether a recipe's ingredients are predominantly metric or imperial.
 */
export function detectUnitSystem(groups: IngredientGroup[]): UnitSystem {
  let imperial = 0;
  let metric = 0;
  for (const group of groups) {
    for (const ing of group.ingredients) {
      if (!ing.units) continue;
      const u = ing.units.toLowerCase().trim();
      if (u in IMPERIAL_TO_METRIC) imperial++;
      if (u in METRIC_TO_IMPERIAL) metric++;
    }
  }
  return metric > imperial ? "metric" : "imperial";
}

function convertIngredient(
  ingredient: Ingredient,
  targetSystem: UnitSystem,
  sourceSystem: UnitSystem
): Ingredient {
  if (targetSystem === sourceSystem) return ingredient;
  if (!ingredient.amount || !ingredient.units) return ingredient;

  const unitLower = ingredient.units.toLowerCase().trim();
  const parsed = parseAmount(ingredient.amount);
  if (parsed === null) return ingredient;

  const conversionMap =
    targetSystem === "metric" ? IMPERIAL_TO_METRIC : METRIC_TO_IMPERIAL;
  const conversion = conversionMap[unitLower];
  if (!conversion) return ingredient;

  const rawValue = parsed * conversion.factor;

  // Apply smart unit selection
  let finalAmount: number;
  let finalUnit: string;

  if (targetSystem === "metric") {
    // Check if this was a volume or weight conversion
    if (conversion.unit === "ml") {
      const smart = smartMetricUnit(rawValue);
      finalAmount = smart.amount;
      finalUnit = smart.unit;
    } else if (conversion.unit === "g") {
      const smart = smartMetricWeight(rawValue);
      finalAmount = smart.amount;
      finalUnit = smart.unit;
    } else {
      finalAmount = rawValue;
      finalUnit = conversion.unit;
    }
  } else {
    if (conversion.unit === "tsp") {
      const smart = smartImperialVolume(rawValue);
      finalAmount = smart.amount;
      finalUnit = smart.unit;
    } else if (conversion.unit === "oz") {
      const smart = smartImperialWeight(rawValue);
      finalAmount = smart.amount;
      finalUnit = smart.unit;
    } else {
      finalAmount = rawValue;
      finalUnit = conversion.unit;
    }
  }

  return {
    ...ingredient,
    amount: formatMetricAmount(finalAmount),
    units: finalUnit,
  };
}

export function convertIngredients(
  groups: IngredientGroup[],
  targetSystem: UnitSystem,
  sourceSystem: UnitSystem
): IngredientGroup[] {
  if (targetSystem === sourceSystem) return groups;
  return groups.map((group) => ({
    ...group,
    ingredients: group.ingredients.map((ing) =>
      convertIngredient(ing, targetSystem, sourceSystem)
    ),
  }));
}

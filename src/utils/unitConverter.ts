import type { Ingredient, IngredientGroup, InstructionStep } from "@/lib/types";
import { parseAmount, formatAmount, FRACTION_MAP } from "./ingredientScaler";

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

  const conversionMap = targetSystem === "metric" ? IMPERIAL_TO_METRIC : METRIC_TO_IMPERIAL;
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
    ingredients: group.ingredients.map((ing) => convertIngredient(ing, targetSystem, sourceSystem)),
  }));
}

// ---------------------------------------------------------------------------
// Inline text conversion (for instruction steps)
// ---------------------------------------------------------------------------

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PACKAGE_NOUNS = new Set([
  "bag",
  "bags",
  "bottle",
  "bottles",
  "box",
  "boxes",
  "can",
  "cans",
  "carton",
  "cartons",
  "container",
  "containers",
  "jar",
  "jars",
  "package",
  "packages",
  "packet",
  "packets",
  "pouch",
  "pouches",
  "stick",
  "sticks",
  "tin",
  "tins",
  "tube",
  "tubes",
]);

function isPackageSizeReference(text: string, matchEnd: number): boolean {
  const trailingText = text.slice(matchEnd).replace(/^[\s)\].,;-]+/, "");
  const nextWord = trailingText.match(/^([a-zA-Z]+)/)?.[1]?.toLowerCase();
  return nextWord ? PACKAGE_NOUNS.has(nextWord) : false;
}

function convertTemperatures(
  text: string,
  targetSystem: UnitSystem,
  sourceSystem: UnitSystem
): string {
  const fToC = targetSystem === "metric" && sourceSystem === "imperial";
  const cToF = targetSystem === "imperial" && sourceSystem === "metric";
  if (!fToC && !cToF) return text;

  const tempRegex = /(\d+)\s*(?:°\s*|degrees?\s+)(F(?:ahrenheit)?|C(?:elsius)?)\b/gi;

  return text.replace(tempRegex, (match, numStr, unit) => {
    const temp = parseInt(numStr, 10);
    const isF = unit.toUpperCase().startsWith("F");
    const isC = unit.toUpperCase().startsWith("C");

    if (fToC && isF) {
      const celsius = Math.round(((temp - 32) * 5) / 9);
      return match.includes("°") ? `${celsius}°C` : `${celsius} degrees C`;
    }
    if (cToF && isC) {
      const fahrenheit = Math.round((temp * 9) / 5 + 32);
      return match.includes("°") ? `${fahrenheit}°F` : `${fahrenheit} degrees F`;
    }
    return match;
  });
}

function convertMeasurements(text: string, targetSystem: UnitSystem): string {
  const conversionMap = targetSystem === "metric" ? IMPERIAL_TO_METRIC : METRIC_TO_IMPERIAL;

  // Build unit pattern from map keys, longest-first to avoid partial matches
  const unitKeys = Object.keys(conversionMap).sort((a, b) => b.length - a.length);
  const unitPattern = unitKeys.map(escapeRegExp).join("|");

  // Unicode fraction chars for the number pattern
  const unicodeFracs = Object.keys(FRACTION_MAP).join("");

  // Number pattern: mixed fractions (1 1/2), simple fractions (1/2),
  // decimals with optional unicode frac (1½), or standalone unicode frac (½)
  const numberPattern = String.raw`(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?(?:\s*[${unicodeFracs}])?|[${unicodeFracs}])`;

  const regex = new RegExp(`${numberPattern}\\s*(${unitPattern})(?=\\s|[.,;:!?)]|$)`, "gi");

  return text.replace(regex, (match, numPart, unitPart, offset, fullText) => {
    if (typeof offset !== "number" || typeof fullText !== "string") {
      return match;
    }

    // Leave package-size references verbatim: "12 oz can", "1 (14 oz) package", etc.
    if (isPackageSizeReference(fullText, offset + match.length)) {
      return match;
    }

    const parsed = parseAmount(numPart.trim());
    if (parsed === null) return match;

    const unitLower = unitPart.toLowerCase().trim();
    const conversion = conversionMap[unitLower];
    if (!conversion) return match;

    const rawValue = parsed * conversion.factor;

    let finalAmount: number;
    let finalUnit: string;

    if (targetSystem === "metric") {
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

    return `${formatMetricAmount(finalAmount)} ${finalUnit}`;
  });
}

export function convertInstructionText(
  text: string,
  targetSystem: UnitSystem,
  sourceSystem: UnitSystem
): string {
  if (targetSystem === sourceSystem) return text;
  let result = convertTemperatures(text, targetSystem, sourceSystem);
  result = convertMeasurements(result, targetSystem);
  return result;
}

export function convertInstructions(
  instructions: InstructionStep[],
  targetSystem: UnitSystem,
  sourceSystem: UnitSystem
): InstructionStep[] {
  if (targetSystem === sourceSystem) return instructions;
  return instructions.map((step) => ({
    ...step,
    detail: convertInstructionText(step.detail, targetSystem, sourceSystem),
    ...(step.tips && {
      tips: convertInstructionText(step.tips, targetSystem, sourceSystem),
    }),
  }));
}

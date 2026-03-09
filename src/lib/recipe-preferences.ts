import type {
  DietaryOption,
  Substitution,
  TemperatureUnit,
  UnitSystem,
} from "@/lib/preferences";
import type { Ingredient, IngredientGroup, InstructionStep } from "@/lib/types";
import { formatAmount, parseAmount } from "@/utils/ingredientScaler";

const DIETARY_CONFLICT_PATTERNS: Record<DietaryOption, RegExp[]> = {
  "Dairy-free": [
    /\b(?:milk|butter|cream|cheese|yogurt|whey|parmesan|mozzarella|ricotta|feta|ghee)\b/i,
  ],
  "Gluten-free": [
    /\b(?:flour|bread|breadcrumbs|panko|pasta|noodles|soy sauce|wheat|barley|rye)\b/i,
  ],
  Vegetarian: [
    /\b(?:anchovy|bacon|beef|chicken|fish sauce|gelatin|ham|lamb|pork|prosciutto|sausage|shrimp|turkey|tuna)\b/i,
  ],
  Vegan: [
    /\b(?:anchovy|bacon|beef|butter|cheese|chicken|cream|egg|eggs|fish sauce|gelatin|ghee|ham|honey|lamb|milk|pork|prosciutto|sausage|shrimp|turkey|tuna|whey|yogurt)\b/i,
  ],
  "Nut-free": [
    /\b(?:almond|cashew|hazelnut|macadamia|nut|peanut|pecan|pistachio|walnut)\b/i,
  ],
  "Low-sodium": [/\b(?:salt|soy sauce|tamari|miso|broth|stock|bouillon)\b/i],
  "Shellfish-free": [
    /\b(?:clam|crab|lobster|mussel|oyster|prawn|scallop|shellfish|shrimp)\b/i,
  ],
};

type UnitFamily = "volume" | "weight";
type UnitDefinition = {
  aliases: string[];
  canonical: string;
  system: Exclude<UnitSystem, "original">;
  family: UnitFamily;
  toBase: number;
};

const UNIT_DEFINITIONS: UnitDefinition[] = [
  {
    aliases: ["tsp", "tsps", "teaspoon", "teaspoons"],
    canonical: "tsp",
    system: "imperial",
    family: "volume",
    toBase: 4.92892,
  },
  {
    aliases: ["tbsp", "tbsps", "tablespoon", "tablespoons"],
    canonical: "tbsp",
    system: "imperial",
    family: "volume",
    toBase: 14.7868,
  },
  {
    aliases: ["cup", "cups"],
    canonical: "cup",
    system: "imperial",
    family: "volume",
    toBase: 240,
  },
  {
    aliases: ["pt", "pts", "pint", "pints"],
    canonical: "pt",
    system: "imperial",
    family: "volume",
    toBase: 473.176,
  },
  {
    aliases: ["qt", "qts", "quart", "quarts"],
    canonical: "qt",
    system: "imperial",
    family: "volume",
    toBase: 946.353,
  },
  {
    aliases: ["gal", "gallon", "gallons"],
    canonical: "gal",
    system: "imperial",
    family: "volume",
    toBase: 3785.41,
  },
  {
    aliases: ["fl oz", "fluid ounce", "fluid ounces"],
    canonical: "fl oz",
    system: "imperial",
    family: "volume",
    toBase: 29.5735,
  },
  {
    aliases: ["oz", "ounce", "ounces"],
    canonical: "oz",
    system: "imperial",
    family: "weight",
    toBase: 28.3495,
  },
  {
    aliases: ["lb", "lbs", "pound", "pounds"],
    canonical: "lb",
    system: "imperial",
    family: "weight",
    toBase: 453.592,
  },
  {
    aliases: ["ml", "milliliter", "milliliters", "millilitre", "millilitres"],
    canonical: "mL",
    system: "metric",
    family: "volume",
    toBase: 1,
  },
  {
    aliases: ["l", "liter", "liters", "litre", "litres"],
    canonical: "L",
    system: "metric",
    family: "volume",
    toBase: 1000,
  },
  {
    aliases: ["g", "gram", "grams"],
    canonical: "g",
    system: "metric",
    family: "weight",
    toBase: 1,
  },
  {
    aliases: ["kg", "kilogram", "kilograms"],
    canonical: "kg",
    system: "metric",
    family: "weight",
    toBase: 1000,
  },
];

function normalizeUnit(unit: string) {
  return unit.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
}

function getUnitDefinition(unit: string) {
  const normalized = normalizeUnit(unit);
  return UNIT_DEFINITIONS.find((definition) => definition.aliases.includes(normalized));
}

function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(value.trim());
  }

  return result;
}

function roundToQuarter(value: number) {
  return Math.round(value * 4) / 4;
}

function formatMetricAmount(value: number, unit: "g" | "kg" | "mL" | "L") {
  const rounded =
    unit === "g" || unit === "mL" ? Math.round(value) : Math.round(value * 10) / 10;

  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(1).replace(/\.0$/, "");
}

function formatImperialAmount(value: number) {
  return formatAmount(roundToQuarter(value));
}

type ConvertedTarget = {
  unit: string;
  fromBase: (baseAmount: number) => string;
};

function getConvertedTarget(
  baseAmount: number,
  family: UnitFamily,
  targetSystem: Exclude<UnitSystem, "original">
): ConvertedTarget | null {
  if (targetSystem === "metric") {
    if (family === "weight") {
      if (baseAmount >= 1000) {
        return {
          unit: "kg",
          fromBase: (value) => formatMetricAmount(value / 1000, "kg"),
        };
      }
      return { unit: "g", fromBase: (value) => formatMetricAmount(value, "g") };
    }

    if (baseAmount >= 1000) {
      return { unit: "L", fromBase: (value) => formatMetricAmount(value / 1000, "L") };
    }
    return { unit: "mL", fromBase: (value) => formatMetricAmount(value, "mL") };
  }

  if (family === "weight") {
    const ounces = baseAmount / 28.3495;
    if (ounces < 0.25) return null;

    if (ounces >= 16) {
      return { unit: "lb", fromBase: (value) => formatImperialAmount(value / 453.592) };
    }

    return { unit: "oz", fromBase: (value) => formatImperialAmount(value / 28.3495) };
  }

  const teaspoons = baseAmount / 4.92892;
  if (teaspoons < 0.25) return null;

  if (baseAmount >= 120) {
    return { unit: "cup", fromBase: (value) => formatImperialAmount(value / 240) };
  }

  if (baseAmount >= 22.5) {
    return { unit: "tbsp", fromBase: (value) => formatImperialAmount(value / 14.7868) };
  }

  return { unit: "tsp", fromBase: (value) => formatImperialAmount(value / 4.92892) };
}

function parseAmountParts(amount: string) {
  const normalized = amount.trim().replace(/[–—]/g, "-");

  if (normalized.includes(" to ")) {
    const [from, to] = normalized.split(" to ");
    const fromValue = parseAmount(from);
    const toValue = parseAmount(to);

    if (fromValue === null || toValue === null) return null;

    return { values: [fromValue, toValue], joiner: " to " as const };
  }

  if (normalized.includes("-")) {
    const [from, to] = normalized.split("-");
    const fromValue = parseAmount(from);
    const toValue = parseAmount(to);

    if (fromValue === null || toValue === null) return null;

    return { values: [fromValue, toValue], joiner: "-" as const };
  }

  const parsed = parseAmount(normalized);
  if (parsed === null) return null;

  return { values: [parsed], joiner: "" as const };
}

function convertIngredientUnits(ingredient: Ingredient, unitSystem: UnitSystem): Ingredient {
  if (unitSystem === "original" || !ingredient.units) return ingredient;

  const definition = getUnitDefinition(ingredient.units);
  if (!definition || definition.system === unitSystem) return ingredient;

  const parsedAmount = parseAmountParts(ingredient.amount);
  if (!parsedAmount) return ingredient;

  const baseValues = parsedAmount.values.map((value) => value * definition.toBase);
  const target = getConvertedTarget(Math.max(...baseValues), definition.family, unitSystem);

  if (!target) return ingredient;

  const amount = baseValues.map((value) => target.fromBase(value)).join(parsedAmount.joiner);

  return {
    ...ingredient,
    amount,
    units: target.unit,
  };
}

function buildDietaryAlerts(ingredient: Ingredient, dietaryProfile: DietaryOption[]) {
  if (dietaryProfile.length === 0) return [];

  const haystack = `${ingredient.ingredient} ${ingredient.description || ""}`.trim();
  return dietaryProfile.filter((option) =>
    DIETARY_CONFLICT_PATTERNS[option].some((pattern) => pattern.test(haystack))
  );
}

function mergePersonalSubstitutions(ingredient: Ingredient, substitutions: Substitution[]) {
  const ingredientName = ingredient.ingredient.toLowerCase();
  const matching = substitutions
    .filter((substitution) => substitution.from.trim() && substitution.to.trim())
    .filter((substitution) => ingredientName.includes(substitution.from.trim().toLowerCase()))
    .map((substitution) => substitution.to.trim());

  return dedupeStrings([...(ingredient.substitutions || []), ...matching]);
}

export function annotateIngredientGroups(
  groups: IngredientGroup[],
  dietaryProfile: DietaryOption[],
  substitutions: Substitution[]
) {
  return groups.map((group) => ({
    ...group,
    ingredients: group.ingredients.map((ingredient) => ({
      ...ingredient,
      alerts: buildDietaryAlerts(ingredient, dietaryProfile),
      substitutions: mergePersonalSubstitutions(ingredient, substitutions),
    })),
  }));
}

function getValidSubstitutions(substitutions: Substitution[]) {
  return substitutions.filter(
    (substitution) => substitution.from.trim() && substitution.to.trim()
  );
}

export function countApplicableSubstitutions(
  groups: IngredientGroup[],
  substitutions: Substitution[]
): number {
  const valid = getValidSubstitutions(substitutions);
  if (valid.length === 0) return 0;

  let count = 0;
  for (const group of groups) {
    for (const ingredient of group.ingredients) {
      const name = ingredient.ingredient.toLowerCase();
      if (valid.some((s) => name.includes(s.from.trim().toLowerCase()))) {
        count++;
      }
    }
  }
  return count;
}

export function applySubstitutionsToGroups(
  groups: IngredientGroup[],
  substitutions: Substitution[]
): IngredientGroup[] {
  const valid = getValidSubstitutions(substitutions);
  if (valid.length === 0) return groups;

  return groups.map((group) => ({
    ...group,
    ingredients: group.ingredients.map((ingredient) => {
      let name = ingredient.ingredient;
      for (const { from, to } of valid) {
        const pattern = new RegExp(from.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        name = name.replace(pattern, to.trim());
      }
      if (name === ingredient.ingredient) return ingredient;
      return { ...ingredient, ingredient: name };
    }),
  }));
}

export function convertIngredientGroups(groups: IngredientGroup[], unitSystem: UnitSystem) {
  if (unitSystem === "original") return groups;

  return groups.map((group) => ({
    ...group,
    ingredients: group.ingredients.map((ingredient) =>
      convertIngredientUnits(ingredient, unitSystem)
    ),
  }));
}

function convertSingleTemperature(value: number, targetUnit: TemperatureUnit) {
  if (targetUnit === "c") {
    return Math.round((((value - 32) * 5) / 9) / 5) * 5;
  }

  return Math.round((((value * 9) / 5 + 32) / 5)) * 5;
}

function replaceTemperatures(text: string, targetUnit: TemperatureUnit) {
  return text.replace(
    /(\d{2,3})\s*(?:°|degrees?\s+)\s*([fc])\b/gi,
    (match, rawValue, rawUnit) => {
      const unit = rawUnit.toLowerCase() as TemperatureUnit;
      if (unit === targetUnit) return match;

      const value = Number(rawValue);
      if (!Number.isFinite(value)) return match;

      return `${convertSingleTemperature(value, targetUnit)}°${targetUnit.toUpperCase()}`;
    }
  );
}

export function convertInstructionTemperatures(
  steps: InstructionStep[],
  temperatureUnit: TemperatureUnit
) {
  return steps.map((step) => ({
    ...step,
    detail: replaceTemperatures(step.detail, temperatureUnit),
    tips: step.tips ? replaceTemperatures(step.tips, temperatureUnit) : step.tips,
  }));
}

export function getPreferredServings(
  originalServings: number | undefined,
  defaultServings: number
) {
  if (!originalServings || originalServings < 1) return originalServings;
  return Math.max(1, Math.min(99, defaultServings));
}

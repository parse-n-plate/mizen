import type {
  EquipmentItem,
  Ingredient,
  IngredientGroup,
  InstructionStep,
  ParsedRecipe,
} from "@/lib/types";

export class RecipeMarkdownError extends Error {}

const SECTION_HEADER = /^##\s+(.+?)\s*$/;
const GROUP_HEADER = /^###\s+(.+?)\s*$/;
const BULLET = /^[-*]\s+(.*)$/;
const NUMBERED = /^(\d+)\.\s+(.*)$/;
const BLOCKQUOTE = /^>\s?(.*)$/;
const TIP_LINE = /^\*Tip:\s*(.+?)\*?$/i;
const LEADING_QUANTITY = /^[\d¼½¾⅓⅔⅛⅜⅝⅞.]/;
const QUANTITY_TOKEN = /^(?:\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?|\d+\/\d+|[¼½¾⅓⅔⅛⅜⅝⅞])$/;

const META_LABELS: Array<{
  key: "servings" | "prepTimeMinutes" | "cookTimeMinutes";
  pattern: RegExp;
}> = [
  { key: "servings", pattern: /\*\*Servings:?\*\*\s*([\d.]+)/i },
  { key: "prepTimeMinutes", pattern: /\*\*Prep(?:\s*Time)?:?\*\*\s*([\d.]+)/i },
  { key: "cookTimeMinutes", pattern: /\*\*Cook(?:\s*Time)?:?\*\*\s*([\d.]+)/i },
];

function formatQuantity(amount: string, units: string): string {
  return [amount, units].filter(Boolean).join(" ").trim();
}

function splitOnDelimiter(text: string, delimiters: string[]): [string, string | undefined] {
  for (const delimiter of delimiters) {
    const index = text.indexOf(delimiter);
    if (index !== -1) {
      return [
        text.slice(0, index).trim(),
        text.slice(index + delimiter.length).trim() || undefined,
      ];
    }
  }
  return [text.trim(), undefined];
}

function normalizeForMatch(text: string): string {
  return text.trim().toLowerCase();
}

function parseQuantityText(quantity: string): { amount: string; units: string } {
  if (!LEADING_QUANTITY.test(quantity)) {
    return { amount: quantity, units: "" };
  }

  const spaceIndex = quantity.search(/\s/);
  if (spaceIndex === -1) {
    return { amount: quantity, units: "" };
  }

  return {
    amount: quantity.slice(0, spaceIndex).trim(),
    units: quantity.slice(spaceIndex + 1).trim(),
  };
}

function splitPlainQuantity(text: string): { amount: string; units: string; rest: string } {
  const tokens = text.trim().split(/\s+/);
  const amountTokens: string[] = [];

  while (tokens.length > 0 && QUANTITY_TOKEN.test(tokens[0])) {
    amountTokens.push(tokens.shift()!);
  }

  if (amountTokens.length === 0 || tokens.length < 2) {
    return { amount: "", units: "", rest: text.trim() };
  }

  const units = tokens.shift()!;
  return {
    amount: amountTokens.join(" "),
    units,
    rest: tokens.join(" ").trim(),
  };
}

/** Serializes a recipe's editable content (everything but the title) to plain-text Markdown. */
export function recipeToMarkdown(recipe: ParsedRecipe): string {
  const lines: string[] = [];

  if (recipe.summary) {
    lines.push(`> ${recipe.summary}`, "");
  }

  const metaParts: string[] = [];
  if (recipe.servings) metaParts.push(`**Servings:** ${recipe.servings}`);
  if (recipe.prepTimeMinutes) metaParts.push(`**Prep:** ${recipe.prepTimeMinutes} min`);
  if (recipe.cookTimeMinutes) metaParts.push(`**Cook:** ${recipe.cookTimeMinutes} min`);
  if (metaParts.length > 0) {
    lines.push(metaParts.join(" | "), "");
  }

  lines.push("## Ingredients", "");
  const singleMainGroup =
    recipe.ingredients.length === 1 && recipe.ingredients[0].groupName.toLowerCase() === "main";
  for (const group of recipe.ingredients) {
    if (!singleMainGroup) {
      lines.push(`### ${group.groupName}`, "");
    }
    for (const ing of group.ingredients) {
      const quantity = formatQuantity(ing.amount, ing.units);
      const namePart = quantity ? `**${quantity}** ${ing.ingredient}` : ing.ingredient;
      lines.push(`- ${ing.description ? `${namePart} — ${ing.description}` : namePart}`);
    }
    lines.push("");
  }

  lines.push("## Instructions", "");
  recipe.instructions.forEach((step, i) => {
    const titlePart = step.title ? `**${step.title}** — ` : "";
    lines.push(`${i + 1}. ${titlePart}${step.detail}`);
    if (step.tips) {
      lines.push(`   *Tip: ${step.tips}*`);
    }
  });
  lines.push("");

  if (recipe.equipment && recipe.equipment.length > 0) {
    lines.push("## Equipment", "");
    for (const item of recipe.equipment) {
      lines.push(`- ${item.name}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

interface ParsedMarkdownRecipe {
  summary?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  ingredients: IngredientGroup[];
  instructions: InstructionStep[];
  equipment: EquipmentItem[];
}

function parseIngredientLine(text: string): Ingredient {
  let rest = text.trim();
  let amount = "";
  let units = "";

  const boldMatch = rest.match(/^\*\*(.+?)\*\*\s*(.*)$/);
  if (boldMatch) {
    const quantity = boldMatch[1].trim();
    rest = boldMatch[2].trim();
    ({ amount, units } = parseQuantityText(quantity));
  } else if (LEADING_QUANTITY.test(rest)) {
    const parsed = splitPlainQuantity(rest);
    if (parsed.amount) {
      amount = parsed.amount;
      units = parsed.units;
      rest = parsed.rest;
    }
  }

  const [namePart, description] = splitOnDelimiter(rest, [" — ", " – ", " - "]);

  return {
    amount,
    units,
    ingredient: namePart || "Ingredient",
    ...(description ? { description } : {}),
  };
}

function parseInstructionLine(text: string): InstructionStep {
  const trimmed = text.trim();
  const boldMatch = trimmed.match(/^\*\*(.+?)\*\*\s*(.*)$/);
  if (!boldMatch) {
    return { title: "", detail: trimmed };
  }
  const title = boldMatch[1].trim();
  const detail = boldMatch[2].trim().replace(/^[—–-]\s*/, "");
  return { title, detail: detail || title };
}

/** Parses the Markdown produced by {@link recipeToMarkdown} (or a user's edits to it) back into structured recipe fields. */
export function parseRecipeMarkdown(markdown: string): ParsedMarkdownRecipe {
  const rawLines = markdown.replace(/\r\n/g, "\n").split("\n");

  type Section = "preamble" | "ingredients" | "instructions" | "equipment";
  let section: Section = "preamble";

  const summaryLines: string[] = [];
  let servings: number | undefined;
  let prepTimeMinutes: number | undefined;
  let cookTimeMinutes: number | undefined;

  const ingredientGroups: IngredientGroup[] = [];
  const instructions: InstructionStep[] = [];
  const equipment: EquipmentItem[] = [];

  let currentGroup: IngredientGroup | null = null;
  let lastIngredient: Ingredient | null = null;
  let lastStep: InstructionStep | null = null;

  for (const raw of rawLines) {
    const trimmed = raw.trim();

    const sectionMatch = trimmed.match(SECTION_HEADER);
    if (sectionMatch) {
      const heading = sectionMatch[1].toLowerCase();
      if (heading.startsWith("ingredient")) section = "ingredients";
      else if (heading.startsWith("instruction") || heading.startsWith("direction"))
        section = "instructions";
      else if (heading.startsWith("equipment")) section = "equipment";
      else section = "preamble";
      currentGroup = null;
      lastIngredient = null;
      lastStep = null;
      continue;
    }

    if (section === "preamble") {
      const blockquoteMatch = trimmed.match(BLOCKQUOTE);
      if (blockquoteMatch) {
        summaryLines.push(blockquoteMatch[1]);
        continue;
      }
      if (!trimmed) continue;
      for (const { key, pattern } of META_LABELS) {
        const match = trimmed.match(pattern);
        if (match) {
          const value = Math.round(parseFloat(match[1]));
          if (key === "servings") servings = value;
          else if (key === "prepTimeMinutes") prepTimeMinutes = value;
          else cookTimeMinutes = value;
        }
      }
      continue;
    }

    if (section === "ingredients") {
      if (!trimmed) continue;
      const groupMatch = trimmed.match(GROUP_HEADER);
      if (groupMatch) {
        currentGroup = { groupName: groupMatch[1].trim(), ingredients: [] };
        ingredientGroups.push(currentGroup);
        lastIngredient = null;
        continue;
      }
      const bulletMatch = trimmed.match(BULLET);
      if (bulletMatch) {
        if (!currentGroup) {
          currentGroup = { groupName: "Main", ingredients: [] };
          ingredientGroups.push(currentGroup);
        }
        const ingredient = parseIngredientLine(bulletMatch[1]);
        currentGroup.ingredients.push(ingredient);
        lastIngredient = ingredient;
        continue;
      }
      if (lastIngredient) {
        lastIngredient.description = lastIngredient.description
          ? `${lastIngredient.description} ${trimmed}`
          : trimmed;
      }
      continue;
    }

    if (section === "instructions") {
      if (!trimmed) continue;
      const numberedMatch = trimmed.match(NUMBERED);
      if (numberedMatch) {
        const step = parseInstructionLine(numberedMatch[2]);
        instructions.push(step);
        lastStep = step;
        continue;
      }
      const tipMatch = trimmed.match(TIP_LINE);
      if (tipMatch && lastStep) {
        lastStep.tips = tipMatch[1].trim();
        continue;
      }
      if (lastStep) {
        lastStep.detail = `${lastStep.detail} ${trimmed}`.trim();
      }
      continue;
    }

    if (section === "equipment") {
      if (!trimmed) continue;
      const bulletMatch = trimmed.match(BULLET);
      if (bulletMatch) {
        equipment.push({ name: bulletMatch[1].trim(), stepNumbers: [] });
      }
      continue;
    }
  }

  const ingredients = ingredientGroups.filter((group) => group.ingredients.length > 0);

  if (ingredients.length === 0) {
    throw new RecipeMarkdownError(
      'Add at least one ingredient under an "## Ingredients" section, e.g. "- 2 cups flour".'
    );
  }
  if (instructions.length === 0) {
    throw new RecipeMarkdownError(
      'Add at least one numbered step under an "## Instructions" section, e.g. "1. Preheat the oven."'
    );
  }

  return {
    summary: summaryLines.length > 0 ? summaryLines.join(" ").trim() : undefined,
    servings,
    prepTimeMinutes,
    cookTimeMinutes,
    ingredients,
    instructions,
    equipment,
  };
}

/**
 * Re-parses edited Markdown and merges it into `original`, carrying over fields the Markdown
 * format doesn't expose (step images/timers, ingredient substitutions, equipment step refs) by
 * matching on the unchanged text they're keyed to. Throws {@link RecipeMarkdownError} on
 * unparseable input — callers should leave `original` untouched when that happens.
 */
export function buildUpdatedRecipe(
  original: ParsedRecipe,
  title: string,
  markdown: string
): ParsedRecipe {
  const parsed = parseRecipeMarkdown(markdown);

  const originalStepsByDetail = new Map<string, InstructionStep>();
  for (const step of original.instructions) {
    originalStepsByDetail.set(normalizeForMatch(step.detail), step);
  }
  const instructions = parsed.instructions.map((step) => {
    const match = originalStepsByDetail.get(normalizeForMatch(step.detail));
    if (!match) return step;
    return {
      ...step,
      timeMinutes: match.timeMinutes,
      timers: match.timers,
      ingredients: match.ingredients,
      imageUrl: match.imageUrl,
      imageUrls: match.imageUrls,
    };
  });

  const originalIngredientsByName = new Map<string, Ingredient>();
  for (const group of original.ingredients) {
    for (const ingredient of group.ingredients) {
      originalIngredientsByName.set(normalizeForMatch(ingredient.ingredient), ingredient);
    }
  }
  const ingredients = parsed.ingredients.map((group) => ({
    groupName: group.groupName || "Main",
    ingredients: group.ingredients.map((ingredient) => {
      const match = originalIngredientsByName.get(normalizeForMatch(ingredient.ingredient));
      return { ...ingredient, substitutions: match?.substitutions };
    }),
  }));

  const originalEquipmentByName = new Map<string, EquipmentItem>();
  for (const item of original.equipment ?? []) {
    originalEquipmentByName.set(normalizeForMatch(item.name), item);
  }
  const equipment = parsed.equipment.map((item) => {
    const match = originalEquipmentByName.get(normalizeForMatch(item.name));
    return match ? { ...item, stepNumbers: match.stepNumbers } : item;
  });

  return {
    ...original,
    title,
    summary: parsed.summary,
    servings: parsed.servings,
    prepTimeMinutes: parsed.prepTimeMinutes,
    cookTimeMinutes: parsed.cookTimeMinutes,
    ingredients,
    instructions,
    equipment: equipment.length > 0 ? equipment : undefined,
  };
}

/** Best-fit rule for V1: a recipe title must be non-empty and a reasonable length once trimmed. */
export function validateRecipeTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed) return "Title can't be empty.";
  if (trimmed.length > 200) return "Title must be 200 characters or fewer.";
  return null;
}

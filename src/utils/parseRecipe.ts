import * as cheerio from "cheerio";
import { z } from "zod";
import {
  getGroqClient,
  extractJsonFromAiResponse,
  GROQ_TEXT_MODEL,
  GROQ_VISION_MODEL,
} from "@/lib/groq";
import { logger } from "@/lib/logger";
import { CoreRecipeSchema, IngredientGroupSchema, EquipmentItemSchema } from "@/lib/schemas/recipe";
import { EXTRACTION_PROMPT, ENRICHMENT_PROMPT } from "@/lib/prompts/extraction";
import { cleanRecipeHTML, type CleanedHTML } from "./htmlCleaner";
import { COLLECTION_MESSAGE } from "./urlPatterns";
import { normalizeAmount, normalizeDecimalsInText } from "./ingredientScaler";
import type {
  Ingredient,
  EquipmentItem,
  ParsedRecipe,
  ParserResult,
  IngredientGroup,
  InstructionStep,
  TimeMarker,
} from "@/lib/types";

const log = logger.child({ module: "parseRecipe" });
const RECIPE_IMPORT_UNAVAILABLE_MESSAGE =
  "We couldn't process this recipe right now. Please try again in a moment.";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseISODuration(duration: string): number | undefined {
  if (!duration || typeof duration !== "string") return undefined;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return undefined;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const total = hours * 60 + minutes;
  return total > 0 ? total : undefined;
}

function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  return text
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function recipeImportError(error: unknown, source: "image" | "text" | "url"): ParserResult {
  log.error({ err: error, source }, "Recipe import failed");
  return {
    success: false,
    error: RECIPE_IMPORT_UNAVAILABLE_MESSAGE,
    method: "none",
  };
}

// ---------------------------------------------------------------------------
// Ingredient string parser — splits raw JSON-LD strings into structured fields
// ---------------------------------------------------------------------------

const UNITS = new Set([
  "cup",
  "cups",
  "c",
  "tablespoon",
  "tablespoons",
  "tbsp",
  "tbs",
  "tb",
  "teaspoon",
  "teaspoons",
  "tsp",
  "ts",
  "ounce",
  "ounces",
  "oz",
  "pound",
  "pounds",
  "lb",
  "lbs",
  "gram",
  "grams",
  "g",
  "kilogram",
  "kilograms",
  "kg",
  "milliliter",
  "milliliters",
  "ml",
  "liter",
  "liters",
  "l",
  "gallon",
  "gallons",
  "gal",
  "quart",
  "quarts",
  "qt",
  "pint",
  "pints",
  "pt",
  "fluid ounce",
  "fluid ounces",
  "fl oz",
  "pinch",
  "pinches",
  "dash",
  "dashes",
  "clove",
  "cloves",
  "sprig",
  "sprigs",
  "slice",
  "slices",
  "piece",
  "pieces",
  "can",
  "cans",
  "bunch",
  "bunches",
  "head",
  "heads",
  "stalk",
  "stalks",
  "serving",
  "servings",
  "package",
  "packages",
  "pkg",
  "stick",
  "sticks",
  "bag",
  "bags",
  "bottle",
  "bottles",
  "jar",
  "jars",
  "sheet",
  "sheets",
  "drop",
  "drops",
  "handful",
  "handfuls",
]);

// Matches leading amounts: "2", "2½", "1/2", "2 1/2", "6-8", "6–8"
const AMOUNT_RE =
  /^(\d+\s*[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|\d+\s*\/\s*\d+|\d+\s+\d+\s*\/\s*\d+|\d+\s*[–\-]\s*\d+|\d+(?:\.\d+)?|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])\s*/;

function parseIngredientString(raw: string): Ingredient {
  let text = raw.trim();

  // 1. Extract parenthetical content → description parts
  const descParts: string[] = [];

  // Double parens ((Optional)) → strip outer, keep inner
  text = text.replace(/\(\(([^)]*)\)\)/g, (_, inner: string) => {
    const cleaned = inner.trim();
    if (cleaned) descParts.push(cleaned);
    return "";
  });

  // Single parens (Japanese Soup Stock)
  text = text.replace(/\(([^)]*)\)/g, (_, inner: string) => {
    const cleaned = inner.trim();
    if (cleaned) descParts.push(cleaned);
    return "";
  });

  text = text.replace(/\s+/g, " ").trim();

  // 2. Extract leading amount
  let amount = "";
  const amountMatch = text.match(AMOUNT_RE);
  if (amountMatch) {
    amount = amountMatch[1].trim();
    text = text.slice(amountMatch[0].length).trim();
  }

  // 3. Extract unit (first word if it's a known unit)
  let units = "";
  // Check for two-word units first (e.g., "fl oz", "fluid ounce")
  const twoWordUnit = text.match(/^(\S+\s+\S+)\s+/);
  if (twoWordUnit && UNITS.has(twoWordUnit[1].toLowerCase())) {
    units = twoWordUnit[1];
    text = text.slice(twoWordUnit[0].length).trim();
  } else {
    const firstWord = text.match(/^(\S+)\s+/);
    if (firstWord && UNITS.has(firstWord[1].toLowerCase())) {
      units = firstWord[1];
      text = text.slice(firstWord[0].length).trim();
    }
  }

  // 4. If no amount was found, default to "as needed" (including unit-only forms like "pinch salt")
  if (!amount) {
    amount = "as needed";
  }

  const description = descParts.length > 0 ? descParts.join(". ") : undefined;

  return {
    amount,
    units,
    ingredient: text || raw.trim(),
    ...(description && { description }),
  };
}

function normalizeInstructionSteps(instructions: unknown): InstructionStep[] {
  if (!Array.isArray(instructions)) return [];

  const cleanLeading = (text: string): string => (text || "").replace(/^[\s.:;,\-–—]+/, "").trim();

  return instructions
    .map((item: unknown, index: number): InstructionStep | null => {
      if (typeof item === "string") {
        const detail = cleanLeading(item.trim());
        if (!detail) return null;
        return { title: `Step ${index + 1}`, detail };
      }
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const rawDetail =
          typeof obj.detail === "string"
            ? obj.detail
            : typeof obj.text === "string"
              ? obj.text
              : typeof obj.name === "string"
                ? obj.name
                : "";
        if (!rawDetail.trim()) return null;
        const aiTitle = typeof obj.title === "string" && obj.title.trim() ? obj.title.trim() : null;
        const title = aiTitle ? cleanLeading(aiTitle) : `Step ${index + 1}`;
        const detail = cleanLeading(rawDetail.trim());
        return {
          title,
          detail,
          timeMinutes: obj.timeMinutes as number | undefined,
          timers: Array.isArray(obj.timers) ? (obj.timers as TimeMarker[]) : undefined,
          ingredients: obj.ingredients as string[] | undefined,
          tips: obj.tips as string | undefined,
          imageUrl: obj.imageUrl as string | undefined,
          imageUrls: obj.imageUrls as string[] | undefined,
        };
      }
      return null;
    })
    .filter((step): step is InstructionStep => Boolean(step));
}

/**
 * If the ingredient name starts with the same word as units, strip the
 * duplicate. Handles plural/singular variants (tablespoon / tablespoons).
 */
function deduplicateUnits(groups: IngredientGroup[]): IngredientGroup[] {
  return groups.map((group) => ({
    ...group,
    ingredients: group.ingredients.map((ing) => {
      if (!ing.units || !ing.ingredient) return ing;
      const unit = ing.units.trim().toLowerCase();
      if (!unit) return ing;

      const ingredientText = ing.ingredient.trimStart();
      const name = ingredientText.toLowerCase();
      // Check exact match or plural/singular variant
      const variants = [unit];
      if (unit.endsWith("s") && unit.length > 1) variants.push(unit.slice(0, -1));
      else variants.push(unit + "s");

      for (const v of variants) {
        if (name.startsWith(v + " ")) {
          return { ...ing, ingredient: ingredientText.slice(v.length).trim() };
        }
      }
      return ing;
    }),
  }));
}

/**
 * Validate and extract equipment items from parsed AI response data.
 */
function extractEquipment(data: Record<string, unknown>): EquipmentItem[] | undefined {
  if (!Array.isArray(data.equipment) || data.equipment.length === 0) return undefined;
  const result = z.array(EquipmentItemSchema).safeParse(data.equipment);
  if (!result.success) return undefined;
  return result.data;
}

/**
 * Normalize all ingredient amounts, converting LLM-generated decimal
 * strings (e.g. "0.33333334326744") back to unicode fractions ("⅓").
 */
function normalizeIngredientAmounts(groups: IngredientGroup[]): IngredientGroup[] {
  return groups.map((group) => ({
    ...group,
    ingredients: group.ingredients.map((ing) => ({
      ...ing,
      amount: normalizeAmount(ing.amount),
    })),
  }));
}

/**
 * Normalize decimal numbers in instruction text back to unicode fractions.
 */
function normalizeInstructionText(instructions: InstructionStep[]): InstructionStep[] {
  return instructions.map((step) => ({
    ...step,
    detail: normalizeDecimalsInText(step.detail),
    ...(step.tips && { tips: normalizeDecimalsInText(step.tips) }),
  }));
}

/**
 * Merge step images into instructions that don't already have one.
 * Applies positionally — only fills in gaps.
 */
function mergeStepImages(instructions: InstructionStep[], htmlImages: string[][]): void {
  if (htmlImages.length === 0) return;
  const hasAnyImages = instructions.some(
    (s) => s.imageUrl || (s.imageUrls && s.imageUrls.length > 0)
  );
  if (hasAnyImages) return;

  const limit = Math.min(instructions.length, htmlImages.length);
  for (let i = 0; i < limit; i++) {
    const imgs = htmlImages[i];
    if (imgs.length > 0) {
      instructions[i].imageUrl = imgs[0];
      instructions[i].imageUrls = imgs;
    }
  }
}

// ---------------------------------------------------------------------------
// Step Image Extraction (HTML fallback)
// ---------------------------------------------------------------------------

function extractStepImagesFromHtml(rawHtml: string): string[][] {
  try {
    const $ = cheerio.load(rawHtml);
    const instructionSelectors = [
      '[class*="instruction"]',
      '[class*="direction"]',
      '[id*="instruction"]',
      '[id*="direction"]',
      '[itemprop="recipeInstructions"]',
      '[class*="steps"]',
      '[id*="steps"]',
      ".recipe-instructions, #recipe-instructions",
      ".recipe-directions, #recipe-directions",
      ".wprm-recipe-instructions-container",
      ".wprm-recipe-instruction",
      '[class*="wprm-recipe-instruction"]',
    ];

    let $container: ReturnType<typeof $> | null = null;
    for (const selector of instructionSelectors) {
      const $match = $(selector);
      if ($match.length) {
        const $parent = $match
          .first()
          .closest('[class*="instruction"], [class*="direction"], [class*="step"], section, div');
        $container = $parent.length ? $parent : $match.first().parent();
        break;
      }
    }

    if (!$container || !$container.length) return [];

    const images: string[][] = [];
    // Look for step elements within the container
    const $steps = $container.find('li, [class*="step"]');
    if ($steps.length === 0) return [];

    $steps.each((_, step) => {
      const stepImages: string[] = [];
      $(step)
        .find("img")
        .each((__, img) => {
          const src = $(img).attr("src") || $(img).attr("data-src") || "";
          if (src) stepImages.push(src);
        });
      images.push(stepImages);
    });

    return images;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Collection Page Detection (JSON-LD)
// ---------------------------------------------------------------------------

const COLLECTION_TYPES = new Set(["ItemList", "CollectionPage", "SearchResultsPage"]);

function detectCollectionSchema($: cheerio.CheerioAPI): boolean {
  try {
    const scripts = $('script[type="application/ld+json"]');
    let hasRecipe = false;
    let hasCollection = false;

    for (let i = 0; i < scripts.length; i++) {
      try {
        const content = $(scripts[i]).html();
        if (!content) continue;
        const data = JSON.parse(content);
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];

          if (types.includes("Recipe")) hasRecipe = true;
          if (types.some((t: string) => COLLECTION_TYPES.has(t))) hasCollection = true;

          if (Array.isArray(item["@graph"])) {
            for (const g of item["@graph"]) {
              const gTypes = Array.isArray(g["@type"]) ? g["@type"] : [g["@type"]];
              if (gTypes.includes("Recipe")) hasRecipe = true;
              if (gTypes.some((t: string) => COLLECTION_TYPES.has(t))) hasCollection = true;
            }
          }
        }
      } catch {
        continue;
      }
    }

    return hasCollection && !hasRecipe;
  } catch {
    // Let normal flow handle it
    return false;
  }
}

// ---------------------------------------------------------------------------
// Layer 1: JSON-LD Extraction
// ---------------------------------------------------------------------------

function extractFromJsonLd($: cheerio.CheerioAPI): ParsedRecipe | null {
  try {
    const scripts = $('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i++) {
      try {
        const scriptContent = $(scripts[i]).html();
        if (!scriptContent) continue;
        const data = JSON.parse(scriptContent);
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          const itemType = item["@type"];
          const isRecipeType =
            itemType === "Recipe" || (Array.isArray(itemType) && itemType.includes("Recipe"));

          if (
            isRecipeType ||
            (item["@graph"] &&
              Array.isArray(item["@graph"]) &&
              item["@graph"].some(
                (g: Record<string, unknown>) =>
                  g["@type"] === "Recipe" ||
                  (Array.isArray(g["@type"]) && (g["@type"] as string[]).includes("Recipe"))
              ))
          ) {
            const recipe = isRecipeType
              ? item
              : item["@graph"].find(
                  (g: Record<string, unknown>) =>
                    g["@type"] === "Recipe" ||
                    (Array.isArray(g["@type"]) && (g["@type"] as string[]).includes("Recipe"))
                );
            if (!recipe) continue;

            const title = decodeHtmlEntities(String(recipe.name || ""));
            const ingredientStrings: string[] = Array.isArray(recipe.recipeIngredient)
              ? recipe.recipeIngredient.filter(
                  (ing: unknown) => typeof ing === "string" && (ing as string).trim()
                )
              : [];

            const ingredients: IngredientGroup[] = [
              {
                groupName: "Main",
                ingredients: ingredientStrings.map((s) =>
                  parseIngredientString(decodeHtmlEntities(s))
                ),
              },
            ];

            // Extract instructions (with optional step images from JSON-LD)
            interface StepData {
              text: string;
              imageUrl?: string;
              imageUrls?: string[];
            }
            let instructionData: StepData[] = [];
            const normalizeText = (text: string) =>
              decodeHtmlEntities(text).replace(/\s+/g, " ").trim();

            const extractImageUrls = (img: unknown): string[] => {
              if (typeof img === "string") return [img];
              if (Array.isArray(img)) return img.flatMap((i: unknown) => extractImageUrls(i));
              if (img && typeof img === "object") {
                const obj = img as Record<string, unknown>;
                if (typeof obj.url === "string") return [obj.url];
              }
              return [];
            };

            const extractStepData = (node: unknown): StepData[] => {
              if (typeof node === "string") {
                const n = normalizeText(node);
                return n ? [{ text: n }] : [];
              }
              if (node && typeof node === "object") {
                const obj = node as Record<string, unknown>;
                if (Array.isArray(obj.itemListElement)) {
                  return obj.itemListElement.flatMap((i: unknown) => extractStepData(i));
                }
                const imageUrls = extractImageUrls(obj.image);
                const imageUrl = imageUrls[0];
                if (typeof obj.text === "string") {
                  const n = normalizeText(obj.text);
                  return n
                    ? [
                        {
                          text: n,
                          imageUrl,
                          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
                        },
                      ]
                    : [];
                }
                if (typeof obj.name === "string") {
                  const n = normalizeText(obj.name);
                  return n
                    ? [
                        {
                          text: n,
                          imageUrl,
                          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
                        },
                      ]
                    : [];
                }
              }
              return [];
            };

            if (Array.isArray(recipe.recipeInstructions)) {
              instructionData = recipe.recipeInstructions
                .flatMap((inst: unknown) => extractStepData(inst))
                .filter((d: StepData) => d.text.length > 10);
            } else if (typeof recipe.recipeInstructions === "string") {
              instructionData = recipe.recipeInstructions
                .split(/\n+/)
                .map((s: string) => ({ text: normalizeText(s) }))
                .filter((d: StepData) => d.text.length > 10);
            }

            // Extract author
            let author: string | undefined;
            if (typeof recipe.author === "string") {
              author = decodeHtmlEntities(recipe.author);
            } else if (recipe.author?.name) {
              author = decodeHtmlEntities(recipe.author.name);
            }

            // Extract servings
            let servings: number | undefined;
            const yieldValue = recipe.yield || recipe.recipeYield;
            if (typeof yieldValue === "string") {
              const m = yieldValue.match(/\d+/);
              if (m) servings = parseInt(m[0], 10);
            } else if (typeof yieldValue === "number") {
              servings = yieldValue;
            } else if (Array.isArray(yieldValue) && yieldValue.length > 0) {
              const first = yieldValue[0];
              if (typeof first === "string") {
                const m = first.match(/\d+/);
                if (m) servings = parseInt(m[0], 10);
              } else if (typeof first === "number") {
                servings = first;
              }
            }
            if (servings && (isNaN(servings) || servings <= 0)) servings = undefined;

            // Extract times
            const prepTimeMinutes = recipe.prepTime ? parseISODuration(recipe.prepTime) : undefined;
            const cookTimeMinutes = recipe.cookTime ? parseISODuration(recipe.cookTime) : undefined;
            const totalTimeMinutes = recipe.totalTime
              ? parseISODuration(recipe.totalTime)
              : undefined;

            // Convert step data to objects with imageUrl for normalization
            const instructionInputs = instructionData.map((d) => ({
              detail: d.text,
              ...(d.imageUrl && { imageUrl: d.imageUrl }),
              ...(d.imageUrls && d.imageUrls.length > 0 && { imageUrls: d.imageUrls }),
            }));
            const normalizedInstructions = normalizeInstructionSteps(instructionInputs);

            if (
              title &&
              title.length > 3 &&
              ingredients[0].ingredients.length > 0 &&
              normalizedInstructions.length > 0
            ) {
              return {
                title,
                ingredients: normalizeIngredientAmounts(ingredients),
                instructions: normalizeInstructionText(normalizedInstructions),
                ...(author && { author }),
                ...(servings && { servings }),
                ...(prepTimeMinutes && { prepTimeMinutes }),
                ...(cookTimeMinutes && { cookTimeMinutes }),
                ...(totalTimeMinutes && { totalTimeMinutes }),
              };
            }
          }
        }
      } catch {
        continue;
      }
    }
  } catch (error) {
    log.error({ err: error }, "JSON-LD parse error");
  }
  return null;
}

// ---------------------------------------------------------------------------
// Layer 2: AI Extraction (Groq)
// ---------------------------------------------------------------------------

async function extractWithAI(cleanedHtml: string): Promise<ParsedRecipe | null> {
  const groq = getGroqClient();
  const limitedHtml = cleanedHtml.slice(0, 15000);

  const response = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    messages: [
      { role: "system", content: EXTRACTION_PROMPT },
      { role: "user", content: limitedHtml },
    ],
    temperature: 0.1,
    max_tokens: 5000,
  });

  const result = response.choices[0]?.message?.content;
  if (!result || result.trim().length === 0) return null;
  if (result.toLowerCase().includes("no recipe found")) return null;

  const parsedData = extractJsonFromAiResponse(result);
  // Normalize flat ingredient arrays into grouped format before validation
  if (
    parsedData &&
    typeof parsedData === "object" &&
    Array.isArray((parsedData as Record<string, unknown>).ingredients)
  ) {
    const ingredients = (parsedData as Record<string, unknown>).ingredients as unknown[];
    if (ingredients.length > 0 && !("groupName" in (ingredients[0] as Record<string, unknown>))) {
      (parsedData as Record<string, unknown>).ingredients = [{ groupName: "Main", ingredients }];
    }
  }
  const validated = CoreRecipeSchema.safeParse(parsedData);

  if (!validated.success) {
    log.error({ issues: validated.error.issues }, "AI parser Zod validation failed");
    return null;
  }

  const data = validated.data;
  const normalizedInstructions = normalizeInstructionSteps(data.instructions);
  if (normalizedInstructions.length === 0) return null;

  // Normalize servings from string to number if needed
  let servings: number | undefined;
  if (typeof data.servings === "number" && data.servings > 0) {
    servings = data.servings;
  } else if (typeof data.servings === "string") {
    const m = data.servings.match(/\d+/);
    if (m) servings = parseInt(m[0], 10);
  }

  const equipment = data.equipment;

  return {
    title: data.title,
    ingredients: normalizeIngredientAmounts(deduplicateUnits(data.ingredients)),
    instructions: normalizeInstructionText(normalizedInstructions),
    ...(data.author && { author: data.author }),
    ...(data.summary && { summary: data.summary }),
    ...(servings && { servings }),
    ...(data.prepTimeMinutes && { prepTimeMinutes: data.prepTimeMinutes }),
    ...(data.cookTimeMinutes && { cookTimeMinutes: data.cookTimeMinutes }),
    ...(data.totalTimeMinutes && { totalTimeMinutes: data.totalTimeMinutes }),
    ...(equipment && equipment.length > 0 && { equipment }),
  };
}

// ---------------------------------------------------------------------------
// Layer 2b: AI Enrichment (Groq) — for JSON-LD data
// ---------------------------------------------------------------------------

async function enrichWithAI(jsonLdData: ParsedRecipe): Promise<Partial<ParsedRecipe> | null> {
  const groq = getGroqClient();

  const inputPayload = JSON.stringify({
    title: jsonLdData.title,
    servings: jsonLdData.servings ?? null,
    prepTimeMinutes: jsonLdData.prepTimeMinutes ?? null,
    cookTimeMinutes: jsonLdData.cookTimeMinutes ?? null,
    totalTimeMinutes: jsonLdData.totalTimeMinutes ?? null,
    ingredients: jsonLdData.ingredients,
    instructions: jsonLdData.instructions.map((s) => ({
      detail: s.detail,
    })),
  });

  const response = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    messages: [
      { role: "system", content: ENRICHMENT_PROMPT },
      { role: "user", content: inputPayload },
    ],
    temperature: 0.1,
    max_tokens: 4000,
  });

  const result = response.choices[0]?.message?.content;
  if (!result || result.trim().length === 0) return null;

  const parsedData = extractJsonFromAiResponse(result);
  if (!parsedData || typeof parsedData !== "object") return null;

  const data = parsedData as Record<string, unknown>;

  let enrichedIngredients: IngredientGroup[] | undefined;
  if (Array.isArray(data.ingredients) && data.ingredients.length > 0) {
    const result = z.array(IngredientGroupSchema).safeParse(data.ingredients);
    if (result.success) enrichedIngredients = normalizeIngredientAmounts(result.data);
    else log.error({ issues: result.error.issues }, "Enriched ingredients failed validation");
  }

  let enrichedInstructions: InstructionStep[] | undefined;
  if (Array.isArray(data.instructions)) {
    const normalized = normalizeInstructionSteps(data.instructions);
    if (normalized.length > 0) enrichedInstructions = normalized;
  }

  const summary =
    typeof data.summary === "string" && data.summary.trim() ? data.summary.trim() : undefined;

  const enrichedServings =
    typeof data.servings === "number" && data.servings > 0 ? data.servings : undefined;
  const enrichedPrepTime =
    typeof data.prepTimeMinutes === "number" && data.prepTimeMinutes > 0
      ? data.prepTimeMinutes
      : undefined;
  const enrichedCookTime =
    typeof data.cookTimeMinutes === "number" && data.cookTimeMinutes > 0
      ? data.cookTimeMinutes
      : undefined;
  const enrichedTotalTime =
    typeof data.totalTimeMinutes === "number" && data.totalTimeMinutes > 0
      ? data.totalTimeMinutes
      : undefined;

  const enrichedEquipment = extractEquipment(data);

  return {
    ...(enrichedIngredients && { ingredients: enrichedIngredients }),
    ...(enrichedInstructions && { instructions: enrichedInstructions }),
    ...(enrichedEquipment && { equipment: enrichedEquipment }),
    ...(summary && { summary }),
    ...(enrichedServings && { servings: enrichedServings }),
    ...(enrichedPrepTime && { prepTimeMinutes: enrichedPrepTime }),
    ...(enrichedCookTime && { cookTimeMinutes: enrichedCookTime }),
    ...(enrichedTotalTime && { totalTimeMinutes: enrichedTotalTime }),
  };
}

// ---------------------------------------------------------------------------
// Content selection for full AI extraction
// ---------------------------------------------------------------------------

function pickContentForAI(cleaned: CleanedHTML): string {
  // Prefer recipe card container (highest signal, no blog prose)
  if (cleaned.recipeCardHtml && cleaned.recipeCardHtml.length > 500) {
    return cleaned.recipeCardHtml;
  }
  return cleaned.html || "";
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Image Extraction (Groq Vision)
// ---------------------------------------------------------------------------

export async function parseRecipeFromImage(dataUrl: string): Promise<ParserResult> {
  try {
    const groq = getGroqClient();

    const response = await groq.chat.completions.create({
      model: GROQ_VISION_MODEL,
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
            {
              type: "text",
              text: "Extract the recipe from this image.",
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 5000,
    });

    const result = response.choices[0]?.message?.content;
    if (!result || result.trim().length === 0) {
      return {
        success: false,
        error: "No recipe data extracted from image",
        method: "none",
      };
    }
    if (result.toLowerCase().includes("no recipe found")) {
      return {
        success: false,
        error: "No recipe found in image",
        method: "none",
      };
    }

    const parsedData = extractJsonFromAiResponse(result);
    // Normalize flat ingredient arrays into grouped format before validation
    if (
      parsedData &&
      typeof parsedData === "object" &&
      Array.isArray((parsedData as Record<string, unknown>).ingredients)
    ) {
      const ingredients = (parsedData as Record<string, unknown>).ingredients as unknown[];
      if (ingredients.length > 0 && !("groupName" in (ingredients[0] as Record<string, unknown>))) {
        (parsedData as Record<string, unknown>).ingredients = [{ groupName: "Main", ingredients }];
      }
    }
    const validated = CoreRecipeSchema.safeParse(parsedData);

    if (!validated.success) {
      log.error(
        { issues: validated.error.issues, raw: result },
        "Image parser Zod validation failed"
      );
      return {
        success: false,
        error: "Could not parse recipe from image",
        method: "none",
      };
    }

    const data = validated.data;
    const normalizedInstructions = normalizeInstructionSteps(data.instructions);
    if (normalizedInstructions.length === 0) {
      return {
        success: false,
        error: "No instructions found in image",
        method: "none",
      };
    }

    let servings: number | undefined;
    if (typeof data.servings === "number" && data.servings > 0) {
      servings = data.servings;
    } else if (typeof data.servings === "string") {
      const m = data.servings.match(/\d+/);
      if (m) servings = parseInt(m[0], 10);
    }

    const imageEquipment = data.equipment;
    const recipe: ParsedRecipe = {
      title: data.title,
      ingredients: normalizeIngredientAmounts(deduplicateUnits(data.ingredients)),
      instructions: normalizeInstructionText(normalizedInstructions),
      ...(data.author && { author: data.author }),
      ...(data.summary && { summary: data.summary }),
      ...(servings && { servings }),
      ...(data.prepTimeMinutes && { prepTimeMinutes: data.prepTimeMinutes }),
      ...(data.cookTimeMinutes && { cookTimeMinutes: data.cookTimeMinutes }),
      ...(data.totalTimeMinutes && { totalTimeMinutes: data.totalTimeMinutes }),
      ...(imageEquipment && imageEquipment.length > 0 && { equipment: imageEquipment }),
    };

    return { success: true, data: recipe, method: "image" };
  } catch (error) {
    return recipeImportError(error, "image");
  }
}

// ---------------------------------------------------------------------------
// Text Extraction (pasted recipe text)
// ---------------------------------------------------------------------------

export async function parseRecipeFromText(text: string): Promise<ParserResult> {
  try {
    const groq = getGroqClient();

    const response = await groq.chat.completions.create({
      model: GROQ_TEXT_MODEL,
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        {
          role: "user",
          content: `The following is plain text (not HTML) containing a recipe. Extract the recipe data from it:\n\n${text}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 5000,
    });

    const result = response.choices[0]?.message?.content;
    if (!result || result.trim().length === 0) {
      return {
        success: false,
        error: "No recipe data extracted from text",
        method: "none",
      };
    }
    if (result.toLowerCase().includes("no recipe found")) {
      return {
        success: false,
        error: "No recipe found in text",
        method: "none",
      };
    }

    const parsedData = extractJsonFromAiResponse(result);
    // Normalize flat ingredient arrays into grouped format before validation
    if (
      parsedData &&
      typeof parsedData === "object" &&
      Array.isArray((parsedData as Record<string, unknown>).ingredients)
    ) {
      const ingredients = (parsedData as Record<string, unknown>).ingredients as unknown[];
      if (ingredients.length > 0 && !("groupName" in (ingredients[0] as Record<string, unknown>))) {
        (parsedData as Record<string, unknown>).ingredients = [{ groupName: "Main", ingredients }];
      }
    }
    const validated = CoreRecipeSchema.safeParse(parsedData);

    if (!validated.success) {
      log.error(
        { issues: validated.error.issues, raw: result },
        "Text parser Zod validation failed"
      );
      return {
        success: false,
        error: "Could not parse recipe from text",
        method: "none",
      };
    }

    const data = validated.data;
    const normalizedInstructions = normalizeInstructionSteps(data.instructions);
    if (normalizedInstructions.length === 0) {
      return {
        success: false,
        error: "No instructions found in text",
        method: "none",
      };
    }

    let servings: number | undefined;
    if (typeof data.servings === "number" && data.servings > 0) {
      servings = data.servings;
    } else if (typeof data.servings === "string") {
      const m = data.servings.match(/\d+/);
      if (m) servings = parseInt(m[0], 10);
    }

    const textEquipment = data.equipment;
    const recipe: ParsedRecipe = {
      title: data.title,
      ingredients: normalizeIngredientAmounts(deduplicateUnits(data.ingredients)),
      instructions: normalizeInstructionText(normalizedInstructions),
      ...(data.author && { author: data.author }),
      ...(data.summary && { summary: data.summary }),
      ...(servings && { servings }),
      ...(data.prepTimeMinutes && { prepTimeMinutes: data.prepTimeMinutes }),
      ...(data.cookTimeMinutes && { cookTimeMinutes: data.cookTimeMinutes }),
      ...(data.totalTimeMinutes && { totalTimeMinutes: data.totalTimeMinutes }),
      ...(textEquipment && textEquipment.length > 0 && { equipment: textEquipment }),
    };

    return { success: true, data: recipe, method: "text" };
  } catch (error) {
    return recipeImportError(error, "text");
  }
}

// ---------------------------------------------------------------------------
// URL Orchestrator
// ---------------------------------------------------------------------------

export async function parseRecipeFromUrl(url: string): Promise<ParserResult> {
  try {
    // Fetch HTML
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error =
        response.status === 402 || response.status === 403
          ? "This website blocked the request. Try copying the recipe text and pasting it instead."
          : `Failed to fetch URL: ${response.status}`;
      return { success: false, error, method: "none" };
    }

    const rawHtml = await response.text();
    if (!rawHtml || rawHtml.trim().length === 0) {
      return { success: false, error: "Fetched HTML is empty", method: "none" };
    }

    // Extract step images from raw HTML before cleaning strips <img> tags
    const htmlStepImages = extractStepImagesFromHtml(rawHtml);

    // Clean HTML
    const cleaned = cleanRecipeHTML(rawHtml);
    if (!cleaned.success || !cleaned.html) {
      return {
        success: false,
        error: cleaned.error || "Failed to clean HTML",
        method: "none",
      };
    }

    // Collection pages are often not parseable; treat as a hint and only
    // surface it if extraction fails to avoid premature false negatives.
    const $raw = cheerio.load(rawHtml);
    const looksLikeCollection = detectCollectionSchema($raw);

    // Layer 1: JSON-LD
    const $ = cheerio.load(cleaned.html);
    const jsonLdResult = extractFromJsonLd($);

    if (jsonLdResult) {
      // Enrich JSON-LD data with AI (groupings, step titles, summary)
      // Sends compact JSON instead of full HTML — much smaller payload
      let enrichment: Partial<ParsedRecipe> | null = null;
      try {
        if (process.env.GROQ_API_KEY) {
          enrichment = await enrichWithAI(jsonLdResult);
        }
      } catch (error) {
        log.warn({ err: error }, "AI enrichment failed, falling back to JSON-LD only");
      }

      const hasOnlyMainGroup =
        jsonLdResult.ingredients.length === 1 && jsonLdResult.ingredients[0].groupName === "Main";

      const useBetterAiGroupings =
        hasOnlyMainGroup &&
        enrichment?.ingredients &&
        enrichment.ingredients.length > 0 &&
        (enrichment.ingredients.length > 1 || enrichment.ingredients[0].groupName !== "Main");

      // Use enriched instructions if same count and has real titles
      const useEnrichedInstructions =
        enrichment?.instructions &&
        enrichment.instructions.length === jsonLdResult.instructions.length &&
        enrichment.instructions.every((s) => s.title && !s.title.startsWith("Step "));

      const mergedRecipe: ParsedRecipe = {
        ...jsonLdResult,
        ...(useBetterAiGroupings && { ingredients: enrichment!.ingredients! }),
        ...(useEnrichedInstructions && {
          // Pin detail text from JSON-LD as source of truth — only take titles/tips/ingredients from AI
          instructions: enrichment!.instructions!.map((enrichedStep, i) => ({
            ...enrichedStep,
            detail: jsonLdResult.instructions[i]?.detail ?? enrichedStep.detail,
          })),
        }),
        ...(enrichment?.summary && { summary: enrichment.summary }),
        ...(enrichment?.equipment &&
          enrichment.equipment.length > 0 && { equipment: enrichment.equipment }),
        // Backfill time/servings from AI enrichment only when JSON-LD didn't have them
        ...(!jsonLdResult.servings && enrichment?.servings && { servings: enrichment.servings }),
        ...(!jsonLdResult.prepTimeMinutes &&
          enrichment?.prepTimeMinutes && { prepTimeMinutes: enrichment.prepTimeMinutes }),
        ...(!jsonLdResult.cookTimeMinutes &&
          enrichment?.cookTimeMinutes && { cookTimeMinutes: enrichment.cookTimeMinutes }),
        ...(!jsonLdResult.totalTimeMinutes &&
          enrichment?.totalTimeMinutes && { totalTimeMinutes: enrichment.totalTimeMinutes }),
        sourceUrl: url,
      };

      // Re-apply imageUrls from JSON-LD if enrichment replaced instructions
      if (useEnrichedInstructions) {
        for (let i = 0; i < jsonLdResult.instructions.length; i++) {
          if (jsonLdResult.instructions[i].imageUrl && !mergedRecipe.instructions[i].imageUrl) {
            mergedRecipe.instructions[i].imageUrl = jsonLdResult.instructions[i].imageUrl;
          }
          const srcUrls = jsonLdResult.instructions[i].imageUrls;
          if (srcUrls && srcUrls.length > 0 && !mergedRecipe.instructions[i].imageUrls?.length) {
            mergedRecipe.instructions[i].imageUrls = srcUrls;
          }
        }
      }

      mergeStepImages(mergedRecipe.instructions, htmlStepImages);

      const enrichmentApplied =
        useBetterAiGroupings ||
        useEnrichedInstructions ||
        Boolean(enrichment?.summary) ||
        Boolean(enrichment?.equipment && enrichment.equipment.length > 0) ||
        Boolean(!jsonLdResult.servings && enrichment?.servings) ||
        Boolean(!jsonLdResult.prepTimeMinutes && enrichment?.prepTimeMinutes) ||
        Boolean(!jsonLdResult.cookTimeMinutes && enrichment?.cookTimeMinutes) ||
        Boolean(!jsonLdResult.totalTimeMinutes && enrichment?.totalTimeMinutes);

      return {
        success: true,
        data: mergedRecipe,
        method: enrichmentApplied ? "json-ld+ai" : "json-ld",
      };
    }

    // Layer 2: Full AI parse — prefer recipe card content over full HTML
    const aiResult = await extractWithAI(pickContentForAI(cleaned));
    if (aiResult) {
      aiResult.sourceUrl = url;
      mergeStepImages(aiResult.instructions, htmlStepImages);
      return { success: true, data: aiResult, method: "ai" };
    }

    return {
      success: false,
      error: looksLikeCollection ? COLLECTION_MESSAGE : "Could not extract recipe data",
      method: "none",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("abort")) {
      return {
        success: false,
        error: "Request timed out after 10 seconds",
        method: "none",
      };
    }

    return recipeImportError(error, "url");
  }
}

export const __test__ = {
  extractFromJsonLd,
  extractStepImagesFromHtml,
  mergeStepImages,
  recipeImportError,
};

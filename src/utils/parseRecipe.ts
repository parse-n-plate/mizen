import * as cheerio from "cheerio";
import { getGroqClient, extractJsonFromAiResponse } from "@/lib/groq";
import { CoreRecipeSchema } from "@/lib/schemas/recipe";
import { EXTRACTION_PROMPT } from "@/lib/prompts/extraction";
import { cleanRecipeHTML } from "./htmlCleaner";
import type {
  ParsedRecipe,
  ParserResult,
  IngredientGroup,
  InstructionStep,
  TimeMarker,
} from "@/lib/types";

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
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(parseInt(dec, 10))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function parseIngredientString(raw: string): {
  amount: string;
  units: string;
  ingredient: string;
} {
  const s = raw.trim();
  if (!s) return { amount: "", units: "", ingredient: s };

  // Match amount at start: integers, fractions, decimals, mixed numbers, unicode fractions, and ranges.
  const unicodeFractions = "½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞";
  const numberToken = `(?:\\d+\\s+\\d+/\\d+|\\d+[${unicodeFractions}]|\\d+/\\d+|\\d*\\.\\d+|\\d+|[${unicodeFractions}])`;
  const amountRe = new RegExp(
    `^((?:${numberToken})(?:\\s*[\\-–—]\\s*(?:${numberToken}))?)\\s*`
  );
  const amountMatch = s.match(amountRe);
  if (!amountMatch) return { amount: "", units: "", ingredient: s };

  const amount = amountMatch[1].trim();
  const rest = s.slice(amountMatch[0].length).trim();

  // Match common cooking units (singular/plural)
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
  const unitRe = new RegExp(
    `^(${unitPatterns.join("|")})(?:\\b|\\.)\\s*`,
    "i"
  );
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

  // If parsing left a dangling dash, treat as an ambiguous parse and preserve the original string.
  if (/^[\-–—]/.test(rest)) {
    return { amount: "", units: "", ingredient: s };
  }

  return { amount, units: "", ingredient: rest };
}

function normalizeInstructionSteps(instructions: unknown): InstructionStep[] {
  if (!Array.isArray(instructions)) return [];

  const cleanLeading = (text: string): string =>
    (text || "").replace(/^[\s.:;,\-–—]+/, "").trim();

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
        const aiTitle =
          typeof obj.title === "string" && obj.title.trim()
            ? obj.title.trim()
            : null;
        const title = aiTitle ? cleanLeading(aiTitle) : `Step ${index + 1}`;
        const detail = cleanLeading(rawDetail.trim());
        return {
          title,
          detail,
          timeMinutes: obj.timeMinutes as number | undefined,
          timers: Array.isArray(obj.timers) ? obj.timers as TimeMarker[] : undefined,
          ingredients: obj.ingredients as string[] | undefined,
          tips: obj.tips as string | undefined,
          imageUrl: obj.imageUrl as string | undefined,
        };
      }
      return null;
    })
    .filter((step): step is InstructionStep => Boolean(step));
}

/**
 * Merge step images into instructions that don't already have one.
 * Applies positionally — only fills in gaps.
 */
function mergeStepImages(
  instructions: InstructionStep[],
  htmlImages: string[]
): void {
  if (htmlImages.length === 0) return;
  const hasAnyImages = instructions.some((s) => s.imageUrl);
  if (hasAnyImages) return;

  const limit = Math.min(instructions.length, htmlImages.length);
  for (let i = 0; i < limit; i++) {
    if (htmlImages[i]) {
      instructions[i].imageUrl = htmlImages[i];
    }
  }
}

// ---------------------------------------------------------------------------
// Step Image Extraction (HTML fallback)
// ---------------------------------------------------------------------------

function extractStepImagesFromHtml(rawHtml: string): string[] {
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
      '.recipe-instructions, #recipe-instructions',
      '.recipe-directions, #recipe-directions',
      '.wprm-recipe-instructions-container',
      '.wprm-recipe-instruction',
      '[class*="wprm-recipe-instruction"]',
    ];

    let $container: ReturnType<typeof $> | null = null;
    for (const selector of instructionSelectors) {
      const $match = $(selector);
      if ($match.length) {
        const $parent = $match.first().closest(
          '[class*="instruction"], [class*="direction"], [class*="step"], section, div'
        );
        $container = $parent.length ? $parent : $match.first().parent();
        break;
      }
    }

    if (!$container || !$container.length) return [];

    const images: string[] = [];
    // Look for step elements within the container
    const $steps = $container.find('li, [class*="step"]');
    if ($steps.length === 0) return [];

    $steps.each((_, step) => {
      const $img = $(step).find("img").first();
      const src = $img.attr("src") || $img.attr("data-src") || "";
      images.push(src);
    });

    return images;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Layer 1: JSON-LD Extraction
// ---------------------------------------------------------------------------

function extractFromJsonLd(
  $: cheerio.CheerioAPI
): ParsedRecipe | null {
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
            itemType === "Recipe" ||
            (Array.isArray(itemType) && itemType.includes("Recipe"));

          if (
            isRecipeType ||
            (item["@graph"] &&
              Array.isArray(item["@graph"]) &&
              item["@graph"].some(
                (g: Record<string, unknown>) =>
                  g["@type"] === "Recipe" ||
                  (Array.isArray(g["@type"]) &&
                    (g["@type"] as string[]).includes("Recipe"))
              ))
          ) {
            const recipe = isRecipeType
              ? item
              : item["@graph"].find(
                  (g: Record<string, unknown>) =>
                    g["@type"] === "Recipe" ||
                    (Array.isArray(g["@type"]) &&
                      (g["@type"] as string[]).includes("Recipe"))
                );
            if (!recipe) continue;

            const title = decodeHtmlEntities(String(recipe.name || ""));
            const ingredientStrings: string[] = Array.isArray(
              recipe.recipeIngredient
            )
              ? recipe.recipeIngredient.filter(
                  (ing: unknown) => typeof ing === "string" && (ing as string).trim()
                )
              : [];

            const ingredients: IngredientGroup[] = [
              {
                groupName: "Main",
                ingredients: ingredientStrings.map((ing) =>
                  parseIngredientString(ing)
                ),
              },
            ];

            // Extract instructions (with optional step images from JSON-LD)
            interface StepData { text: string; imageUrl?: string }
            let instructionData: StepData[] = [];
            const normalizeText = (text: string) =>
              decodeHtmlEntities(text).replace(/\s+/g, " ").trim();

            const extractImageUrl = (img: unknown): string | undefined => {
              if (typeof img === "string") return img;
              if (Array.isArray(img) && img.length > 0) return extractImageUrl(img[0]);
              if (img && typeof img === "object") {
                const obj = img as Record<string, unknown>;
                if (typeof obj.url === "string") return obj.url;
              }
              return undefined;
            };

            const extractStepData = (node: unknown): StepData[] => {
              if (typeof node === "string") {
                const n = normalizeText(node);
                return n ? [{ text: n }] : [];
              }
              if (node && typeof node === "object") {
                const obj = node as Record<string, unknown>;
                if (Array.isArray(obj.itemListElement)) {
                  return obj.itemListElement.flatMap((i: unknown) =>
                    extractStepData(i)
                  );
                }
                const imageUrl = extractImageUrl(obj.image);
                if (typeof obj.text === "string") {
                  const n = normalizeText(obj.text);
                  return n ? [{ text: n, imageUrl }] : [];
                }
                if (typeof obj.name === "string") {
                  const n = normalizeText(obj.name);
                  return n ? [{ text: n, imageUrl }] : [];
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
            if (servings && (isNaN(servings) || servings <= 0))
              servings = undefined;

            // Extract times
            const prepTimeMinutes = recipe.prepTime
              ? parseISODuration(recipe.prepTime)
              : undefined;
            const cookTimeMinutes = recipe.cookTime
              ? parseISODuration(recipe.cookTime)
              : undefined;
            const totalTimeMinutes = recipe.totalTime
              ? parseISODuration(recipe.totalTime)
              : undefined;

            // Convert step data to objects with imageUrl for normalization
            const instructionInputs = instructionData.map((d) => ({
              detail: d.text,
              ...(d.imageUrl && { imageUrl: d.imageUrl }),
            }));
            const normalizedInstructions =
              normalizeInstructionSteps(instructionInputs);

            if (
              title &&
              title.length > 3 &&
              ingredients[0].ingredients.length > 0 &&
              normalizedInstructions.length > 0
            ) {
              return {
                title,
                ingredients,
                instructions: normalizedInstructions,
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
    console.error("[JSON-LD] Error parsing:", error);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Layer 2: AI Extraction (Groq)
// ---------------------------------------------------------------------------

async function extractWithAI(
  cleanedHtml: string
): Promise<ParsedRecipe | null> {
  const groq = getGroqClient();
  const limitedHtml = cleanedHtml.slice(0, 15000);

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
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
  const validated = CoreRecipeSchema.safeParse(parsedData);

  if (!validated.success) {
    console.error("[AI Parser] Zod validation failed:", validated.error.issues);
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

  return {
    title: data.title,
    ingredients: data.ingredients,
    instructions: normalizedInstructions,
    ...(data.author && { author: data.author }),
    ...(data.summary && { summary: data.summary }),
    ...(servings && { servings }),
    ...(data.prepTimeMinutes && { prepTimeMinutes: data.prepTimeMinutes }),
    ...(data.cookTimeMinutes && { cookTimeMinutes: data.cookTimeMinutes }),
    ...(data.totalTimeMinutes && { totalTimeMinutes: data.totalTimeMinutes }),
  };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Image Extraction (Groq Vision)
// ---------------------------------------------------------------------------

export async function parseRecipeFromImage(
  base64: string,
  mimeType: string
): Promise<ParserResult> {
  try {
    const groq = getGroqClient();

    const response = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview",
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
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
    const validated = CoreRecipeSchema.safeParse(parsedData);

    if (!validated.success) {
      console.error(
        "[Image Parser] Zod validation failed:",
        validated.error.issues
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

    const recipe: ParsedRecipe = {
      title: data.title,
      ingredients: data.ingredients,
      instructions: normalizedInstructions,
      ...(data.author && { author: data.author }),
      ...(data.summary && { summary: data.summary }),
      ...(servings && { servings }),
      ...(data.prepTimeMinutes && { prepTimeMinutes: data.prepTimeMinutes }),
      ...(data.cookTimeMinutes && { cookTimeMinutes: data.cookTimeMinutes }),
      ...(data.totalTimeMinutes && { totalTimeMinutes: data.totalTimeMinutes }),
    };

    return { success: true, data: recipe, method: "image" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message, method: "none" };
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
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch URL: ${response.status}`,
        method: "none",
      };
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

    // Layer 1: JSON-LD
    const $ = cheerio.load(cleaned.html);
    const jsonLdResult = extractFromJsonLd($);

    if (jsonLdResult) {
      // Try AI enrichment for better groupings
      let aiResult: ParsedRecipe | null = null;
      try {
        if (process.env.GROQ_API_KEY) {
          aiResult = await extractWithAI(cleaned.html);
        }
      } catch (error) {
        console.error("[Parser] AI enrichment failed:", error);
      }

      const hasOnlyMainGroup =
        jsonLdResult.ingredients.length === 1 &&
        jsonLdResult.ingredients[0].groupName === "Main";

      const useBetterAiGroupings =
        hasOnlyMainGroup &&
        aiResult &&
        aiResult.ingredients.length > 0 &&
        (aiResult.ingredients.length > 1 ||
          aiResult.ingredients[0].groupName !== "Main");

      const mergedRecipe: ParsedRecipe = {
        ...jsonLdResult,
        ...(useBetterAiGroupings && { ingredients: aiResult!.ingredients }),
        ...(aiResult?.summary && { summary: aiResult.summary }),
        ...(jsonLdResult.servings
          ? { servings: jsonLdResult.servings }
          : aiResult?.servings
            ? { servings: aiResult.servings }
            : {}),
        ...(jsonLdResult.prepTimeMinutes
          ? { prepTimeMinutes: jsonLdResult.prepTimeMinutes }
          : aiResult?.prepTimeMinutes
            ? { prepTimeMinutes: aiResult.prepTimeMinutes }
            : {}),
        ...(jsonLdResult.cookTimeMinutes
          ? { cookTimeMinutes: jsonLdResult.cookTimeMinutes }
          : aiResult?.cookTimeMinutes
            ? { cookTimeMinutes: aiResult.cookTimeMinutes }
            : {}),
        ...(jsonLdResult.totalTimeMinutes
          ? { totalTimeMinutes: jsonLdResult.totalTimeMinutes }
          : aiResult?.totalTimeMinutes
            ? { totalTimeMinutes: aiResult.totalTimeMinutes }
            : {}),
        sourceUrl: url,
      };

      // Merge HTML step images if JSON-LD didn't provide any
      mergeStepImages(mergedRecipe.instructions, htmlStepImages);

      return {
        success: true,
        data: mergedRecipe,
        method: aiResult ? "json-ld+ai" : "json-ld",
      };
    }

    // Layer 2: Full AI parse
    const aiResult = await extractWithAI(cleaned.html);
    if (aiResult) {
      aiResult.sourceUrl = url;
      mergeStepImages(aiResult.instructions, htmlStepImages);
      return { success: true, data: aiResult, method: "ai" };
    }

    return {
      success: false,
      error: "Could not extract recipe data",
      method: "none",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    if (message.includes("abort")) {
      return {
        success: false,
        error: "Request timed out after 10 seconds",
        method: "none",
      };
    }

    return { success: false, error: message, method: "none" };
  }
}

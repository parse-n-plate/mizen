/**
 * AI-Based Universal Recipe Parser
 *
 * Architecture:
 *   Layer 1 (JSON-LD) — Fast, free, reliable when available.
 *     Extracts structured data from <script type="application/ld+json"> tags.
 *     Returns raw ingredient strings in a single "Main" group (no amount/unit split).
 *
 *   Layer 2 (AI / Groq) — Slower, costs tokens, handles any page.
 *     Sends cleaned HTML (max 15k chars) to llama-3.3-70b-versatile.
 *     Returns structured ingredients (amount/unit/name), grouped logically,
 *     plus AI-generated metadata: descriptions, substitutions, cuisine,
 *     storage guidance, plating notes.
 *
 *   Hybrid (JSON-LD + AI) — Most common path.
 *     Uses JSON-LD for title/author/servings/times (ground truth),
 *     then calls AI to enrich with groupings, cuisine, and metadata.
 *
 * Entry points:
 *   parseRecipe(rawHtml)       — Parse from raw HTML string
 *   parseRecipeFromUrl(url)    — Fetch URL then parse
 *   parseRecipeFromImage(b64)  — Vision model extraction from image
 *
 * Known accuracy issues (see .context/notes.md for full list):
 *   - Author-name heuristic can false-positive on short instructions
 *   - AI sometimes returns instructions as strings instead of {title, detail} objects
 *   - 15k char HTML truncation can cut off recipes on blog-heavy pages
 *   - 4k token output limit can truncate complex recipes mid-JSON
 *   - No deduplication if recipe appears twice in HTML (jump-to-recipe + inline)
 */

import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';
import { cleanRecipeHTML } from './htmlCleaner';
import { SUPPORTED_CUISINES, isSupportedCuisine } from '@/config/cuisineConfig';

// ---------------------------------------------------------------------------
// Instruction Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize any instruction array into InstructionStep objects.
 *
 * The AI prompt asks for {title, detail} objects, but sometimes returns plain
 * strings (see warning at line ~1232). This function handles both formats:
 *   - string  → { title: "Step N", detail: <string> }   (lossy — no semantic title)
 *   - object  → extracts title + detail from various key names (detail/text/name)
 *
 * TODO: Track how often the AI returns strings vs objects to measure prompt compliance.
 */
const normalizeInstructionSteps = (
  instructions: unknown,
): InstructionStep[] => {
  if (!Array.isArray(instructions)) return [];

  const cleanLeading = (text: string): string =>
    (text || '').replace(/^[\s.:;,\-–—]+/, '').trim();

  return instructions
    .map((item: unknown, index: number) => {
      // Handle string inputs (legacy format - AI should not return these)
      if (typeof item === 'string') {
        const detail = cleanLeading(item.trim());
        if (!detail) return null;
        // Use generic title for legacy string inputs
        return {
          title: `Step ${index + 1}`,
          detail,
        };
      }

      // Handle object inputs (expected format from AI)
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        // Extract detail from various possible fields
        const rawDetail =
          typeof obj.detail === 'string'
            ? obj.detail
            : typeof obj.text === 'string'
            ? obj.text
            : typeof obj.name === 'string'
            ? obj.name
            : '';

        if (!rawDetail.trim()) return null;

        // Extract title if provided by AI
        const aiTitle =
          typeof obj.title === 'string' && obj.title.trim()
            ? obj.title.trim()
            : null;

        // Use AI-provided title, or fallback to generic if missing
        const title = aiTitle ? cleanLeading(aiTitle) : `Step ${index + 1}`;
        const detail = cleanLeading(rawDetail.trim());

        return {
          title,
          detail,
          timeMinutes: obj.timeMinutes as number | undefined,
          ingredients: obj.ingredients as string[] | undefined,
          tips: obj.tips as string | undefined,
        };
      }

      return null;
    })
    .filter((step): step is InstructionStep => Boolean(step));
};

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

/**
 * A single ingredient with structured amount/unit/name.
 *
 * When extracted via JSON-LD (Layer 1), amount and units are empty strings
 * because JSON-LD only provides the full ingredient as a single string.
 * The AI layer (Layer 2) splits them properly.
 */
export interface Ingredient {
  amount: string;
  units: string;
  ingredient: string;
  description?: string;      // One sentence explaining flavor/texture contribution (max 80 chars)
  substitutions?: string[];  // Array of 1-3 realistic alternatives (empty array if none)
}

/**
 * Interface for ingredient group (e.g., "For the sauce", "For the cake")
 */
export interface IngredientGroup {
  groupName: string;
  ingredients: Ingredient[];
}

/**
 * Instruction step with a human-friendly title and full detail text
 */
export interface InstructionStep {
  title: string;
  detail: string;
  timeMinutes?: number;
  ingredients?: string[];
  tips?: string;
}

/**
 * Interface for parsed recipe data
 */
export interface ParsedRecipe {
  title: string;
  author?: string;
  publishedDate?: string;
  sourceUrl?: string;
  summary?: string; // AI-generated recipe summary (1-2 sentences)
  servings?: number; // Number of servings/yield
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  ingredients: IngredientGroup[];
  instructions: InstructionStep[];
  cuisine?: string[]; // Cuisine types/tags (e.g., ["Italian", "Mediterranean"])
  // Storage guidance - generated during initial parse
  storageGuide?: string; // Storage instructions (e.g., "Store in airtight container in fridge")
  shelfLife?: {
    fridge?: number | null;  // Days in fridge (null if not fridge-safe)
    freezer?: number | null; // Days in freezer (null if not freezer-friendly)
  };
  // Plating/serving guidance - generated during initial parse
  platingNotes?: string; // 2-3 sentences of plating suggestions based on the dish
  servingVessel?: string; // Recommended serving vessel (e.g., "shallow bowl", "dinner plate")
  servingTemp?: string; // Ideal serving temperature (e.g., "hot", "warm", "room temp", "chilled")
}

/**
 * Interface for parser result
 */
export interface ParserResult {
  success: boolean;
  data?: ParsedRecipe;
  error?: string;
  method?: 'json-ld' | 'ai' | 'json-ld+ai' | 'none';
  retryAfter?: number; // Timestamp (milliseconds) when to retry after rate limit
  warnings?: string[]; // Non-fatal issues (e.g., missing API key)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse ISO 8601 duration string (e.g., "PT30M", "PT1H30M") to minutes.
 *
 * NOTE: Only handles hours+minutes. Durations with days/seconds (P1DT2H, PT30S)
 * will not match and return undefined.
 */
function parseISODuration(duration: string): number | undefined {
  if (!duration || typeof duration !== 'string') return undefined;
  
  // ISO 8601 duration format: PT[hours]H[minutes]M
  // Examples: "PT30M" (30 minutes), "PT1H30M" (1 hour 30 minutes), "PT2H" (2 hours)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return undefined;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const totalMinutes = hours * 60 + minutes;
  
  // Return undefined if total is 0 (invalid duration)
  return totalMinutes > 0 ? totalMinutes : undefined;
}

/**
 * Decode common HTML entities from source fields (e.g., "Chef John&#39;s" -> "Chef John's").
 * Some JSON-LD blobs contain entity-encoded text that should be normalized.
 */
function decodeHtmlEntities(text: string): string {
  if (!text) return text;

  return text
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Normalize a single cuisine name against the supported list.
 * Returns the canonical name if matched (case-insensitive), or null.
 */
function matchSupportedCuisine(name: string): string | null {
  if (isSupportedCuisine(name)) return name;
  const lower = name.toLowerCase();
  return SUPPORTED_CUISINES.find((s) => s.toLowerCase() === lower) ?? null;
}

/**
 * Normalize the raw cuisine field from AI output into a validated string[].
 *
 * Handles: string, string[], or undefined/null.
 * Filters to only supported cuisine names (case-insensitive).
 */
function normalizeCuisineField(raw: unknown): string[] | undefined {
  if (!raw) return undefined;

  // Collect raw values into an array
  let candidates: string[] = [];
  if (Array.isArray(raw)) {
    candidates = raw.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      .map((c) => c.trim());
  } else if (typeof raw === 'string' && raw.trim().length > 0) {
    candidates = [raw.trim()];
  }

  if (candidates.length === 0) return undefined;

  const validated = candidates
    .map(matchSupportedCuisine)
    .filter((c): c is string => c !== null);

  return validated.length > 0 ? validated : undefined;
}

// ---------------------------------------------------------------------------
// Layer 1: JSON-LD Extraction (Fast Path — no AI tokens)
// ---------------------------------------------------------------------------

/**
 * Extract recipe data from JSON-LD structured data.
 *
 * Searches all <script type="application/ld+json"> tags for a Recipe object,
 * handling both top-level and @graph-nested schemas.
 *
 * Limitations:
 *   - Ingredients are stored as raw strings (amount/units not split)
 *   - All ingredients go into a single "Main" group
 *   - No cuisine, storage, or plating metadata
 *   - Author filtering heuristic can be overly aggressive (see isAuthorName)
 */
function extractFromJsonLd($: cheerio.CheerioAPI): ParsedRecipe | null {
  try {
    const scripts = $('script[type="application/ld+json"]');

    for (let i = 0; i < scripts.length; i++) {
      try {
        const scriptContent = $(scripts[i]).html();
        if (!scriptContent) continue;

        const data = JSON.parse(scriptContent);

        // Handle both single objects and arrays of objects
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          // Check if @type is Recipe (handle both string and array formats)
          const itemType = item['@type'];
          const isRecipeType = 
            itemType === 'Recipe' ||
            (Array.isArray(itemType) && itemType.includes('Recipe'));
          
          // Look for Recipe type or items with recipe data
          if (
            isRecipeType ||
            (item['@graph'] &&
              Array.isArray(item['@graph']) &&
              item['@graph'].some((g: Record<string, unknown>) => {
                const gType = g['@type'];
                return gType === 'Recipe' || (Array.isArray(gType) && gType.includes('Recipe'));
              }))
          ) {
            // If it's in @graph, find the Recipe object
            const recipe = isRecipeType
              ? item
              : item['@graph'].find((g: Record<string, unknown>) => {
                  const gType = g['@type'];
                  return gType === 'Recipe' || (Array.isArray(gType) && gType.includes('Recipe'));
                });

            if (!recipe) continue;

            const title = decodeHtmlEntities(String(recipe.name || ''));

            // Normalize double parentheses to single parentheses (some sites have ((...)) in their JSON-LD)
            const normalizeDoubleParens = (text: string): string => {
              return text.replace(/\(\(/g, '(').replace(/\)\)/g, ')');
            };

            // Extract ingredients as simple strings first
            const ingredientStrings: string[] = Array.isArray(
              recipe.recipeIngredient
            )
              ? recipe.recipeIngredient.filter(
                  (ing: unknown) => typeof ing === 'string' && ing.trim()
                )
              : [];

            // Convert to structured format with default group
            const ingredients: IngredientGroup[] = [
              {
                groupName: 'Main',
                ingredients: ingredientStrings.map((ing) => ({
                  amount: '',
                  units: '',
                  ingredient: normalizeDoubleParens(ing),
                })),
              },
            ];

            let instructions: string[] = [];

            /**
             * Heuristic: detect whether a string is an author name rather than
             * a real instruction step. Used to filter JSON-LD instructions.
             *
             * FIXME: Known accuracy issues:
             *   - False positives: short legitimate steps like "Season well" or
             *     "Plate immediately" (≤3 words, no cooking-term match) get filtered.
             *   - False negatives: author names containing food words
             *     (e.g., "Pat Baker", "Rosemary Gill") pass through.
             *   - Empty/whitespace-only strings return true (treated as author),
             *     but these should arguably be filtered separately.
             */
            const isAuthorName = (text: string): boolean => {
              if (!text || text.length === 0) return true;

              const wordCount = text.split(/\s+/).length;
              const hasCookingTerms =
                /(heat|add|stir|mix|cook|bake|simmer|boil|fry|roast|season|taste|serve|preheat|chop|dice|slice|mince|pour|drain|whisk|beat|fold|knead|roll|cut|peel|grate|zest|squeeze|melt|saute|brown|caramelize|deglaze|reduce|thicken|thaw|marinate|brine|rub|glaze|garnish|top|sprinkle|drizzle|toss|coat|dredge|flour|bread|batter|crust|filling|topping|sauce|gravy|broth|stock|marinade|dressing|vinaigrette|seasoning|spice|herb|aromatic|flavor|taste|texture|tender|crispy|golden|browned|caramelized|caramel|syrup|honey|sugar|salt|pepper|garlic|onion|herbs|spices)/i.test(
                  text
                );

              // If it's 1-3 words and has no cooking terms, it's likely an author name
              if (wordCount <= 3 && !hasCookingTerms) {
                const looksLikeName =
                  /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\.?$/.test(text);
                if (looksLikeName) return true;
              }

              // Check for "By [Name]" pattern
              if (/^by\s+[A-Z]/i.test(text)) return true;

              return false;
            };

            // Handle different instruction formats
            const normalizeInstructionText = (text: string): string =>
              normalizeDoubleParens(decodeHtmlEntities(text).replace(/\s+/g, ' ').trim());

            const extractInstructionTexts = (node: unknown): string[] => {
              // String format
              if (typeof node === 'string') {
                const normalized = normalizeInstructionText(node);
                return normalized ? [normalized] : [];
              }

              // Object format
              if (node && typeof node === 'object') {
                const obj = node as Record<string, unknown>;

                // HowToSection or nested list: preserve each sub-step as its own instruction.
                if (Array.isArray(obj.itemListElement)) {
                  return obj.itemListElement.flatMap((item: unknown) =>
                    extractInstructionTexts(item)
                  );
                }

                if (typeof obj.text === 'string') {
                  const normalized = normalizeInstructionText(obj.text);
                  return normalized ? [normalized] : [];
                }

                if (typeof obj.name === 'string') {
                  const normalized = normalizeInstructionText(obj.name);
                  return normalized ? [normalized] : [];
                }
              }

              return [];
            };

            if (Array.isArray(recipe.recipeInstructions)) {
              instructions = recipe.recipeInstructions
                .flatMap((inst: string | Record<string, unknown>) =>
                  extractInstructionTexts(inst)
                )
                // FIXME: The 10-char minimum silently drops short but valid steps
                // (e.g., "Serve hot.", "Rest 5 min."). Consider lowering or removing.
                .filter((text: string) => text.length > 10 && !isAuthorName(text));
            } else if (
              typeof recipe.recipeInstructions === 'string' &&
              recipe.recipeInstructions.trim()
            ) {
              // Split string instructions by newlines
              instructions = recipe.recipeInstructions
                .split(/\n+/)
                .map((s: string) => normalizeInstructionText(s))
                // Same 10-char filter as above — see FIXME.
                .filter((s: string) => s.length > 10 && !isAuthorName(s));
            }

            // Extract author if available - handle various formats
            let author: string | undefined = undefined;
            
            // Try different author field formats
            if (recipe.author) {
              if (typeof recipe.author === 'string') {
                author = decodeHtmlEntities(recipe.author);
              } else if (typeof recipe.author === 'object' && recipe.author !== null) {
                // Handle author as object (e.g., {"@type": "Person", "name": "John Doe"})
                if (recipe.author.name && typeof recipe.author.name === 'string') {
                  author = decodeHtmlEntities(recipe.author.name);
                }
              }
            }
            
            // Try publisher as fallback
            if (!author && recipe.publisher) {
              if (typeof recipe.publisher === 'string') {
                author = decodeHtmlEntities(recipe.publisher);
              } else if (typeof recipe.publisher === 'object' && recipe.publisher !== null) {
                if (recipe.publisher.name && typeof recipe.publisher.name === 'string') {
                  author = decodeHtmlEntities(recipe.publisher.name);
                }
              }
            }
            
            // Try creator as another fallback
            if (!author && recipe.creator) {
              if (typeof recipe.creator === 'string') {
                author = decodeHtmlEntities(recipe.creator);
              } else if (Array.isArray(recipe.creator) && recipe.creator.length > 0) {
                const firstCreator = recipe.creator[0];
                if (typeof firstCreator === 'string') {
                  author = decodeHtmlEntities(firstCreator);
                } else if (typeof firstCreator === 'object' && firstCreator !== null && firstCreator.name) {
                  author = decodeHtmlEntities(firstCreator.name);
                }
              } else if (typeof recipe.creator === 'object' && recipe.creator !== null) {
                if (recipe.creator.name && typeof recipe.creator.name === 'string') {
                  author = decodeHtmlEntities(recipe.creator.name);
                }
              }
            }
            
            // Only set author if it's a non-empty string
            if (author && author.length === 0) {
              author = undefined;
            }

            // Extract servings/yield from JSON-LD
            // JSON-LD can have yield as a string (e.g., "4 servings") or number (e.g., 4)
            let servings: number | undefined = undefined;
            if (recipe.yield || recipe.recipeYield) {
              const yieldValue = recipe.yield || recipe.recipeYield;
              
              // Handle string format like "4 servings" or "4"
              if (typeof yieldValue === 'string') {
                // Extract number from string (e.g., "4 servings" -> 4, "Serves 6" -> 6)
                const numberMatch = yieldValue.match(/\d+/);
                if (numberMatch) {
                  servings = parseInt(numberMatch[0], 10);
                }
              } 
              // Handle number format
              else if (typeof yieldValue === 'number') {
                servings = yieldValue;
              }
              // Handle array format (some sites use ["4 servings"])
              else if (Array.isArray(yieldValue) && yieldValue.length > 0) {
                const firstValue = yieldValue[0];
                if (typeof firstValue === 'string') {
                  const numberMatch = firstValue.match(/\d+/);
                  if (numberMatch) {
                    servings = parseInt(numberMatch[0], 10);
                  }
                } else if (typeof firstValue === 'number') {
                  servings = firstValue;
                }
              }
              
              // Validate servings is a positive number
              if (servings && (isNaN(servings) || servings <= 0)) {
                servings = undefined;
              }
            } // end if (recipe.yield || recipe.recipeYield)

            // Extract prep time, cook time, and total time from JSON-LD
            // These are typically in ISO 8601 duration format (e.g., "PT30M", "PT1H30M")
            let prepTimeMinutes: number | undefined = undefined;
            let cookTimeMinutes: number | undefined = undefined;
            let totalTimeMinutes: number | undefined = undefined;
            
            // Extract prepTime (prepTime or prepTimeMinutes)
            if (recipe.prepTime) {
              prepTimeMinutes = parseISODuration(recipe.prepTime);
            } else if (typeof recipe.prepTimeMinutes === 'number' && recipe.prepTimeMinutes > 0) {
              prepTimeMinutes = recipe.prepTimeMinutes;
            }
            
            // Extract cookTime (cookTime or cookTimeMinutes)
            if (recipe.cookTime) {
              cookTimeMinutes = parseISODuration(recipe.cookTime);
            } else if (typeof recipe.cookTimeMinutes === 'number' && recipe.cookTimeMinutes > 0) {
              cookTimeMinutes = recipe.cookTimeMinutes;
            }
            
            // Extract totalTime (totalTime or totalTimeMinutes)
            if (recipe.totalTime) {
              totalTimeMinutes = parseISODuration(recipe.totalTime);
            } else if (typeof recipe.totalTimeMinutes === 'number' && recipe.totalTimeMinutes > 0) {
              totalTimeMinutes = recipe.totalTimeMinutes;
            }

            const normalizedInstructions = normalizeInstructionSteps(instructions);

            // Validate we have complete data
            if (
              title &&
              title.length > 3 &&
              ingredients[0].ingredients.length > 0 &&
              normalizedInstructions.length > 0
            ) {
              console.log(
                `[JSON-LD] Found recipe: "${title}" with ${ingredients[0].ingredients.length} ingredients and ${normalizedInstructions.length} instructions${author ? `, author: "${author}"` : ''}${servings ? `, servings: ${servings}` : ''}${prepTimeMinutes ? `, prepTime: ${prepTimeMinutes}min` : ''}${cookTimeMinutes ? `, cookTime: ${cookTimeMinutes}min` : ''}${totalTimeMinutes ? `, totalTime: ${totalTimeMinutes}min` : ''}`
              );
              return { 
                title, 
                ingredients, 
                instructions: normalizedInstructions, 
                author,
                ...(servings && { servings }),
                ...(prepTimeMinutes && { prepTimeMinutes }),
                ...(cookTimeMinutes && { cookTimeMinutes }),
                ...(totalTimeMinutes && { totalTimeMinutes })
              };
            }
          }
        }
      } catch {
        // Continue to next script tag if this one fails
        continue;
      }
    }
  } catch (error) {
    console.error('[JSON-LD] Error parsing:', error);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Layer 2: AI Parsing (Groq / llama-3.3-70b-versatile)
// ---------------------------------------------------------------------------

/**
 * Parse recipe from cleaned HTML using the Groq AI API.
 *
 * The prompt (~600 lines) instructs the model to return a single JSON object
 * with structured ingredients, instructions-as-objects, cuisine tags,
 * storage guidance, and plating notes.
 *
 * Constraints:
 *   - Input is truncated to 15,000 chars to avoid token overflow.
 *     FIXME: On blog-heavy pages the recipe content may be past the cutoff.
 *   - Output is capped at 4,000 tokens.
 *     FIXME: Complex recipes (20+ ingredients, 15+ steps) can exceed this,
 *     producing truncated JSON that fails to parse.
 *   - Temperature is 0.1 for consistency, but the model still occasionally
 *     returns instructions as strings instead of {title, detail} objects.
 */
async function parseWithAI(cleanedHtml: string): Promise<ParsedRecipe | null> {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error('[AI Parser] GROQ_API_KEY is not configured');
      return null;
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // FIXME: 15k char limit can cut off the recipe on blog-heavy pages.
    // The HTML cleaner should prioritize recipe content, but doesn't always.
    const limitedHtml = cleanedHtml.slice(0, 15000);

    console.log('[AI Parser] Sending HTML to AI for parsing...');

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          // ---------------------------------------------------------------
          // AI PROMPT — ~590 lines of extraction rules.
          // Sections: Output Format, Extraction Workflow, Title Rules,
          //   Ingredient Rules, Instruction Rules, Cuisine Detection,
          //   Storage Guidance, Plating Guidance, Final Reminder.
          //
          // TODO: Consider extracting this prompt to a separate file
          // (e.g., prompts/recipeExtractionPrompt.ts) for readability
          // and easier A/B testing of prompt variations.
          //
          // FIXME: The cuisine examples contain errors that teach the model
          // wrong associations — e.g., "Pad Thai" is mapped to ["Chinese"]
          // when it should be ["Thai"]. Thai isn't even in SUPPORTED_CUISINES,
          // so the prompt forces an incorrect fallback.
          // ---------------------------------------------------------------
          content: `========================================
CRITICAL OUTPUT FORMAT
========================================
You MUST output ONLY raw JSON. NO thinking, NO reasoning, NO explanations, NO text before or after the JSON.
START YOUR RESPONSE IMMEDIATELY WITH { and END WITH }. Nothing else.

🚨 CRITICAL: INSTRUCTIONS MUST BE OBJECTS, NOT STRINGS 🚨
Every instruction in the "instructions" array MUST be an object with "title" and "detail" properties.
NEVER use strings like ["Step 1", "Step 2"] - ALWAYS use objects like [{"title": "...", "detail": "..."}]

Required JSON structure:
{
  "title": "string (cleaned recipe title following TITLE EXTRACTION RULES - no prefixes/suffixes)",
  "summary": "string (exactly one concise sentence, max 200 chars, neutral dish description)",
  "author": "string (optional - recipe author name if found)",
  "servings": 4, // Only include if found in HTML - omit if not available
  "prepTimeMinutes": 15, // Prep time in minutes - only include if found in HTML
  "cookTimeMinutes": 30, // Cook time in minutes - only include if found in HTML
  "totalTimeMinutes": 45, // Total time in minutes - only include if found in HTML (or calculate as prep+cook if both available)
  "cuisine": ["Italian", "Mediterranean"],
  "ingredients": [
    {
      "groupName": "string",
      "ingredients": [
        {
          "amount": "string",
          "units": "string",
          "ingredient": "string",
          "description": "One sentence (max 80 chars) explaining flavor/texture contribution",
          "substitutions": ["alternative1", "alternative2"]
        }
      ]
    }
  ],
  "instructions": [
    {
      "title": "Short, human-friendly step title (e.g., \"Make the broth\")",
      "detail": "Full instruction text exactly as written in the HTML",
      "timeMinutes": 0,
      "ingredients": ["ingredient 1", "ingredient 2"],
      "tips": "Optional tip for this step"
    }
  ],
  "storageGuide": "2-3 sentences on how to store leftovers properly based on the dish type",
  "shelfLife": {
    "fridge": 3,
    "freezer": 30
  },
  "platingNotes": "2-3 sentences of plating suggestions based on the dish",
  "servingVessel": "recommended serving vessel (e.g., 'shallow bowl', 'dinner plate', 'cast iron skillet')",
  "servingTemp": "ideal serving temperature (e.g., 'hot', 'warm', 'room temp', 'chilled')"
}

CRITICAL: ingredients and instructions MUST be arrays, NEVER null.
- If ingredients are found: extract them into the array structure above
- If NO ingredients found: use empty array []

🚨 INSTRUCTIONS FORMAT - THIS IS MANDATORY 🚨
- Each instruction MUST be an OBJECT (not a string)
- Each instruction object MUST have exactly two properties: "title" and "detail"
- "title": A concise summary (2-8 words) describing the main action (e.g., "Mix ingredients", "Cook until done")
- "detail": The complete instruction text exactly as written in the HTML
- CORRECT: [{"title": "Mix ingredients", "detail": "Mix blueberries, sugar..."}]
- WRONG: ["Mix blueberries, sugar..."] ← This is FORBIDDEN
- If NO instructions found: use empty array []
- NEVER use null for ingredients or instructions - ALWAYS use [] if nothing is found

SUMMARY RULES:
- Include "summary" as EXACTLY one sentence (max 200 characters)
- Neutral menu-style dish description only
- No technique/process explanations
- If details are incomplete, use: "Recipe details incomplete. Review ingredients and steps."

========================================
THE HTML PROVIDED IS YOUR ONLY SOURCE OF DATA
========================================
You are an AI recipe extractor. Your SOLE purpose is to read the HTML provided and extract recipe data EXACTLY as it appears.

CORE EXTRACTION PRINCIPLES:
1. Read the HTML carefully and locate the recipe content - ingredients and instructions ARE in the HTML
2. Extract amounts, units, and ingredient names EXACTLY as written in the HTML
3. Extract instruction steps EXACTLY as written in the HTML
4. Never invent, estimate, round, convert, or modify any values
5. If data is missing from HTML, use fallback values (see Edge Cases section)
6. Only normalize whitespace and line breaks - nothing else
7. ALWAYS return arrays for ingredients and instructions - NEVER null, use [] if empty

========================================
EXTRACTION WORKFLOW
========================================
Follow these steps in order:
1. Locate and extract the recipe title (usually the main heading)
2. Locate the ingredients section in the HTML
3. For each ingredient, extract:
   - The amount EXACTLY as written (e.g., "2 1/2", "1/4", "½", "0.5")
   - The unit EXACTLY as written (e.g., "cups", "tablespoons", "grams")
   - The ingredient name EXACTLY as written
4. Preserve any ingredient groups found in the HTML
5. Locate the instructions section in the HTML
6. For each instruction step:
   - Extract the full instruction text EXACTLY as written in the HTML → use as "detail"
   - Create a concise summary (2-8 words) describing the main action → use as "title"
   - Format as an object: {"title": "Summary", "detail": "Full instruction text"}

========================================
TITLE EXTRACTION RULES
========================================
LOCATION PRIORITY:
1. Look for the main heading (usually <h1> tag) - this is most common
2. Look for recipe title in structured data or meta tags
3. Look for prominent headings near the recipe content
4. Avoid navigation menus, headers, or footer content

CLEANING RULES:
- Remove common prefixes: "Recipe:", "Recipe for", "How to Make", "How to Cook"
- Remove common suffixes: "Recipe", "| [Site Name]", "- [Site Name]"
- Remove extra whitespace (multiple spaces, tabs, newlines)
- Trim leading and trailing whitespace
- Remove HTML entities and decode special characters

FORMAT RULES:
- Keep the title as a single line (no line breaks)
- Preserve capitalization as written in the HTML
- Keep punctuation only if it's part of the actual title (e.g., "Mom's Apple Pie")
- Remove trailing punctuation that's clearly not part of the title (e.g., "Recipe Title -")

VALIDATION:
- Title should be 3-100 characters long
- Title should contain actual recipe name, not generic text like "Recipe" or "Home"
- If title contains only numbers or symbols, look for a better heading

EXAMPLES:
- Good: "Classic Chocolate Chip Cookies"
- Good: "Grandma's Famous Meatloaf"
- Bad: "Recipe: Classic Chocolate Chip Cookies | AllRecipes" (remove prefix/suffix)
- Bad: "Recipe" (too generic, find actual title)

========================================
INGREDIENT EXTRACTION RULES
========================================
AMOUNTS:
- Copy the amount EXACTLY as it appears in HTML: "2 1/2", "1/4", "½", "0.25", "¾"
- Do NOT convert fractions to decimals or vice versa
- Do NOT round or estimate (e.g., if HTML says "2 1/2", output "2 1/2", NOT "2.5" or "2")
- If HTML shows a range like "2-3", use "2-3"
- If no amount is provided, use "as needed"

UNITS:
- Copy the unit EXACTLY as it appears: "cups", "tablespoons", "teaspoons", "grams", "ounces", "pounds"
- Do NOT convert units (e.g., do NOT convert tablespoons to cups)
- Do NOT abbreviate or expand (if HTML says "tbsp", use "tbsp")
- If no amount is provided (using "as needed"), leave units as empty string ""

INGREDIENT NAMES:
- Copy the ingredient name EXACTLY as written in HTML
- Include all descriptors: "all-purpose flour", "unsalted butter", "large eggs"
- Do NOT abbreviate, simplify, or modify names

INGREDIENT DESCRIPTION (AI-GENERATED):
- For EACH ingredient, generate a brief one-sentence description (max 80 characters)
- Explain what flavor, texture, or role this ingredient contributes to the dish
- Focus on culinary purpose: "Adds umami depth and savory richness"
- Keep it informative and concise, not instructional
- Examples:
  - gochujang: "Adds spicy-sweet depth and fermented complexity"
  - heavy cream: "Creates silky richness and balances heat"
  - parmesan: "Provides salty, nutty finish and umami"
  - garlic: "Builds aromatic foundation and savory base"
  - pasta: "The starchy canvas that absorbs the sauce"

INGREDIENT SUBSTITUTIONS (AI-GENERATED):
- For EACH ingredient, suggest 1-3 realistic substitutions
- Only include substitutions that would work in this specific recipe
- Use empty array [] if no good substitutions exist (e.g., for the main protein in a specific dish)
- Prioritize common, accessible alternatives
- Examples:
  - gochujang: ["sriracha mixed with miso", "sambal oelek", "red pepper flakes with soy sauce"]
  - heavy cream: ["coconut cream", "half-and-half"]
  - parmesan: ["pecorino romano", "grana padano"]
  - unsalted butter: ["salted butter (reduce added salt)", "ghee"]
  - spaghetti: ["linguine", "fettuccine", "bucatini"]

INGREDIENT GROUPS - MANDATORY GROUPING RULES:
You MUST create logical ingredient groupings for EVERY recipe. Do NOT default to a single "Main" group unless the recipe truly has no logical way to group ingredients.

STEP 1: DETECT EXPLICIT GROUPINGS IN HTML (if present):
- Look for explicit group headers: "For the [X]:", "For [X]:", "[X] Ingredients:", "[X]:"
- Look for section headings (<h2>, <h3>, <h4>) before ingredient lists
- Look for bold text or visual separators that indicate groups
- If found, use those exact group names

STEP 2: CREATE LOGICAL GROUPINGS (even if not in HTML):
If no explicit groupings exist, you MUST analyze the ingredients and create logical groups based on:

A. SAUCE/MARINADE/DRESSING GROUP:
   - Ingredients used to make sauces, marinades, dressings, or liquid bases
   - Examples: soy sauce, vinegar, oil, cream, broth, wine, lemon juice, etc.
   - Group name: "For the sauce", "For the marinade", "For the dressing", etc.

B. MAIN INGREDIENTS GROUP:
   - Primary proteins, vegetables, or starches that are the main focus
   - Examples: chicken, beef, pasta, rice, vegetables, tofu, etc.
   - Group name: "Main ingredients" or recipe-specific like "For the pasta"

C. SEASONING/SPICES GROUP:
   - Herbs, spices, salt, pepper, and flavor enhancers
   - Examples: garlic, ginger, salt, pepper, herbs, spices, etc.
   - Group name: "Seasoning", "Spices", or "For seasoning"

D. GARNISH/TOPPING GROUP:
   - Ingredients added at the end for garnish or topping
   - Examples: green onions, cilantro, sesame seeds, cheese, nuts, etc.
   - Group name: "For garnish", "For serving", "Toppings"

E. BASE/DOUGH/CRUST GROUP:
   - Ingredients for bases, doughs, crusts, or batters
   - Examples: flour, eggs, butter, baking powder, etc.
   - Group name: "For the dough", "For the crust", "For the base"

GROUPING LOGIC:
1. Analyze ALL ingredients and their typical uses in cooking
2. Group ingredients that are used together or serve similar purposes
3. Create 2-4 groups minimum (unless recipe truly has <5 ingredients total)
4. Use descriptive, recipe-appropriate group names
5. Each group should have at least 2 ingredients (unless recipe is very small)

OUTPUT RULES:
- ALWAYS create multiple groups when you have 5+ ingredients
- NEVER use "Main" unless the recipe has <5 ingredients total
- Group names should be descriptive and recipe-appropriate
- Examples: "For the sauce", "Main ingredients", "For garnish", "For the pasta", etc.

EXAMPLES OF PROPER GROUPING:
Good (logical groupings created):
[
  {"groupName": "For the sauce", "ingredients": [gochujang, heavy cream, butter, garlic, sugar]},
  {"groupName": "Main ingredients", "ingredients": [pasta, pasta water]},
  {"groupName": "For garnish", "ingredients": [green onions, parmesan]}
]

Good (explicit groupings detected):
[
  {"groupName": "For the sauce", "ingredients": [...]},
  {"groupName": "For the meatballs", "ingredients": [...]}
]

Bad (defaulting to Main when logical groups exist):
[
  {"groupName": "Main", "ingredients": [all ingredients combined]}
]

========================================
INSTRUCTION EXTRACTION RULES
========================================
COMPLETENESS:
- Extract ALL instruction steps from the HTML
- Do NOT combine multiple steps into one
- Do NOT skip any steps, even if they seem minor
- Include every detail: temperatures, times, measurements, techniques

ACCURACY:
- Copy instruction text as closely as possible to the HTML
- Preserve all cooking temperatures (e.g., "350°F", "175°C")
- Preserve all cooking times (e.g., "30 minutes", "until golden brown")
- Preserve all measurements mentioned in instructions
- Keep the exact order of steps as they appear in HTML

DETAIL PRESERVATION:
- Do NOT shorten, summarize, or condense instructions
- Do NOT simplify complex steps
- Keep all helpful details about techniques, visual cues, and tips
- Maintain the original level of detail from the HTML

INSTRUCTION TITLES:
- Each instruction object must have a "title" property (2-8 words max)
- Title should summarize the main action using action verbs (e.g., "Mix ingredients", "Cook until done", "Serve warm")
- Do NOT include times, temperatures, or measurements in the title - keep those in "detail"
- Title is a summary, "detail" contains the full instruction text

AUTHOR EXTRACTION:
- Extract the recipe author name if clearly visible (e.g., "By Chef John", "Recipe by Jane Doe")
- Include author in the JSON output as a separate "author" field
- Do NOT include author names in instruction text - extract separately
- If no clear author is found, omit the "author" field (don't use null)

SERVINGS/YIELD EXTRACTION:
- Extract the number of servings (yield) if clearly visible in the HTML
- Look for patterns like "Serves 4", "Yield: 6 servings", "Makes 8", "4 servings", etc.
- Extract ONLY the numeric value (e.g., if HTML says "Serves 4", return 4)
- Include servings as a number in the JSON output: "servings": 4
- If servings information is not found or unclear, omit the "servings" field entirely (don't use null, 0, or any default value)
- NEVER guess or default to a number - only include servings if you can clearly extract it from the HTML
- Common locations: recipe metadata sections, near prep/cook time, in recipe header

CLEANING (remove these only):
- Attribution text (e.g., "Recipe courtesy of...") - but extract author name separately
- Nutritional information
- Prep time, cook time, total time labels
- Serving size information
- Image descriptions or video references
- Advertisement content

========================================
EDGE CASES AND MISSING DATA
========================================
If the recipe title is missing or invalid:
- Follow the TITLE EXTRACTION RULES above to find alternative headings
- Check for title in meta tags (og:title, twitter:title)
- Look for the largest or most prominent heading in the recipe content area
- If still not found, use a descriptive title based on main ingredients (e.g., "Chicken and Rice Dish")
- Never use generic fallbacks like "Recipe" or "Untitled Recipe"

If an ingredient amount is missing:
- Use "as needed" for amount
- Use "" (empty string) for units
- Still include the ingredient name

If ingredient groups are unclear:
- You MUST create logical groupings based on ingredient types and uses
- Categorize by: Sauce/Marinade, Main ingredients, Seasoning/Spices, Garnish/Toppings, Base/Dough
- Only use "Main" if the recipe has fewer than 5 ingredients total
- When in doubt, create at least 2 groups based on how ingredients are typically used together
- Analyze ingredient names to infer their purpose (e.g., "heavy cream" → sauce group, "green onions" → garnish group)

If instructions are incomplete or unclear:
- Extract what is available, exactly as written
- Do NOT make up or fill in missing steps

If no valid recipe is found in HTML:
- Return: {"title": "No recipe found", "ingredients": [], "instructions": []}
- NEVER use null - ALWAYS use empty arrays []

MANDATORY OUTPUT REQUIREMENTS:
- ingredients MUST be an array (never null) - use [] if empty
- instructions MUST be an array (never null) - use [] if empty
- If you cannot find ingredients, return []
- If you cannot find instructions, return []
- The HTML contains recipe data - search more carefully if you initially find nothing

========================================
FORMAT EXAMPLES (FOR STRUCTURE REFERENCE ONLY)
========================================
WARNING: These examples show the JSON FORMAT and STRUCTURE only.
DO NOT use these example values. Extract actual values from the HTML provided.

Example showing logical ingredient groupings (ALWAYS create groups):
{
  "title": "Gochujang Pasta",
  "servings": 4, // Only include if found in HTML - omit if not available
  "prepTimeMinutes": 10, // Only include if found in HTML
  "cookTimeMinutes": 20, // Only include if found in HTML
  "totalTimeMinutes": 30, // Only include if found in HTML (or calculate as prep+cook)
  "ingredients": [
    {
      "groupName": "For the sauce",
      "ingredients": [
        {"amount": "2", "units": "tablespoons", "ingredient": "unsalted butter", "description": "Creates silky base and rich mouthfeel", "substitutions": ["ghee", "olive oil"]},
        {"amount": "2", "units": "cloves", "ingredient": "garlic", "description": "Builds aromatic foundation", "substitutions": ["garlic powder", "shallots"]},
        {"amount": "2", "units": "tablespoons", "ingredient": "gochujang", "description": "Adds spicy-sweet depth and fermented complexity", "substitutions": ["sriracha mixed with miso", "sambal oelek"]},
        {"amount": "1/2", "units": "cup", "ingredient": "heavy cream", "description": "Creates silky richness and balances heat", "substitutions": ["coconut cream", "half-and-half"]},
        {"amount": "1", "units": "teaspoon", "ingredient": "sugar", "description": "Rounds out flavors and tempers spice", "substitutions": ["honey", "maple syrup"]}
      ]
    },
    {
      "groupName": "Main ingredients",
      "ingredients": [
        {"amount": "8", "units": "ounces", "ingredient": "pasta", "description": "The starchy canvas that absorbs the sauce", "substitutions": ["linguine", "udon noodles"]},
        {"amount": "1/2", "units": "cup", "ingredient": "pasta water", "description": "Starchy liquid that emulsifies the sauce", "substitutions": []}
      ]
    },
    {
      "groupName": "For garnish",
      "ingredients": [
        {"amount": "2", "units": "stalks", "ingredient": "green onion", "description": "Adds fresh crunch and mild onion bite", "substitutions": ["chives", "thinly sliced shallots"]},
        {"amount": "as needed", "units": "", "ingredient": "parmesan cheese", "description": "Provides salty, nutty finish and umami", "substitutions": ["pecorino romano", "nutritional yeast"]}
      ]
    }
  ],
  "instructions": [
    {
      "title": "Activate the yeast",
      "detail": "In a large bowl, dissolve 2 1/4 teaspoons yeast in 1/4 cup warm water. Let stand until creamy, about 10 minutes.",
      "timeMinutes": 10,
      "ingredients": [],
      "tips": ""
    },
    {
      "title": "Mix the dry ingredients",
      "detail": "Add 3 1/2 cups flour, 1/2 tablespoon salt, and remaining water to the yeast mixture. Mix until dough comes together.",
      "timeMinutes": 0,
      "ingredients": [],
      "tips": ""
    },
    {
      "title": "Knead the dough",
      "detail": "Turn dough out onto a lightly floured surface and knead for 8 to 10 minutes, until smooth and elastic.",
      "timeMinutes": 10,
      "ingredients": [],
      "tips": ""
    }
  ]
}

IMPORTANT: The example above shows JSON format structure only. You MUST extract actual amounts, units, and text from the HTML provided, not use these example values.

========================================
🍽️ CUISINE DETECTION - REQUIRED FIELD 🍽️
========================================
THIS IS A REQUIRED FIELD. You MUST analyze and return cuisine(s) for EVERY recipe.

Supported cuisines (use EXACT names only):
${JSON.stringify(SUPPORTED_CUISINES)}

CRITICAL RULES:
1. You MUST analyze EVERY recipe and return cuisine(s) - this is NOT optional
2. Use ONLY exact cuisine names from the supported list above (case-sensitive)
3. Return 1-3 cuisines maximum (prioritize primary cuisines)
4. For fusion recipes, include ALL relevant cuisines (e.g., ["Korean", "Italian"])

DETECTION STRATEGY - Analyze in this order:
A. RECIPE NAME/TITLE (strongest indicator):
   - "Pad Thai" → ["Chinese"]
   - "Spaghetti Carbonara" → ["Italian"]
   - "Kimchi Fried Rice" → ["Korean"]
   - "Chicken Tikka Masala" → ["Indian"]
   - "Beef Bulgogi" → ["Korean"]
   - "Miso Soup" → ["Japanese"]
   - "Ratatouille" → ["French"]
   - "Chicken Mole" → ["Mexican"]
   - "Hummus" → ["Mediterranean"]
   - "Spam Musubi" → ["Hawaiian"]

B. KEY INGREDIENTS (reliable indicators):
   Chinese: soy sauce, hoisin, oyster sauce, sesame oil, Szechuan peppercorns, bok choy, Chinese five-spice
   Italian: pasta, polenta, risotto, parmesan, mozzarella, basil, oregano, balsamic vinegar, prosciutto
   Mexican: tortillas, cilantro, lime, jalapeños, cumin, chipotle, black beans, avocado, queso fresco
   Mediterranean: olive oil, feta, olives, tahini, chickpeas, za'atar, sumac, pita, hummus
   French: butter, wine, shallots, herbes de Provence, Dijon mustard, crème fraîche, baguette
   Indian: curry powder, garam masala, turmeric, cardamom, ghee, paneer, naan, basmati rice
   Japanese: miso, soy sauce, mirin, sake, dashi, nori, wasabi, pickled ginger, sushi rice
   Korean: gochujang, kimchi, doenjang, sesame oil, Korean chili flakes, bulgogi marinade
   Hawaiian: pineapple, coconut, macadamia nuts, Spam, teriyaki sauce, poi, kalua pork

C. COOKING TECHNIQUES:
   - Stir-frying → Chinese
   - Pasta-making → Italian
   - Grilling with gochujang → Korean
   - Sushi-making → Japanese
   - Slow-cooking with spices → Indian
   - Braising with wine → French

D. FUSION RECIPES (include ALL relevant cuisines):
   - "Gochujang Pasta" → ["Korean", "Italian"] (Korean ingredient + Italian pasta)
   - "Korean Tacos" → ["Korean", "Mexican"] (Korean filling + Mexican tortilla)
   - "Teriyaki Pizza" → ["Japanese", "Italian"] (Japanese sauce + Italian base)
   - "Curry Pasta" → ["Indian", "Italian"] (Indian spices + Italian pasta)
   - "Hawaiian Pizza" → ["Hawaiian", "Italian"] (Hawaiian toppings + Italian base)

EXAMPLES (ALL use exact names from supported list):
✅ "Pad Thai" → ["Chinese"]
✅ "Spaghetti Carbonara" → ["Italian"]
✅ "Gochujang Pasta" → ["Korean", "Italian"]
✅ "Kimchi Fried Rice" → ["Korean"]
✅ "Chicken Tikka Masala" → ["Indian"]
✅ "Miso Ramen" → ["Japanese"]
✅ "Ratatouille" → ["French"]
✅ "Chicken Mole" → ["Mexican"]
✅ "Hummus Bowl" → ["Mediterranean"]
✅ "Spam Musubi" → ["Hawaiian"]
✅ "Korean Carbonara" → ["Korean", "Italian"]
✅ "Mediterranean Pasta" → ["Italian", "Mediterranean"]

OUTPUT FORMAT:
- Include in JSON as: "cuisine": ["Italian", "Mediterranean"]
- If you cannot determine with confidence, return empty array: "cuisine": []
- NEVER use variations like "Korean Fusion", "Italian-American", "Asian", "European" - ONLY exact names from the list
- NEVER skip this field - always include "cuisine" in your JSON response

INGREDIENT-BASED DETECTION QUICK REFERENCE:
- gochujang, kimchi → ["Korean"]
- miso, dashi, nori → ["Japanese"]
- curry powder, garam masala → ["Indian"]
- pasta, polenta, risotto → ["Italian"]
- tortillas, chipotle → ["Mexican"]
- tahini, za'atar → ["Mediterranean"]
- wine, herbes de Provence → ["French"]
- pineapple, Spam → ["Hawaiian"]
- soy sauce, hoisin → ["Chinese"]

========================================
📦 STORAGE GUIDANCE - REQUIRED FIELD 📦
========================================
THIS IS A REQUIRED FIELD. You MUST generate storage guidance for EVERY recipe.

STORGE GUIDE RULES:
- Provide 2-3 concise sentences on how to store leftovers properly
- Be specific to the dish type (e.g., soups vs baked goods vs salads)
- Include container recommendations when relevant (airtight container, covered bowl, etc.)
- Mention any special handling (cool before storing, keep dressing separate, etc.)

EXAMPLES:
- Soup/Stew: "Store in an airtight container in the refrigerator. The flavors will develop further overnight. Reheat gently on the stovetop."
- Pasta: "Store pasta and sauce separately in airtight containers in the fridge. Reheat with a splash of water or broth to restore moisture."
- Salad: "Store undressed salad in a sealed container lined with paper towel. Keep dressing separate and add just before serving."
- Baked goods: "Store in an airtight container at room temperature for up to 3 days. For longer storage, freeze in a freezer-safe bag."
- Meat dishes: "Refrigerate in an airtight container within 2 hours of cooking. Reheat thoroughly to 165°F (74°C) before serving."

SHELF LIFE RULES:
- "fridge": Number of days the dish will stay fresh in the refrigerator (typically 2-5 days for most cooked dishes)
- "freezer": Number of days in the freezer (typically 30-90 days), or null if the dish doesn't freeze well
- Base estimates on the PRIMARY ingredients and dish type

SHELF LIFE QUICK REFERENCE:
- Soups/stews: fridge 3-4 days, freezer 60-90 days
- Cooked pasta: fridge 3-5 days, freezer 30-60 days (sauce freezes better than pasta)
- Cooked rice: fridge 3-4 days, freezer 30 days
- Cooked meat: fridge 3-4 days, freezer 60-90 days
- Salads (undressed): fridge 2-3 days, freezer null (don't freeze)
- Baked goods: fridge 5-7 days (or room temp), freezer 60-90 days
- Cream-based dishes: fridge 2-3 days, freezer null (may separate)
- Fried foods: fridge 2-3 days, freezer 30 days (will lose crispiness)

OUTPUT FORMAT:
- "storageGuide": "2-3 sentences of practical storage advice"
- "shelfLife": { "fridge": <number>, "freezer": <number or null> }
- NEVER skip these fields - always include them in your JSON response

========================================
🍽️ PLATING GUIDANCE - REQUIRED FIELD 🍽️
========================================
THIS IS A REQUIRED FIELD. You MUST generate plating guidance for EVERY recipe.

PLATING NOTES RULES:
- Provide 2-3 concise sentences on how to plate/present the dish
- Be specific to the dish type (e.g., pasta vs steak vs salad)
- Include visual arrangement suggestions (e.g., "pile in center", "fan slices", "drizzle sauce around")
- Mention garnish placement when relevant

EXAMPLES:
- Pasta: "Twirl pasta into a nest in the center of a shallow bowl. Spoon sauce over the top and finish with grated parmesan and fresh basil leaves."
- Steak: "Slice against the grain and fan across the plate. Place vegetables alongside and drizzle pan sauce around the meat."
- Salad: "Build layers starting with greens as the base. Arrange toppings in sections for visual appeal and drizzle dressing in a zigzag pattern."
- Soup: "Ladle into a warmed bowl leaving room at the rim. Add garnishes to the center and serve immediately."
- Dessert: "Place on the center of a clean white plate. Add sauce dots or swooshes and dust with powdered sugar."

SERVING VESSEL RULES:
- Recommend the most appropriate vessel for the dish type
- Use common vessel names: "shallow bowl", "dinner plate", "deep bowl", "cast iron skillet", "wooden board", "ramekin", "soup bowl", "salad plate", "serving platter"
- Consider the dish texture and sauce amount

SERVING TEMPERATURE RULES:
- Use one of these standard temperatures: "hot", "warm", "room temp", "chilled", "frozen"
- Base on the dish type and how it's best enjoyed

OUTPUT FORMAT:
- "platingNotes": "2-3 sentences of plating suggestions"
- "servingVessel": "vessel type (e.g., 'shallow bowl', 'dinner plate')"
- "servingTemp": "temperature (e.g., 'hot', 'warm', 'room temp', 'chilled')"
- NEVER skip these fields - always include them in your JSON response

========================================
FINAL REMINDER
========================================
Output ONLY the JSON object. No markdown, no code blocks, no explanations, no text before or after.
START with { and END with }. Nothing else.

ABSOLUTE REQUIREMENTS:
- summary: MUST be exactly one sentence (REQUIRED FIELD)
- ingredients: MUST be an array [] (never null)
- instructions: MUST be an array [] (never null)
- cuisine: MUST be an array [] (REQUIRED FIELD - analyze every recipe, can be empty [] if truly uncertain)
- storageGuide: MUST be a string with 2-3 sentences of storage advice (REQUIRED FIELD)
- shelfLife: MUST be an object with "fridge" and "freezer" properties (REQUIRED FIELD)
- platingNotes: MUST be a string with 2-3 sentences of plating suggestions (REQUIRED FIELD)
- servingVessel: MUST be a string with vessel recommendation (REQUIRED FIELD)
- servingTemp: MUST be a string with serving temperature (REQUIRED FIELD)
- Each instruction MUST be an object: {"title": "Summary", "detail": "Full text"}
- If you find ingredients in the HTML, extract them
- If you find instructions in the HTML, extract them as objects with title and detail

🍽️ CUISINE DETECTION IS MANDATORY:
- ALWAYS analyze the recipe name, ingredients, and techniques to determine cuisine(s)
- Use ONLY exact cuisine names from the supported list: ${JSON.stringify(SUPPORTED_CUISINES)}
- For fusion recipes (e.g., Korean pasta, Mexican-Italian fusion), include BOTH cuisines
- Return empty array [] only if you truly cannot determine the cuisine
- NEVER skip the "cuisine" field - it must always be present in your JSON response

📦 STORAGE GUIDANCE IS MANDATORY:
- ALWAYS generate storage guidance based on the dish type and ingredients
- ALWAYS estimate shelf life based on the recipe type
- NEVER skip the "storageGuide" or "shelfLife" fields - they must always be present in your JSON response

🍽️ PLATING GUIDANCE IS MANDATORY:
- ALWAYS generate plating notes with 2-3 sentences of presentation suggestions
- ALWAYS recommend an appropriate serving vessel
- ALWAYS specify the ideal serving temperature
- NEVER skip the "platingNotes", "servingVessel", or "servingTemp" fields - they must always be present in your JSON response
- The recipe data exists in the HTML - extract it carefully, including plating analysis`,
        },
        {
          role: 'user',
          content: limitedHtml,
        },
      ],
      temperature: 0.1, // Low temperature for more consistent output
      max_tokens: 4000,
    });

    const result = response.choices[0]?.message?.content;

    if (!result || result.trim().length === 0) {
      console.error('[AI Parser] No response from AI service');
      return null;
    }

    // Check if AI explicitly says no recipe found
    if (result.toLowerCase().includes('no recipe found')) {
      console.log('[AI Parser] AI determined no recipe in content');
      return null;
    }

    // Extract JSON from response (in case AI added markdown formatting)
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : result;

    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[AI Parser] JSON parse error:', parseError);
      throw parseError;
    }

    // Validate structure
    if (
      parsedData.title &&
      Array.isArray(parsedData.ingredients) &&
      Array.isArray(parsedData.instructions)
    ) {

      // Ensure ingredients have the correct structure
      const validIngredients = parsedData.ingredients.every(
        (group: Record<string, unknown>) =>
          group.groupName &&
          Array.isArray(group.ingredients) &&
          (group.ingredients as Record<string, unknown>[]).every(
            (ing: Record<string, unknown>) =>
              typeof ing.amount === 'string' &&
              typeof ing.units === 'string' &&
              typeof ing.ingredient === 'string'
          )
      );

      // Validate that AI returned objects, not strings
      const hasStringInstructions = parsedData.instructions.some(
        (inst: unknown) => typeof inst === 'string'
      );
      
      if (hasStringInstructions) {
        console.warn('[AI Parser] ⚠️ AI returned instructions as strings instead of objects. Prompt may need adjustment.');
      } else {
        console.log('[AI Parser] ✅ AI correctly returned instructions as objects with title/detail');
      }

      const normalizedInstructions = normalizeInstructionSteps(
        parsedData.instructions,
      );

      if (validIngredients && normalizedInstructions.length > 0) {
        console.log(
          `[AI Parser] Successfully parsed recipe: "${parsedData.title}" with ${parsedData.ingredients.reduce((sum: number, g: Record<string, unknown>) => sum + (Array.isArray(g.ingredients) ? g.ingredients.length : 0), 0)} ingredients and ${normalizedInstructions.length} instructions`
        );
        // Return recipe with author, servings, and cuisine if available
        const recipe: ParsedRecipe = {
          title: parsedData.title,
          ingredients: parsedData.ingredients,
          instructions: normalizedInstructions,
        };
        if (typeof parsedData.summary === 'string' && parsedData.summary.trim()) {
          recipe.summary = parsedData.summary.trim();
        }
        if (parsedData.author && typeof parsedData.author === 'string') {
          recipe.author = parsedData.author;
        }
        
        // Extract servings if provided by AI
        if (parsedData.servings !== undefined && parsedData.servings !== null) {
          // Handle both number and string formats
          if (typeof parsedData.servings === 'number') {
            // Validate it's a positive number
            if (parsedData.servings > 0 && !isNaN(parsedData.servings)) {
              recipe.servings = parsedData.servings;
            }
          } else if (typeof parsedData.servings === 'string') {
            // Extract number from string (e.g., "4 servings" -> 4)
            const numberMatch = parsedData.servings.match(/\d+/);
            if (numberMatch) {
              const servingsNum = parseInt(numberMatch[0], 10);
              if (servingsNum > 0 && !isNaN(servingsNum)) {
                recipe.servings = servingsNum;
              }
            }
          }
        }
        
        // -- Extract optional AI-generated metadata ----------------------------
        // These fields are entirely AI-generated (not from the source HTML).
        // NOTE: No validation against ground truth — values are best-effort.

        if (typeof parsedData.storageGuide === 'string') {
          recipe.storageGuide = parsedData.storageGuide.trim();
        }
        if (parsedData.shelfLife && typeof parsedData.shelfLife === 'object') {
          recipe.shelfLife = {
            fridge: typeof parsedData.shelfLife.fridge === 'number' ? parsedData.shelfLife.fridge : null,
            freezer: typeof parsedData.shelfLife.freezer === 'number' ? parsedData.shelfLife.freezer : null,
          };
        }
        if (typeof parsedData.platingNotes === 'string') {
          recipe.platingNotes = parsedData.platingNotes.trim();
        }
        if (typeof parsedData.servingVessel === 'string') {
          recipe.servingVessel = parsedData.servingVessel.trim();
        }
        if (typeof parsedData.servingTemp === 'string') {
          recipe.servingTemp = parsedData.servingTemp.trim();
        }

        console.log('[AI Parser] Recipe:', {
          title: recipe.title,
          author: recipe.author ?? '(none)',
          servings: recipe.servings ?? '(none)',
          cuisine: recipe.cuisine?.join(', ') ?? '(none)',
          hasStorage: !!recipe.storageGuide,
          hasPlating: !!recipe.platingNotes,
        });
        
        // -- Cuisine normalization -----------------------------------------------
        // The AI returns cuisine as string | string[] | undefined.
        // We normalize to a string[] of SUPPORTED_CUISINES values (case-insensitive match).
        recipe.cuisine = normalizeCuisineField(parsedData.cuisine);
        console.log('[AI Parser] Cuisine:', recipe.cuisine?.length ? recipe.cuisine.join(', ') : 'none');
        return recipe;
      }
    }

    console.error('[AI Parser] Invalid recipe structure from AI:', parsedData);
    return null;
  } catch (error: unknown) {
    console.error('[AI Parser] Error:', error);
    const err = error as { status?: number; message?: string; headers?: Record<string, string>; response?: { status?: number; headers?: Record<string, string> } };

    // Check for rate limit errors
    if (err?.status === 429 ||
        err?.message?.includes('rate limit') ||
        err?.message?.includes('quota') ||
        err?.response?.status === 429) {
      console.error('[AI Parser] Rate limit detected');

      // Extract retry-after header if available
      // Groq SDK may return headers in error.headers or error.response.headers
      const retryAfterHeader =
        err?.headers?.['retry-after'] ||
        err?.headers?.['Retry-After'] ||
        err?.response?.headers?.['retry-after'] ||
        err?.response?.headers?.['Retry-After'];

      // Calculate retry timestamp (retry-after is typically in seconds)
      let retryAfter: number | undefined;
      if (retryAfterHeader) {
        const retrySeconds = parseInt(retryAfterHeader, 10);
        if (!isNaN(retrySeconds) && retrySeconds > 0) {
          // Add buffer time (add 5 seconds to be safe)
          retryAfter = Date.now() + (retrySeconds + 5) * 1000;
        }
      }

      // Create error with retry-after information
      const rateLimitError = new Error('ERR_RATE_LIMIT') as Error & { retryAfter?: number };
      if (retryAfter) {
        rateLimitError.retryAfter = retryAfter;
      }
      throw rateLimitError;
    }

    // Check for service unavailable
    if (err?.status === 503 ||
        err?.status === 502 ||
        err?.message?.includes('service unavailable') ||
        err?.message?.includes('temporarily unavailable')) {
      console.error('[AI Parser] Service unavailable');
      throw new Error('ERR_API_UNAVAILABLE');
    }
    
    return null;
  }
}

// ---------------------------------------------------------------------------
// Orchestrator: parseRecipe (main entry point for HTML)
// ---------------------------------------------------------------------------

/**
 * Main parsing function — tries JSON-LD first, then AI fallback.
 *
 * Flow:
 *   1. Clean HTML (remove ads, nav, scripts — see htmlCleaner.ts)
 *   2. Try JSON-LD extraction
 *      a. If JSON-LD has only a "Main" group → call AI for better groupings → merge
 *      b. If JSON-LD has good groups → still call AI for cuisine/metadata → merge
 *   3. If no JSON-LD → full AI parse
 *   4. Use summary returned from the same AI parse call (when available)
 *
 * NOTE: Even when JSON-LD succeeds, we always call the AI (step 2a/2b),
 * so every successful parse costs at least one AI call.
 *
 * @param rawHtml - Raw HTML from recipe page
 * @returns ParserResult with success status, data, error, and method used
 */
export async function parseRecipe(rawHtml: string): Promise<ParserResult> {
  try {
    console.log('[Recipe Parser] Starting universal recipe parsing...');

    // Clean the HTML first
    const cleaned = cleanRecipeHTML(rawHtml);
    if (!cleaned.success || !cleaned.html) {
      return {
        success: false,
        error: cleaned.error || 'Failed to clean HTML',
        method: 'none',
      };
    }

    // Load cleaned HTML with Cheerio
    const $ = cheerio.load(cleaned.html);

    // Layer 1: Try JSON-LD extraction (fast, no API cost)
    console.log('[Recipe Parser] Attempting JSON-LD extraction...');
    const jsonLdResult = extractFromJsonLd($);
    if (jsonLdResult) {
      // -- JSON-LD succeeded: always call AI for cuisine + enrichment ------
      //
      // Two sub-cases:
      //   a) JSON-LD has only a "Main" ingredient group → use AI groupings
      //   b) JSON-LD has good groups → keep them, use AI only for cuisine/metadata
      //
      // TODO: Both sub-cases duplicate the merge logic below. Consider
      // extracting a mergeJsonLdWithAi() helper to reduce duplication.

      const hasOnlyMainGroup = jsonLdResult.ingredients.length === 1 &&
                                jsonLdResult.ingredients[0].groupName === 'Main';

      // Always call AI — needed for cuisine, storage, plating, descriptions
      console.log(`[Recipe Parser] JSON-LD found. Calling AI for enrichment (mainGroupOnly=${hasOnlyMainGroup})...`);
      const warnings: string[] = [];
      let aiResult: ParsedRecipe | null = null;
      if (!process.env.GROQ_API_KEY) {
        warnings.push('AI_NOT_CONFIGURED');
      } else {
        try {
          aiResult = await parseWithAI(cleaned.html);
          if (!aiResult) {
            warnings.push('AI_ENRICHMENT_FAILED');
          }
        } catch (error) {
          console.error('[Recipe Parser] AI enrichment failed:', error);
          warnings.push('AI_ENRICHMENT_FAILED');
          // Continue with JSON-LD data only
        }
      }

      // Merge: JSON-LD fields take priority for ground-truth data (title, author,
      // servings, times). AI provides enrichment (cuisine, storage, plating).
      // If JSON-LD had only "Main" group and AI has better groupings, use AI's.
      const useBetterAiGroupings = hasOnlyMainGroup && aiResult &&
        aiResult.ingredients.length > 0 &&
        (aiResult.ingredients.length > 1 ||
         aiResult.ingredients[0].groupName !== 'Main');

      const mergedRecipe: ParsedRecipe = {
        ...jsonLdResult,
        // Use AI ingredient groupings when JSON-LD only had "Main"
        ...(useBetterAiGroupings && { ingredients: aiResult!.ingredients }),
        // AI-only fields
        ...(aiResult?.cuisine && aiResult.cuisine.length > 0 && { cuisine: aiResult.cuisine }),
        ...(aiResult?.storageGuide && { storageGuide: aiResult.storageGuide }),
        ...(aiResult?.shelfLife && { shelfLife: aiResult.shelfLife }),
        ...(aiResult?.platingNotes && { platingNotes: aiResult.platingNotes }),
        ...(aiResult?.servingVessel && { servingVessel: aiResult.servingVessel }),
        ...(aiResult?.servingTemp && { servingTemp: aiResult.servingTemp }),
        ...(aiResult?.summary && { summary: aiResult.summary }),
        // JSON-LD takes priority for these; fall back to AI if missing
        ...(jsonLdResult.servings ? { servings: jsonLdResult.servings } : (aiResult?.servings ? { servings: aiResult.servings } : {})),
        ...(jsonLdResult.prepTimeMinutes ? { prepTimeMinutes: jsonLdResult.prepTimeMinutes } : (aiResult?.prepTimeMinutes ? { prepTimeMinutes: aiResult.prepTimeMinutes } : {})),
        ...(jsonLdResult.cookTimeMinutes ? { cookTimeMinutes: jsonLdResult.cookTimeMinutes } : (aiResult?.cookTimeMinutes ? { cookTimeMinutes: aiResult.cookTimeMinutes } : {})),
        ...(jsonLdResult.totalTimeMinutes ? { totalTimeMinutes: jsonLdResult.totalTimeMinutes } : (aiResult?.totalTimeMinutes ? { totalTimeMinutes: aiResult.totalTimeMinutes } : {})),
      };

      console.log('[Recipe Parser] Merged (json-ld+ai):', {
        title: mergedRecipe.title,
        author: mergedRecipe.author ?? '(none)',
        servings: mergedRecipe.servings ?? '(none)',
        cuisine: mergedRecipe.cuisine?.join(', ') ?? '(none)',
        usedAiGroupings: !!useBetterAiGroupings,
      });

      return {
        success: true,
        data: mergedRecipe,
        method: aiResult ? 'json-ld+ai' : 'json-ld',
        ...(warnings.length > 0 && { warnings }),
      };
    }

    // -- Layer 2: Full AI parse (no JSON-LD available) ---------------------
    console.log('[Recipe Parser] No JSON-LD found, falling back to AI parsing...');

    const aiResult = await parseWithAI(cleaned.html);
    if (aiResult) {
      console.log('[Recipe Parser] AI-only parse succeeded:', {
        title: aiResult.title,
        author: aiResult.author ?? '(none)',
        servings: aiResult.servings ?? '(none)',
        cuisine: aiResult.cuisine?.join(', ') ?? '(none)',
      });

      return {
        success: true,
        data: aiResult,
        method: 'ai',
      };
    }

    // Both methods failed
    return {
      success: false,
      error: 'Could not extract recipe data using JSON-LD or AI parsing',
      method: 'none',
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during parsing';
    console.error('[Recipe Parser] Error:', errorMessage);
    const err = error as { status?: number; message?: string; retryAfter?: number };

    // Check for rate limit errors
    if (errorMessage === 'ERR_RATE_LIMIT' ||
        err?.status === 429 ||
        err?.message?.includes('rate limit') ||
        err?.message?.includes('quota')) {
      // Pass through retry-after timestamp if available
      const retryAfter = err?.retryAfter;
      return {
        success: false,
        error: 'ERR_RATE_LIMIT',
        method: 'none',
        retryAfter, // Include retry timestamp if available
      };
    }

    // Check for service unavailable
    if (errorMessage === 'ERR_API_UNAVAILABLE' ||
        err?.status === 503 ||
        err?.status === 502 ||
        err?.message?.includes('service unavailable')) {
      return {
        success: false,
        error: 'ERR_API_UNAVAILABLE',
        method: 'none',
      };
    }

    return {
      success: false,
      error: errorMessage,
      method: 'none',
    };
  }
}

// ---------------------------------------------------------------------------
// URL Entry Point
// ---------------------------------------------------------------------------

/**
 * Fetch HTML from a URL, then parse it.
 *
 * Uses a Chrome-like User-Agent to avoid bot detection. 10-second timeout.
 * Sets sourceUrl on the result so the UI can link back to the original page.
 */
export async function parseRecipeFromUrl(url: string): Promise<ParserResult> {
  try {
    console.log(`[Recipe Parser] Fetching recipe from URL: ${url}`);

    // Fetch HTML with timeout and proper headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    console.log(`[Recipe Parser] Making fetch request to: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log(`[Recipe Parser] Fetch response: ${response.status} ${response.statusText}, ok: ${response.ok}`);

    if (!response.ok) {
      console.error(`[Recipe Parser] Response not ok: ${response.status} ${response.statusText}`);
      return {
        success: false,
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        method: 'none',
      };
    }

    const html = await response.text();
    console.log(`[Recipe Parser] HTML length: ${html.length}`);

    if (!html || html.trim().length === 0) {
      console.error('[Recipe Parser] HTML content is empty');
      return {
        success: false,
        error: 'Fetched HTML is empty',
        method: 'none',
      };
    }

    // Parse the fetched HTML
    const result = await parseRecipe(html);
    
    // Add sourceUrl to the result if parsing was successful
    if (result.success && result.data) {
      result.data.sourceUrl = url;
    }
    
    return result;
  } catch (error) {
    console.error('[Recipe Parser] Error caught:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error fetching URL';
    
    // Check for timeout
    if (errorMessage.includes('abort')) {
      console.error('[Recipe Parser] Timeout error detected');
      return {
        success: false,
        error: 'Request timed out after 10 seconds',
        method: 'none',
      };
    }

    return {
      success: false,
      error: errorMessage,
      method: 'none',
    };
  }
}

// ---------------------------------------------------------------------------
// Image Entry Point (Vision Model)
// ---------------------------------------------------------------------------

/**
 * Parse recipe from an image using Groq's vision-capable model.
 *
 * Uses meta-llama/llama-4-scout-17b-16e-instruct (vision model).
 *
 * NOTE: The prompt here is much simpler than parseWithAI — it doesn't request
 * cuisine, storage, plating, descriptions, or substitutions. These fields
 * will be missing from image-parsed recipes.
 *
 * TODO: Align the image prompt with the HTML prompt to produce consistent output.
 *
 * @param imageBase64 - Base64-encoded image data (with data URL prefix)
 */
export async function parseRecipeFromImage(imageBase64: string): Promise<ParserResult> {
  try {
    console.log('[Recipe Parser] Starting recipe parsing from image...');

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('[Image Parser] GROQ_API_KEY is not configured');
      return {
        success: false,
        error: 'API key not configured',
        method: 'none',
      };
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    console.log('[Image Parser] Sending image to AI vision model for parsing...');

    // Use Groq's vision model to analyze the image
    // Using meta-llama/llama-4-scout-17b-16e-instruct (vision-capable model)
    const modelToUse = 'meta-llama/llama-4-scout-17b-16e-instruct';
    console.log('[Image Parser] Using model:', modelToUse);
    
    const response = await groq.chat.completions.create({
      model: modelToUse,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a recipe extraction AI. Extract the recipe from this image and return ONLY valid JSON with this exact structure:

{
  "title": "Recipe Name Here",
  "summary": "One sentence dish description.",
  "ingredients": [
    {
      "groupName": "Main",
      "ingredients": [
        {"amount": "1", "units": "cup", "ingredient": "flour"}
      ]
    }
  ],
  "instructions": [
    {
      "title": "Short, high-level step title",
      "detail": "Full step text exactly as shown in the image",
      "timeMinutes": 0,
      "ingredients": ["ingredient 1", "ingredient 2"],
      "tips": "Optional tip for this step"
    }
  ]
}

Rules:
1. Return ONLY the JSON object, nothing else
2. Extract ALL text you see for ingredients and instructions
3. Copy amounts and measurements exactly as shown
4. If ingredients have groups (like "For the sauce"), preserve the group names
5. If no groups, use "Main" as the groupName
6. Extract every instruction step you can see
7. Write a concise, action-focused title for each step (3-8 words)
8. Include "summary" as exactly one concise sentence (max 200 characters)
9. If no recipe is visible, return: {"title": "No recipe found", "summary": "Recipe details incomplete. Review ingredients and steps.", "ingredients": [], "instructions": []}

Start your response with { and end with }`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      temperature: 0.1, // Low temperature for consistent output
      max_tokens: 4000,
    });

    const result = response.choices[0]?.message?.content;

    console.log('[Image Parser] Raw AI response length:', result?.length);
    console.log('[Image Parser] Raw AI response (first 1000 chars):', result?.substring(0, 1000));

    if (!result || result.trim().length === 0) {
      console.error('[Image Parser] No response from AI service');
      console.error('[Image Parser] Full response object:', JSON.stringify(response, null, 2));
      return {
        success: false,
        error: 'No response from AI vision model',
        method: 'none',
      };
    }

    // Extract JSON from response (in case AI added markdown formatting)
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : result;

    console.log('[Image Parser] Extracted JSON string (first 500 chars):', jsonString.substring(0, 500));

    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
      console.log('[Image Parser] Successfully parsed JSON');
      console.log('[Image Parser] Parsed title:', parsedData.title);
      console.log('[Image Parser] Ingredients array length:', parsedData.ingredients?.length);
      console.log('[Image Parser] Instructions array length:', parsedData.instructions?.length);
    } catch (parseError) {
      console.error('[Image Parser] Failed to parse JSON:', parseError);
      console.error('[Image Parser] JSON string that failed:', jsonString);
      return {
        success: false,
        error: 'Invalid JSON response from AI',
        method: 'none',
      };
    }

    // Check if AI explicitly says no recipe found AFTER parsing
    if (parsedData.title && parsedData.title.toLowerCase().includes('no recipe found')) {
      console.log('[Image Parser] AI determined no recipe in image');
      console.log('[Image Parser] Full AI response for debugging:', result);
      return {
        success: false,
        error: 'No recipe found in image - AI could not read recipe text',
        method: 'none',
      };
    }

    // Validate structure
    if (
      parsedData.title &&
      Array.isArray(parsedData.ingredients) &&
      Array.isArray(parsedData.instructions)
    ) {
      // Ensure ingredients have the correct structure
      const validIngredients = parsedData.ingredients.every(
        (group: Record<string, unknown>) =>
          group.groupName &&
          Array.isArray(group.ingredients) &&
          (group.ingredients as Record<string, unknown>[]).every(
            (ing: Record<string, unknown>) =>
              typeof ing.amount === 'string' &&
              typeof ing.units === 'string' &&
              typeof ing.ingredient === 'string'
          )
      );

      const normalizedInstructions = normalizeInstructionSteps(
        parsedData.instructions,
      );

      if (validIngredients && normalizedInstructions.length > 0) {
        console.log(
          `[Image Parser] Successfully parsed recipe: "${parsedData.title}" with ${parsedData.ingredients.reduce((sum: number, g: Record<string, unknown>) => sum + (Array.isArray(g.ingredients) ? g.ingredients.length : 0), 0)} ingredients and ${normalizedInstructions.length} instructions`
        );
        const recipe: ParsedRecipe = {
          ...parsedData,
          instructions: normalizedInstructions,
        };
        if (typeof parsedData.summary === 'string' && parsedData.summary.trim()) {
          recipe.summary = parsedData.summary.trim();
        }
        return {
          success: true,
          data: recipe,
          method: 'ai',
        };
      }
    }

    console.error('[Image Parser] Invalid recipe structure from AI:', parsedData);
    return {
      success: false,
      error: 'Could not extract valid recipe structure from image',
      method: 'none',
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during image parsing';
    console.error('[Image Parser] Error:', errorMessage);
    console.error('[Image Parser] Full error object:', error);
    const err = error as { status?: number; message?: string; headers?: Record<string, string>; response?: { status?: number; headers?: Record<string, string> }; retryAfter?: number };

    // If it's a Groq API error, include more details
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('[Image Parser] API error response:', JSON.stringify(err.response, null, 2));
    }

    // Check for rate limit errors
    if (err?.status === 429 ||
        err?.message?.includes('rate limit') ||
        err?.message?.includes('quota') ||
        err?.response?.status === 429) {
      // Extract retry-after header if available
      const retryAfterHeader =
        err?.headers?.['retry-after'] ||
        err?.headers?.['Retry-After'] ||
        err?.response?.headers?.['retry-after'] ||
        err?.response?.headers?.['Retry-After'];

      // Calculate retry timestamp (retry-after is typically in seconds)
      let retryAfter: number | undefined;
      if (retryAfterHeader) {
        const retrySeconds = parseInt(retryAfterHeader, 10);
        if (!isNaN(retrySeconds) && retrySeconds > 0) {
          // Add buffer time (add 5 seconds to be safe)
          retryAfter = Date.now() + (retrySeconds + 5) * 1000;
        }
      }

      return {
        success: false,
        error: 'ERR_RATE_LIMIT',
        method: 'none',
        retryAfter, // Include retry timestamp if available
      };
    }

    // Check for service unavailable
    if (err?.status === 503 ||
        err?.status === 502 ||
        err?.message?.includes('service unavailable') ||
        err?.message?.includes('temporarily unavailable')) {
      return {
        success: false,
        error: 'ERR_API_UNAVAILABLE',
        method: 'none',
      };
    }

    return {
      success: false,
      error: errorMessage,
      method: 'none',
    };
  }
}

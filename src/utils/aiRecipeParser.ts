/**
 * AI-Based Universal Recipe Parser
 * 
 * This parser uses a two-layer approach:
 * 1. Layer 1 (Fast Path): Extract from JSON-LD structured data
 * 2. Layer 2 (AI Fallback): Use AI to parse cleaned HTML when structured data isn't available
 * 
 * This approach works with any recipe website without requiring site-specific selectors.
 */

import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';
import { cleanRecipeHTML } from './htmlCleaner';

// Derive a concise, human-friendly title from an instruction detail
const deriveStepTitle = (text: string): string => {
  const trimmed = text?.trim() || '';
  if (!trimmed) return 'Step';
  const match = trimmed.match(/^([^.!?]+[.!?]?)/);
  if (match) {
    return match[1].trim().replace(/[.!?]+$/, '') || 'Step';
  }
  return trimmed;
};

// Normalize any instruction array (strings or objects) into InstructionStep objects
const normalizeInstructionSteps = (
  instructions: any,
): InstructionStep[] => {
  if (!Array.isArray(instructions)) return [];

  const chooseTitleAndDetail = (
    detailRaw: string,
    extras?: {
      timeMinutes?: number;
      ingredients?: string[];
      tips?: string;
    },
  ): InstructionStep | null => {
    const detail = detailRaw.trim();
    if (!detail) return null;

    const autoTitle = deriveStepTitle(detail);
    const chosenTitle = autoTitle || 'Step';

    // Strip leading chosen title from detail to avoid duplication
    const escapedTitle = chosenTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const stripped = detail.replace(
      new RegExp(`^${escapedTitle}\\s*[:\\-–—]?\\s*`, 'i'),
      '',
    ).trim();

    const finalDetail = stripped.length > 0 ? stripped : detail;

    return {
      title: chosenTitle,
      detail: finalDetail,
      timeMinutes: extras?.timeMinutes,
      ingredients: extras?.ingredients,
      tips: extras?.tips,
    };
  };

  return instructions
    .map((item: any) => {
      if (typeof item === 'string') {
        return chooseTitleAndDetail(item);
      }

      if (item && typeof item === 'object') {
        const rawDetail =
          typeof item.detail === 'string'
            ? item.detail
            : typeof item.text === 'string'
            ? item.text
            : typeof item.name === 'string'
            ? item.name
            : '';

        return chooseTitleAndDetail(rawDetail, {
          timeMinutes: item.timeMinutes,
          ingredients: item.ingredients,
          tips: item.tips,
        });
      }

      return null;
    })
    .filter((step): step is InstructionStep => Boolean(step));
};

/**
 * Interface for ingredient with amount, units, and name
 */
export interface Ingredient {
  amount: string;
  units: string;
  ingredient: string;
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
  ingredients: IngredientGroup[];
  instructions: InstructionStep[];
}

/**
 * Interface for parser result
 */
export interface ParserResult {
  success: boolean;
  data?: ParsedRecipe;
  error?: string;
  method?: 'json-ld' | 'ai' | 'none';
}

/**
 * Extract recipe data from JSON-LD structured data (Layer 1 - Fast Path)
 * This is the most reliable method when available and doesn't use AI tokens
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
          // Look for Recipe type or items with recipe data
          if (
            item['@type'] === 'Recipe' ||
            (item['@graph'] &&
              Array.isArray(item['@graph']) &&
              item['@graph'].some((g: any) => g['@type'] === 'Recipe'))
          ) {
            // If it's in @graph, find the Recipe object
            const recipe =
              item['@type'] === 'Recipe'
                ? item
                : item['@graph'].find((g: any) => g['@type'] === 'Recipe');

            if (!recipe) continue;

            const title = recipe.name || '';

            // Extract ingredients as simple strings first
            const ingredientStrings: string[] = Array.isArray(
              recipe.recipeIngredient
            )
              ? recipe.recipeIngredient.filter(
                  (ing: any) => typeof ing === 'string' && ing.trim()
                )
              : [];

            // Convert to structured format with default group
            const ingredients: IngredientGroup[] = [
              {
                groupName: 'Main',
                ingredients: ingredientStrings.map((ing) => ({
                  amount: '',
                  units: '',
                  ingredient: ing,
                })),
              },
            ];

            let instructions: string[] = [];

            // Helper function to check if text looks like an author name
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
            if (Array.isArray(recipe.recipeInstructions)) {
              instructions = recipe.recipeInstructions
                .map((inst: any) => {
                  // Handle string format
                  if (typeof inst === 'string') return inst.trim();

                  // Handle object with text property
                  if (inst.text && typeof inst.text === 'string')
                    return inst.text.trim();

                  // Handle HowToStep format
                  if (
                    inst['@type'] === 'HowToStep' &&
                    inst.text &&
                    typeof inst.text === 'string'
                  )
                    return inst.text.trim();

                  // Handle HowToStep with name property
                  if (
                    inst['@type'] === 'HowToStep' &&
                    inst.name &&
                    typeof inst.name === 'string'
                  )
                    return inst.name.trim();

                  // Handle itemListElement format
                  if (
                    inst.itemListElement &&
                    Array.isArray(inst.itemListElement)
                  ) {
                    return inst.itemListElement
                      .map((item: any) => {
                        if (item.text) return item.text.trim();
                        if (item.name) return item.name.trim();
                        return '';
                      })
                      .filter((t: string) => t.length > 0)
                      .join(' ');
                  }

                  return '';
                })
                .filter((text: string) => text.length > 10 && !isAuthorName(text));
            } else if (
              typeof recipe.recipeInstructions === 'string' &&
              recipe.recipeInstructions.trim()
            ) {
              // Split string instructions by newlines
              instructions = recipe.recipeInstructions
                .split(/\n+/)
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 10 && !isAuthorName(s));
            }

            // Extract author if available - handle various formats
            let author: string | undefined = undefined;
            
            // Try different author field formats
            if (recipe.author) {
              if (typeof recipe.author === 'string') {
                author = recipe.author.trim();
              } else if (typeof recipe.author === 'object' && recipe.author !== null) {
                // Handle author as object (e.g., {"@type": "Person", "name": "John Doe"})
                if (recipe.author.name && typeof recipe.author.name === 'string') {
                  author = recipe.author.name.trim();
                }
              }
            }
            
            // Try publisher as fallback
            if (!author && recipe.publisher) {
              if (typeof recipe.publisher === 'string') {
                author = recipe.publisher.trim();
              } else if (typeof recipe.publisher === 'object' && recipe.publisher !== null) {
                if (recipe.publisher.name && typeof recipe.publisher.name === 'string') {
                  author = recipe.publisher.name.trim();
                }
              }
            }
            
            // Try creator as another fallback
            if (!author && recipe.creator) {
              if (typeof recipe.creator === 'string') {
                author = recipe.creator.trim();
              } else if (Array.isArray(recipe.creator) && recipe.creator.length > 0) {
                const firstCreator = recipe.creator[0];
                if (typeof firstCreator === 'string') {
                  author = firstCreator.trim();
                } else if (typeof firstCreator === 'object' && firstCreator !== null && firstCreator.name) {
                  author = firstCreator.name.trim();
                }
              } else if (typeof recipe.creator === 'object' && recipe.creator !== null) {
                if (recipe.creator.name && typeof recipe.creator.name === 'string') {
                  author = recipe.creator.name.trim();
                }
              }
            }
            
            // Only set author if it's a non-empty string
            if (author && author.length === 0) {
              author = undefined;
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
                `[JSON-LD] Found recipe: "${title}" with ${ingredients[0].ingredients.length} ingredients and ${normalizedInstructions.length} instructions${author ? `, author: "${author}"` : ''}`
              );
              return { title, ingredients, instructions: normalizedInstructions, author };
            }
          }
        }
      } catch (e) {
        // Continue to next script tag if this one fails
        continue;
      }
    }
  } catch (error) {
    console.error('[JSON-LD] Error parsing:', error);
  }

  return null;
}

/**
 * Parse recipe using AI (Layer 2 - AI Fallback)
 * This uses the Groq API to extract recipe data from cleaned HTML
 */
async function parseWithAI(cleanedHtml: string): Promise<ParsedRecipe | null> {
  try {
    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('[AI Parser] GROQ_API_KEY is not configured');
      return null;
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // Limit HTML to prevent token overflow (keep first 15k characters)
    const limitedHtml = cleanedHtml.slice(0, 15000);

    console.log('[AI Parser] Sending HTML to AI for parsing...');

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `========================================
CRITICAL OUTPUT FORMAT
========================================
You MUST output ONLY raw JSON. NO thinking, NO reasoning, NO explanations, NO text before or after the JSON.
START YOUR RESPONSE IMMEDIATELY WITH { and END WITH }. Nothing else.

Required JSON structure:
{
  "title": "string",
  "author": "string (optional - recipe author name if found)",
  "ingredients": [
    {
      "groupName": "string",
      "ingredients": [
        {"amount": "string", "units": "string", "ingredient": "string"}
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
  ]
}

CRITICAL: ingredients and instructions MUST be arrays, NEVER null.
- If ingredients are found: extract them into the array structure above
- If NO ingredients found: use empty array []
- If instructions are found: extract them into an array of instruction objects
- If NO instructions found: use empty array []
- NEVER use null for ingredients or instructions - ALWAYS use [] if nothing is found

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
6. Extract each instruction step EXACTLY as written, preserving all details
7. Create a concise, action-oriented title for each step (do NOT invent new content; summarize the step in 3-8 words)
8. Format the extracted data into the required JSON structure

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

GROUPS:
- If ingredients are grouped in HTML (e.g., "For the crust", "For the filling"), preserve those exact group names
- If no groups exist, use a single group with groupName "Main"
- Do NOT create groups that don't exist in the HTML

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

STEP TITLES:
- Provide a short, clear title that summarizes what the step does (3-8 words)
- Use action verbs and keep it high-level (e.g., "Make the broth", "Simmer the soup", "Season the noodles")
- Do NOT include times or temperatures in the title (keep those in detail)
- Do NOT leave titles blank; if unclear, use a brief summary of the action

AUTHOR EXTRACTION:
- Extract the recipe author name if clearly visible (e.g., "By Chef John", "Recipe by Jane Doe")
- Include author in the JSON output as a separate "author" field
- Do NOT include author names in instruction text - extract separately
- If no clear author is found, omit the "author" field (don't use null)

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
If the recipe title is missing:
- Use the page's main heading or first prominent heading

If an ingredient amount is missing:
- Use "as needed" for amount
- Use "" (empty string) for units
- Still include the ingredient name

If ingredient groups are unclear:
- Use a single group with groupName "Main"

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

Example showing varied fraction formats:
{
  "title": "Homemade Bread",
  "ingredients": [
    {
      "groupName": "Main",
      "ingredients": [
        {"amount": "3 1/2", "units": "cups", "ingredient": "bread flour"},
        {"amount": "2 1/4", "units": "teaspoons", "ingredient": "active dry yeast"},
        {"amount": "1/4", "units": "cup", "ingredient": "warm water"},
        {"amount": "½", "units": "tablespoon", "ingredient": "salt"},
        {"amount": "as needed", "units": "", "ingredient": "olive oil for brushing"}
      ]
    }
  ],
  "instructions": [
    "In a large bowl, dissolve 2 1/4 teaspoons yeast in 1/4 cup warm water. Let stand until creamy, about 10 minutes.",
    "Add 3 1/2 cups flour, 1/2 tablespoon salt, and remaining water to the yeast mixture. Mix until dough comes together.",
    "Turn dough out onto a lightly floured surface and knead for 8 to 10 minutes, until smooth and elastic."
  ]
}

IMPORTANT: The example above shows JSON format structure only. You MUST extract actual amounts, units, and text from the HTML provided, not use these example values.

========================================
FINAL REMINDER
========================================
Output ONLY the JSON object. No markdown, no code blocks, no explanations, no text before or after.
START with { and END with }. Nothing else.

ABSOLUTE REQUIREMENTS:
- ingredients: MUST be an array [] (never null)
- instructions: MUST be an array [] (never null)
- If you find ingredients in the HTML, extract them
- If you find instructions in the HTML, extract them
- If you don't find them, use empty arrays [] - NEVER null
- The recipe data exists in the HTML - extract it carefully`,
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
    const parsedData = JSON.parse(jsonString);

    // Validate structure
    if (
      parsedData.title &&
      Array.isArray(parsedData.ingredients) &&
      Array.isArray(parsedData.instructions)
    ) {
      // Ensure ingredients have the correct structure
      const validIngredients = parsedData.ingredients.every(
        (group: any) =>
          group.groupName &&
          Array.isArray(group.ingredients) &&
          group.ingredients.every(
            (ing: any) =>
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
          `[AI Parser] Successfully parsed recipe: "${parsedData.title}" with ${parsedData.ingredients.reduce((sum: number, g: any) => sum + g.ingredients.length, 0)} ingredients and ${normalizedInstructions.length} instructions`
        );
        // Return recipe with author if available
        const recipe: ParsedRecipe = {
          title: parsedData.title,
          ingredients: parsedData.ingredients,
          instructions: normalizedInstructions,
        };
        if (parsedData.author && typeof parsedData.author === 'string') {
          recipe.author = parsedData.author;
        }
        return recipe;
      }
    }

    console.error('[AI Parser] Invalid recipe structure from AI:', parsedData);
    return null;
  } catch (error) {
    console.error('[AI Parser] Error:', error);
    return null;
  }
}

/**
 * Main parsing function - tries JSON-LD first, then AI fallback
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
      return {
        success: true,
        data: jsonLdResult,
        method: 'json-ld',
      };
    }

    console.log('[Recipe Parser] JSON-LD not available, falling back to AI parsing...');

    // Layer 2: AI parsing fallback
    const aiResult = await parseWithAI(cleaned.html);
    if (aiResult) {
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
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during parsing';
    console.error('[Recipe Parser] Error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
      method: 'none',
    };
  }
}

/**
 * Parse recipe from URL (fetches HTML first)
 * 
 * @param url - Recipe URL to fetch and parse
 * @returns ParserResult with success status, data, error, and method used
 */
export async function parseRecipeFromUrl(url: string): Promise<ParserResult> {
  try {
    console.log(`[Recipe Parser] Fetching recipe from URL: ${url}`);

    // Fetch HTML with timeout and proper headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        method: 'none',
      };
    }

    const html = await response.text();

    if (!html || html.trim().length === 0) {
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
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error fetching URL';
    
    // Check for timeout
    if (errorMessage.includes('abort')) {
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

/**
 * Parse recipe from image using AI vision model
 * 
 * This function uses Groq's vision-capable model to extract recipe data
 * directly from an image (photo of recipe card, cookbook page, etc.)
 * 
 * @param imageBase64 - Base64-encoded image data (with data URL prefix)
 * @returns ParserResult with success status, data, error, and method used
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
8. If no recipe is visible, return: {"title": "No recipe found", "ingredients": [], "instructions": []}

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
        (group: any) =>
          group.groupName &&
          Array.isArray(group.ingredients) &&
          group.ingredients.every(
            (ing: any) =>
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
          `[Image Parser] Successfully parsed recipe: "${parsedData.title}" with ${parsedData.ingredients.reduce((sum: number, g: any) => sum + g.ingredients.length, 0)} ingredients and ${normalizedInstructions.length} instructions`
        );
        return {
          success: true,
          data: {
            ...parsedData,
            instructions: normalizedInstructions,
          } as ParsedRecipe,
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
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during image parsing';
    console.error('[Image Parser] Error:', errorMessage);
    console.error('[Image Parser] Full error object:', error);
    
    // If it's a Groq API error, include more details
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('[Image Parser] API error response:', JSON.stringify((error as any).response, null, 2));
    }
    
    return {
      success: false,
      error: errorMessage,
      method: 'none',
    };
  }
}


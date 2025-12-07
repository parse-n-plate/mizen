/**
 * Admin Debug API Endpoint
 * 
 * This endpoint provides detailed step-by-step information about the parsing process
 * for debugging and monitoring purposes.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';
import { cleanRecipeHTML } from '@/utils/htmlCleaner';

interface DebugStep {
  step: string;
  title: string;
  data: any;
  success: boolean;
  timestamp: number;
}

/**
 * GET /api/admin/debug-parse?url=<recipe_url>&customPrompt=<prompt>
 * POST /api/admin/debug-parse (body: { url: string, customPrompt?: string })
 * 
 * Returns detailed debug information about each step of the parsing process
 * Supports custom AI prompts for testing different extraction strategies
 */
export async function GET(req: NextRequest): Promise<Response> {
  const steps: DebugStep[] = [];
  
  try {
    const url = req.nextUrl.searchParams.get('url');
    const customPrompt = req.nextUrl.searchParams.get('customPrompt');

    if (!url || typeof url !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'URL parameter is required',
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid URL format',
      });
    }

    console.log(`[Debug API] Starting debug parse for: ${url}`);

    // CHECKPOINT 1: URL Validator - Check if page contains recipe indicators
    console.log('[Debug API] CHECKPOINT 1: URL Validation...');
    let urlValidationResult = {
      hasIngredients: false,
      hasInstructions: false,
      hasSchema: false,
      isRecipe: false,
      details: {} as any,
    };

    // Step 1: Fetch raw HTML
    console.log('[Debug API] Step 1: Fetching raw HTML...');
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
      return NextResponse.json({
        success: false,
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
      });
    }

    const rawHtml = await response.text();
    steps.push({
      step: 'raw_html',
      title: 'Raw HTML Fetched',
      data: rawHtml,
      success: true,
      timestamp: Date.now(),
    });

    // Step 2: Clean HTML
    console.log('[Debug API] Step 2: Cleaning HTML...');
    const cleaned = cleanRecipeHTML(rawHtml);
    
    if (!cleaned.success || !cleaned.html) {
      return NextResponse.json({
        success: false,
        error: cleaned.error || 'Failed to clean HTML',
        steps,
      });
    }

    steps.push({
      step: 'cleaned_html',
      title: 'HTML Cleaned',
      data: cleaned.html,
      success: true,
      timestamp: Date.now(),
    });

    // CHECKPOINT 2: Recipe Parsing - Try JSON-LD extraction first
    console.log('[Debug API] CHECKPOINT 2: Recipe Parsing - Attempting JSON-LD extraction...');
    const $ = cheerio.load(cleaned.html);
    let jsonLdResult = null;

    try {
      const scripts = $('script[type="application/ld+json"]');
      for (let i = 0; i < scripts.length; i++) {
        const scriptContent = $(scripts[i]).html();
        if (!scriptContent) continue;

        const data = JSON.parse(scriptContent);
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          if (
            item['@type'] === 'Recipe' ||
            (item['@graph'] &&
              Array.isArray(item['@graph']) &&
              item['@graph'].some((g: any) => g['@type'] === 'Recipe'))
          ) {
            const recipe =
              item['@type'] === 'Recipe'
                ? item
                : item['@graph'].find((g: any) => g['@type'] === 'Recipe');

            if (recipe && recipe.name && recipe.recipeIngredient && recipe.recipeInstructions) {
              jsonLdResult = recipe;
              break;
            }
          }
        }
        if (jsonLdResult) break;
      }
    } catch (error) {
      console.log('[Debug API] JSON-LD parsing failed:', error);
    }

    if (jsonLdResult) {
      steps.push({
        step: 'json_ld',
        title: 'JSON-LD Structured Data Found',
        data: jsonLdResult,
        success: true,
        timestamp: Date.now(),
      });

      // Parse JSON-LD into our format
      const title = jsonLdResult.name || '';
      const ingredientStrings = Array.isArray(jsonLdResult.recipeIngredient)
        ? jsonLdResult.recipeIngredient
        : [];
      
      const ingredients = [
        {
          groupName: 'Main',
          ingredients: ingredientStrings.map((ing: string) => ({
            amount: '',
            units: '',
            ingredient: ing,
          })),
        },
      ];

      let instructions: string[] = [];
      if (Array.isArray(jsonLdResult.recipeInstructions)) {
        instructions = jsonLdResult.recipeInstructions
          .map((inst: any) => {
            if (typeof inst === 'string') return inst.trim();
            if (inst.text) return inst.text.trim();
            if (inst['@type'] === 'HowToStep' && inst.text) return inst.text.trim();
            if (inst['@type'] === 'HowToStep' && inst.name) return inst.name.trim();
            return '';
          })
          .filter((text: string) => text.length > 10);
      }

      // Extract author if available
      const author = jsonLdResult.author?.name || jsonLdResult.author || jsonLdResult.publisher?.name || undefined;

      // CHECKPOINT 3: Data Validation
      const validationResult = {
        hasTitle: false,
        hasIngredients: false,
        hasInstructions: false,
        details: {} as any,
      };

      validationResult.hasTitle =
        title &&
        typeof title === 'string' &&
        title.trim().length > 0 &&
        title !== 'No recipe found';

      validationResult.hasIngredients =
        ingredients &&
        Array.isArray(ingredients) &&
        ingredients.length > 0 &&
        ingredients.some(
          (group: any) =>
            group &&
            group.ingredients &&
            Array.isArray(group.ingredients) &&
            group.ingredients.length > 0
        );

      validationResult.hasInstructions =
        instructions &&
        Array.isArray(instructions) &&
        instructions.length > 0;

      validationResult.details = {
        title: title || 'missing',
        titleLength: title?.length || 0,
        ingredientGroups: ingredients?.length || 0,
        totalIngredients: ingredients?.reduce((sum: number, g: any) => sum + (g.ingredients?.length || 0), 0) || 0,
        instructionCount: instructions?.length || 0,
      };

      const validationPassed =
        validationResult.hasTitle &&
        validationResult.hasIngredients &&
        validationResult.hasInstructions;

      steps.push({
        step: 'checkpoint_3',
        title: 'CHECKPOINT 3: Data Validation',
        data: validationResult,
        success: validationPassed,
        timestamp: Date.now(),
      });

      if (!validationPassed) {
        steps.push({
          step: 'warning',
          title: '⚠️ Warning: Data Validation Failed',
          data: `Validation failed: ${!validationResult.hasTitle ? 'Missing or invalid title' : ''} ${!validationResult.hasIngredients ? 'Missing or empty ingredients' : ''} ${!validationResult.hasInstructions ? 'Missing or empty instructions' : ''}`,
          success: false,
          timestamp: Date.now(),
        });
      }

      steps.push({
        step: 'final_result',
        title: 'Final Parsed Recipe (via JSON-LD)',
        data: { title, ingredients, instructions, method: 'json-ld', validationPassed, author, sourceUrl: url },
        success: validationPassed,
        timestamp: Date.now(),
      });

      return NextResponse.json({
        success: true,
        steps,
        checkpoints: {
          checkpoint1: urlValidationResult,
          checkpoint2: { method: 'json-ld', success: true },
          checkpoint3: validationResult,
        },
      });
    } else {
      steps.push({
        step: 'checkpoint_2_jsonld',
        title: 'CHECKPOINT 2: JSON-LD Not Found',
        data: 'No structured data found, will use AI parsing',
        success: false,
        timestamp: Date.now(),
      });
    }

    // CHECKPOINT 2 (continued): AI Parsing fallback
    console.log('[Debug API] CHECKPOINT 2: Recipe Parsing - Using AI fallback...');
    
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'GROQ_API_KEY is not configured',
        steps,
      });
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const limitedHtml = cleaned.html.slice(0, 15000);
    
    // Use custom prompt if provided, otherwise use default
    const defaultPrompt = `========================================
CRITICAL OUTPUT FORMAT
========================================
You MUST output ONLY raw JSON. NO thinking, NO reasoning, NO explanations, NO text before or after the JSON.
START YOUR RESPONSE IMMEDIATELY WITH { and END WITH }. Nothing else.

Required JSON structure:
{
  "title": "string",
  "ingredients": [
    {
      "groupName": "string",
      "ingredients": [
        {"amount": "string", "units": "string", "ingredient": "string"}
      ]
    }
  ],
  "instructions": ["string", "string", ...]
}

CRITICAL: ingredients and instructions MUST be arrays, NEVER null.
- If ingredients are found: extract them into the array structure above
- If NO ingredients found: use empty array []
- If instructions are found: extract them into an array of strings
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
7. Format the extracted data into the required JSON structure

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

CLEANING (remove these only):
- Author names and bylines (e.g., "By Chef John:")
- Attribution text (e.g., "Recipe courtesy of...")
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
- The recipe data exists in the HTML - extract it carefully`;

    // Use custom prompt if provided (from query param or request body)
    const aiPrompt = customPrompt && customPrompt.trim() ? customPrompt.trim() : defaultPrompt;

    steps.push({
      step: 'ai_prompt',
      title: customPrompt ? 'AI Prompt Sent (Custom)' : 'AI Prompt Sent (Default)',
      data: aiPrompt,
      success: true,
      timestamp: Date.now(),
    });

    let aiResponse;
    try {
      aiResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: aiPrompt,
          },
          {
            role: 'user',
            content: limitedHtml,
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      });
    } catch (apiError: any) {
      console.error('[Debug API] Groq API Error:', apiError);
      return NextResponse.json({
        success: false,
        error: `Groq API Error: ${apiError?.message || 'Unknown error'}. Model may not be available.`,
        steps,
      });
    }

    const result = aiResponse.choices[0]?.message?.content;

    if (!result || result.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No response from AI service',
        steps,
      });
    }

    steps.push({
      step: 'ai_response',
      title: 'AI Response Received',
      data: result,
      success: true,
      timestamp: Date.now(),
    });

    // Parse AI response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : result;
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[Debug API] JSON Parse Error:', parseError);
      return NextResponse.json({
        success: false,
        error: `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        steps,
      });
    }

    // Validate and normalize the parsed data
    // Convert null values to empty arrays to prevent UI errors
    const normalizedData = {
      title: parsedData.title || 'No title found',
      ingredients: Array.isArray(parsedData.ingredients) ? parsedData.ingredients : [],
      instructions: Array.isArray(parsedData.instructions) ? parsedData.instructions : [],
      method: 'ai',
      author: parsedData.author || undefined,
      sourceUrl: url,
    };

    // Log warning if null values were found
    if (parsedData.ingredients === null || parsedData.instructions === null) {
      console.warn('[Debug API] AI returned null values. Ingredients:', parsedData.ingredients, 'Instructions:', parsedData.instructions);
      steps.push({
        step: 'warning',
        title: '⚠️ Warning: AI returned null values',
        data: 'The AI model returned null for ingredients or instructions. This may indicate the HTML content was not parseable or the model had difficulty extracting the data.',
        success: false,
        timestamp: Date.now(),
      });
    }

    // CHECKPOINT 3: Data Validation
    const validationResult = {
      hasTitle: false,
      hasIngredients: false,
      hasInstructions: false,
      details: {} as any,
    };

    validationResult.hasTitle =
      normalizedData.title &&
      typeof normalizedData.title === 'string' &&
      normalizedData.title.trim().length > 0 &&
      normalizedData.title !== 'No recipe found' &&
      normalizedData.title !== 'No title found';

    validationResult.hasIngredients =
      normalizedData.ingredients &&
      Array.isArray(normalizedData.ingredients) &&
      normalizedData.ingredients.length > 0 &&
      normalizedData.ingredients.some(
        (group: any) =>
          group &&
          group.ingredients &&
          Array.isArray(group.ingredients) &&
          group.ingredients.length > 0
      );

    validationResult.hasInstructions =
      normalizedData.instructions &&
      Array.isArray(normalizedData.instructions) &&
      normalizedData.instructions.length > 0;

    validationResult.details = {
      title: normalizedData.title || 'missing',
      titleLength: normalizedData.title?.length || 0,
      ingredientGroups: normalizedData.ingredients?.length || 0,
      totalIngredients: normalizedData.ingredients?.reduce((sum: number, g: any) => sum + (g.ingredients?.length || 0), 0) || 0,
      instructionCount: normalizedData.instructions?.length || 0,
    };

    const validationPassed =
      validationResult.hasTitle &&
      validationResult.hasIngredients &&
      validationResult.hasInstructions;

    steps.push({
      step: 'checkpoint_3',
      title: 'CHECKPOINT 3: Data Validation',
      data: validationResult,
      success: validationPassed,
      timestamp: Date.now(),
    });

    if (!validationPassed) {
      steps.push({
        step: 'warning',
        title: '⚠️ Warning: Data Validation Failed',
        data: `Validation failed: ${!validationResult.hasTitle ? 'Missing or invalid title' : ''} ${!validationResult.hasIngredients ? 'Missing or empty ingredients' : ''} ${!validationResult.hasInstructions ? 'Missing or empty instructions' : ''}`,
        success: false,
        timestamp: Date.now(),
      });
    }

    steps.push({
      step: 'final_result',
      title: 'Final Parsed Recipe (via AI)',
      data: { ...normalizedData, validationPassed },
      success: validationPassed,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      steps,
      checkpoints: {
        checkpoint1: urlValidationResult,
        checkpoint2: { method: 'ai', success: aiResponse ? true : false },
        checkpoint3: validationResult,
      },
    });
  } catch (error) {
    console.error('[Debug API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      success: false,
      error: errorMessage,
      steps,
    });
  }
}

/**
 * POST /api/admin/debug-parse
 * 
 * Same as GET but accepts URL and customPrompt in request body
 * Useful for sending large custom prompts that exceed URL length limits
 */
export async function POST(req: NextRequest): Promise<Response> {
  const steps: DebugStep[] = [];
  
  try {
    const body = await req.json();
    const { url, customPrompt } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'URL is required in request body',
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid URL format',
      });
    }

    console.log(`[Debug API] Starting debug parse for: ${url}${customPrompt ? ' (with custom prompt)' : ''}`);

    // Reuse the same logic as GET handler, but use customPrompt from body
    // Step 1: Fetch raw HTML
    console.log('[Debug API] Step 1: Fetching raw HTML...');
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
      return NextResponse.json({
        success: false,
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
      });
    }

    const rawHtml = await response.text();
    steps.push({
      step: 'raw_html',
      title: 'Raw HTML Fetched',
      data: rawHtml,
      success: true,
      timestamp: Date.now(),
    });

    // Step 2: Clean HTML
    console.log('[Debug API] Step 2: Cleaning HTML...');
    const cleaned = cleanRecipeHTML(rawHtml);
    
    if (!cleaned.success || !cleaned.html) {
      return NextResponse.json({
        success: false,
        error: cleaned.error || 'Failed to clean HTML',
        steps,
      });
    }

    steps.push({
      step: 'cleaned_html',
      title: 'HTML Cleaned',
      data: cleaned.html,
      success: true,
      timestamp: Date.now(),
    });

    // Step 3: Try JSON-LD extraction (same as GET)
    console.log('[Debug API] Step 3: Attempting JSON-LD extraction...');
    const $ = cheerio.load(cleaned.html);
    let jsonLdResult = null;

    try {
      const scripts = $('script[type="application/ld+json"]');
      for (let i = 0; i < scripts.length; i++) {
        const scriptContent = $(scripts[i]).html();
        if (!scriptContent) continue;

        const data = JSON.parse(scriptContent);
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          if (
            item['@type'] === 'Recipe' ||
            (item['@graph'] &&
              Array.isArray(item['@graph']) &&
              item['@graph'].some((g: any) => g['@type'] === 'Recipe'))
          ) {
            const recipe =
              item['@type'] === 'Recipe'
                ? item
                : item['@graph'].find((g: any) => g['@type'] === 'Recipe');

            if (recipe && recipe.name && recipe.recipeIngredient && recipe.recipeInstructions) {
              jsonLdResult = recipe;
              break;
            }
          }
        }
        if (jsonLdResult) break;
      }
    } catch (error) {
      console.log('[Debug API] JSON-LD parsing failed:', error);
    }

    if (jsonLdResult) {
      steps.push({
        step: 'json_ld',
        title: 'JSON-LD Structured Data Found',
        data: jsonLdResult,
        success: true,
        timestamp: Date.now(),
      });

      // Parse JSON-LD into our format
      const title = jsonLdResult.name || '';
      const ingredientStrings = Array.isArray(jsonLdResult.recipeIngredient)
        ? jsonLdResult.recipeIngredient
        : [];
      
      const ingredients = [
        {
          groupName: 'Main',
          ingredients: ingredientStrings.map((ing: string) => ({
            amount: '',
            units: '',
            ingredient: ing,
          })),
        },
      ];

      let instructions: string[] = [];
      if (Array.isArray(jsonLdResult.recipeInstructions)) {
        instructions = jsonLdResult.recipeInstructions
          .map((inst: any) => {
            if (typeof inst === 'string') return inst.trim();
            if (inst.text) return inst.text.trim();
            if (inst['@type'] === 'HowToStep' && inst.text) return inst.text.trim();
            if (inst['@type'] === 'HowToStep' && inst.name) return inst.name.trim();
            return '';
          })
          .filter((text: string) => text.length > 10);
      }

      // Extract author if available
      const author = jsonLdResult.author?.name || jsonLdResult.author || jsonLdResult.publisher?.name || undefined;

      steps.push({
        step: 'final_result',
        title: 'Final Parsed Recipe (via JSON-LD)',
        data: { title, ingredients, instructions, method: 'json-ld', author, sourceUrl: url },
        success: true,
        timestamp: Date.now(),
      });

      return NextResponse.json({
        success: true,
        steps,
      });
    } else {
      steps.push({
        step: 'json_ld',
        title: 'JSON-LD Not Found',
        data: 'No structured data found, will use AI parsing',
        success: false,
        timestamp: Date.now(),
      });
    }

    // Step 4: AI Parsing with custom prompt support
    console.log('[Debug API] Step 4: Using AI to parse...');
    
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'GROQ_API_KEY is not configured',
        steps,
      });
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const limitedHtml = cleaned.html.slice(0, 15000);
    
    // Use custom prompt if provided, otherwise use default
    const defaultPrompt = `========================================
CRITICAL OUTPUT FORMAT
========================================
You MUST output ONLY raw JSON. NO thinking, NO reasoning, NO explanations, NO text before or after the JSON.
START YOUR RESPONSE IMMEDIATELY WITH { and END WITH }. Nothing else.

Required JSON structure:
{
  "title": "string",
  "ingredients": [
    {
      "groupName": "string",
      "ingredients": [
        {"amount": "string", "units": "string", "ingredient": "string"}
      ]
    }
  ],
  "instructions": ["string", "string", ...]
}

CRITICAL: ingredients and instructions MUST be arrays, NEVER null.
- If ingredients are found: extract them into the array structure above
- If NO ingredients found: use empty array []
- If instructions are found: extract them into an array of strings
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
7. Format the extracted data into the required JSON structure

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

CLEANING (remove these only):
- Author names and bylines (e.g., "By Chef John:")
- Attribution text (e.g., "Recipe courtesy of...")
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
- The recipe data exists in the HTML - extract it carefully`;

    // Use custom prompt if provided
    const aiPrompt = customPrompt && customPrompt.trim() ? customPrompt.trim() : defaultPrompt;

    steps.push({
      step: 'ai_prompt',
      title: customPrompt ? 'AI Prompt Sent (Custom)' : 'AI Prompt Sent (Default)',
      data: aiPrompt,
      success: true,
      timestamp: Date.now(),
    });

    let aiResponse;
    try {
      aiResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: aiPrompt,
          },
          {
            role: 'user',
            content: limitedHtml,
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      });
    } catch (apiError: any) {
      console.error('[Debug API] Groq API Error:', apiError);
      return NextResponse.json({
        success: false,
        error: `Groq API Error: ${apiError?.message || 'Unknown error'}. Model may not be available.`,
        steps,
      });
    }

    const result = aiResponse.choices[0]?.message?.content;

    if (!result || result.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No response from AI service',
        steps,
      });
    }

    steps.push({
      step: 'ai_response',
      title: 'AI Response Received',
      data: result,
      success: true,
      timestamp: Date.now(),
    });

    // Parse AI response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : result;
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[Debug API] JSON Parse Error:', parseError);
      return NextResponse.json({
        success: false,
        error: `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        steps,
      });
    }

    // Validate and normalize the parsed data
    // Convert null values to empty arrays to prevent UI errors
    const normalizedData = {
      title: parsedData.title || 'No title found',
      ingredients: Array.isArray(parsedData.ingredients) ? parsedData.ingredients : [],
      instructions: Array.isArray(parsedData.instructions) ? parsedData.instructions : [],
      method: 'ai',
      author: parsedData.author || undefined,
      sourceUrl: url,
    };

    // Log warning if null values were found
    if (parsedData.ingredients === null || parsedData.instructions === null) {
      console.warn('[Debug API] AI returned null values. Ingredients:', parsedData.ingredients, 'Instructions:', parsedData.instructions);
      steps.push({
        step: 'warning',
        title: '⚠️ Warning: AI returned null values',
        data: 'The AI model returned null for ingredients or instructions. This may indicate the HTML content was not parseable or the model had difficulty extracting the data.',
        success: false,
        timestamp: Date.now(),
      });
    }

    steps.push({
      step: 'final_result',
      title: 'Final Parsed Recipe (via AI)',
      data: normalizedData,
      success: true,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      steps,
    });
  } catch (error) {
    console.error('[Debug API] POST Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      success: false,
      error: errorMessage,
      steps,
    });
  }
}



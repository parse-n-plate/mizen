/**
 * Unified Recipe Parsing API Endpoint
 * 
 * This endpoint provides a single, unified interface for parsing recipes from any website.
 * It uses a two-layer approach:
 * 1. JSON-LD structured data extraction (fast, reliable)
 * 2. AI-based parsing of cleaned HTML (fallback)
 * 
 * This replaces the need for site-specific HTML selectors and works with any recipe website.
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatError, ERROR_CODES } from '@/utils/formatError';
import { parseRecipeFromUrl } from '@/utils/aiRecipeParser';

/**
 * POST /api/parseRecipe
 * 
 * Request body:
 * {
 *   "url": "https://example.com/recipe"
 * }
 * 
 * Response (success):
 * {
 *   "success": true,
 *   "title": "Recipe Title",
 *   "ingredients": [
 *     {
 *       "groupName": "Main",
 *       "ingredients": [
 *         {"amount": "1", "units": "cup", "ingredient": "flour"}
 *       ]
 *     }
 *   ],
 *   "instructions": ["Step 1", "Step 2"],
 *   "method": "json-ld" | "ai"
 * }
 * 
 * Response (error):
 * {
 *   "success": false,
 *   "error": {
 *     "code": "ERR_CODE",
 *     "message": "Error message"
 *   }
 * }
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { url } = await req.json();

    // Validate URL is provided and is a string
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        formatError(
          ERROR_CODES.ERR_INVALID_URL,
          'URL is required and must be a string'
        )
      );
    }

    // Basic URL format validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_INVALID_URL, 'Invalid URL format')
      );
    }

    console.log(`[API /parseRecipe] Starting recipe parse for URL: ${url}`);

    // Use the unified parser
    const result = await parseRecipeFromUrl(url);

    // Check if parsing failed
    if (!result.success || !result.data) {
      console.error('[API /parseRecipe] Parsing failed:', result.error);
      
      // Determine appropriate error code based on error message
      let errorCode: string = ERROR_CODES.ERR_NO_RECIPE_FOUND;
      let errorMessage = 'Could not extract recipe from this page';

      if (result.error) {
        if (result.error === 'ERR_RATE_LIMIT' || result.error.includes('rate limit') || result.error.includes('quota')) {
          errorCode = ERROR_CODES.ERR_RATE_LIMIT;
          errorMessage = 'Too many requests';
          // Pass through retry-after timestamp if available
          const retryAfter = result.retryAfter;
          return NextResponse.json(formatError(errorCode, errorMessage, retryAfter));
        } else if (result.error === 'ERR_API_UNAVAILABLE' || result.error.includes('service unavailable')) {
          errorCode = ERROR_CODES.ERR_API_UNAVAILABLE;
          errorMessage = 'Service temporarily unavailable';
        } else if (result.error.includes('timeout') || result.error.includes('abort')) {
          errorCode = ERROR_CODES.ERR_TIMEOUT;
          errorMessage = 'Request timed out';
        } else if (result.error.includes('fetch') || result.error.includes('Failed to fetch')) {
          errorCode = ERROR_CODES.ERR_FETCH_FAILED;
          errorMessage = 'Could not connect to recipe site';
        } else if (result.error.includes('empty')) {
          errorCode = ERROR_CODES.ERR_NO_RECIPE_FOUND;
          errorMessage = 'No content found on this page';
        }
      }

      return NextResponse.json(formatError(errorCode, errorMessage));
    }

    // Validate we have complete recipe data
    const hasTitle =
      result.data.title &&
      typeof result.data.title === 'string' &&
      result.data.title.trim().length > 0 &&
      result.data.title !== 'No recipe found';

    const hasIngredients =
      result.data.ingredients &&
      Array.isArray(result.data.ingredients) &&
      result.data.ingredients.length > 0 &&
      result.data.ingredients.some(
        (group) => group.ingredients && group.ingredients.length > 0
      );

    const hasInstructions =
      result.data.instructions &&
      Array.isArray(result.data.instructions) &&
      result.data.instructions.length > 0;

    if (!hasTitle || !hasIngredients || !hasInstructions) {
      console.error('[API /parseRecipe] Incomplete recipe data:', {
        hasTitle,
        hasIngredients,
        hasInstructions,
      });
      return NextResponse.json(
        formatError(
          ERROR_CODES.ERR_NO_RECIPE_FOUND,
          'No complete recipe content found on this page'
        )
      );
    }

    // Return successful response with recipe data
    console.log(
      `[API /parseRecipe] Successfully parsed recipe using ${result.method}: "${result.data.title}" with ${result.data.ingredients.reduce((sum, g) => sum + g.ingredients.length, 0)} ingredients and ${result.data.instructions.length} instructions`
    );
    console.log('[API /parseRecipe] 🍽️ Cuisine data in response:', {
      cuisine: result.data.cuisine,
      hasCuisine: !!result.data.cuisine,
      cuisineCount: result.data.cuisine?.length || 0,
    });
    
    // Log important recipe output information: title, author, and servings
    console.log('[API /parseRecipe] 📋 Recipe output summary:', {
      title: result.data.title || 'N/A',
      author: result.data.author || 'N/A',
      servings: result.data.servings || 'N/A',
      hasAuthor: !!result.data.author,
      hasServings: !!result.data.servings,
    });
    
    return NextResponse.json({
      success: true,
      title: result.data.title,
      ingredients: result.data.ingredients,
      instructions: result.data.instructions,
      author: result.data.author, // Include author if available
      sourceUrl: result.data.sourceUrl, // Include source URL if available
      summary: result.data.summary, // Include AI-generated summary if available
      cuisine: result.data.cuisine, // Include cuisine tags if available
      servings: result.data.servings, // Include servings/yield if available
      prepTimeMinutes: result.data.prepTimeMinutes, // Include prep time if available
      cookTimeMinutes: result.data.cookTimeMinutes, // Include cook time if available
      totalTimeMinutes: result.data.totalTimeMinutes, // Include total time if available
      storageGuide: result.data.storageGuide, // Include storage instructions if available
      shelfLife: result.data.shelfLife, // Include shelf life info if available
      method: result.method, // Include which method was used (json-ld or ai)
    });
  } catch (error) {
    console.error('[API /parseRecipe] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_TIMEOUT, 'Request timed out')
      );
    }

    // Check for network errors
    if (
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('fetch')
    ) {
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_FETCH_FAILED, 'Could not connect to recipe site')
      );
    }

    // Generic error fallback
    return NextResponse.json(
      formatError(ERROR_CODES.ERR_UNKNOWN, 'An unexpected error occurred')
    );
  }
}

/**
 * GET /api/parseRecipe
 * 
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    message: 'Unified Recipe Parsing API',
    description:
      'This endpoint parses recipes from any website using JSON-LD or AI-based extraction',
    usage: {
      method: 'POST',
      body: {
        url: 'https://example.com/recipe',
      },
    },
    methods: [
      {
        name: 'json-ld',
        description: 'Fast extraction from structured data (no AI tokens used)',
      },
      {
        name: 'ai',
        description: 'AI-based extraction from HTML when structured data is not available',
      },
    ],
  });
}








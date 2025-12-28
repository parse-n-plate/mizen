import { NextRequest, NextResponse } from 'next/server';
import { formatError, ERROR_CODES } from '@/utils/formatError';
import { parseRecipeFromUrl } from '@/utils/aiRecipeParser';

/**
 * API endpoint for recipe scraping - now uses unified AI-based parser
 * 
 * This endpoint maintains backward compatibility with the old API contract
 * but now uses the new scalable AI-based parsing system that works with any recipe website.
 * 
 * The new system uses:
 * 1. JSON-LD structured data extraction (fast, reliable when available)
 * 2. AI-based parsing of cleaned HTML (fallback for any website)
 * 
 * No more site-specific HTML selectors needed!
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Check if request is FormData (with image) or JSON (without image)
    const contentType = req.headers.get('content-type') || '';
    let url: string | undefined;
    let imageFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData request (with image, URL optional)
      const formData = await req.formData();
      const urlValue = formData.get('url');
      url = urlValue && typeof urlValue === 'string' ? urlValue : undefined;
      const image = formData.get('image') as File | null;
      
      if (image && image.size > 0) {
        imageFile = image;
        console.log(`[API /recipeScraperPython] Received image upload: ${image.name} (${image.size} bytes)`);
      }
    } else {
      // Handle JSON request (without image, URL required)
      const body = await req.json();
      url = body.url;
    }

    // Validate: must have either URL or image (or both)
    if (!url && !imageFile) {
      return NextResponse.json(
        formatError(
          ERROR_CODES.ERR_INVALID_URL,
          'Either URL or image must be provided',
        ),
      );
    }

    // If URL is provided, validate it
    if (url) {
      if (typeof url !== 'string') {
        return NextResponse.json(
          formatError(
            ERROR_CODES.ERR_INVALID_URL,
            'URL must be a string',
          ),
        );
      }

      // Basic URL format validation
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          formatError(ERROR_CODES.ERR_INVALID_URL, 'Invalid URL format'),
        );
      }
    }

    console.log(`[API /recipeScraperPython] Starting recipe parse${url ? ` for URL: ${url}` : ''}${imageFile ? ' with image' : ''}`);

    // Use the new unified parser with optional URL and image
    const result = url 
      ? await parseRecipeFromUrl(url, imageFile)
      : await parseRecipeFromImage(imageFile!); // imageFile is guaranteed to exist if no URL

    // Check if parsing failed
    if (!result.success || !result.data) {
      console.error('[API /recipeScraperPython] Parsing failed:', result.error);
      
      // Determine appropriate error code
      let errorCode = ERROR_CODES.ERR_NO_RECIPE_FOUND;
      let errorMessage = 'Could not extract recipe from this page';

      if (result.error) {
        if (result.error === 'ERR_RATE_LIMIT' || result.error.includes('rate limit') || result.error.includes('quota')) {
          errorCode = ERROR_CODES.ERR_RATE_LIMIT;
          errorMessage = 'Too many requests';
        } else if (result.error === 'ERR_API_UNAVAILABLE' || result.error.includes('service unavailable')) {
          errorCode = ERROR_CODES.ERR_API_UNAVAILABLE;
          errorMessage = 'Service temporarily unavailable';
        } else if (result.error.includes('timeout') || result.error.includes('abort')) {
          errorCode = ERROR_CODES.ERR_TIMEOUT;
          errorMessage = 'Request timed out';
        } else if (result.error.includes('fetch') || result.error.includes('Failed to fetch')) {
          errorCode = ERROR_CODES.ERR_FETCH_FAILED;
          errorMessage = 'Could not connect to recipe site';
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

    // Check ingredients structure more carefully
    const hasIngredients =
      result.data.ingredients &&
      Array.isArray(result.data.ingredients) &&
      result.data.ingredients.length > 0 &&
      // Ensure at least one group has ingredients
      result.data.ingredients.some(
        (group: any) =>
          group &&
          group.ingredients &&
          Array.isArray(group.ingredients) &&
          group.ingredients.length > 0
      );

    const hasInstructions =
      result.data.instructions &&
      Array.isArray(result.data.instructions) &&
      result.data.instructions.length > 0;

    if (!hasTitle || !hasIngredients || !hasInstructions) {
      console.error('[API /recipeScraperPython] Incomplete recipe data:', {
        hasTitle,
        hasIngredients,
        hasInstructions,
        titleValue: result.data.title,
        ingredientsStructure: result.data.ingredients
          ? {
              length: result.data.ingredients.length,
              groups: result.data.ingredients.map((g: any) => ({
                groupName: g?.groupName,
                ingredientCount: g?.ingredients?.length || 0,
              })),
            }
          : 'missing',
        instructionsCount: result.data.instructions?.length || 0,
        method: result.method,
      });
      return NextResponse.json(
        formatError(
          ERROR_CODES.ERR_NO_RECIPE_FOUND,
          'No recipe content found on this page',
        ),
      );
    }

    // Return successful response with recipe data
    // Maintaining backward compatibility with original API contract
    console.log(
      `[API /recipeScraperPython] Successfully parsed recipe using ${result.method}: "${result.data.title}" with ${result.data.ingredients.reduce((sum, g) => sum + g.ingredients.length, 0)} total ingredients and ${result.data.instructions.length} instructions`,
    );
    console.log('[API /recipeScraperPython] 🍽️ Cuisine data in response:', {
      cuisine: result.data.cuisine,
      hasCuisine: !!result.data.cuisine,
      cuisineCount: result.data.cuisine?.length || 0,
    });

    return NextResponse.json({
      success: true,
      title: result.data.title,
      ingredients: result.data.ingredients,
      instructions: result.data.instructions,
      // Surface optional metadata so the client can display attribution
      author: result.data.author,
      sourceUrl: result.data.sourceUrl,
      summary: result.data.summary, // Include AI-generated summary
      cuisine: result.data.cuisine, // Include cuisine tags if available
    });
  } catch (error) {
    console.error('[API /recipeScraperPython] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_TIMEOUT, 'Request timed out'),
      );
    }

    // Check for network errors
    if (
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('fetch')
    ) {
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_FETCH_FAILED, 'Could not connect to recipe site'),
      );
    }

    // Generic error fallback
    return NextResponse.json(
      formatError(ERROR_CODES.ERR_UNKNOWN, 'An unexpected error occurred'),
    );
  }
}

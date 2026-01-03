/**
 * Image Recipe Parsing API Endpoint
 * 
 * This endpoint accepts image uploads (recipe cards, cookbook pages, screenshots)
 * and uses AI vision models to extract recipe data from the image.
 * 
 * Supported formats: JPG, PNG, WEBP, GIF
 * Max file size: 10MB
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatError, ERROR_CODES } from '@/utils/formatError';
import { parseRecipeFromImage } from '@/utils/aiRecipeParser';

/**
 * POST /api/parseRecipeFromImage
 * 
 * Request: multipart/form-data with 'image' field
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
 *   "instructions": ["Step 1", "Step 2"]
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
    console.log('[API /parseRecipeFromImage] Received image upload request');

    // Parse the multipart/form-data request
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;

    // Validate that an image file was provided
    if (!imageFile) {
      console.error('[API /parseRecipeFromImage] No image file provided');
      return NextResponse.json(
        formatError(ERROR_CODES.ERR_INVALID_URL, 'No image file provided')
      );
    }

    // Validate file type - only allow image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(imageFile.type)) {
      console.error('[API /parseRecipeFromImage] Invalid file type:', imageFile.type);
      return NextResponse.json(
        formatError(
          ERROR_CODES.ERR_INVALID_URL,
          'Invalid file type. Please upload a JPG, PNG, WEBP, or GIF image.'
        )
      );
    }

    // Validate file size - max 10MB
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (imageFile.size > maxSize) {
      console.error('[API /parseRecipeFromImage] File too large:', imageFile.size);
      return NextResponse.json(
        formatError(
          ERROR_CODES.ERR_INVALID_URL,
          'Image size must be less than 10MB'
        )
      );
    }

    console.log('[API /parseRecipeFromImage] Valid image file received:', {
      name: imageFile.name,
      type: imageFile.type,
      size: imageFile.size,
    });

    // Convert image file to base64 data URL
    // This is required for the Groq vision API
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    
    // Create data URL with proper MIME type prefix
    // Format: data:image/jpeg;base64,<base64data>
    const mimeType = imageFile.type || 'image/jpeg';
    const base64DataUrl = `data:${mimeType};base64,${base64Image}`;

    console.log('[API /parseRecipeFromImage] Converted image to base64, length:', base64DataUrl.length);

    // Call the AI vision parser function
    const result = await parseRecipeFromImage(base64DataUrl);

    // Check if parsing failed
    if (!result.success || !result.data) {
      console.error('[API /parseRecipeFromImage] Parsing failed:', result.error);
      
      // Determine appropriate error code
      let errorCode = ERROR_CODES.ERR_NO_RECIPE_FOUND;
      let errorMessage = 'Could not extract recipe from image';

      if (result.error) {
        if (result.error === 'ERR_RATE_LIMIT' || result.error.includes('rate limit') || result.error.includes('quota')) {
          errorCode = ERROR_CODES.ERR_RATE_LIMIT;
          errorMessage = 'Too many requests';
          // Pass through retry-after timestamp if available
          const retryAfter = result.retryAfter;
          return NextResponse.json(formatError(errorCode, errorMessage, retryAfter));
        } else if (result.error.includes('API key') || result.error.includes('configured')) {
          errorCode = ERROR_CODES.ERR_AI_PARSE_FAILED;
          errorMessage = 'AI service not configured';
        } else if (result.error.includes('No recipe found')) {
          errorCode = ERROR_CODES.ERR_NO_RECIPE_FOUND;
          errorMessage = 'No recipe found in image - could not read recipe text';
        } else {
          errorCode = ERROR_CODES.ERR_AI_PARSE_FAILED;
          errorMessage = result.error;
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
      console.error('[API /parseRecipeFromImage] Incomplete recipe data:', {
        hasTitle,
        hasIngredients,
        hasInstructions,
      });
      return NextResponse.json(
        formatError(
          ERROR_CODES.ERR_NO_RECIPE_FOUND,
          'Could not extract complete recipe from image'
        )
      );
    }

    // Return successful response with recipe data
    console.log(
      `[API /parseRecipeFromImage] Successfully parsed recipe: "${result.data.title}" with ${result.data.ingredients.reduce((sum, g) => sum + g.ingredients.length, 0)} ingredients and ${result.data.instructions.length} instructions`
    );
    
    // Log important recipe output information: title, author, and servings
    console.log('[API /parseRecipeFromImage] 📋 Recipe output summary:', {
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
      summary: result.data.summary, // Include AI-generated summary
      author: result.data.author, // Include author if available
      cuisine: result.data.cuisine, // Include cuisine if available
      servings: result.data.servings, // Include servings/yield if available
      prepTimeMinutes: result.data.prepTimeMinutes, // Include prep time if available
      cookTimeMinutes: result.data.cookTimeMinutes, // Include cook time if available
      totalTimeMinutes: result.data.totalTimeMinutes, // Include total time if available
      imageData: base64DataUrl, // Return the base64 image data for preview
      imageFilename: imageFile.name, // Return the original filename
    });
  } catch (error) {
    console.error('[API /parseRecipeFromImage] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Generic error fallback
    return NextResponse.json(
      formatError(ERROR_CODES.ERR_UNKNOWN, `An unexpected error occurred: ${errorMessage}`)
    );
  }
}

/**
 * GET /api/parseRecipeFromImage
 * 
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    message: 'Image Recipe Parsing API',
    description:
      'This endpoint parses recipes from uploaded images using AI vision models',
    usage: {
      method: 'POST',
      contentType: 'multipart/form-data',
      body: {
        image: 'Image file (JPG, PNG, WEBP, GIF, max 10MB)',
      },
    },
    supportedFormats: ['JPG', 'PNG', 'WEBP', 'GIF'],
    maxFileSize: '10MB',
  });
}


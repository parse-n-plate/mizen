import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(req: NextRequest): Promise<Response> {
  const { url } = await req.json();

  return new Promise((resolve) => {
    const process = spawn('python3', ['src/utils/scrape_recipe.py', url]);

    const data = '';
    let error = '';

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
        if (result.error.includes('timeout') || result.error.includes('abort')) {
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

    return NextResponse.json({
      success: true,
      title: result.data.title,
      ingredients: result.data.ingredients,
      instructions: result.data.instructions,
      datePublished: result.data.datePublished, // Include publication date if available
      method: result.method, // Include which method was used (json-ld or ai)
    });

    process.stderr.on('data', (chunk) => {
      error += chunk.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        try {
          const json = JSON.parse(data);
          resolve(NextResponse.json(json));
        } catch (err) {
          console.error('Error parsing Python output:', err);
          resolve(
            NextResponse.json({ error: 'Failed to parse Python output' }),
          );
        }
      } else {
        resolve(
          NextResponse.json({
            error: error || 'Unknown error running Python script',
          }),
        );
      }
    });
  });
}

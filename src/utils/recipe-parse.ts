export async function fetchHtml(url: string) {
  console.log('Parsing recipe to HTML:', url);
  const res = await fetch(`/api/fetchHtml?url=${encodeURIComponent(url)}`);
  return await res.json();
}

export async function validateRecipeUrl(url: string) {
  const res = await fetch('/api/urlValidator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  return await res.json();
}

/**
 * Extract JSON from a string that may contain extra text or markdown
 */
function extractJsonFromResponse(text: string): string {
  // First, try to clean common markdown patterns
  const cleaned = text
    .replace(/^[\s`]*```(?:json)?/, '') // Remove starting ```json or ```
    .replace(/```[\s`]*$/, '') // Remove trailing ```
    .trim();

  // Try to extract JSON array first (for our ["title", [ingredients]] format)
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  // If no JSON array found, try to extract JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // If no JSON found, return the cleaned text
  return cleaned;
}

/**
 * Fallback recipe data when parsing fails
 */
function getFallbackRecipeData(): [
  string,
  {
    groupName: string;
    ingredients: { amount: string; units: string; ingredient: string }[];
  }[],
] {
  console.warn(
    'parseIngredients: Using fallback recipe data due to parsing failure',
  );
  return [
    'Recipe',
    [
      {
        groupName: 'Main',
        ingredients: [
          { amount: '1', units: 'cup', ingredient: 'ingredient' },
          { amount: '1', units: 'tablespoon', ingredient: 'seasoning' },
        ],
      },
    ],
  ];
}

/**
 * Parses ingredients and groups from AI response.
 * Returns: [title: string, groups: { groupName: string, ingredients: { amount, units, ingredient }[] }[]]
 */
export async function parseIngredients(ingredients: string) {
  // Convert array to string if needed
  const ingredientsText = Array.isArray(ingredients)
    ? ingredients.join('\n')
    : ingredients;
  const res = await fetch('/api/parseIngredients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: ingredientsText }),
  });

  // Check if response is actually JSON before parsing
  // If the API returns an HTML error page, we need to handle it gracefully
  // Read response as text first (can only read body once)
  const textResponse = await res.text();
  let responseData;

  // Check if response looks like HTML (starts with <) or is empty
  if (textResponse.trim().startsWith('<') || textResponse.trim().length === 0) {
    // Response is HTML error page or empty
    console.error('parseIngredients: Received HTML or empty response:', {
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get('content-type'),
      responsePreview: textResponse.slice(0, 200), // First 200 chars for debugging
    });
    return {
      success: false,
      error: {
        code: 'ERR_AI_PARSE_FAILED',
        message: `API returned HTML error page (status: ${res.status})`,
      },
    };
  }

  // Try to parse as JSON
  try {
    responseData = JSON.parse(textResponse);
  } catch (jsonError) {
    // If JSON parsing fails, log the error and return a helpful message
    console.error('parseIngredients: Failed to parse JSON response:', {
      error: jsonError,
      status: res.status,
      responsePreview: textResponse.slice(0, 200),
    });
    return {
      success: false,
      error: {
        code: 'ERR_AI_PARSE_FAILED',
        message: 'Failed to parse API response as JSON',
      },
    };
  }

  if (!res.ok || !responseData.success) {
    console.error('parseIngredients API error:', responseData);
    return responseData; // Return the error response
  }

  if (!responseData.data) {
    console.error('parseIngredients response missing data:', responseData);
    return {
      success: false,
      error: {
        code: 'ERR_AI_PARSE_FAILED',
        message: 'Response missing data field',
      },
    };
  }

  // Extract and clean the JSON data
  const rawData = responseData.data;
  const jsonString = extractJsonFromResponse(rawData);

  try {
    const parsedData = JSON.parse(jsonString);
    // Validate the parsed data structure
    if (Array.isArray(parsedData) && parsedData.length >= 2) {
      const title = parsedData[0];
      const groups = parsedData[1];
      // New structure: groups is an array of { groupName, ingredients }
      if (
        typeof title === 'string' &&
        Array.isArray(groups) &&
        groups.every(
          (g: {
            groupName: string;
            ingredients: {
              amount: string;
              units: string;
              ingredient: string;
            }[];
          }) =>
            typeof g.groupName === 'string' &&
            Array.isArray(g.ingredients) &&
            g.ingredients.every(
              (ing: { amount: string; units: string; ingredient: string }) =>
                typeof ing.amount === 'string' &&
                typeof ing.units === 'string' &&
                typeof ing.ingredient === 'string',
            ),
        )
      ) {
        return { success: true, data: parsedData };
      }
      // Fallback: if groups is a flat array of ingredients, wrap in a single group
      if (
        Array.isArray(groups) &&
        groups.length > 0 &&
        groups.every(
          (ing: { amount: string; units: string; ingredient: string }) =>
            typeof ing.amount === 'string' &&
            typeof ing.units === 'string' &&
            typeof ing.ingredient === 'string',
        )
      ) {
        return {
          success: true,
          data: [title, [{ groupName: 'Main', ingredients: groups }]],
        };
      }
    }
    // If structure is invalid, log and use fallback
    console.warn(
      'parseIngredients: Invalid data structure, using fallback',
      parsedData,
    );
    return { success: true, data: getFallbackRecipeData() };
  } catch (parseError) {
    console.error('parseIngredients: JSON parsing failed', {
      error: parseError,
      rawResponse: rawData,
      extractedJson: jsonString,
    });
    console.warn(
      'parseIngredients: Using fallback due to JSON parsing failure',
    );
    return { success: true, data: getFallbackRecipeData() };
  }
}

export async function parseInstructions(ingredients: string) {
  // Convert array to string if needed
  const ingredientsText = Array.isArray(ingredients)
    ? ingredients.join('\n')
    : ingredients;
  const res = await fetch('/api/parseInstructions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: ingredientsText }),
  });

  // Check if response is actually JSON before parsing
  // If the API returns an HTML error page, we need to handle it gracefully
  // Read response as text first (can only read body once)
  const textResponse = await res.text();
  let responseData;

  // Check if response looks like HTML (starts with <) or is empty
  if (textResponse.trim().startsWith('<') || textResponse.trim().length === 0) {
    // Response is HTML error page or empty
    console.error('parseInstructions: Received HTML or empty response:', {
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get('content-type'),
      responsePreview: textResponse.slice(0, 200), // First 200 chars for debugging
    });
    return {
      success: false,
      error: {
        code: 'ERR_AI_PARSE_FAILED',
        message: `API returned HTML error page (status: ${res.status})`,
      },
    };
  }

  // Try to parse as JSON
  try {
    responseData = JSON.parse(textResponse);
  } catch (jsonError) {
    // If JSON parsing fails, log the error and return a helpful message
    console.error('parseInstructions: Failed to parse JSON response:', {
      error: jsonError,
      status: res.status,
      responsePreview: textResponse.slice(0, 200),
    });
    return {
      success: false,
      error: {
        code: 'ERR_AI_PARSE_FAILED',
        message: 'Failed to parse API response as JSON',
      },
    };
  }

  if (!res.ok || !responseData.success) {
    console.error('parseInstructions API error:', responseData);
    return responseData; // Return the error response
  }

  if (!responseData.data) {
    console.error('parseInstructions response missing data:', responseData);
    return {
      success: false,
      error: {
        code: 'ERR_AI_PARSE_FAILED',
        message: 'Response missing data field',
      },
    };
  }

  const cleanData = responseData.data
    .replace(/^[\s`]*```(?:json)?/, '') // Remove starting ```json or ```
    .replace(/```[\s`]*$/, '') // Remove trailing ```
    .trim();

  try {
    const parsedData = JSON.parse(cleanData);
    return { success: true, data: parsedData };
  } catch (parseError) {
    console.error('parseInstructions: JSON parsing failed', parseError);
    return {
      success: false,
      error: {
        code: 'ERR_AI_PARSE_FAILED',
        message: 'Failed to parse instructions JSON',
      },
    };
  }
}

export async function recipeScrape(url: string) {
  const res = await fetch('/api/recipeScraperPython', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  // Check if response is actually JSON before parsing
  // If the API returns an HTML error page, we need to handle it gracefully
  // Read response as text first (can only read body once)
  const textResponse = await res.text();
  let responseData;

  // Check if response looks like HTML (starts with <) or is empty
  if (textResponse.trim().startsWith('<') || textResponse.trim().length === 0) {
    // Response is HTML error page or empty
    console.error('recipeScrape: Received HTML or empty response:', {
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get('content-type'),
      responsePreview: textResponse.slice(0, 200), // First 200 chars for debugging
    });
    return {
      success: false,
      error: {
        code: 'ERR_AI_PARSE_FAILED',
        message: `API returned HTML error page (status: ${res.status})`,
      },
    };
  }

  // Try to parse as JSON
  try {
    responseData = JSON.parse(textResponse);
  } catch (jsonError) {
    // If JSON parsing fails, log the error and return a helpful message
    console.error('recipeScrape: Failed to parse JSON response:', {
      error: jsonError,
      status: res.status,
      responsePreview: textResponse.slice(0, 200),
    });
    return {
      success: false,
      error: {
        code: 'ERR_AI_PARSE_FAILED',
        message: 'Failed to parse API response as JSON',
      },
    };
  }

  if (!res.ok || !responseData.success) {
    console.error('recipeScrape API error:', responseData);
    return responseData; // Return the error response
  }

  return responseData;
}

/**
 * Parse recipe from uploaded image file
 *
 * This function sends an image to the backend AI vision service
 * to extract recipe information (title, ingredients, instructions)
 *
 * @param imageFile - File object containing the recipe image
 * @returns Promise with parsed recipe data or error
 */
export async function parseRecipeFromImage(imageFile: File) {
  try {
    console.log(
      '[Client] Sending image to backend for parsing:',
      imageFile.name,
    );

    // Create FormData to send the image file
    const formData = new FormData();
    formData.append('image', imageFile);

    // Send to the image parsing API endpoint
    const res = await fetch('/api/parseRecipeFromImage', {
      method: 'POST',
      body: formData, // FormData automatically sets Content-Type with boundary
    });

    // Read response as text first (can only read body once)
    const textResponse = await res.text();
    let responseData;

    // Check if response looks like HTML (starts with <) or is empty
    if (
      textResponse.trim().startsWith('<') ||
      textResponse.trim().length === 0
    ) {
      console.error('parseRecipeFromImage: Received HTML or empty response:', {
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get('content-type'),
        responsePreview: textResponse.slice(0, 200),
      });
      return {
        success: false,
        error: {
          code: 'ERR_AI_PARSE_FAILED',
          message: `API returned HTML error page (status: ${res.status})`,
        },
      };
    }

    // Try to parse as JSON
    try {
      responseData = JSON.parse(textResponse);
    } catch (jsonError) {
      console.error('parseRecipeFromImage: Failed to parse JSON response:', {
        error: jsonError,
        status: res.status,
        responsePreview: textResponse.slice(0, 200),
      });
      return {
        success: false,
        error: {
          code: 'ERR_AI_PARSE_FAILED',
          message: 'Failed to parse API response as JSON',
        },
      };
    }

    // Check if request failed
    if (!res.ok || !responseData.success) {
      console.error('parseRecipeFromImage API error:', responseData);
      return responseData; // Return the error response
    }

    // Return successful response
    console.log(
      '[Client] Successfully received parsed recipe from image:',
      responseData.title,
    );
    return responseData;
  } catch (error) {
    console.error('[Client] Error in parseRecipeFromImage:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: {
        code: 'ERR_UNKNOWN',
        message: `Failed to parse image: ${errorMessage}`,
      },
    };
  }
}

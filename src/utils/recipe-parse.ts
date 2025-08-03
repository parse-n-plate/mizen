export async function fetchHtml(url: string) {
  console.log('Parsing recipe to HTML:', url);
  const res = await fetch(`/api/fetchHtml?url=${encodeURIComponent(url)}`);
  return await res.json();
}

export async function validateRecipeUrl(url: string): Promise<boolean> {
  const res = await fetch('/api/urlValidator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  const data = await res.json();
  return data.isRecipe;
}

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

  const { data } = await res.json();
  const cleanData = data
    .replace(/^[\s`]*```(?:json)?/, '') // Remove starting ```json or ```
    .replace(/```[\s`]*$/, '') // Remove trailing ```
    .trim();
  
  try {
    return JSON.parse(cleanData);
  } catch (error) {
    console.error('Failed to parse ingredients JSON:', error);
    console.error('Malformed JSON data:', cleanData);
    // Return fallback structure if parsing fails
    return [
      'Recipe Title Not Available',
      [{ amount: 'as needed', units: '', ingredient: 'Ingredients could not be parsed' }]
    ];
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

  const { data } = await res.json();
  const cleanData = data
    .replace(/^[\s`]*```(?:json)?/, '') // Remove starting ```json or ```
    .replace(/```[\s`]*$/, '') // Remove trailing ```
    .trim();
  
  try {
    return JSON.parse(cleanData);
  } catch (error) {
    console.error('Failed to parse instructions JSON:', error);
    console.error('Malformed JSON data:', cleanData);
    // Return fallback array if parsing fails
    return ['Instructions could not be parsed from the recipe.'];
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

  if (!res.ok) {
    throw new Error(`Python scraper failed: ${res.status} ${res.statusText}`);
  }

  return await res.json();
}

export type InstructionStep = {
  title: string;   // Short, high-level name for the step
  detail: string;  // Full instruction text
  timeMinutes?: number;
  ingredients?: string[];
  tips?: string;
};

export type ParsedRecipe = {
  id: string;
  title: string;
  summary: string; // Brief text for landing page cards
  description?: string; // AI-generated engagement summary
  url: string;
  imageUrl?: string;
  imageData?: string; // Base64 image data for uploaded images
  imageFilename?: string; // Original filename for uploaded images
  parsedAt: string;
  // Full recipe data for viewing
  ingredients?: {
    groupName: string;
    ingredients: { amount: string; units: string; ingredient: string }[];
  }[];
  // Accept legacy string steps or new titled steps; we normalize on read/write.
  instructions?: Array<string | InstructionStep>;
  author?: string; // Recipe author if available
  sourceUrl?: string; // Source URL if available
  cuisine?: string[]; // Cuisine types/tags (e.g., ["Italian", "Mediterranean"])
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
};

const RECENT_RECIPES_KEY = 'recentRecipes';
const BOOKMARKED_RECIPES_KEY = 'bookmarkedRecipes';
const MAX_RECENT_RECIPES = 10;

// Derive a concise title from a full instruction for legacy data
// Normalize instructions into titled steps, tolerating legacy string arrays
function normalizeInstructions(
  instructions?: Array<string | InstructionStep>,
): InstructionStep[] {
  if (!instructions || !Array.isArray(instructions)) return [];

  const cleanLeading = (text: string): string =>
    (text || '').replace(/^[\s.:;,\-–—]+/, '').trim();

  return instructions
    .map((item, index) => {
      // Handle string inputs (legacy format)
      if (typeof item === 'string') {
        const detail = cleanLeading(item.trim());
        if (!detail) return null;
        // Use generic title for legacy string inputs
        return {
          title: `Step ${index + 1}`,
          detail,
        } satisfies InstructionStep;
      }

      // Handle object inputs (expected format)
      if (item && typeof item === 'object') {
        const title =
          typeof (item as any).title === 'string'
            ? cleanLeading((item as any).title.trim())
            : `Step ${index + 1}`;
        const detail =
          typeof (item as any).detail === 'string'
            ? cleanLeading((item as any).detail.trim())
            : '';

        // If there is no usable detail, drop the step
        if (!detail) return null;

        return {
          title,
          detail,
          timeMinutes: (item as any).timeMinutes,
          ingredients: (item as any).ingredients,
          tips: (item as any).tips,
        } satisfies InstructionStep;
      }

      return null;
    })
    .filter((step): step is InstructionStep => Boolean(step));
}

/**
 * Get recent recipes from localStorage
 * @returns Array of recent recipes, sorted by most recent first
 */
export function getRecentRecipes(): ParsedRecipe[] {
  try {
    const stored = localStorage.getItem(RECENT_RECIPES_KEY);
    if (!stored) {
      console.log('[Storage] No recipes found in localStorage');
      return [];
    }

    const recipes = JSON.parse(stored) as ParsedRecipe[];
    console.log(`[Storage] 🍽️ Loading ${recipes.length} recipes from localStorage`);
    
    const normalized = recipes
      .map((recipe) => ({
        ...recipe,
        instructions: normalizeInstructions(recipe.instructions),
      }))
      .sort(
        (a, b) =>
          new Date(b.parsedAt).getTime() - new Date(a.parsedAt).getTime(),
      );
    
    // Log cuisine data for each recipe
    normalized.forEach(recipe => {
      console.log(`[Storage] Recipe "${recipe.title}": cuisine=${recipe.cuisine || 'none'}`);
    });
    
    return normalized;
  } catch (error) {
    console.error('Error reading recent recipes from localStorage:', error);
    return [];
  }
}

/**
 * Add a new recipe to recent recipes in localStorage
 * @param recipe - The recipe to add
 */
export function addRecentRecipe(
  recipe: Omit<ParsedRecipe, 'id' | 'parsedAt'>,
): void {
  try {
    const recentRecipes = getRecentRecipes();

    // Create new recipe with id and parsedAt
    console.log('[Storage] 🍽️ Adding recipe to localStorage with cuisine:', recipe.cuisine || 'none');
    const newRecipe: ParsedRecipe = {
      ...recipe,
      instructions: normalizeInstructions(recipe.instructions),
      id: generateId(),
      parsedAt: new Date().toISOString(),
    };
    
    console.log('[Storage] 🍽️ Recipe stored with cuisine:', newRecipe.cuisine || 'none');

    // Remove duplicate if same URL exists
    const filteredRecipes = recentRecipes.filter((r) => r.url !== recipe.url);

    // Add new recipe to the beginning
    const updatedRecipes = [newRecipe, ...filteredRecipes];

    // Keep only the most recent MAX_RECENT_RECIPES
    const limitedRecipes = updatedRecipes.slice(0, MAX_RECENT_RECIPES);

    localStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(limitedRecipes));
    console.log('[Storage] ✅ Recipe saved to localStorage successfully');
  } catch (error) {
    console.error('Error adding recent recipe to localStorage:', error);
  }
}

/**
 * Get a specific recipe by ID from recent recipes
 * @param id - The ID of the recipe to retrieve
 * @returns The recipe if found, null otherwise
 */
export function getRecipeById(id: string): ParsedRecipe | null {
  try {
    const recentRecipes = getRecentRecipes();
    return recentRecipes.find((recipe) => recipe.id === id) || null;
  } catch (error) {
    console.error('Error getting recipe by ID from localStorage:', error);
    return null;
  }
}

/**
 * Remove a recipe from recent recipes by ID
 * @param id - The ID of the recipe to remove
 */
export function removeRecentRecipe(id: string): void {
  try {
    const recentRecipes = getRecentRecipes();
    const filteredRecipes = recentRecipes.filter((recipe) => recipe.id !== id);
    localStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(filteredRecipes));
  } catch (error) {
    console.error('Error removing recent recipe from localStorage:', error);
  }
}

/**
 * Clear all recent recipes from localStorage
 */
export function clearRecentRecipes(): void {
  try {
    localStorage.removeItem(RECENT_RECIPES_KEY);
  } catch (error) {
    console.error('Error clearing recent recipes from localStorage:', error);
  }
}

/**
 * Generate a unique ID for recipes
 * @returns A unique string ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get all bookmarked recipe IDs from localStorage
 * @returns Array of bookmarked recipe IDs
 */
export function getBookmarkedRecipeIds(): string[] {
  try {
    const stored = localStorage.getItem(BOOKMARKED_RECIPES_KEY);
    if (!stored) {
      return [];
    }
    const ids = JSON.parse(stored) as string[];
    // Validate that we got an array of strings
    if (!Array.isArray(ids)) {
      console.warn('[Storage] Invalid bookmarked recipes format, resetting');
      localStorage.removeItem(BOOKMARKED_RECIPES_KEY);
      return [];
    }
    return ids;
  } catch (error) {
    console.error('Error reading bookmarked recipes from localStorage:', error);
    return [];
  }
}

/**
 * Add a recipe ID to bookmarks
 * @param id - The recipe ID to bookmark
 */
export function addBookmark(id: string): void {
  try {
    const bookmarkedIds = getBookmarkedRecipeIds();
    // Only add if not already bookmarked
    if (!bookmarkedIds.includes(id)) {
      const updatedIds = [...bookmarkedIds, id];
      localStorage.setItem(BOOKMARKED_RECIPES_KEY, JSON.stringify(updatedIds));
      console.log(`[Storage] ✅ Bookmarked recipe ID: ${id}`);
    }
  } catch (error) {
    console.error('Error adding bookmark to localStorage:', error);
  }
}

/**
 * Remove a recipe ID from bookmarks
 * @param id - The recipe ID to unbookmark
 */
export function removeBookmark(id: string): void {
  try {
    const bookmarkedIds = getBookmarkedRecipeIds();
    const filteredIds = bookmarkedIds.filter((bookmarkId) => bookmarkId !== id);
    localStorage.setItem(BOOKMARKED_RECIPES_KEY, JSON.stringify(filteredIds));
    console.log(`[Storage] ✅ Unbookmarked recipe ID: ${id}`);
  } catch (error) {
    console.error('Error removing bookmark from localStorage:', error);
  }
}

/**
 * Check if a recipe is bookmarked
 * @param id - The recipe ID to check
 * @returns True if the recipe is bookmarked, false otherwise
 */
export function isRecipeBookmarked(id: string): boolean {
  try {
    const bookmarkedIds = getBookmarkedRecipeIds();
    return bookmarkedIds.includes(id);
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
}

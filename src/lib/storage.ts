export type InstructionStep = {
  title: string; // Short, high-level name for the step
  detail: string; // Full instruction text
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
  // Storage guidance - generated during initial parse (top-level for immediate access)
  storageGuide?: string; // Storage instructions (e.g., "Store in airtight container in fridge")
  shelfLife?: {
    fridge?: number | null; // Days in fridge (null if not fridge-safe)
    freezer?: number | null; // Days in freezer (null if not freezer-friendly)
  };
  pinnedAt?: string | null; // ISO timestamp when pinned, null/undefined if not pinned
  lastAccessedAt?: string | null; // ISO timestamp of last access/view
  plate?: {
    // Legacy single photo support (backward compatibility)
    photoData?: string;
    photoFilename?: string;
    capturedAt?: string;
    // New multi-photo support (up to 5 photos)
    photos?: Array<{
      data: string;
      filename: string;
      capturedAt: string;
      rating?: number; // 1-5 star rating
    }>;
    // AI-generated guidance
    platingNotes?: string; // AI-generated plating suggestions
    servingVessel?: string; // e.g., "shallow bowl", "plate"
    servingTemp?: string; // e.g., "hot", "warm", "chilled"
    storageGuide?: string; // Storage instructions
    shelfLife?: {
      fridge?: number | null; // Days in fridge
      freezer?: number | null; // Days in freezer
    };
    storedAt?: string; // ISO timestamp when marked as stored
    sharedAt?: string[]; // Array of ISO timestamps when shared
    shareCount?: number; // Number of times shared
  };
};

const RECENT_RECIPES_KEY = 'recentRecipes';
const BOOKMARKED_RECIPES_KEY = 'bookmarkedRecipes';
const MAX_RECENT_RECIPES = 10;

/**
 * Migrate legacy bookmark storage (array of IDs) to full-recipe storage.
 * Old format: string[] of recipe IDs stored under BOOKMARKED_RECIPES_KEY.
 * New format: ParsedRecipe[] stored under BOOKMARKED_RECIPES_KEY.
 * Runs once on first access; a no-op when already migrated.
 */
function migrateBookmarksIfNeeded(): void {
  try {
    const raw = localStorage.getItem(BOOKMARKED_RECIPES_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    // Already migrated — first element is an object (ParsedRecipe)
    if (typeof parsed[0] === 'object') return;

    // Legacy format: string IDs → look up full recipes in recents
    const recents = getRecentRecipes();
    const recentsById = new Map(recents.map((r) => [r.id, r]));

    const fullBookmarks: ParsedRecipe[] = (parsed as string[])
      .map((id) => recentsById.get(id))
      .filter((r): r is ParsedRecipe => r !== undefined);

    localStorage.setItem(BOOKMARKED_RECIPES_KEY, JSON.stringify(fullBookmarks));

    // Remove migrated bookmarks from the recents list
    const bookmarkIdSet = new Set(fullBookmarks.map((r) => r.id));
    const cleanedRecents = recents.filter((r) => !bookmarkIdSet.has(r.id));
    localStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(cleanedRecents));

    console.log(
      `[Storage] Migrated ${fullBookmarks.length} bookmarks from ID-only to full-recipe format`,
    );
  } catch (error) {
    console.error('[Storage] Bookmark migration failed:', error);
  }
}

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
    console.log(
      `[Storage] 🍽️ Loading ${recipes.length} recipes from localStorage`,
    );

    const normalized = recipes
      .map((recipe) => ({
        ...recipe,
        instructions: normalizeInstructions(recipe.instructions),
      }))
      .sort(
        (a, b) =>
          new Date(b.lastAccessedAt || b.parsedAt).getTime() -
          new Date(a.lastAccessedAt || a.parsedAt).getTime(),
      );

    // Log cuisine data for each recipe
    normalized.forEach((recipe) => {
      console.log(
        `[Storage] Recipe "${recipe.title}": cuisine=${recipe.cuisine || 'none'}`,
      );
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
    console.log(
      '[Storage] Adding recipe to localStorage with cuisine:',
      recipe.cuisine || 'none',
    );
    const newRecipe: ParsedRecipe = {
      ...recipe,
      instructions: normalizeInstructions(recipe.instructions),
      id: generateId(),
      parsedAt: new Date().toISOString(),
    };

    // Remove duplicate if same URL exists
    const filteredRecipes = recentRecipes.filter((r) => r.url !== recipe.url);

    // Add new recipe to the beginning, then strictly cap
    const limitedRecipes = [newRecipe, ...filteredRecipes].slice(
      0,
      MAX_RECENT_RECIPES,
    );

    localStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(limitedRecipes));
    console.log('[Storage] Recipe saved to localStorage successfully');
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
    // Check recents first, then bookmarks
    const recentRecipes = getRecentRecipes();
    const found = recentRecipes.find((recipe) => recipe.id === id);
    if (found) return found;

    const bookmarks = getBookmarkedRecipes();
    return bookmarks.find((recipe) => recipe.id === id) || null;
  } catch (error) {
    console.error('Error getting recipe by ID from localStorage:', error);
    return null;
  }
}

/**
 * Update an existing recipe in recent recipes
 * @param id - The ID of the recipe to update
 * @param updates - Partial recipe data to merge with existing recipe
 */
export function updateRecipe(id: string, updates: Partial<ParsedRecipe>): void {
  try {
    // Try recents first
    const recentRecipes = getRecentRecipes();
    const recentIndex = recentRecipes.findIndex((recipe) => recipe.id === id);

    if (recentIndex !== -1) {
      recentRecipes[recentIndex] = {
        ...recentRecipes[recentIndex],
        ...updates,
        id,
        parsedAt: recentRecipes[recentIndex].parsedAt,
      };
      localStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(recentRecipes));
      console.log('[Storage] Recipe updated in recents:', id);
      return;
    }

    // Try bookmarks
    const bookmarks = getBookmarkedRecipes();
    const bookmarkIndex = bookmarks.findIndex((recipe) => recipe.id === id);

    if (bookmarkIndex !== -1) {
      bookmarks[bookmarkIndex] = {
        ...bookmarks[bookmarkIndex],
        ...updates,
        id,
        parsedAt: bookmarks[bookmarkIndex].parsedAt,
      };
      localStorage.setItem(BOOKMARKED_RECIPES_KEY, JSON.stringify(bookmarks));
      console.log('[Storage] Recipe updated in bookmarks:', id);
      return;
    }

    console.warn('[Storage] Recipe not found for update:', id);
  } catch (error) {
    console.error('Error updating recipe in localStorage:', error);
  }
}

/**
 * Remove a recipe from recent recipes by ID
 * @param id - The ID of the recipe to remove
 */
export function removeRecentRecipe(id: string): void {
  try {
    // Remove from recents
    const recentRecipes = getRecentRecipes();
    const filteredRecipes = recentRecipes.filter((recipe) => recipe.id !== id);
    localStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(filteredRecipes));

    // Also remove from bookmarks if present
    const bookmarks = getBookmarkedRecipes();
    if (bookmarks.some((r) => r.id === id)) {
      const filteredBookmarks = bookmarks.filter((r) => r.id !== id);
      localStorage.setItem(
        BOOKMARKED_RECIPES_KEY,
        JSON.stringify(filteredBookmarks),
      );
    }
  } catch (error) {
    console.error('Error removing recipe from localStorage:', error);
  }
}

/**
 * Restore a previously deleted recipe back into localStorage.
 * Used for undo-delete functionality.
 * @param recipe - The full recipe object to restore
 * @param wasBookmarked - Whether the recipe was bookmarked before deletion
 */
export function restoreRecentRecipe(recipe: ParsedRecipe, wasBookmarked: boolean): void {
  try {
    const recentRecipes = getRecentRecipes();
    // Avoid duplicates
    if (!recentRecipes.some((r) => r.id === recipe.id)) {
      localStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify([recipe, ...recentRecipes]));
    }

    if (wasBookmarked) {
      const bookmarks = getBookmarkedRecipes();
      if (!bookmarks.some((r) => r.id === recipe.id)) {
        localStorage.setItem(BOOKMARKED_RECIPES_KEY, JSON.stringify([...bookmarks, recipe]));
      }
    }
  } catch (error) {
    console.error('Error restoring recipe to localStorage:', error);
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
 * Get all bookmarked recipes (full data) from localStorage.
 * Handles migration from the legacy ID-only format on first call.
 */
export function getBookmarkedRecipes(): ParsedRecipe[] {
  try {
    migrateBookmarksIfNeeded();

    const stored = localStorage.getItem(BOOKMARKED_RECIPES_KEY);
    if (!stored) return [];

    const recipes = JSON.parse(stored);
    if (!Array.isArray(recipes)) {
      console.warn('[Storage] Invalid bookmarked recipes format, resetting');
      localStorage.removeItem(BOOKMARKED_RECIPES_KEY);
      return [];
    }

    return (recipes as ParsedRecipe[]).map((recipe) => ({
      ...recipe,
      instructions: normalizeInstructions(recipe.instructions),
    }));
  } catch (error) {
    console.error('Error reading bookmarked recipes from localStorage:', error);
    return [];
  }
}

/**
 * Get all bookmarked recipe IDs from localStorage.
 * Derived from the full bookmark store.
 */
export function getBookmarkedRecipeIds(): string[] {
  return getBookmarkedRecipes().map((r) => r.id);
}

/**
 * Add a recipe to bookmarks by ID.
 * Marks the recipe as bookmarked without moving it between stores,
 * so the sidebar order stays stable.
 */
export function addBookmark(id: string): void {
  try {
    const bookmarks = getBookmarkedRecipes();
    if (bookmarks.some((r) => r.id === id)) return; // already bookmarked

    // Find the recipe in recents
    const recentRecipes = getRecentRecipes();
    const recipe = recentRecipes.find((r) => r.id === id);
    if (!recipe) {
      console.warn('[Storage] Cannot bookmark — recipe not found:', id);
      return;
    }

    // Add to bookmarks
    localStorage.setItem(
      BOOKMARKED_RECIPES_KEY,
      JSON.stringify([...bookmarks, recipe]),
    );

    console.log(`[Storage] Bookmarked recipe: ${id}`);
  } catch (error) {
    console.error('Error adding bookmark to localStorage:', error);
  }
}

/**
 * Remove a recipe from bookmarks by ID.
 * Simply removes from the bookmark store without reordering recents.
 */
export function removeBookmark(id: string): void {
  try {
    const bookmarks = getBookmarkedRecipes();
    const filtered = bookmarks.filter((r) => r.id !== id);
    localStorage.setItem(BOOKMARKED_RECIPES_KEY, JSON.stringify(filtered));

    console.log(`[Storage] Unbookmarked recipe: ${id}`);
  } catch (error) {
    console.error('Error removing bookmark from localStorage:', error);
  }
}

/**
 * Check if a recipe is bookmarked
 */
export function isRecipeBookmarked(id: string): boolean {
  try {
    return getBookmarkedRecipes().some((r) => r.id === id);
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
}

/**
 * Pin a recipe by ID. Sets pinnedAt timestamp on the recipe
 * in whichever store (recents or bookmarks) it lives in.
 */
export function pinRecipe(id: string): void {
  updateRecipe(id, { pinnedAt: new Date().toISOString() });
}

/**
 * Unpin a recipe by ID. Clears pinnedAt on the recipe.
 */
export function unpinRecipe(id: string): void {
  updateRecipe(id, { pinnedAt: null });
}

/**
 * Check if a recipe is pinned.
 */
export function isRecipePinned(id: string): boolean {
  const recipe = getRecipeById(id);
  return !!recipe?.pinnedAt;
}

/**
 * Update lastAccessedAt on a recipe (in whichever store it lives).
 */
export function touchRecipeAccess(id: string): void {
  updateRecipe(id, { lastAccessedAt: new Date().toISOString() });
}

export type ParsedRecipe = {
  id: string;
  title: string;
  summary: string;
  url: string;
  parsedAt: string;
  // Full recipe data for viewing
  ingredients?: {
    groupName: string;
    ingredients: { amount: string; units: string; ingredient: string }[];
  }[];
  instructions?: string[];
};

const RECENT_RECIPES_KEY = 'recentRecipes';
const MAX_RECENT_RECIPES = 10;

/**
 * Get recent recipes from localStorage
 * @returns Array of recent recipes, sorted by most recent first
 */
export function getRecentRecipes(): ParsedRecipe[] {
  try {
    const stored = localStorage.getItem(RECENT_RECIPES_KEY);
    if (!stored) return [];

    const recipes = JSON.parse(stored) as ParsedRecipe[];
    return recipes.sort(
      (a, b) => new Date(b.parsedAt).getTime() - new Date(a.parsedAt).getTime(),
    );
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
    const newRecipe: ParsedRecipe = {
      ...recipe,
      id: generateId(),
      parsedAt: new Date().toISOString(),
    };

    // Remove duplicate if same URL exists
    const filteredRecipes = recentRecipes.filter((r) => r.url !== recipe.url);

    // Add new recipe to the beginning
    const updatedRecipes = [newRecipe, ...filteredRecipes];

    // Keep only the most recent MAX_RECENT_RECIPES
    const limitedRecipes = updatedRecipes.slice(0, MAX_RECENT_RECIPES);

    localStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(limitedRecipes));
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

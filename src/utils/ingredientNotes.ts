/**
 * Utility functions for managing ingredient notes
 * 
 * Stores notes in localStorage keyed by a unique ingredient identifier.
 * Notes are stored per recipe, using the recipe's source URL as the key.
 */

/**
 * Creates a unique identifier for an ingredient
 * Format: "groupName:ingredientName:amount:units"
 * This ensures uniqueness even if the same ingredient appears multiple times
 */
export function createIngredientId(
  groupName: string,
  ingredientName: string,
  amount?: string,
  units?: string
): string {
  // Normalize values to ensure consistent keys
  const normalizedGroup = (groupName || 'Main').trim().toLowerCase();
  const normalizedName = ingredientName.trim().toLowerCase();
  const normalizedAmount = (amount || '').trim();
  const normalizedUnits = (units || '').trim();
  
  // Create a stable key from all parts
  return `${normalizedGroup}:${normalizedName}:${normalizedAmount}:${normalizedUnits}`;
}

/**
 * Get the storage key for ingredient notes for a specific recipe
 */
function getNotesStorageKey(recipeUrl?: string): string {
  // If no recipe URL, use a default key (for current recipe)
  const url = recipeUrl || 'current-recipe';
  return `ingredient-notes:${url}`;
}

/**
 * Load all ingredient notes for a recipe
 * @param recipeUrl - Optional recipe URL to load notes for (defaults to current recipe)
 * @returns Map of ingredient IDs to their notes
 */
export function loadIngredientNotes(recipeUrl?: string): Record<string, string> {
  try {
    const storageKey = getNotesStorageKey(recipeUrl);
    const stored = localStorage.getItem(storageKey);
    if (!stored) return {};
    
    return JSON.parse(stored) as Record<string, string>;
  } catch (error) {
    console.error('Error loading ingredient notes:', error);
    return {};
  }
}

/**
 * Save notes for a specific ingredient
 * @param ingredientId - Unique identifier for the ingredient
 * @param notes - The notes text to save
 * @param recipeUrl - Optional recipe URL (defaults to current recipe)
 */
export function saveIngredientNotes(
  ingredientId: string,
  notes: string,
  recipeUrl?: string
): void {
  try {
    const storageKey = getNotesStorageKey(recipeUrl);
    const allNotes = loadIngredientNotes(recipeUrl);
    
    // Update the notes for this ingredient
    if (notes.trim()) {
      allNotes[ingredientId] = notes.trim();
    } else {
      // Remove empty notes
      delete allNotes[ingredientId];
    }
    
    // Save back to localStorage
    localStorage.setItem(storageKey, JSON.stringify(allNotes));
  } catch (error) {
    console.error('Error saving ingredient notes:', error);
  }
}

/**
 * Get notes for a specific ingredient
 * @param ingredientId - Unique identifier for the ingredient
 * @param recipeUrl - Optional recipe URL (defaults to current recipe)
 * @returns The notes text, or empty string if not found
 */
export function getIngredientNotes(
  ingredientId: string,
  recipeUrl?: string
): string {
  const allNotes = loadIngredientNotes(recipeUrl);
  return allNotes[ingredientId] || '';
}

/**
 * Clear all notes for a recipe
 * @param recipeUrl - Optional recipe URL (defaults to current recipe)
 */
export function clearIngredientNotes(recipeUrl?: string): void {
  try {
    const storageKey = getNotesStorageKey(recipeUrl);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Error clearing ingredient notes:', error);
  }
}













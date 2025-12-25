/**
 * Search History Storage
 * 
 * Manages URL search history separately from recipe history.
 * Tracks URLs that users have searched/parsed, allowing quick re-access.
 */

export interface SearchHistoryItem {
  id: string;
  url: string;
  searchedAt: string; // ISO timestamp
  title?: string; // Optional: recipe title if successfully parsed
}

const SEARCH_HISTORY_KEY = 'searchHistory';
const MAX_SEARCH_HISTORY = 20; // Maximum number of URL searches to keep

/**
 * Get all search history items from localStorage
 * @returns Array of search history items, sorted by most recent first
 */
export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored) as SearchHistoryItem[];
    // Sort by most recent first
    return history.sort(
      (a, b) =>
        new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime(),
    );
  } catch (error) {
    console.error('Error reading search history from localStorage:', error);
    return [];
  }
}

/**
 * Add a URL to search history
 * @param url - The URL that was searched
 * @param title - Optional recipe title if successfully parsed
 */
export function addToSearchHistory(url: string, title?: string): void {
  try {
    const history = getSearchHistory();

    // Remove duplicate if same URL exists (we'll add it fresh at the top)
    const filteredHistory = history.filter((item) => item.url !== url);

    // Create new history item
    const newItem: SearchHistoryItem = {
      id: generateId(),
      url,
      searchedAt: new Date().toISOString(),
      title,
    };

    // Add new item to the beginning
    const updatedHistory = [newItem, ...filteredHistory];

    // Keep only the most recent MAX_SEARCH_HISTORY items
    const limitedHistory = updatedHistory.slice(0, MAX_SEARCH_HISTORY);

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Error adding to search history:', error);
  }
}

/**
 * Remove a specific search history item by ID
 * @param id - The ID of the item to remove
 */
export function removeSearchHistoryItem(id: string): void {
  try {
    const history = getSearchHistory();
    const filteredHistory = history.filter((item) => item.id !== id);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('Error removing search history item:', error);
  }
}

/**
 * Clear all search history
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}

/**
 * Generate a unique ID for search history items
 * @returns A unique string ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}







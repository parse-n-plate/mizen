/**
 * Search Utilities
 * 
 * Helper functions for fuzzy search, highlighting, scrolling, and parsing search queries.
 */

/**
 * Simple fuzzy match - checks if query appears in text (case-insensitive)
 * @param query - The search query
 * @param text - The text to search in
 * @returns true if query matches text (fuzzy)
 */
export function fuzzyMatch(query: string, text: string): boolean {
  if (!query.trim()) return true;
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase();
  return normalizedText.includes(normalizedQuery);
}

/**
 * Highlight matching text in a string
 * @param text - The original text
 * @param query - The search query to highlight
 * @returns JSX element with highlighted matches
 */
export function highlightMatches(text: string, query: string): string {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight-text">$1</mark>');
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Smooth scroll to an element and highlight it
 * @param elementId - The ID of the element to scroll to
 * @param highlightDuration - How long to show the highlight (ms)
 */
export function scrollToElement(
  elementId: string,
  highlightDuration: number = 2000,
): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with ID "${elementId}" not found`);
    return;
  }

  // Scroll into view smoothly
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });

  // Add highlight class
  element.classList.add('search-highlight');

  // Remove highlight after duration
  setTimeout(() => {
    element.classList.remove('search-highlight');
  }, highlightDuration);
}

/**
 * Parse search query for special syntax
 * Examples: "step:mix", "ingredient:butter", "tool:whisk"
 * @param query - The raw search query
 * @returns Object with type and search term
 */
export interface ParsedSearchQuery {
  type: 'step' | 'ingredient' | 'tool' | 'metadata' | 'all';
  term: string;
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const trimmed = query.trim().toLowerCase();

  // Check for special syntax
  if (trimmed.startsWith('step:')) {
    return {
      type: 'step',
      term: trimmed.replace(/^step:\s*/, ''),
    };
  }

  if (trimmed.startsWith('ingredient:') || trimmed.startsWith('ing:')) {
    return {
      type: 'ingredient',
      term: trimmed.replace(/^(ingredient|ing):\s*/, ''),
    };
  }

  if (trimmed.startsWith('tool:') || trimmed.startsWith('equipment:')) {
    return {
      type: 'tool',
      term: trimmed.replace(/^(tool|equipment):\s*/, ''),
    };
  }

  if (trimmed.startsWith('meta:') || trimmed.startsWith('info:')) {
    return {
      type: 'metadata',
      term: trimmed.replace(/^(meta|info):\s*/, ''),
    };
  }

  // Default: search all
  return {
    type: 'all',
    term: trimmed,
  };
}

/**
 * Check if a string looks like a URL
 */
export function isUrl(text: string): boolean {
  return (
    text.includes('http') ||
    text.includes('www.') ||
    text.includes('.com') ||
    text.includes('.org') ||
    text.includes('.net') ||
    text.includes('.io')
  );
}

/**
 * Extract domain from URL for display
 */
export function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}








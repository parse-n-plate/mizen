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
 * 
 * This function detects URLs with or without the protocol prefix.
 * Examples that will return true:
 * - "https://example.com/recipe"
 * - "www.example.com/recipe"
 * - "allrecipes.com/recipe/123" (domain pattern without prefix)
 */
export function isUrl(text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed.includes('http') ||
    trimmed.includes('www.') ||
    // Match domain patterns like "example.com/path" or "sub.example.co.uk"
    // This regex matches: word characters, optional hyphens, followed by a TLD (2+ chars)
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+/.test(trimmed)
  );
}

/**
 * Normalize a URL by adding protocol and www if missing
 * 
 * This enables "Arc/Dia browser" style URL auto-completion where users
 * can type shortened URLs like "allrecipes.com/recipe/123" and we'll
 * automatically expand them to "https://www.allrecipes.com/recipe/123"
 * 
 * Examples:
 * - "allrecipes.com/recipe" → "https://www.allrecipes.com/recipe"
 * - "www.example.com" → "https://www.example.com"
 * - "https://example.com" → "https://example.com" (unchanged)
 */
export function normalizeUrl(input: string): string {
  let url = input.trim();
  
  // If already has protocol, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If starts with www., add https://
  if (url.startsWith('www.')) {
    return `https://${url}`;
  }
  
  // Otherwise, add https://www.
  return `https://www.${url}`;
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











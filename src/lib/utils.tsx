import React from 'react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
}

/**
 * Highlights quantities and measurements in recipe text
 * Finds patterns like "250g", "1 pinch", "2 tbsp", "1/2 cup", etc.
 * Returns JSX with quantities wrapped in spans for styling
 * 
 * Matches common cooking measurements and units to highlight them in lighter gray
 */
export function highlightQuantities(text: string): React.ReactElement {
  // Pattern to match quantities: numbers (including fractions) followed by units
  // Matches: "250g", "1 pinch", "2 tbsp", "1/2 cup", "1 1/2 cups", etc.
  // Common units: g, kg, oz, lb, cup, tbsp, tsp, ml, l, pinch, etc.
  const quantityPattern = /(\d+(?:\s+\d+\/\d+|\/\d+)?)\s*(?:of\s+)?(pinch|pinches|tbsp|tbsps|tablespoon|tablespoons|tsp|tsps|teaspoon|teaspoons|cup|cups|g|gram|grams|kg|kilogram|kilograms|oz|ounce|ounces|lb|lbs|pound|pounds|ml|milliliter|milliliters|l|liter|liters|fl\s*oz|fluid\s*ounce|fluid\s*ounces|piece|pieces|slice|slices|stalk|stalks|clove|cloves|head|heads|bunch|bunches|can|cans|package|packages|pack|packs|bottle|bottles|jar|jars|box|boxes|bag|bags|sheet|sheets|strip|strips|fillet|fillets|serving|servings|portion|portions|dash|dashes|drop|drops|splash|splashes|handful|handfuls|sprig|sprigs|leaf|leaves|bulb|bulbs|pod|pods)/gi;
  
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;
  
  // Find all matches and create parts array
  while ((match = quantityPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the matched quantity as a highlighted span
    // Using lighter gray color (stone-400) to match the design
    parts.push(
      <span key={`qty-${keyCounter++}`} className="text-stone-400 font-medium">
        {match[0]}
      </span>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  // If no matches found, return the original text wrapped in a fragment
  if (parts.length === 0) {
    return <>{text}</>;
  }
  
  // Return all parts wrapped in a fragment
  return <>{parts}</>;
}

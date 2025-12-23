import React from 'react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { findIngredientsInText, IngredientInfo } from '@/utils/ingredientMatcher';

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
    
    // Add the matched quantity as a highlighted span using React.createElement
    // Using lighter gray color (stone-400) to match the design
    parts.push(
      React.createElement(
        'span',
        {
          key: `qty-${keyCounter++}`,
          className: 'text-stone-400 font-medium'
        },
        match[0]
      )
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  // If no matches found, return the original text wrapped in a fragment
  if (parts.length === 0) {
    return React.createElement(React.Fragment, null, text);
  }
  
  // Return all parts wrapped in a fragment
  // Note: React.createElement accepts children as additional arguments, not as an array
  return React.createElement(React.Fragment, null, ...parts);
}

/**
 * Highlights quantities, measurements, and ingredient names in recipe text
 * Uses consistent styling across ListView and CardView (StepDisplay)
 * 
 * Highlights:
 * - Quantities and measurements (250g, 1 cup, 2 tbsp, etc.)
 * - Ingredient names found in the ingredient list
 * 
 * Style: Bold, underline, with hover color change (matching CardView)
 */
export function highlightQuantitiesAndIngredients(
  text: string, 
  allIngredients: IngredientInfo[] = []
): React.ReactElement {
  if (!text) {
    return React.createElement(React.Fragment, null, text);
  }

  // Pattern to match quantities: numbers (including fractions) followed by units
  const quantityPattern = /(\d+(?:\s+\d+\/\d+|\/\d+)?)\s*(?:of\s+)?(pinch|pinches|tbsp|tbsps|tablespoon|tablespoons|tsp|tsps|teaspoon|teaspoons|cup|cups|g|gram|grams|kg|kilogram|kilograms|oz|ounce|ounces|lb|lbs|pound|pounds|ml|milliliter|milliliters|l|liter|liters|fl\s*oz|fluid\s*ounce|fluid\s*ounces|piece|pieces|slice|slices|stalk|stalks|clove|cloves|head|heads|bunch|bunches|can|cans|package|packages|pack|packs|bottle|bottles|jar|jars|box|boxes|bag|bags|sheet|sheets|strip|strips|fillet|fillets|serving|servings|portion|portions|dash|dashes|drop|drops|splash|splashes|handful|handfuls|sprig|sprigs|leaf|leaves|bulb|bulbs|pod|pods)/gi;

  // Find all ingredient matches in the text
  const matchedIngredients = findIngredientsInText(text, allIngredients);

  // Create a map of all matches (quantities and ingredients) with their positions
  interface Match {
    start: number;
    end: number;
    text: string;
    type: 'quantity' | 'ingredient';
  }

  const matches: Match[] = [];

  // Find all quantity matches
  let match;
  const regex = new RegExp(quantityPattern);
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      type: 'quantity',
    });
  }

  // Find all ingredient matches
  const lowerText = text.toLowerCase();
  matchedIngredients.forEach((ingredient) => {
    const lowerName = ingredient.name.toLowerCase();
    let searchIndex = 0;
    
    // Find all occurrences of this ingredient name
    while ((searchIndex = lowerText.indexOf(lowerName, searchIndex)) !== -1) {
      const endIndex = searchIndex + lowerName.length;
      // Get the actual text from the original (preserving case)
      const actualText = text.substring(searchIndex, endIndex);
      
      matches.push({
        start: searchIndex,
        end: endIndex,
        text: actualText,
        type: 'ingredient',
      });
      
      searchIndex = endIndex;
    }
  });

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (prefer quantities over ingredients if they overlap)
  const nonOverlappingMatches: Match[] = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    let hasOverlap = false;

    // Check if this match overlaps with any already added match
    for (const existing of nonOverlappingMatches) {
      if (
        (current.start < existing.end && current.end > existing.start)
      ) {
        hasOverlap = true;
        // If both are quantities or both are ingredients, keep the longer one
        // Otherwise, prefer quantity over ingredient
        if (current.type === existing.type) {
          if (current.end - current.start > existing.end - existing.start) {
            // Replace the shorter one with the longer one
            const index = nonOverlappingMatches.indexOf(existing);
            nonOverlappingMatches[index] = current;
          }
        } else if (current.type === 'quantity') {
          // Replace ingredient with quantity
          const index = nonOverlappingMatches.indexOf(existing);
          nonOverlappingMatches[index] = current;
        }
        break;
      }
    }

    if (!hasOverlap) {
      nonOverlappingMatches.push(current);
    }
  }

  // Sort again after removing overlaps
  nonOverlappingMatches.sort((a, b) => a.start - b.start);

  // Build the parts array with highlighted spans
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let keyCounter = 0;

  // CardView styling: bold, underline, hover color change
  const highlightClassName = 'font-bold underline decoration-stone-200 underline-offset-4 transition-colors cursor-help hover:text-[#0072ff]';

  nonOverlappingMatches.forEach((match) => {
    // Add text before the match
    if (match.start > lastIndex) {
      parts.push(text.substring(lastIndex, match.start));
    }

    // Add the highlighted span
    parts.push(
      React.createElement(
        'span',
        {
          key: `highlight-${keyCounter++}`,
          className: highlightClassName,
        },
        match.text
      )
    );

    lastIndex = match.end;
  });

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no matches found, return the original text
  if (parts.length === 0) {
    return React.createElement(React.Fragment, null, text);
  }

  // Return all parts wrapped in a fragment
  return React.createElement(React.Fragment, null, ...parts);
}

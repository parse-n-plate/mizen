import React, { useState, useEffect } from 'react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { findIngredientsInText, IngredientInfo } from '@/utils/ingredientMatcher';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates the scrollbar width by creating a temporary element and measuring it.
 * This is more reliable than comparing window.innerWidth vs clientWidth.
 * 
 * @returns The width of the scrollbar in pixels, or 0 if no scrollbar exists
 */
export function getScrollbarWidth(): number {
  // Only calculate if we're in the browser (not SSR)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 0;
  }

  // Check if page is actually scrollable first
  const isScrollable = document.documentElement.scrollHeight > window.innerHeight;
  if (!isScrollable) {
    return 0;
  }

  // Method 1: Compare window width vs document width (most reliable)
  const scrollbarWidth1 = window.innerWidth - document.documentElement.clientWidth;
  
  // Method 2: Create temporary element (backup method)
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  outer.style.msOverflowStyle = 'scrollbar';
  outer.style.width = '100px';
  outer.style.position = 'absolute';
  outer.style.top = '-9999px';
  document.body.appendChild(outer);

  const inner = document.createElement('div');
  inner.style.width = '100%';
  outer.appendChild(inner);

  const scrollbarWidth2 = outer.offsetWidth - inner.offsetWidth;

  // Clean up
  document.body.removeChild(outer);

  // Use the larger value, but cap at reasonable maximum (scrollbars are typically 15-17px)
  // This prevents incorrect calculations from causing layout issues
  const calculatedWidth = Math.max(scrollbarWidth1, scrollbarWidth2, 0);
  const MAX_SCROLLBAR_WIDTH = 25; // Reasonable maximum for scrollbar width
  
  // Return 0 if calculation seems incorrect (negative or too large)
  if (calculatedWidth <= 0 || calculatedWidth > MAX_SCROLLBAR_WIDTH) {
    return 0;
  }
  
  return calculatedWidth;
}

/**
 * Converts text fractions like "1/2" to Unicode fraction symbols like "½"
 * Handles common cooking fractions and mixed numbers like "1 1/2"
 * 
 * @param text - The text containing fractions to convert
 * @returns The text with fractions replaced by Unicode symbols
 * 
 * @example
 * convertTextFractionsToSymbols("1/2 cup") // returns "½ cup"
 * convertTextFractionsToSymbols("1 1/2 cups") // returns "1½ cups"
 * convertTextFractionsToSymbols("3/4 teaspoon") // returns "¾ teaspoon"
 */
export function convertTextFractionsToSymbols(text: string): string {
  if (!text) return text;
  
  // Map of common fractions to their Unicode symbols
  const fractionMap: Record<string, string> = {
    '1/2': '½',
    '1/3': '⅓',
    '2/3': '⅔',
    '1/4': '¼',
    '3/4': '¾',
    '1/5': '⅕',
    '2/5': '⅖',
    '3/5': '⅗',
    '4/5': '⅘',
    '1/6': '⅙',
    '5/6': '⅚',
    '1/8': '⅛',
    '3/8': '⅜',
    '5/8': '⅝',
    '7/8': '⅞',
  };

  // Replace fractions with their Unicode symbols
  // Pattern matches optional number followed by space and fraction, or just fraction
  // Examples: "1 1/2", "1/2", "3/4"
  let result = text;
  
  // First pass: Convert standalone fractions (not preceded by a digit without space)
  // This handles cases like "1/2 cup" or "at 350°F for 1/2 hour"
  Object.entries(fractionMap).forEach(([fraction, symbol]) => {
    // Match fraction that's either at start, after space/non-digit, or after punctuation
    // But not after a digit without space (to preserve mixed numbers for next pass)
    const standalonePattern = new RegExp(`(?<=^|\\s|[^\\d])${fraction.replace('/', '\\/')}(?=\\s|$|[^\\d\\/])`, 'g');
    result = result.replace(standalonePattern, symbol);
  });
  
  // Second pass: Convert mixed numbers like "1 1/2" to "1½"
  // This removes the space between the whole number and the fraction
  Object.entries(fractionMap).forEach(([fraction, symbol]) => {
    const mixedNumberPattern = new RegExp(`(\\d+)\\s+${fraction.replace('/', '\\/')}`, 'g');
    result = result.replace(mixedNumberPattern, `$1${symbol}`);
  });
  
  return result;
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

// Component for ingredient tooltip that works with tap on mobile
const IngredientTooltipWrapper = React.memo(({ 
  text, 
  tooltipContent, 
  highlightClassName,
  tooltipKey 
}: { 
  text: string; 
  tooltipContent: string; 
  highlightClassName: string;
  tooltipKey: string;
}) => {
  const [open, setOpen] = useState(false);
  
  return (
    <Tooltip 
      open={open}
      onOpenChange={setOpen}
    >
      <TooltipTrigger asChild>
        <span 
          className={highlightClassName}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          onClick={(e) => {
            // Stop event propagation to prevent triggering parent click handlers
            // (e.g., step navigation in ListView)
            e.stopPropagation()
            // Toggle tooltip on tap (mobile)
            setOpen(!open)
          }}
          onPointerDown={(e) => {
            // Also stop pointer events from bubbling
            e.stopPropagation()
          }}
        >
          {text}
        </span>
      </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-xs"
            onPointerDownOutside={(e) => {
              // Close tooltip when tapping outside
              setOpen(false)
            }}
          >
        <p className="text-sm font-medium">{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
});

IngredientTooltipWrapper.displayName = 'IngredientTooltipWrapper';

/**
 * Highlights quantities, measurements, ingredient names, and times in recipe text
 * Uses consistent styling across ListView and CardView (StepDisplay)
 * 
 * Highlights:
 * - Quantities and measurements (250g, 1 cup, 2 tbsp, etc.)
 * - Ingredient names found in the ingredient list (including plural forms)
 * - Time expressions (5 minutes, 10 min, 30 seconds, etc.)
 * 
 * Style: Bold, underline, with hover color change (matching CardView)
 */
export function highlightQuantitiesAndIngredients(
  text: string, 
  allIngredients: IngredientInfo[] = []
): React.ReactElement {
  if (!text) {
    return <>{text}</>;
  }

  // Convert text fractions to Unicode symbols first
  text = convertTextFractionsToSymbols(text);

  // Pattern to match quantities: numbers (including fractions, decimals, and ranges) followed by units
  // Matches: "2 cups", "2.5 cups", "2 to 2.5 cups", "about 1 to 2 tablespoons", "2-3 cups", etc.
  // Includes ranges with "to", hyphens, or en dashes, and optional "about" prefix
  // Note: Put plural forms FIRST in alternation to match them before singular forms (e.g., "cups" before "cup")
  const quantityPattern = /(?:about\s+)?(\d+(?:\.\d+)?(?:\s+\d+\/\d+|\/\d+)?(?:\s*(?:to|–|-)\s*\d+(?:\.\d+)?(?:\s+\d+\/\d+|\/\d+)?)?)\s*(?:of\s+)?(pinches|pinch|tbsps|tbsp|tablespoons|tablespoon|tsps|tsp|teaspoons|teaspoon|cups|cup|grams|gram|kilograms|kilogram|ounces|ounce|pounds|pound|milliliters|milliliter|liters|liter|fluid\s*ounces|fluid\s*ounce|pieces|piece|slices|slice|stalks|stalk|cloves|clove|heads|head|bunches|bunch|cans|can|packages|package|packs|pack|bottles|bottle|jars|jar|boxes|box|bags|bag|sheets|sheet|strips|strip|fillets|fillet|servings|serving|portions|portion|dashes|dash|drops|drop|splashes|splash|handfuls|handful|sprigs|sprig|leaves|leaf|bulbs|bulb|pods|pod|g|kg|oz|lb|ml|l|fl\s*oz)/gi;

  // Pattern to match time expressions: numbers (including ranges, decimals, and "to" connectors) followed by time units
  // Matches: "5 minutes", "10 min", "30 seconds", "2-3 minutes", "2–3 minutes" (en dash), "5 to 7 minutes", "about 5 to 7 minutes", "2.5 minutes", "2 to 2.5 minutes", etc.
  // Includes ranges with "to", hyphens, or en dashes, and optional "about" prefix
  // Note: Put plural forms FIRST in alternation to match them before singular forms
  const timePattern = /(?:about\s+)?(\d+(?:\.\d+)?(?:\s+\d+\/\d+|\/\d+)?(?:\s*(?:to|–|-)\s*\d+(?:\.\d+)?(?:\s+\d+\/\d+|\/\d+)?)?)\s*(minutes|minute|mins|min|seconds|second|secs|sec|hours|hour|hrs|hr|h)/gi;

  // Find all ingredient matches in the text
  const matchedIngredients = findIngredientsInText(text, allIngredients);

  // Create a map of all matches (quantities, ingredients, and times) with their positions
  interface Match {
    start: number;
    end: number;
    text: string;
    type: 'quantity' | 'ingredient' | 'time';
    ingredientInfo?: IngredientInfo; // Store ingredient details for tooltip
  }

  const matches: Match[] = [];

  // Find all quantity matches
  let match;
  const quantityRegex = new RegExp(quantityPattern.source, quantityPattern.flags);
  while ((match = quantityRegex.exec(text)) !== null) {
    // Check if match starts with "about " and exclude it from the highlighted text
    let matchText = match[0];
    let matchStart = match.index;
    
    // If the match text starts with "about ", remove it and adjust the start position
    if (matchText.toLowerCase().startsWith('about ')) {
      matchText = matchText.substring(6); // Remove "about " (6 characters)
      matchStart = match.index + 6; // Adjust start position
    }
    
    matches.push({
      start: matchStart,
      end: matchStart + matchText.length,
      text: matchText,
      type: 'quantity',
    });
  }

  // Find all time matches
  const timeRegex = new RegExp(timePattern.source, timePattern.flags);
  while ((match = timeRegex.exec(text)) !== null) {
    // Check if match starts with "about " and exclude it from the highlighted text
    let matchText = match[0];
    let matchStart = match.index;
    
    // If the match text starts with "about ", remove it and adjust the start position
    if (matchText.toLowerCase().startsWith('about ')) {
      matchText = matchText.substring(6); // Remove "about " (6 characters)
      matchStart = match.index + 6; // Adjust start position
    }
    
    matches.push({
      start: matchStart,
      end: matchStart + matchText.length,
      text: matchText,
      type: 'time',
    });
  }

  // Find all ingredient matches (including plural forms)
  const lowerText = text.toLowerCase();
  const ingredientMatches = new Set<string>(); // Track matches to avoid duplicates
  
  matchedIngredients.forEach((ingredient) => {
    const lowerName = ingredient.name.toLowerCase();
    
    // Helper function to check if a position is a word boundary
    const isWordBoundary = (pos: number, length: number): boolean => {
      const beforeChar = pos > 0 ? lowerText[pos - 1] : ' ';
      const afterChar = pos + length < lowerText.length ? lowerText[pos + length] : ' ';
      // Word boundary: before and after are not letters
      return !/[a-z]/.test(beforeChar) && !/[a-z]/.test(afterChar);
    };
    
    // Helper function to add match if it's a whole word and not duplicate
    const addMatchIfValid = (start: number, end: number) => {
      const matchKey = `${start}-${end}`;
      if (!ingredientMatches.has(matchKey) && isWordBoundary(start, end - start)) {
        ingredientMatches.add(matchKey);
        const actualText = text.substring(start, end);
        matches.push({
          start,
          end,
          text: actualText,
          type: 'ingredient',
          ingredientInfo: ingredient, // Store ingredient info for tooltip
        });
      }
    };
    
    // Find all occurrences of this ingredient name (exact match)
    let searchIndex = 0;
    while ((searchIndex = lowerText.indexOf(lowerName, searchIndex)) !== -1) {
      const endIndex = searchIndex + lowerName.length;
      addMatchIfValid(searchIndex, endIndex);
      searchIndex = endIndex;
    }

    // Also check for plural/singular variations
    // If ingredient name ends with 's', also search for singular form
    if (lowerName.endsWith('s') && lowerName.length > 1) {
      const singular = lowerName.slice(0, -1);
      searchIndex = 0;
      while ((searchIndex = lowerText.indexOf(singular, searchIndex)) !== -1) {
        const afterIndex = searchIndex + singular.length;
        addMatchIfValid(searchIndex, afterIndex);
        searchIndex = afterIndex;
      }
    } else {
      // If ingredient name doesn't end with 's', also search for plural form
      const plural = lowerName + 's';
      searchIndex = 0;
      while ((searchIndex = lowerText.indexOf(plural, searchIndex)) !== -1) {
        const afterIndex = searchIndex + plural.length;
        addMatchIfValid(searchIndex, afterIndex);
        searchIndex = afterIndex;
      }
    }
  });

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (prefer times > quantities > ingredients if they overlap)
  const nonOverlappingMatches: Match[] = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    let shouldAdd = true;

    // Check if this match overlaps with any already added match
    for (let j = 0; j < nonOverlappingMatches.length; j++) {
      const existing = nonOverlappingMatches[j];
      if (current.start < existing.end && current.end > existing.start) {
        // There's an overlap - determine which one to keep
        // Priority: time > quantity > ingredient
        const typePriority: Record<string, number> = { time: 3, quantity: 2, ingredient: 1 };
        const currentPriority = typePriority[current.type] || 0;
        const existingPriority = typePriority[existing.type] || 0;

        if (currentPriority > existingPriority) {
          // Current has higher priority, replace existing
          nonOverlappingMatches[j] = current;
          shouldAdd = false;
          break;
        } else if (currentPriority < existingPriority) {
          // Existing has higher priority, skip current
          shouldAdd = false;
          break;
        } else {
          // Same priority - keep the longer one
          if (current.end - current.start > existing.end - existing.start) {
            nonOverlappingMatches[j] = current;
            shouldAdd = false;
            break;
          } else {
            // Existing is longer or same, skip current
            shouldAdd = false;
            break;
          }
        }
      }
    }

    if (shouldAdd) {
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
    // For ingredient matches, wrap in tooltip to show prep stage details
    if (match.type === 'ingredient' && match.ingredientInfo) {
      const ingredient = match.ingredientInfo;
      // Format tooltip content: amount + unit + name
      const tooltipParts: string[] = [];
      if (ingredient.amount && ingredient.amount.trim() && ingredient.amount !== 'as needed') {
        tooltipParts.push(ingredient.amount.trim());
      }
      if (ingredient.units && ingredient.units.trim()) {
        tooltipParts.push(ingredient.units.trim());
      }
      tooltipParts.push(ingredient.name);
      const tooltipContent = tooltipParts.join(' ');
      
      parts.push(
        <IngredientTooltipWrapper
          key={`highlight-${keyCounter++}`}
          text={match.text}
          tooltipContent={tooltipContent}
          highlightClassName={highlightClassName}
          tooltipKey={`tooltip-${keyCounter}`}
        />
      );
    } else {
      // For non-ingredient matches (quantities, times), use regular span
      parts.push(
        <span
          key={`highlight-${keyCounter++}`}
          className={highlightClassName}
        >
          {match.text}
        </span>
      );
    }

    lastIndex = match.end;
  });

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no matches found, return the original text
  if (parts.length === 0) {
    return <>{text}</>;
  }

  // Return all parts wrapped in a fragment
  return <>{parts}</>;
}

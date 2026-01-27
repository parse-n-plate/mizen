/**
 * Utility for matching ingredients in recipe step text.
 * This helps identify which ingredients are used in which instructions.
 */

export interface IngredientInfo {
  name: string;
  amount?: string;
  units?: string;
  group?: string;
}

/**
 * Extended ingredient info that includes the terms that matched in the text.
 * Used for highlighting the actual matched text in step instructions.
 */
export interface IngredientMatch extends IngredientInfo {
  matchedTerms: string[]; // The actual terms found in the text that triggered this match
}

/**
 * Ingredient category synonyms - generic cooking terms that can refer to specific ingredients
 * When instructions use a generic term like "meat", it should match specific ingredients
 * like "pork belly", "beef", "chicken", etc.
 */
const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  // Generic "meat" matches any meat ingredient
  'meat': ['pork', 'beef', 'chicken', 'lamb', 'turkey', 'duck', 'veal', 'bacon', 'sausage', 'ham', 'prosciutto', 'chorizo', 'pancetta'],
  // Pork-related synonyms
  'pork': ['pork belly', 'pork shoulder', 'pork chop', 'pork loin', 'pork tenderloin', 'bacon', 'ham', 'prosciutto', 'pancetta', 'sausage'],
  // Beef-related synonyms
  'beef': ['beef chuck', 'ground beef', 'steak', 'brisket', 'ribeye', 'sirloin', 'tenderloin', 'short ribs', 'beef stew'],
  // Chicken-related synonyms
  'chicken': ['chicken breast', 'chicken thigh', 'chicken wing', 'chicken drumstick', 'ground chicken'],
  // Fish/seafood synonyms
  'fish': ['salmon', 'tuna', 'cod', 'halibut', 'tilapia', 'mackerel', 'sardine', 'anchovy', 'trout'],
  'seafood': ['shrimp', 'prawn', 'crab', 'lobster', 'scallop', 'mussel', 'clam', 'oyster', 'squid', 'octopus'],
  // Vegetable synonyms
  'onion': ['yellow onion', 'red onion', 'white onion', 'green onion', 'scallion', 'shallot', 'leek'],
  'pepper': ['bell pepper', 'red pepper', 'green pepper', 'yellow pepper', 'chili pepper', 'jalapeño', 'serrano'],
  'tomato': ['cherry tomato', 'roma tomato', 'plum tomato', 'grape tomato', 'tomato paste', 'tomato sauce'],
  // Dairy synonyms
  'cheese': ['cheddar', 'mozzarella', 'parmesan', 'feta', 'goat cheese', 'cream cheese', 'ricotta', 'gorgonzola'],
  'butter': ['unsalted butter', 'salted butter', 'clarified butter', 'ghee'],
  // Herbs/spices synonyms
  'garlic': ['garlic clove', 'garlic powder', 'minced garlic'],
  'ginger': ['fresh ginger', 'ginger root', 'ground ginger'],
  // Grain/starch synonyms
  'rice': ['white rice', 'brown rice', 'jasmine rice', 'basmati rice', 'arborio rice', 'sushi rice'],
  'pasta': ['spaghetti', 'penne', 'fettuccine', 'linguine', 'rigatoni', 'macaroni', 'fusilli'],
};

/**
 * Searches for ingredient mentions in a given text.
 * Uses a simple case-insensitive substring match, including synonym matching.
 * Returns ingredients with the actual terms that matched in the text.
 */
export function findIngredientsInText(text: string, ingredients: IngredientInfo[]): IngredientMatch[] {
  if (!text || !ingredients || ingredients.length === 0) return [];

  const foundIngredients: IngredientMatch[] = [];
  const lowerText = text.toLowerCase();

  // Helper to find ALL occurrences of a term in the text
  const findAllOccurrences = (term: string): string[] => {
    const results: string[] = [];
    const lowerTerm = term.toLowerCase();
    let searchIdx = 0;
    while ((searchIdx = lowerText.indexOf(lowerTerm, searchIdx)) !== -1) {
      results.push(text.substring(searchIdx, searchIdx + lowerTerm.length));
      searchIdx += lowerTerm.length;
    }
    return results;
  };

  for (const ingredient of ingredients) {
    const lowerName = ingredient.name.toLowerCase();
    let isMatched = false;
    const matchedTerms: string[] = [];

    // Stage 1: Check for exact full name match (highest priority for compound ingredients)
    // This ensures "cottage cheese" matches as a whole unit before individual words
    const exactMatches = findAllOccurrences(lowerName);
    if (exactMatches.length > 0) {
      matchedTerms.push(...exactMatches);
      isMatched = true;
    }

    // Stage 2: Check for singular/plural versions (find ALL occurrences)
    if (!isMatched) {
      if (lowerName.endsWith('s')) {
        const singular = lowerName.slice(0, -1);
        if (singular.length > 3) {
          const singularMatches = findAllOccurrences(singular);
          if (singularMatches.length > 0) {
            matchedTerms.push(...singularMatches);
            isMatched = true;
          }
        }
      } else {
        const plural = lowerName + 's';
        const pluralMatches = findAllOccurrences(plural);
        if (pluralMatches.length > 0) {
          matchedTerms.push(...pluralMatches);
          isMatched = true;
        }
      }
    }

    // Stage 3: Check for common variations (e.g., "onion" in "green onions")
    // Match ALL significant words, not just the first one (no break)
    if (!isMatched) {
      const words = lowerName.split(' ');

      for (const word of words) {
        if (word.length > 3 && lowerText.includes(word)) {
          const wordMatches = findAllOccurrences(word);
          if (wordMatches.length > 0) {
            matchedTerms.push(...wordMatches);
            isMatched = true;
            // No break - continue to find all significant words
          }
        }
      }
    }

    // Stage 4: Check for synonym matches
    // If text contains a synonym term (e.g., "meat"), check if ingredient matches that category
    if (!isMatched) {
      for (const [synonymTerm, relatedTerms] of Object.entries(INGREDIENT_SYNONYMS)) {
        // Check if text contains the synonym term (as a whole word to avoid false matches)
        // Find ALL occurrences of the synonym term
        const synonymRegex = new RegExp(`\\b${synonymTerm}\\b`, 'gi');
        let synonymMatch;
        while ((synonymMatch = synonymRegex.exec(text)) !== null) {
          // Check if ingredient name contains any of the related terms
          for (const relatedTerm of relatedTerms) {
            if (lowerName.includes(relatedTerm.toLowerCase())) {
              // Use the actual matched text (preserves case)
              matchedTerms.push(synonymMatch[0]);
              isMatched = true;
              break;
            }
          }
        }
        // If we found matches via synonym, break out of synonym loop
        if (isMatched) {
          break;
        }
      }
    }

    if (isMatched) {
      foundIngredients.push({
        ...ingredient,
        matchedTerms: [...new Set(matchedTerms)], // Dedupe matched terms
      });
    }
  }

  // Deduplicate by name, merging matchedTerms
  const deduped = new Map<string, IngredientMatch>();
  for (const item of foundIngredients) {
    const existing = deduped.get(item.name);
    if (existing) {
      // Merge matched terms
      existing.matchedTerms = [...new Set([...existing.matchedTerms, ...item.matchedTerms])];
    } else {
      deduped.set(item.name, item);
    }
  }
  return Array.from(deduped.values());
}

/**
 * Identifies which steps use a specific ingredient.
 * Returns an array of step numbers (1-indexed).
 */
export function findStepsForIngredient(ingredientName: string, steps: { instruction: string }[]): number[] {
  if (!ingredientName || !steps) return [];

  const stepNumbers: number[] = [];
  const lowerName = ingredientName.toLowerCase();

  steps.forEach((step, index) => {
    const lowerInstruction = step.instruction.toLowerCase();
    if (lowerInstruction.includes(lowerName)) {
      stepNumbers.push(index + 1);
    } else {
      // Basic singular/plural check
      const singular = lowerName.endsWith('s') ? lowerName.slice(0, -1) : lowerName;
      const plural = lowerName.endsWith('s') ? lowerName : lowerName + 's';
      
      if (lowerInstruction.includes(singular) || lowerInstruction.includes(plural)) {
        stepNumbers.push(index + 1);
      }
    }
  });

  return stepNumbers;
}


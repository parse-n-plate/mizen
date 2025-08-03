'use client';
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';

interface IngredientObject {
  amount: string;
  units: string;
  ingredient: string;
}

interface ParsedRecipe {
  title?: string;
  ingredients: string[] | IngredientObject[] | string[][];  // Support multiple formats
  instructions: string[];
}

interface RecipeContextType {
  parsedRecipe: ParsedRecipe | null;
  setParsedRecipe: (recipe: ParsedRecipe | null) => void;
  clearRecipe: () => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('parsedRecipe');
    if (saved) {
      try {
        setParsedRecipe(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recipe from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('parsedRecipe');
      }
    }
    setIsLoaded(true);
  }, []);

  const setParsedRecipeWithStorage = (recipe: ParsedRecipe | null) => {
    setParsedRecipe(recipe);
    if (recipe) {
      try {
        localStorage.setItem('parsedRecipe', JSON.stringify(recipe));
      } catch (error) {
        console.error('Error saving recipe to localStorage:', error);
      }
    } else {
      localStorage.removeItem('parsedRecipe');
    }
  };

  const clearRecipe = () => {
    setParsedRecipe(null);
    localStorage.removeItem('parsedRecipe');
  };

  return (
    <RecipeContext.Provider
      value={{
        parsedRecipe,
        setParsedRecipe: setParsedRecipeWithStorage,
        clearRecipe,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipe() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }
  return context;
}

// Helper function to normalize ingredients to a consistent format
export function normalizeIngredients(ingredients: string[] | IngredientObject[] | string[][]): IngredientObject[] {
  if (!ingredients || ingredients.length === 0) {
    return [];
  }

  // If it's already an array of IngredientObjects
  if (typeof ingredients[0] === 'object' && 'ingredient' in ingredients[0]) {
    return ingredients as IngredientObject[];
  }

  // If it's an array of string arrays (from Python scraper)
  if (Array.isArray(ingredients[0])) {
    return (ingredients as string[][]).map(([ingredient, amount, units]) => ({
      ingredient: ingredient || '',
      amount: amount || 'as needed',
      units: units || '',
    }));
  }

  // If it's an array of strings
  return (ingredients as string[]).map((ingredient) => ({
    ingredient,
    amount: 'as needed',
    units: '',
  }));
}

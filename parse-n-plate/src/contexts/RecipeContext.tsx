'use client'
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ParsedRecipe {
  title?: string;
  ingredients: string[];
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
      }
    }
    setIsLoaded(true);
  }, []);

  const setParsedRecipeWithStorage = (recipe: ParsedRecipe | null) => {
    setParsedRecipe(recipe);
    if (recipe) {
      localStorage.setItem('parsedRecipe', JSON.stringify(recipe));
    } else {
      localStorage.removeItem('parsedRecipe');
    }
  };

  const clearRecipe = () => {
    setParsedRecipe(null);
    localStorage.removeItem('parsedRecipe');
  };

  return (
    <RecipeContext.Provider value={{
      parsedRecipe,
      setParsedRecipe: setParsedRecipeWithStorage,
      clearRecipe
    }}>
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

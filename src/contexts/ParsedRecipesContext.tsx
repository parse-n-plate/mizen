'use client';
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import {
  ParsedRecipe,
  getRecentRecipes,
  addRecentRecipe,
  getRecipeById,
} from '@/lib/storage';

interface ParsedRecipesContextType {
  recentRecipes: ParsedRecipe[];
  isLoaded: boolean; // Add this line
  addRecipe: (recipe: Omit<ParsedRecipe, 'id' | 'parsedAt'>) => void;
  clearRecipes: () => void;
  removeRecipe: (id: string) => void;
  getRecipeById: (id: string) => ParsedRecipe | null;
}

const ParsedRecipesContext = createContext<
  ParsedRecipesContextType | undefined
>(undefined);

export function ParsedRecipesProvider({ children }: { children: ReactNode }) {
  const [recentRecipes, setRecentRecipes] = useState<ParsedRecipe[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedRecipes = getRecentRecipes();
      setRecentRecipes(storedRecipes);
    } catch (error) {
      console.error('Error loading recent recipes from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const addRecipe = (recipe: Omit<ParsedRecipe, 'id' | 'parsedAt'>) => {
    try {
      // Add to localStorage
      addRecentRecipe(recipe);

      // Update state by re-fetching from localStorage
      const updatedRecipes = getRecentRecipes();
      setRecentRecipes(updatedRecipes);
    } catch (error) {
      console.error('Error adding recipe:', error);
    }
  };

  const clearRecipes = () => {
    try {
      // Clear from localStorage
      localStorage.removeItem('recentRecipes');

      // Update state
      setRecentRecipes([]);
    } catch (error) {
      console.error('Error clearing recipes:', error);
    }
  };

  const removeRecipe = (id: string) => {
    try {
      // Remove from localStorage
      const currentRecipes = getRecentRecipes();
      const filteredRecipes = currentRecipes.filter(
        (recipe) => recipe.id !== id,
      );
      localStorage.setItem('recentRecipes', JSON.stringify(filteredRecipes));

      // Update state
      setRecentRecipes(filteredRecipes);
    } catch (error) {
      console.error('Error removing recipe:', error);
    }
  };

  const getRecipeByIdFromContext = (id: string) => {
    return getRecipeById(id);
  };

  return (
    <ParsedRecipesContext.Provider
      value={{
        recentRecipes,
        isLoaded, // Add this line
        addRecipe,
        clearRecipes,
        removeRecipe,
        getRecipeById: getRecipeByIdFromContext,
      }}
    >
      {children}
    </ParsedRecipesContext.Provider>
  );
}

export function useParsedRecipes() {
  const context = useContext(ParsedRecipesContext);
  if (context === undefined) {
    throw new Error(
      'useParsedRecipes must be used within a ParsedRecipesProvider',
    );
  }
  return context;
}














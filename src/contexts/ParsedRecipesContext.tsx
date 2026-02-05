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
  updateRecipe as updateRecipeInStorage,
  removeRecentRecipe,
  getBookmarkedRecipeIds,
  getBookmarkedRecipes as getBookmarkedRecipesFromStorage,
  addBookmark as addBookmarkToStorage,
  removeBookmark as removeBookmarkFromStorage,
} from '@/lib/storage';

interface ParsedRecipesContextType {
  recentRecipes: ParsedRecipe[];
  isLoaded: boolean;
  addRecipe: (recipe: Omit<ParsedRecipe, 'id' | 'parsedAt'>) => void;
  updateRecipe: (id: string, updates: Partial<ParsedRecipe>) => void;
  clearRecipes: () => void;
  removeRecipe: (id: string) => void;
  getRecipeById: (id: string) => ParsedRecipe | null;
  // Bookmark functionality
  bookmarkedRecipeIds: string[];
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  getBookmarkedRecipes: () => ParsedRecipe[];
}

const ParsedRecipesContext = createContext<
  ParsedRecipesContextType | undefined
>(undefined);

export function ParsedRecipesProvider({ children }: { children: ReactNode }) {
  const [recentRecipes, setRecentRecipes] = useState<ParsedRecipe[]>([]);
  const [bookmarkedRecipeIds, setBookmarkedRecipeIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedRecipes = getRecentRecipes();
      setRecentRecipes(storedRecipes);

      // Load bookmarked recipe IDs (derived from full bookmark store)
      const bookmarkedIds = getBookmarkedRecipeIds();
      setBookmarkedRecipeIds(bookmarkedIds);
    } catch (error) {
      console.error('Error loading recipes from localStorage:', error);
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

  const updateRecipe = (id: string, updates: Partial<ParsedRecipe>) => {
    try {
      // Update in localStorage (handles both recents and bookmarks)
      updateRecipeInStorage(id, updates);

      // Refresh state from localStorage
      setRecentRecipes(getRecentRecipes());
    } catch (error) {
      console.error('Error updating recipe:', error);
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
      // removeRecentRecipe handles both recents and bookmarks
      removeRecentRecipe(id);

      // Refresh state from both stores
      setRecentRecipes(getRecentRecipes());
      setBookmarkedRecipeIds(getBookmarkedRecipeIds());
    } catch (error) {
      console.error('Error removing recipe:', error);
    }
  };

  const getRecipeByIdFromContext = (id: string) => {
    return getRecipeById(id);
  };

  // Bookmark management functions
  const toggleBookmark = (id: string) => {
    try {
      const isCurrentlyBookmarked = bookmarkedRecipeIds.includes(id);

      if (isCurrentlyBookmarked) {
        removeBookmarkFromStorage(id);
      } else {
        addBookmarkToStorage(id);
      }

      // Refresh both slices — addBookmark/removeBookmark move data between stores
      setRecentRecipes(getRecentRecipes());
      setBookmarkedRecipeIds(getBookmarkedRecipeIds());
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const isBookmarked = (id: string): boolean => {
    return bookmarkedRecipeIds.includes(id);
  };

  // Get full recipe objects for all bookmarks
  const getBookmarkedRecipes = (): ParsedRecipe[] => {
    return getBookmarkedRecipesFromStorage();
  };

  return (
    <ParsedRecipesContext.Provider
      value={{
        recentRecipes,
        isLoaded,
        addRecipe,
        updateRecipe,
        clearRecipes,
        removeRecipe,
        getRecipeById: getRecipeByIdFromContext,
        bookmarkedRecipeIds,
        toggleBookmark,
        isBookmarked,
        getBookmarkedRecipes,
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

























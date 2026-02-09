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
  pinRecipe as pinRecipeInStorage,
  unpinRecipe as unpinRecipeInStorage,
  isRecipePinned as isRecipePinnedInStorage,
  touchRecipeAccess,
  getRecipeOrder,
  saveRecipeOrder,
  clearRecipeOrder,
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
  // Pin functionality
  togglePin: (id: string) => void;
  isPinned: (id: string) => boolean;
  // Last-accessed tracking
  touchRecipe: (id: string) => void;
  // Manual recipe ordering
  recipeOrder: string[];
  reorderRecipes: (orderedIds: string[]) => void;
}

const ParsedRecipesContext = createContext<
  ParsedRecipesContextType | undefined
>(undefined);

export function ParsedRecipesProvider({ children }: { children: ReactNode }) {
  const [recentRecipes, setRecentRecipes] = useState<ParsedRecipe[]>([]);
  const [bookmarkedRecipeIds, setBookmarkedRecipeIds] = useState<string[]>([]);
  const [recipeOrder, setRecipeOrder] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const getLiveRecipeIds = (): string[] => {
    const recentIds = getRecentRecipes().map((recipe) => recipe.id);
    const bookmarkedIds = getBookmarkedRecipeIds();

    const seen = new Set(recentIds);
    const mergedIds = [...recentIds];

    for (const id of bookmarkedIds) {
      if (!seen.has(id)) {
        mergedIds.push(id);
        seen.add(id);
      }
    }

    return mergedIds;
  };

  const normalizeRecipeOrder = (
    candidateOrder: string[],
    liveIds: string[],
  ): string[] => {
    const liveSet = new Set(liveIds);
    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const id of candidateOrder) {
      if (liveSet.has(id) && !seen.has(id)) {
        normalized.push(id);
        seen.add(id);
      }
    }

    for (const id of liveIds) {
      if (!seen.has(id)) {
        normalized.push(id);
        seen.add(id);
      }
    }

    return normalized;
  };

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedRecipes = getRecentRecipes();
      setRecentRecipes(storedRecipes);

      // Load bookmarked recipe IDs (derived from full bookmark store)
      const bookmarkedIds = getBookmarkedRecipeIds();
      setBookmarkedRecipeIds(bookmarkedIds);

      const liveIds = [...storedRecipes.map((recipe) => recipe.id)];
      for (const id of bookmarkedIds) {
        if (!liveIds.includes(id)) {
          liveIds.push(id);
        }
      }

      // Load persisted recipe order
      const savedOrder = getRecipeOrder();
      if (savedOrder) {
        const normalizedOrder = normalizeRecipeOrder(savedOrder, liveIds);
        setRecipeOrder(normalizedOrder);

        if (normalizedOrder.length !== savedOrder.length) {
          saveRecipeOrder(normalizedOrder);
        }
      }
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

      // Prepend the new recipe to the order (it's the first in updatedRecipes)
      if (updatedRecipes.length > 0) {
        const newId = updatedRecipes[0].id;
        const liveIds = getLiveRecipeIds();
        const newOrder = normalizeRecipeOrder(
          [newId, ...recipeOrder.filter((id) => id !== newId)],
          liveIds,
        );
        setRecipeOrder(newOrder);
        saveRecipeOrder(newOrder);
      }
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

      // Clear persisted order
      setRecipeOrder([]);
      clearRecipeOrder();
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

      // Remove from persisted order
      const liveIds = getLiveRecipeIds();
      const newOrder = normalizeRecipeOrder(
        recipeOrder.filter((orderId) => orderId !== id),
        liveIds,
      );
      setRecipeOrder(newOrder);
      saveRecipeOrder(newOrder);
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

  // Pin management
  const togglePin = (id: string) => {
    try {
      if (isRecipePinnedInStorage(id)) {
        unpinRecipeInStorage(id);
      } else {
        pinRecipeInStorage(id);
      }
      setRecentRecipes(getRecentRecipes());
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const isPinned = (id: string): boolean => {
    return isRecipePinnedInStorage(id);
  };

  // Last-accessed tracking
  const touchRecipe = (id: string) => {
    try {
      touchRecipeAccess(id);
      setRecentRecipes(getRecentRecipes());
    } catch (error) {
      console.error('Error touching recipe:', error);
    }
  };

  // Manual recipe ordering
  const reorderRecipes = (orderedIds: string[]) => {
    const liveIds = getLiveRecipeIds();
    const normalizedOrder = normalizeRecipeOrder(orderedIds, liveIds);
    setRecipeOrder(normalizedOrder);
    saveRecipeOrder(normalizedOrder);
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
        togglePin,
        isPinned,
        touchRecipe,
        recipeOrder,
        reorderRecipes,
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
























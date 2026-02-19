"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { ParsedRecipe } from "@/lib/types";

interface SavedMeta {
  id: string;
  slug: string;
}

interface RecipeContextType {
  recipe: ParsedRecipe | null;
  setRecipe: (recipe: ParsedRecipe | null) => void;
  savedMeta: SavedMeta | null;
  setSavedMeta: (meta: SavedMeta | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const STORAGE_KEY = "baby-mizen-recipe";
const META_STORAGE_KEY = "baby-mizen-recipe-meta";

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipe, setRecipeState] = useState<ParsedRecipe | null>(null);
  const [savedMeta, setSavedMetaState] = useState<SavedMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecipeState(JSON.parse(stored));
      }
      const storedMeta = localStorage.getItem(META_STORAGE_KEY);
      if (storedMeta) {
        setSavedMetaState(JSON.parse(storedMeta));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const setRecipe = (newRecipe: ParsedRecipe | null) => {
    setRecipeState(newRecipe);
    try {
      if (newRecipe) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecipe));
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(META_STORAGE_KEY);
        setSavedMetaState(null);
      }
    } catch {
      // Ignore storage errors
    }
  };

  const setSavedMeta = (meta: SavedMeta | null) => {
    setSavedMetaState(meta);
    try {
      if (meta) {
        localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
      } else {
        localStorage.removeItem(META_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <RecipeContext.Provider
      value={{
        recipe,
        setRecipe,
        savedMeta,
        setSavedMeta,
        isLoading,
        setIsLoading,
        error,
        setError,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipe() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipe must be used within a RecipeProvider");
  }
  return context;
}

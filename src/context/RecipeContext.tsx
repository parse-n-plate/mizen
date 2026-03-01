"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { ParsedRecipe } from "@/lib/types";

interface SavedMeta {
  id: string;
  slug: string;
}

export interface HistoryEntry {
  recipe: ParsedRecipe;
  parsedAt: string;
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
  history: HistoryEntry[];
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const STORAGE_KEY = "baby-mizen-recipe";
const META_STORAGE_KEY = "baby-mizen-recipe-meta";
const HISTORY_KEY = "baby-mizen-history";
const MAX_HISTORY = 10;

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipe, setRecipeState] = useState<ParsedRecipe | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [savedMeta, setSavedMetaState] = useState<SavedMeta | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(META_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const setRecipe = (newRecipe: ParsedRecipe | null) => {
    setRecipeState(newRecipe);
    // Clear saved meta — caller must explicitly setSavedMeta if recipe is already saved
    setSavedMetaState(null);
    try {
      if (newRecipe) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecipe));
        localStorage.removeItem(META_STORAGE_KEY);

        // Add to parse history (dedup by title, newest first)
        const entry: HistoryEntry = {
          recipe: newRecipe,
          parsedAt: new Date().toISOString(),
        };
        const updated = [
          entry,
          ...history.filter((h) => h.recipe.title !== newRecipe.title),
        ].slice(0, MAX_HISTORY);
        setHistory(updated);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(META_STORAGE_KEY);
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
        history,
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

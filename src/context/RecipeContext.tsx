"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ParsedRecipe } from "@/lib/types";

interface SavedMeta {
  id: string;
  slug: string;
}

export interface HistoryEntry {
  recipe: ParsedRecipe;
  parsedAt: string;
  savedMeta?: SavedMeta | null;
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
  hasHydrated: boolean;
  removeFromHistory: () => void;
  loadRecipe: (recipe: ParsedRecipe, meta?: SavedMeta | null) => void;
  unsaveHistoryEntry: (title: string) => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const STORAGE_KEY = "baby-mizen-recipe";
const META_STORAGE_KEY = "baby-mizen-recipe-meta";
const HISTORY_KEY = "baby-mizen-history";
const MAX_HISTORY = 10;

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipe, setRecipeState] = useState<ParsedRecipe | null>(null);
  const [savedMeta, setSavedMetaState] = useState<SavedMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Hydrate from localStorage after mount to avoid SSR/client mismatch
  /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage */
  useEffect(() => {
    try {
      const storedRecipe = localStorage.getItem(STORAGE_KEY);
      if (storedRecipe) setRecipeState(JSON.parse(storedRecipe));
    } catch {
      /* ignore */
    }
    try {
      const storedMeta = localStorage.getItem(META_STORAGE_KEY);
      if (storedMeta) setSavedMetaState(JSON.parse(storedMeta));
    } catch {
      /* ignore */
    }
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) setHistory(JSON.parse(storedHistory));
    } catch {
      /* ignore */
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  const [hasHydrated] = useState(true);

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
        const updated = [entry, ...history.filter((h) => h.recipe.title !== newRecipe.title)].slice(
          0,
          MAX_HISTORY
        );
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

  const removeFromHistory = () => {
    if (!recipe) return;
    try {
      const updated = history.filter((h) => h.recipe.title !== recipe.title);
      setHistory(updated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      // Clear current recipe state
      setRecipeState(null);
      setSavedMetaState(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(META_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  // Load an existing history recipe without reordering history
  const loadRecipe = (r: ParsedRecipe, meta?: SavedMeta | null) => {
    setRecipeState(r);
    const resolvedMeta = meta ?? null;
    setSavedMetaState(resolvedMeta);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
      if (resolvedMeta) {
        localStorage.setItem(META_STORAGE_KEY, JSON.stringify(resolvedMeta));
      } else {
        localStorage.removeItem(META_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  };

  const unsaveHistoryEntry = (title: string) => {
    const updated = history.map((h) => (h.recipe.title === title ? { ...h, savedMeta: null } : h));
    setHistory(updated);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
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
      // Update the matching history entry with savedMeta
      if (recipe) {
        const updated = history.map((h) =>
          h.recipe.title === recipe.title ? { ...h, savedMeta: meta } : h
        );
        setHistory(updated);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
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
        hasHydrated,
        removeFromHistory,
        loadRecipe,
        unsaveHistoryEntry,
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

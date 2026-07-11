"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ParsedRecipe, SavedRecipe } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

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
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

const STORAGE_KEY = "baby-mizen-recipe";
const META_STORAGE_KEY = "baby-mizen-recipe-meta";
const HISTORY_KEY = "baby-mizen-history";
const MAX_HISTORY = 10;

function recipeIdentityKey(recipe: ParsedRecipe): string {
  const sourceUrl = recipe.sourceUrl?.trim();
  if (sourceUrl) return `url:${sourceUrl}`;
  return `title:${recipe.title.trim().toLowerCase()}`;
}

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

  // Reconcile local history with server-side saved status. Runs on mount and
  // whenever auth state changes (sign-in/out), so the dropdown reflects
  // recipes saved on other devices too.
  useEffect(() => {
    let cancelled = false;

    const reconcile = async () => {
      try {
        const res = await fetch("/api/recipes", { cache: "no-store" });
        if (!res.ok) {
          if (cancelled) return;
          // Not signed in or server error — clear all saved markers locally.
          setHistory((prev) => {
            if (!prev.some((h) => h.savedMeta)) return prev;
            const cleared = prev.map((h) => ({ ...h, savedMeta: null }));
            try {
              localStorage.setItem(HISTORY_KEY, JSON.stringify(cleared));
            } catch {
              /* ignore */
            }
            return cleared;
          });
          setSavedMetaState((prev) => {
            if (!prev) return prev;
            try {
              localStorage.removeItem(META_STORAGE_KEY);
            } catch {
              /* ignore */
            }
            return null;
          });
          return;
        }
        const saved = (await res.json()) as SavedRecipe[];
        if (cancelled || !Array.isArray(saved)) return;

        const byKey = new Map<string, SavedRecipe>();
        for (const s of saved) {
          const sourceUrl = s.source_url || s.recipe?.sourceUrl;
          if (sourceUrl) {
            byKey.set(`url:${sourceUrl.trim()}`, s);
          } else if (s.recipe?.title) {
            byKey.set(`title:${s.recipe.title.trim().toLowerCase()}`, s);
          }
        }
        const matchFor = (r: ParsedRecipe): SavedMeta | null => {
          const hit = byKey.get(recipeIdentityKey(r));
          return hit ? { id: hit.id, slug: hit.slug } : null;
        };

        setHistory((prev) => {
          let changed = false;
          const next = prev.map((h) => {
            const meta = matchFor(h.recipe);
            const sameId = (meta?.id ?? null) === (h.savedMeta?.id ?? null);
            if (sameId) return h;
            changed = true;
            return { ...h, savedMeta: meta };
          });
          if (!changed) return prev;
          try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
          } catch {
            /* ignore */
          }
          return next;
        });

        setRecipeState((current) => {
          if (!current) return current;
          const meta = matchFor(current);
          setSavedMetaState((prev) => {
            const sameId = (meta?.id ?? null) === (prev?.id ?? null);
            if (sameId) return prev;
            try {
              if (meta) {
                localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
              } else {
                localStorage.removeItem(META_STORAGE_KEY);
              }
            } catch {
              /* ignore */
            }
            return meta;
          });
          return current;
        });
      } catch {
        // Network/transient — leave local state untouched.
      }
    };

    reconcile();

    const supabase = createClient();
    if (!supabase)
      return () => {
        cancelled = true;
      };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "INITIAL_SESSION") {
        reconcile();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const setRecipe = (newRecipe: ParsedRecipe | null) => {
    setRecipeState(newRecipe);
    try {
      if (newRecipe) {
        // If this recipe already has a saved-meta record in history, restore it
        // so navigating back to it shows the saved (filled heart) state.
        const newRecipeKey = recipeIdentityKey(newRecipe);
        const existing = history.find((h) => recipeIdentityKey(h.recipe) === newRecipeKey);
        const restoredMeta = existing?.savedMeta ?? null;
        setSavedMetaState(restoredMeta);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecipe));
        if (restoredMeta) {
          localStorage.setItem(META_STORAGE_KEY, JSON.stringify(restoredMeta));
        } else {
          localStorage.removeItem(META_STORAGE_KEY);
        }

        // Add to parse history, newest first.
        const entry: HistoryEntry = {
          recipe: newRecipe,
          parsedAt: new Date().toISOString(),
          savedMeta: restoredMeta,
        };
        const updated = [
          entry,
          ...history.filter((h) => recipeIdentityKey(h.recipe) !== newRecipeKey),
        ].slice(0, MAX_HISTORY);
        setHistory(updated);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } else {
        setSavedMetaState(null);
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
      const currentRecipeKey = recipeIdentityKey(recipe);
      const updated = history.filter((h) => recipeIdentityKey(h.recipe) !== currentRecipeKey);
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

  const setSavedMeta = (meta: SavedMeta | null) => {
    setSavedMetaState(meta);
    try {
      if (meta) {
        localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
      } else {
        localStorage.removeItem(META_STORAGE_KEY);
      }
      // Sync saved status into the matching history entry so the recipe
      // switcher dropdown can indicate which recent recipes are saved.
      if (recipe) {
        const currentRecipeKey = recipeIdentityKey(recipe);
        const updated = history.map((h) =>
          recipeIdentityKey(h.recipe) === currentRecipeKey ? { ...h, savedMeta: meta } : h
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

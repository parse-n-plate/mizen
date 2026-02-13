'use client';

import { useSyncExternalStore, useCallback } from 'react';

export type IngredientDisplayMode = 'modal' | 'inline' | 'drawer';

const STORAGE_KEY = 'ingredientDisplayMode';
const DEFAULT_MODE: IngredientDisplayMode = 'inline';

function isValidMode(value: unknown): value is IngredientDisplayMode {
  return value === 'modal' || value === 'inline' || value === 'drawer';
}

// ── Module-level shared store ──────────────────────────────────────────
let currentMode: IngredientDisplayMode = DEFAULT_MODE;
const listeners = new Set<() => void>();

// Hydrate from localStorage once on the client
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidMode(stored)) {
      currentMode = stored;
    }
  } catch {
    // localStorage unavailable
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot() {
  return currentMode;
}

function getServerSnapshot() {
  return DEFAULT_MODE;
}

// ── Hook ───────────────────────────────────────────────────────────────
export function useIngredientDisplayMode(): [IngredientDisplayMode, (mode: IngredientDisplayMode) => void] {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMode = useCallback((next: IngredientDisplayMode) => {
    currentMode = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable
    }
    listeners.forEach((l) => l());
  }, []);

  return [mode, setMode];
}

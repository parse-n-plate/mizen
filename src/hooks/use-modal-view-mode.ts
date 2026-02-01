'use client';

import { useSyncExternalStore, useCallback } from 'react';

export type ModalViewMode = 'side-peek' | 'floating';

const STORAGE_KEY = 'modalViewMode';
const DEFAULT_MODE: ModalViewMode = 'floating';

function isValidMode(value: unknown): value is ModalViewMode {
  return value === 'side-peek' || value === 'floating';
}

// ── Module-level shared store ──────────────────────────────────────────
let currentMode: ModalViewMode = DEFAULT_MODE;
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
export function useModalViewMode(): [ModalViewMode, (mode: ModalViewMode) => void] {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMode = useCallback((next: ModalViewMode) => {
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

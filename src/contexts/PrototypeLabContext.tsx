'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface PrototypeLabContextType {
  isOpen: boolean;
  openLab: () => void;
  closeLab: () => void;
  toggleLab: () => void;
}

const PrototypeLabContext = createContext<PrototypeLabContextType | undefined>(undefined);

export function PrototypeLabProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openLab = useCallback(() => setIsOpen(true), []);
  const closeLab = useCallback(() => setIsOpen(false), []);
  const toggleLab = useCallback(() => setIsOpen((prev) => !prev), []);

  // Global keyboard shortcut: Cmd/Ctrl + Shift + P
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        toggleLab();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLab]);

  return (
    <PrototypeLabContext.Provider value={{ isOpen, openLab, closeLab, toggleLab }}>
      {children}
    </PrototypeLabContext.Provider>
  );
}

export function usePrototypeLab() {
  const context = useContext(PrototypeLabContext);
  if (context === undefined) {
    throw new Error('usePrototypeLab must be used within a PrototypeLabProvider');
  }
  return context;
}

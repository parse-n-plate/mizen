'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import SearchCommandModal from '@/components/ui/SearchCommandModal';

interface CommandKContextType {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

const CommandKContext = createContext<CommandKContextType | undefined>(
  undefined,
);

export function CommandKProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => setIsOpen(false), []);
  const toggleSearch = useCallback(() => setIsOpen((prev) => !prev), []);

  // Global keyboard listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCommandK =
        (isMac && event.metaKey && event.key === 'k') ||
        (!isMac && event.ctrlKey && event.key === 'k');

      if (isCommandK) {
        event.preventDefault();
        event.stopPropagation();
        toggleSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSearch]);

  return (
    <CommandKContext.Provider
      value={{ isOpen, openSearch, closeSearch, toggleSearch }}
    >
      <SearchCommandModal open={isOpen} onOpenChange={setIsOpen} />
      {children}
    </CommandKContext.Provider>
  );
}

export function useCommandK() {
  const context = useContext(CommandKContext);
  if (context === undefined) {
    throw new Error('useCommandK must be used within a CommandKProvider');
  }
  return context;
}

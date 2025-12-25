'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';

interface CommandKContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const CommandKContext = createContext<CommandKContextType | undefined>(
  undefined,
);

export function CommandKProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Global keyboard listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for ⌘K on Mac or Ctrl+K on Windows/Linux
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCommandK =
        (isMac && event.metaKey && event.key === 'k') ||
        (!isMac && event.ctrlKey && event.key === 'k');

      if (isCommandK) {
        // Prevent default browser behavior (browser search)
        event.preventDefault();
        event.stopPropagation();

        // Toggle the modal
        toggle();
      }

      // Also handle ESC to close
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        close();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, toggle, close]);

  return (
    <CommandKContext.Provider
      value={{
        isOpen,
        open,
        close,
        toggle,
      }}
    >
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







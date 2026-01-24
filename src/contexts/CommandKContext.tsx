'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { usePathname } from 'next/navigation';

interface CommandKContextType {
  focusSearch: () => void;
}

const CommandKContext = createContext<CommandKContextType | undefined>(
  undefined,
);

/**
 * CommandKProvider
 * 
 * Handles Command+K (⌘K / Ctrl+K) keyboard shortcut to focus the relevant search box.
 * - On homepage (/): focuses the homepage search input
 * - On recipe page (/parsed-recipe-page): focuses the navbar search input
 */
export function CommandKProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  /**
   * Focus the appropriate search box based on current route
   */
  const focusSearch = useCallback(() => {
    // Determine which search box to focus based on current page
    const isRecipePage = pathname === '/parsed-recipe-page';
    
    if (isRecipePage) {
      // On recipe page, focus the navbar search input
      // Look for the navbar search input using data attribute
      const navbarSearchInput = document.querySelector(
        '[data-search-input="navbar"]'
      ) as HTMLInputElement;
      
      if (navbarSearchInput) {
        navbarSearchInput.focus();
        // Select all text if there's any, to make it easy to replace
        navbarSearchInput.select();
      }
    } else {
      // On homepage or other pages, focus the homepage search input
      const homepageSearchInput = document.querySelector(
        '[data-search-input="homepage"]'
      ) as HTMLInputElement;
      
      if (homepageSearchInput) {
        homepageSearchInput.focus();
      }
    }
  }, [pathname]);

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

        // Focus the appropriate search box
        focusSearch();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusSearch]);

  return (
    <CommandKContext.Provider
      value={{
        focusSearch,
      }}
    >
      {children}
    </CommandKContext.Provider>
  );
}

/**
 * useCommandK Hook
 * 
 * Provides access to Command K functionality.
 * Currently only provides focusSearch function to focus the relevant search box.
 */
export function useCommandK() {
  const context = useContext(CommandKContext);
  if (context === undefined) {
    throw new Error('useCommandK must be used within a CommandKProvider');
  }
  return context;
}










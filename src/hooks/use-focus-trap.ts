'use client';

import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
  isActive: boolean;
  onEscape?: () => void;
  /** Auto-focus the first focusable element when trap activates. Default: true */
  autoFocus?: boolean;
  /** Restore focus to the previously focused element on deactivate. Default: true */
  restoreFocus?: boolean;
}

/**
 * Traps keyboard focus within a container element.
 *
 * - Tab / Shift+Tab cycle through focusable children
 * - Escape calls onEscape
 * - Auto-focuses the first focusable element on activation
 * - Restores focus to the previously focused element on deactivation
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isActive,
  onEscape,
  autoFocus = true,
  restoreFocus = true,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter((el) => el.offsetParent !== null); // visible only
  }, []);

  // Capture previously focused element before activation
  useEffect(() => {
    if (isActive) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
    }
  }, [isActive]);

  // Auto-focus first element
  useEffect(() => {
    if (!isActive || !autoFocus) return;

    // Small delay to let the DOM render
    const id = requestAnimationFrame(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        // Focus the container itself as fallback
        containerRef.current?.focus();
      }
    });

    return () => cancelAnimationFrame(id);
  }, [isActive, autoFocus, getFocusableElements]);

  // Restore focus on deactivation
  useEffect(() => {
    if (isActive) return;

    return () => {
      if (restoreFocus && previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
        previouslyFocusedRef.current = null;
      }
    };
  }, [isActive, restoreFocus]);

  // Keyboard event handler
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        e.stopPropagation();
        onEscape();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if on first element, wrap to last
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, onEscape, getFocusableElements]);

  return containerRef;
}

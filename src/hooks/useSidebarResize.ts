'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export const RAIL_WIDTH = 64;

interface UseSidebarResizeOptions {
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
  storageKey: string;
  isCollapsed: boolean;
}

interface UseSidebarResizeReturn {
  width: number;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

export function useSidebarResize({
  minWidth,
  maxWidth,
  defaultWidth,
  storageKey,
  isCollapsed,
}: UseSidebarResizeOptions): UseSidebarResizeReturn {
  const [width, setWidth] = useState(defaultWidth);

  // Read persisted width after hydration to avoid SSR mismatch
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
        setWidth(parsed);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const widthRef = useRef(width);
  const rafRef = useRef<number | null>(null);

  // Sync ref with state
  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX));
        widthRef.current = newWidth;
        setWidth(newWidth);
      });
    },
    [minWidth, maxWidth],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    localStorage.setItem(storageKey, String(widthRef.current));

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [storageKey, handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isCollapsed) return;
      e.preventDefault();

      setIsDragging(true);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [isCollapsed, handleMouseMove, handleMouseUp],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove, handleMouseUp]);

  if (isCollapsed) {
    return { width: RAIL_WIDTH, isDragging: false, handleMouseDown: () => {} };
  }

  return { width, isDragging, handleMouseDown };
}

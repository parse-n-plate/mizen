'use client';

import { useEffect } from 'react';

/**
 * ImageProtection Component
 * 
 * This component adds global protection for images by:
 * 1. Blocking default drag behaviors on images
 * 2. Preventing right-click context menu on images (pngs, jpgs, svgs)
 * 
 * Uses React effects to attach event listeners that prevent:
 * - Dragging images
 * - Right-clicking on images to access context menu
 * 
 * This works in conjunction with CSS rules in globals.css that disable
 * user-drag properties and the draggable="false" attribute on image elements.
 */
export default function ImageProtection() {
  useEffect(() => {
    /**
     * Check if an element is an image with a protected file extension
     * Only protects png, jpg, jpeg, and svg images
     */
    const isProtectedImage = (element: HTMLElement | null): boolean => {
      if (!element) return false;
      
      // Check if it's an img element
      if (element.tagName === 'IMG') {
        const img = element as HTMLImageElement;
        const src = img.src || img.getAttribute('src') || '';
        
        // Check for image file extensions (case-insensitive)
        const protectedExtensions = ['.png', '.jpg', '.jpeg', '.svg'];
        return protectedExtensions.some(ext => 
          src.toLowerCase().endsWith(ext.toLowerCase())
        );
      }
      
      // Also check for Next.js Image component wrapper
      // Next.js Image components render as img tags, so they'll be caught above
      return false;
    };

    /**
     * Prevent default drag behavior on images
     * This blocks the browser's default drag-and-drop functionality
     */
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (isProtectedImage(target)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    /**
     * Prevent right-click context menu on images
     * Only blocks context menu for png, jpg, jpeg, and svg images
     */
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isProtectedImage(target)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    /**
     * Prevent drag events on images
     * Catches drag events at different phases
     */
    const handleDrag = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (isProtectedImage(target)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Attach event listeners to document
    // Using capture phase to catch events early
    document.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('drag', handleDrag, true);
    document.addEventListener('contextmenu', handleContextMenu, true);

    // Cleanup: Remove event listeners when component unmounts
    return () => {
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('drag', handleDrag, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, []); // Empty dependency array - only run once on mount

  // This component doesn't render anything
  return null;
}

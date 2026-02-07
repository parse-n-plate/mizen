'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';

export type SidebarMode = 'expanded' | 'collapsed' | 'hover';

type SidebarContextType = {
  isMobileNavVisible: boolean;
  showMobileNav: () => void;
  hideMobileNav: () => void;
  sidebarMode: SidebarMode;
  setSidebarMode: (mode: SidebarMode) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isHoverExpanded: boolean;
  setIsHoverExpanded: (expanded: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const [sidebarMode, setSidebarModeState] = useState<SidebarMode>('expanded');
  const [manualCollapsed, setManualCollapsed] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);

  const isMobile = useIsMobile();
  const pathname = usePathname();
  const initializedRef = useRef(false);
  const prevPathnameRef = useRef(pathname);

  // Hydration-safe: read persisted mode from localStorage after mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-mode');
    if (stored === 'expanded' || stored === 'collapsed' || stored === 'hover') {
      setSidebarModeState(stored);
    }
  }, []);

  const setSidebarMode = useCallback((mode: SidebarMode) => {
    setSidebarModeState(mode);
    localStorage.setItem('sidebar-mode', mode);
    // Reset transient states when switching modes
    setManualCollapsed(false);
    setIsHoverExpanded(false);
  }, []);

  // Derived isCollapsed based on mode
  const isCollapsed = useMemo(() => {
    if (sidebarMode === 'collapsed') return true;
    if (sidebarMode === 'hover') return !isHoverExpanded;
    return manualCollapsed; // 'expanded' mode
  }, [sidebarMode, isHoverExpanded, manualCollapsed]);

  const setIsCollapsed = useCallback((collapsed: boolean) => {
    if (sidebarMode === 'expanded') {
      setManualCollapsed(collapsed);
    }
  }, [sidebarMode]);

  const showMobileNav = useCallback(() => setIsMobileNavVisible(true), []);
  const hideMobileNav = useCallback(() => setIsMobileNavVisible(false), []);

  // Handle deep links: on initial mount only, if mobile and on a non-home route,
  // hide the sidebar so the page content shows.
  useEffect(() => {
    if (!isMobile || initializedRef.current) return;
    initializedRef.current = true;
    prevPathnameRef.current = pathname;

    if (pathname !== '/') {
      setIsMobileNavVisible(false);
    }
  }, [isMobile, pathname]);

  // Auto-hide sidebar when the route changes on mobile.
  // This ensures the sidebar hides only AFTER the new page has rendered,
  // preventing a flash of the previous page content.
  useEffect(() => {
    if (!isMobile || !initializedRef.current) return;

    if (pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = pathname;
      setIsMobileNavVisible(false);
    }
  }, [isMobile, pathname]);

  const value = useMemo(
    () => ({
      isMobileNavVisible,
      showMobileNav,
      hideMobileNav,
      sidebarMode,
      setSidebarMode,
      isCollapsed,
      setIsCollapsed,
      isHoverExpanded,
      setIsHoverExpanded,
    }),
    [isMobileNavVisible, showMobileNav, hideMobileNav, sidebarMode, setSidebarMode, isCollapsed, setIsCollapsed, isHoverExpanded],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

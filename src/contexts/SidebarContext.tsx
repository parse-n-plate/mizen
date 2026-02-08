'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';

type SidebarContextType = {
  isMobileNavVisible: boolean;
  showMobileNav: () => void;
  hideMobileNav: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isMobile = useIsMobile();
  const pathname = usePathname();
  const initializedRef = useRef(false);
  const prevPathnameRef = useRef(pathname);

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
      isCollapsed,
      setIsCollapsed,
    }),
    [isMobileNavVisible, showMobileNav, hideMobileNav, isCollapsed],
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

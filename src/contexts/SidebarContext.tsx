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
  const prevPathnameRef = useRef(pathname);

  const showMobileNav = useCallback(() => setIsMobileNavVisible(true), []);
  const hideMobileNav = useCallback(() => setIsMobileNavVisible(false), []);

  // Auto-hide sidebar on mobile when the route changes.
  // Uses ref comparison to detect actual route changes and avoids
  // calling setState synchronously in the effect body.
  useEffect(() => {
    if (!isMobile) return;
    const prevPathname = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    if (pathname !== prevPathname && pathname !== '/') {
      // Use microtask to avoid synchronous setState in effect
      queueMicrotask(() => setIsMobileNavVisible(false));
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

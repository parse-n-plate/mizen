'use client';

import React from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Menu, X } from 'lucide-react';

interface MobileMenuToggleProps {
  controlsId: string;
}

export default function MobileMenuToggle({ controlsId }: MobileMenuToggleProps) {
  const isMobile = useIsMobile();
  const { isMobileNavVisible, showMobileNav, hideMobileNav } = useSidebar();

  if (!isMobile) return null;

  return (
    <button
      onClick={isMobileNavVisible ? hideMobileNav : showMobileNav}
      className="absolute top-4 left-4 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm border border-stone-200 dark:border-stone-700 shadow-sm"
      aria-label={isMobileNavVisible ? 'Close navigation menu' : 'Open navigation menu'}
      aria-controls={controlsId}
      aria-expanded={isMobileNavVisible}
    >
      {isMobileNavVisible ? (
        <X className="w-5 h-5 text-stone-600 dark:text-stone-300" />
      ) : (
        <Menu className="w-5 h-5 text-stone-600 dark:text-stone-300" />
      )}
    </button>
  );
}

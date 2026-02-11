'use client';

import React from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Menu } from 'lucide-react';

export default function MobileMenuToggle() {
  const isMobile = useIsMobile();
  const { isMobileNavVisible, showMobileNav } = useSidebar();

  if (!isMobile || isMobileNavVisible) return null;

  return (
    <button
      onClick={showMobileNav}
      className="absolute top-4 left-4 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-stone-200 shadow-sm"
      aria-label="Open navigation menu"
      aria-expanded={false}
    >
      <Menu className="w-5 h-5 text-stone-600" />
    </button>
  );
}

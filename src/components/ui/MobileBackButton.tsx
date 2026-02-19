'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useUISettings } from '@/contexts/UISettingsContext';
import { ArrowLeft } from 'lucide-react';

export default function MobileBackButton() {
  const isMobile = useIsMobile();
  const { showMobileNav } = useSidebar();
  const { settings } = useUISettings();

  if (!isMobile || settings.sidebarMinimal) return null;

  return (
    <button
      onClick={showMobileNav}
      className="flex items-center gap-1.5 px-4 pt-4 pb-2 text-stone-500 hover:text-stone-700 transition-colors"
      aria-label="Back to menu"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="font-albert text-sm font-medium">Menu</span>
    </button>
  );
}

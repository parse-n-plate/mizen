'use client';

import React from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useUISettings } from '@/contexts/UISettingsContext';
import Sidebar from '@/components/ui/Sidebar';
import MobileFloatingBar from '@/components/ui/Sidebar/MobileFloatingBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { isMobileNavVisible } = useSidebar();
  const { settings } = useUISettings();

  // Desktop layout — minimal mode: floating dock overlay
  if (!isMobile && settings.sidebarMinimal) {
    return (
      <div className="relative h-screen overflow-hidden">
        <div className="fixed left-0 top-0 h-full z-30 flex items-center pl-2.5 pointer-events-none">
          <div className="pointer-events-auto">
            <Sidebar />
          </div>
        </div>
        <main className="h-screen overflow-y-auto">{children}</main>
      </div>
    );
  }

  // Desktop layout — default: flex sidebar + content
  if (!isMobile) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    );
  }

  // Mobile layout — minimal mode: floating bottom bar
  if (isMobile && settings.sidebarMinimal) {
    return (
      <div className="relative h-screen overflow-hidden">
        <main className="h-full overflow-y-auto pb-[88px]">{children}</main>
        <MobileFloatingBar />
      </div>
    );
  }

  // Mobile: both panels always rendered, slide via translateX
  return (
    <div className="relative h-screen overflow-hidden">
      <div
        className={`absolute inset-0 mobile-slide-panel ${
          !isMobileNavVisible ? 'pointer-events-none z-10' : 'z-20'
        }`}
        style={{ translate: isMobileNavVisible ? '0 0' : '-100% 0' }}
      >
        <Sidebar />
      </div>
      <div
        className={`absolute inset-0 mobile-slide-panel ${
          isMobileNavVisible ? 'pointer-events-none z-10' : 'z-20'
        }`}
        style={{ translate: isMobileNavVisible ? '100% 0' : '0 0' }}
      >
        <main className="h-full overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

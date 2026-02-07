'use client';

import React from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import Sidebar from '@/components/ui/Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { isMobileNavVisible } = useSidebar();

  // Desktop: original flex layout, unchanged
  if (!isMobile) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="contents">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    );
  }

  // Mobile: both panels always rendered, slide via translateX
  return (
    <div className="relative h-screen overflow-hidden">
      <div
        className={`absolute inset-0 mobile-slide-panel ${!isMobileNavVisible ? 'pointer-events-none' : ''}`}
        style={{ translate: isMobileNavVisible ? '0 0' : '-100% 0' }}
      >
        <Sidebar />
      </div>
      <div
        className={`absolute inset-0 mobile-slide-panel ${isMobileNavVisible ? 'pointer-events-none' : ''}`}
        style={{ translate: isMobileNavVisible ? '100% 0' : '0 0' }}
      >
        <main className="h-full overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

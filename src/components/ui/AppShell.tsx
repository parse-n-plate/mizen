'use client';

import React from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Sidebar from '@/components/ui/Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { isMobileNavVisible } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar: on mobile, hidden when viewing a page */}
      <div className={isMobile && !isMobileNavVisible ? 'hidden' : 'contents'}>
        <Sidebar />
      </div>

      {/* Main content: on mobile, hidden when sidebar is showing */}
      <div
        className={`flex-1 flex flex-col min-h-0 ${
          isMobile && isMobileNavVisible ? 'hidden' : ''
        }`}
      >
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

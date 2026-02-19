'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCommandK } from '@/contexts/CommandKContext';
import { useUISettings } from '@/contexts/UISettingsContext';
import { cn } from '@/lib/utils';
import HomeIcon from '@solar-icons/react/csr/ui/Home';
import Magnifer from '@solar-icons/react/csr/search/Magnifer';
import SettingsIcon from '@solar-icons/react/csr/settings/Settings';
import SidebarMinimalistic from '@solar-icons/react/csr/it/SidebarMinimalistic';
import ChatRoundLine from '@solar-icons/react/csr/messages/ChatRoundLine';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import FeedbackDialog from './FeedbackDialog';

export default function MobileFloatingBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { openSearch } = useCommandK();
  const { settings, setSidebarMinimal } = useUISettings();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const isHome = pathname === '/';

  const toggleSidebarMinimal = useCallback(() => {
    setSidebarMinimal(!settings.sidebarMinimal);
  }, [setSidebarMinimal, settings.sidebarMinimal]);

  const handleSidebarToggleRowKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleSidebarMinimal();
      }
    },
    [toggleSidebarMinimal],
  );

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pb-[calc(env(safe-area-inset-bottom,8px)+16px)] px-4 pt-2 pointer-events-none"
      >
        <div
          className="pointer-events-auto flex items-center gap-1 px-3 py-2 bg-white border border-stone-200/60 rounded-full shadow-md shadow-black/[0.04]"
        >
          {/* Home */}
          <button
            onClick={() => router.push('/')}
            className={cn(
              'w-11 h-11 flex items-center justify-center rounded-xl transition-colors',
              isHome
                ? 'bg-stone-100 text-stone-900'
                : 'text-stone-400 active:bg-stone-100 active:text-stone-600',
            )}
            aria-label="Home"
          >
            <HomeIcon className="w-[22px] h-[22px]" />
          </button>

          {/* Divider */}
          <div className="h-7 border-l border-stone-200/80 mx-0.5" />

          {/* Search */}
          <button
            onClick={openSearch}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-stone-400 active:bg-stone-100 active:text-stone-600 transition-colors"
            aria-label="Search"
          >
            <Magnifer className="w-[22px] h-[22px]" />
          </button>

          {/* Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-11 h-11 flex items-center justify-center rounded-xl text-stone-400 active:bg-stone-100 active:text-stone-600 transition-colors"
                aria-label="Settings"
              >
                <SettingsIcon className="w-[22px] h-[22px]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end">
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              <div
                className="flex items-center justify-between gap-6 px-2 py-1.5 rounded-sm hover:bg-stone-50 cursor-pointer"
                role="switch"
                aria-checked={settings.sidebarMinimal}
                tabIndex={0}
                onClick={toggleSidebarMinimal}
                onKeyDown={handleSidebarToggleRowKeyDown}
              >
                <div className="flex items-center gap-2">
                  <SidebarMinimalistic className="w-4 h-4 text-stone-400" />
                  <span className="font-albert text-sm text-stone-700">
                    Minimal sidebar
                  </span>
                </div>
                <Switch
                  checked={settings.sidebarMinimal}
                  onCheckedChange={setSidebarMinimal}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  aria-label="Toggle minimal sidebar"
                />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFeedbackOpen(true)}>
                <ChatRoundLine className="w-4 h-4 text-stone-400" />
                Leave Feedback
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}

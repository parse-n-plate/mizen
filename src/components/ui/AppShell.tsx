'use client';

import React, { useCallback, useEffect } from 'react';
import { motion, useDragControls, useReducedMotion, type PanInfo } from 'framer-motion';
import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import Sidebar from '@/components/ui/Sidebar';
import MobileMenuToggle from '@/components/ui/MobileMenuToggle';

const NAV_ID = 'mobile-sidebar-nav';
const NAV_WIDTH = '85vw';
const EDGE_SWIPE_WIDTH_PX = 24;
const SWIPE_THRESHOLD_PX = 100;
const SWIPE_VELOCITY = 500;
const EASE_OUT_CUBIC: [number, number, number, number] = [0.215, 0.61, 0.355, 1];

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      'a,button,input,select,textarea,label,summary,[role="button"],[role="link"],[contenteditable="true"]',
    ),
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { isMobileNavVisible, showMobileNav, hideMobileNav } = useSidebar();
  const reduceMotion = useReducedMotion() ?? false;
  const dragControls = useDragControls();

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isMobileNavVisible) {
        // Nav is open — swipe left to close
        if (info.offset.x < -SWIPE_THRESHOLD_PX || info.velocity.x < -SWIPE_VELOCITY) {
          hideMobileNav();
        }
      } else {
        // Nav is closed — swipe right to open
        if (info.offset.x > SWIPE_THRESHOLD_PX || info.velocity.x > SWIPE_VELOCITY) {
          showMobileNav();
        }
      }
    },
    [isMobileNavVisible, showMobileNav, hideMobileNav],
  );

  useEffect(() => {
    if (!isMobile || !isMobileNavVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideMobileNav();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isMobileNavVisible, hideMobileNav]);

  // Desktop layout — unchanged
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

  // Mobile: reveal pattern — nav underneath, content slides right
  return (
    <div className="relative h-screen overflow-hidden">
      {/* Nav layer: always rendered behind content */}
      <aside
        id={NAV_ID}
        aria-label="Primary navigation"
        className="absolute inset-y-0 left-0 z-0"
        style={{ width: NAV_WIDTH }}
      >
        <Sidebar />
      </aside>

      {/* Content layer: slides right to reveal nav */}
      <motion.div
        className="absolute inset-0 z-10 bg-white"
        animate={{ x: isMobileNavVisible ? NAV_WIDTH : '0' }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.35, ease: EASE_OUT_CUBIC }
        }
        drag="x"
        dragListener={isMobileNavVisible}
        dragControls={dragControls}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.15 }}
        onDragEnd={handleDragEnd}
        onPointerDownCapture={(event) => {
          if (isMobileNavVisible) return;
          if (event.clientX > EDGE_SWIPE_WIDTH_PX) return;
          if (isInteractiveTarget(event.target)) return;
          dragControls.start(event);
        }}
        style={{
          boxShadow: isMobileNavVisible
            ? '-4px 0 24px rgba(0, 0, 0, 0.12)'
            : 'none',
        }}
      >
        <MobileMenuToggle controlsId={NAV_ID} />
        <main className="h-full overflow-y-auto">
          {children}
        </main>

        {/* Tap overlay to dismiss when nav is open */}
        {isMobileNavVisible && (
          <div
            className="absolute inset-0 z-20"
            onClick={hideMobileNav}
            aria-hidden="true"
          />
        )}
      </motion.div>
    </div>
  );
}

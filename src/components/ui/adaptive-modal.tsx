'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModalViewMode } from '@/hooks/use-modal-view-mode';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { ModalViewSwitcher } from './modal-view-switcher';

interface AdaptiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AdaptiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: AdaptiveModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mode, setMode] = useModalViewMode();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Focus trap for desktop modal
  const focusTrapRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen && !isMobile,
    onEscape: onClose,
  });

  // Prevent body scroll on desktop when open
  useEffect(() => {
    if (isOpen && !isMobile) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen, isMobile]);

  // ── Mobile: Vaul drawer ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <Drawer.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-stone-900/40 z-[200]" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 max-h-[90vh] bg-white rounded-t-[32px] shadow-2xl z-[201] outline-none flex flex-col overscroll-contain">
            <Drawer.Handle className="mt-3 mb-2 !w-12 !h-1.5 !bg-stone-200" />

            <div className="px-8 pb-6 flex items-start justify-between flex-shrink-0">
              <div className="pt-2">
                <Drawer.Title className="font-domine font-bold text-2xl text-stone-900 capitalize text-balance">
                  {title}
                </Drawer.Title>
                {subtitle && (
                  <Drawer.Description className="text-stone-400 font-albert font-medium mt-0.5 text-pretty">
                    {subtitle}
                  </Drawer.Description>
                )}
              </div>
              <Drawer.Close
                className="mt-2 p-2.5 bg-stone-50 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-[background-color,color,transform] active:scale-90 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none"
                aria-label="Close"
              >
                <X className="size-5" />
              </Drawer.Close>
            </div>

            <div
              className="flex-1 min-h-0 overflow-y-auto px-8 pb-8 overscroll-contain"
              data-vaul-no-drag
            >
              {children}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // ── Desktop: Floating or Side Peek ───────────────────────────────────
  const noMotion = shouldReduceMotion ?? false;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="adaptive-modal-backdrop"
            initial={noMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={noMotion ? undefined : { opacity: 0 }}
            transition={{ duration: noMotion ? 0 : 0.15, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/40"
          />

          {/* Panel */}
          {mode === 'side-peek' ? (
            <motion.div
              ref={focusTrapRef}
              key="adaptive-modal-side-peek"
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={noMotion ? false : { x: '100%' }}
              animate={{ x: 0 }}
              exit={noMotion ? undefined : { x: '100%' }}
              transition={{ duration: noMotion ? 0 : 0.2, ease: 'easeOut' }}
              className={cn(
                'fixed top-0 right-0 h-dvh w-full max-w-md',
                'bg-white shadow-2xl z-[201]',
                'flex flex-col overflow-hidden',
              )}
            >
              <DesktopHeader
                title={title}
                subtitle={subtitle}
                mode={mode}
                onModeChange={setMode}
                onClose={onClose}
              />
              <div className="flex-1 min-h-0 overflow-y-auto p-6 overscroll-contain">
                {children}
              </div>
            </motion.div>
          ) : (
            <motion.div
              ref={focusTrapRef}
              key="adaptive-modal-floating"
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={noMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={noMotion ? undefined : { opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: noMotion ? 0 : 0.2, ease: 'easeOut' }}
              className={cn(
                'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                'w-full max-w-md max-h-[85vh]',
                'bg-white rounded-2xl shadow-2xl z-[201]',
                'flex flex-col overflow-hidden',
              )}
            >
              <DesktopHeader
                title={title}
                subtitle={subtitle}
                mode={mode}
                onModeChange={setMode}
                onClose={onClose}
              />
              <div className="flex-1 min-h-0 overflow-y-auto p-6 overscroll-contain">
                {children}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

// ── Shared desktop header ────────────────────────────────────────────────

interface DesktopHeaderProps {
  title: string;
  subtitle?: string;
  mode: 'side-peek' | 'floating';
  onModeChange: (mode: 'side-peek' | 'floating') => void;
  onClose: () => void;
}

function DesktopHeader({
  title,
  subtitle,
  mode,
  onModeChange,
  onClose,
}: DesktopHeaderProps) {
  return (
    <div className="p-6 border-b border-stone-100 flex items-start justify-between flex-shrink-0">
      <div className="min-w-0 flex-1">
        <h2 className="font-domine font-bold text-xl text-stone-900 capitalize text-balance">
          {title}
        </h2>
        {subtitle && (
          <p className="text-stone-400 font-albert font-medium mt-0.5 text-pretty">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <ModalViewSwitcher mode={mode} onModeChange={onModeChange} />
        <button
          onClick={onClose}
          className="p-2 hover:bg-stone-50 rounded-full text-stone-400 hover:text-stone-900 transition-colors focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  );
}

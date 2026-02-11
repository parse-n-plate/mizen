'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModalViewMode } from '@/hooks/use-modal-view-mode';
import { ModalViewSwitcher } from './modal-view-switcher';

interface AdaptiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
}

export function AdaptiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  description,
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

  // Escape key to close (no focus trap — page remains interactive)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // ── Mobile: Vaul drawer ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <Drawer.Root
        modal={false}
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Drawer.Portal>
          <Drawer.Content className="fixed inset-x-0 bottom-0 max-h-[90vh] bg-white rounded-t-[32px] shadow-2xl z-[201] flex flex-col overscroll-contain focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none">
            <Drawer.Handle className="mt-3 mb-2 !w-12 !h-1 !bg-stone-200" />

            <div className="px-8 pb-6 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="pt-2">
                  <Drawer.Title className="font-domine font-bold text-2xl text-stone-900 capitalize text-balance">
                    {title}
                  </Drawer.Title>
                  {subtitle && (
                    <Drawer.Description className="text-[15px] md:text-[16px] text-stone-400 font-albert font-medium mt-1 text-pretty">
                      {subtitle}
                    </Drawer.Description>
                  )}
                </div>
                <Drawer.Close
                  className="mt-2 p-3 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 hover:text-stone-900 transition-[background-color,color,transform] active:scale-90 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none"
                  aria-label="Close"
                >
                  <X className="size-5" aria-hidden="true" />
                </Drawer.Close>
              </div>
              {description && (
                <p className="text-stone-500 text-[15px] leading-relaxed font-albert mt-3">
                  {description}
                </p>
              )}
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
          {/* Panel */}
          {mode === 'side-peek' ? (
            <motion.div
              key="adaptive-modal-side-peek"
              role="dialog"
              aria-modal="false"
              aria-label={title}
              initial={noMotion ? false : { x: '100%' }}
              animate={{ x: 0 }}
              exit={noMotion ? undefined : { x: '100%' }}
              transition={{ duration: noMotion ? 0 : 0.2, ease: 'easeOut' }}
              className={cn(
                'fixed top-0 right-0 h-dvh w-full max-w-md',
                'bg-white shadow-[0_0_40px_rgba(0,0,0,0.08)] border-l border-stone-100 z-[201]',
                'flex flex-col overflow-hidden',
              )}
            >
              <DesktopHeader
                title={title}
                subtitle={subtitle}
                description={description}
                mode={mode}
                onModeChange={setMode}
                onClose={onClose}
              />
              <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-2 pb-8 overscroll-contain">
                <div className="w-full max-w-full">
                  {children}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="adaptive-modal-floating"
              role="dialog"
              aria-modal="false"
              aria-label={title}
              initial={noMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={noMotion ? undefined : { opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: noMotion ? 0 : 0.2, ease: 'easeOut' }}
              className={cn(
                'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                'w-full max-w-md max-h-[85vh]',
                'bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-stone-100 z-[201]',
                'flex flex-col overflow-hidden',
              )}
            >
              <DesktopHeader
                title={title}
                subtitle={subtitle}
                description={description}
                mode={mode}
                onModeChange={setMode}
                onClose={onClose}
              />
              <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-2 pb-8 overscroll-contain">
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
  description?: string;
  mode: 'side-peek' | 'floating';
  onModeChange: (mode: 'side-peek' | 'floating') => void;
  onClose: () => void;
}

function DesktopHeader({
  title,
  subtitle,
  description,
  mode,
  onModeChange,
  onClose,
}: DesktopHeaderProps) {
  return (
    <div className="px-6 pt-5 pb-6 border-b border-stone-100/80 flex-shrink-0">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="font-domine font-bold text-2xl text-stone-900 capitalize text-balance">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[15px] md:text-[16px] text-stone-400 font-albert font-medium mt-1 text-pretty">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <ModalViewSwitcher mode={mode} onModeChange={onModeChange} />
          <button
            onClick={onClose}
            className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 hover:text-stone-900 transition-[background-color,color] focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      {description && (
        <p className="text-stone-500 text-[15px] leading-relaxed font-albert mt-3">
          {description}
        </p>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { convertTextFractionsToSymbols } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/use-focus-trap';

/**
 * IngredientsOverlay Component
 *
 * Displays ingredients in a modal (desktop) or drawer (mobile).
 * Shows a simplified list of all ingredients organized by group.
 *
 * @param isOpen - Controls visibility
 * @param onClose - Close callback
 * @param ingredients - Array of ingredient groups with ingredients
 */

interface IngredientGroup {
  groupName: string;
  ingredients: Array<
    | string
    | {
        amount?: string;
        units?: string;
        ingredient: string;
      }
  >;
}

interface IngredientsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: IngredientGroup[];
}

export default function IngredientsOverlay({
  isOpen,
  onClose,
  ingredients,
}: IngredientsOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Focus trap for desktop modal
  const focusTrapRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen && !isMobile,
    onEscape: onClose,
  });

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll on desktop when open
  // Note: scrollbar-gutter: stable in globals.css prevents layout shift
  useEffect(() => {
    if (isOpen && !isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isMobile]);


  // Format ingredient for display
  const formatIngredient = (
    ingredient: string | { amount?: string; units?: string; ingredient: string }
  ): string => {
    if (typeof ingredient === 'string') {
      return convertTextFractionsToSymbols(ingredient);
    }

    const parts: string[] = [];
    if (ingredient.amount) {
      parts.push(convertTextFractionsToSymbols(ingredient.amount));
    }
    if (ingredient.units) {
      parts.push(ingredient.units);
    }
    if (ingredient.ingredient) {
      parts.push(convertTextFractionsToSymbols(ingredient.ingredient));
    }
    return parts.join(' ');
  };

  // Render simplified ingredient content
  const renderContent = () => (
    <div className="space-y-6">
      {ingredients.map((group, groupIdx) => (
        <div key={groupIdx}>
          {/* Group Header - only show if not "Main" */}
          {group.groupName && group.groupName !== 'Main' && (
            <h3 className="font-domine font-semibold text-lg text-stone-900 mb-3">
              {group.groupName}
            </h3>
          )}

          {/* Ingredient List */}
          <ul className="space-y-2">
            {group.ingredients.map((ingredient, idx) => (
              <li
                key={idx}
                className="font-albert text-base text-stone-700 flex items-start gap-2"
              >
                <span className="text-stone-400 mt-1 flex-shrink-0">•</span>
                <span>{formatIngredient(ingredient)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  // Mobile: Vaul drawer
  if (isMobile) {
    return (
      <Drawer.Root
        modal={false}
        open={isOpen}
        onOpenChange={(open) => { if (!open) onClose(); }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[200]" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-[32px] shadow-2xl z-[201] outline-none flex flex-col">
            <Drawer.Handle className="mt-3 mb-2 !w-12 !h-1 !bg-stone-200" />

            {/* Header */}
            <div className="px-8 pb-6 flex items-start justify-between flex-shrink-0">
              <div className="pt-2">
                <Drawer.Title className="font-domine font-bold text-2xl text-stone-900">
                  Ingredients
                </Drawer.Title>
              </div>
              <Drawer.Close className="mt-2 p-3 bg-stone-50 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-[background-color,color,transform] active:scale-90 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none"
                aria-label="Close ingredients"
              >
                <X className="h-5 w-5" />
              </Drawer.Close>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-8 overscroll-contain" data-vaul-no-drag>
              {renderContent()}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop: Framer Motion modal
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[200]"
          />

          {/* Desktop Modal */}
          <motion.div
            ref={focusTrapRef}
            role="dialog"
            aria-modal="true"
            aria-label="Ingredients"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-[201] overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
              <h2 className="font-domine font-bold text-xl text-stone-900">
                Ingredients
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-stone-50 rounded-full text-stone-400 hover:text-stone-900 transition-colors focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none"
                aria-label="Close ingredients"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 overscroll-contain">
              {renderContent()}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { convertTextFractionsToSymbols } from '@/lib/utils';

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

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll and layout shift when overlay is open
  // This prevents the page from shifting when the scrollbar appears/disappears
  useEffect(() => {
    if (isOpen) {
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Store original values to restore later
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Lock body scroll and add padding equal to scrollbar width
      // This prevents the page from shifting when scrollbar disappears
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      // Cleanup: restore original styles when overlay closes
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

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
                <span className="text-stone-400 mt-1.5 flex-shrink-0">•</span>
                <span>{formatIngredient(ingredient)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 z-[200] ${
              isMobile
                ? 'bg-stone-900/40 backdrop-blur-sm'
                : 'bg-black/40 backdrop-blur-[2px]'
            }`}
          />

          {/* Desktop Modal */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-[201] overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
                <h2 className="font-domine font-bold text-xl text-stone-900">
                  Ingredients
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-stone-50 rounded-full text-stone-400 hover:text-stone-900 transition-colors"
                  aria-label="Close ingredients"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                {renderContent()}
              </div>
            </motion.div>
          )}

          {/* Mobile Drawer */}
          {isMobile && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-[32px] shadow-2xl z-[201] overflow-hidden flex flex-col"
            >
              {/* Handle/Indicator */}
              <div className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-stone-200 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-8 pb-6 flex items-start justify-between flex-shrink-0">
                <div className="pt-2">
                  <h2 className="font-domine font-bold text-2xl text-stone-900">
                    Ingredients
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="mt-2 p-2.5 bg-stone-50 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-all active:scale-90"
                  aria-label="Close ingredients"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-8">
                {renderContent()}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

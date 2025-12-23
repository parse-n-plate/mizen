'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GripHorizontal } from 'lucide-react';
import { IngredientDrawerContent } from './ingredient-drawer-content';

interface IngredientExpandedDrawerProps {
  ingredientName: string;
  ingredientAmount?: string;
  linkedSteps: number[];
  onStepClick: (stepNumber: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function IngredientExpandedDrawer({
  ingredientName,
  ingredientAmount,
  linkedSteps,
  onStepClick,
  isOpen,
  onClose
}: IngredientExpandedDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[200]"
          />
          
          {/* Bottom Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 max-h-[90vh] bg-white rounded-t-[32px] shadow-2xl z-[201] overflow-hidden flex flex-col"
          >
            {/* Handle/Indicator */}
            <div className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-stone-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-8 pb-6 flex items-start justify-between">
              <div className="pt-2">
                <h3 className="font-domine font-bold text-2xl text-stone-900">{ingredientName}</h3>
                {ingredientAmount && (
                  <p className="text-stone-400 font-albert font-medium mt-0.5">{ingredientAmount}</p>
                )}
              </div>
              <button 
                onClick={onClose}
                className="mt-2 p-2.5 bg-stone-50 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-all active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8">
              <IngredientDrawerContent
                ingredientName={ingredientName}
                ingredientAmount={ingredientAmount}
                linkedSteps={linkedSteps}
                onStepClick={onStepClick}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}










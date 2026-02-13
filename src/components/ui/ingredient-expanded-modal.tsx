'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { IngredientExpandedContent } from './ingredient-expanded-content';

interface IngredientExpandedModalProps {
  ingredientName: string;
  ingredientAmount?: string;
  ingredientUnits?: string;
  groupName?: string;
  description?: string;
  linkedSteps: number[];
  stepTitlesMap?: Record<number, string>; // Map of step numbers to step titles
  onStepClick: (stepNumber: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function IngredientExpandedModal({
  ingredientName,
  ingredientAmount,
  ingredientUnits,
  groupName,
  description,
  linkedSteps,
  stepTitlesMap,
  onStepClick,
  isOpen,
  onClose,
}: IngredientExpandedModalProps) {
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
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[200]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-[201] overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-domine font-bold text-xl text-stone-900">{ingredientName}</h3>
                <p className="text-sm font-albert text-stone-400">{ingredientAmount}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-stone-50 rounded-full text-stone-400 hover:text-stone-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <IngredientExpandedContent
                ingredientName={ingredientName}
                ingredientAmount={ingredientAmount}
                ingredientUnits={ingredientUnits}
                groupName={groupName}
                description={description}
                linkedSteps={linkedSteps}
                stepTitlesMap={stepTitlesMap}
                onStepClick={onStepClick}
                variant="modal"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

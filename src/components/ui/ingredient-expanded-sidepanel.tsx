'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { IngredientExpandedContent } from './ingredient-expanded-content';

interface IngredientExpandedSidePanelProps {
  ingredientName: string;
  ingredientAmount?: string;
  ingredientUnits?: string;
  groupName?: string;
  description?: string;
  linkedSteps: number[];
  onStepClick: (stepNumber: number) => void;
  isOpen: boolean;
  onClose: () => void;
  recipeUrl?: string;
  onNotesChange?: (notes: string) => void;
}

export function IngredientExpandedSidePanel({
  ingredientName,
  ingredientAmount,
  ingredientUnits,
  groupName,
  description,
  linkedSteps,
  onStepClick,
  isOpen,
  onClose,
  recipeUrl,
  onNotesChange
}: IngredientExpandedSidePanelProps) {
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
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[200]"
          />
          
          {/* Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-[201] overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-stone-100 flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-albert font-bold uppercase tracking-[0.2em] text-[#FFBA25]">Ingredient Details</span>
                <h3 className="font-domine font-bold text-3xl text-stone-900 leading-tight">{ingredientName}</h3>
                <p className="text-lg text-stone-400 font-albert">{ingredientAmount}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-stone-50 rounded-full text-stone-300 hover:text-stone-900 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <IngredientExpandedContent
                ingredientName={ingredientName}
                ingredientAmount={ingredientAmount}
                ingredientUnits={ingredientUnits}
                groupName={groupName}
                description={description}
                linkedSteps={linkedSteps}
                onStepClick={onStepClick}
                variant="sidepanel"
                recipeUrl={recipeUrl}
                onNotesChange={onNotesChange}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


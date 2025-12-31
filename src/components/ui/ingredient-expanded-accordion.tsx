'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { IngredientExpandedContent } from './ingredient-expanded-content';

interface IngredientExpandedAccordionProps {
  ingredientName: string;
  ingredientAmount?: string;
  ingredientUnits?: string;
  groupName?: string;
  description?: string;
  linkedSteps: number[];
  stepTitlesMap?: Record<number, string>; // Map of step numbers to step titles
  onStepClick: (stepNumber: number) => void;
  isOpen: boolean;
  recipeUrl?: string;
  onNotesChange?: (notes: string) => void;
}

export function IngredientExpandedAccordion({
  ingredientName,
  ingredientAmount,
  ingredientUnits,
  groupName,
  description,
  linkedSteps,
  stepTitlesMap,
  onStepClick,
  isOpen,
  recipeUrl,
  onNotesChange
}: IngredientExpandedAccordionProps) {
  return (
    <motion.div
      initial={false}
      animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden bg-white/50"
    >
      <div className="pt-2 pb-4 px-12 border-t border-stone-50">
        <IngredientExpandedContent
          ingredientName={ingredientName}
          ingredientAmount={ingredientAmount}
          ingredientUnits={ingredientUnits}
          groupName={groupName}
          description={description}
          linkedSteps={linkedSteps}
          stepTitlesMap={stepTitlesMap}
          onStepClick={onStepClick}
          variant="accordion"
          recipeUrl={recipeUrl}
          onNotesChange={onNotesChange}
        />
      </div>
    </motion.div>
  );
}


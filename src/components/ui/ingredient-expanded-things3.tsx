'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { IngredientExpandedContent } from './ingredient-expanded-content';

interface IngredientExpandedThings3Props {
  ingredientName: string;
  ingredientAmount?: string;
  ingredientUnits?: string;
  groupName?: string;
  description?: string;
  linkedSteps: number[];
  onStepClick: (stepNumber: number) => void;
  isOpen: boolean;
  recipeUrl?: string;
  onNotesChange?: (notes: string) => void;
}

export function IngredientExpandedThings3({
  ingredientName,
  ingredientAmount,
  ingredientUnits,
  groupName,
  description,
  linkedSteps,
  onStepClick,
  isOpen,
  recipeUrl,
  onNotesChange
}: IngredientExpandedThings3Props) {
  return (
    <motion.div
      initial={false}
      animate={{ 
        height: isOpen ? 'auto' : 0, 
        opacity: isOpen ? 1 : 0,
        marginTop: isOpen ? 12 : 0,
        marginBottom: isOpen ? 12 : 0
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="overflow-hidden"
    >
      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-stone-100 mx-1 mb-2">
        <IngredientExpandedContent
          ingredientName={ingredientName}
          ingredientAmount={ingredientAmount}
          ingredientUnits={ingredientUnits}
          groupName={groupName}
          description={description}
          linkedSteps={linkedSteps}
          onStepClick={onStepClick}
          variant="things3"
          recipeUrl={recipeUrl}
          onNotesChange={onNotesChange}
        />
      </div>
    </motion.div>
  );
}


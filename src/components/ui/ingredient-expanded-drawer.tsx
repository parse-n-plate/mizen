'use client';

import { IngredientDrawerContent } from './ingredient-drawer-content';
import { AdaptiveModal } from './adaptive-modal';

interface IngredientExpandedDrawerProps {
  ingredientName: string;
  ingredientAmount?: string;
  description?: string;
  substitutions?: string[];
  linkedSteps: number[];
  stepTitlesMap?: Record<number, string>;
  onStepClick: (stepNumber: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function IngredientExpandedDrawer({
  ingredientName,
  ingredientAmount,
  description,
  substitutions,
  linkedSteps,
  stepTitlesMap,
  onStepClick,
  isOpen,
  onClose,
}: IngredientExpandedDrawerProps) {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={ingredientName}
      subtitle={ingredientAmount}
      description={description || 'A staple in this dish, providing that signature flavor and texture you love.'}
    >
      <IngredientDrawerContent
        ingredientName={ingredientName}
        ingredientAmount={ingredientAmount}
        substitutions={substitutions}
        linkedSteps={linkedSteps}
        stepTitlesMap={stepTitlesMap}
        onStepClick={onStepClick}
      />
    </AdaptiveModal>
  );
}

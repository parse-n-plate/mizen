'use client';

import { IngredientDrawerContent } from './ingredient-drawer-content';
import { AdaptiveModal } from './adaptive-modal';

interface IngredientExpandedDrawerProps {
  ingredientName: string;
  ingredientAmount?: string;
  linkedSteps: number[];
  stepTitlesMap?: Record<number, string>;
  onStepClick: (stepNumber: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function IngredientExpandedDrawer({
  ingredientName,
  ingredientAmount,
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
    >
      <IngredientDrawerContent
        ingredientName={ingredientName}
        ingredientAmount={ingredientAmount}
        linkedSteps={linkedSteps}
        stepTitlesMap={stepTitlesMap}
        onStepClick={onStepClick}
      />
    </AdaptiveModal>
  );
}

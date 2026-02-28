'use client';

import { IngredientDrawerContent } from './ingredient-details-content';
import { AdaptiveModal } from '@/components/shared/adaptive-modal';

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
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
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
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: IngredientExpandedDrawerProps) {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={ingredientName}
      subtitle={ingredientAmount}
      description={
        description ||
        'A staple in this dish, providing that signature flavor and texture you love.'
      }
      onPrevious={onPrevious}
      onNext={onNext}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
    >
      <IngredientDrawerContent
        key={`${ingredientName}:${ingredientAmount || ''}`}
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

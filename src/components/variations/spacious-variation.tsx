'use client';

import React from 'react';
import { ParsedRecipe, RecipeStep } from '@/contexts/RecipeContext';
import { DirectionStepCard } from '@/components/ui/direction-step-card';
import { isEnhancedInstructions, migrateInstructionsToSteps } from '@/utils/recipe-helpers';

interface VariationProps {
  recipe: ParsedRecipe;
}

export function SpaciousVariation({ recipe }: VariationProps) {
  // Ensure instructions are in the new format
  const steps: RecipeStep[] = isEnhancedInstructions(recipe.instructions) 
    ? recipe.instructions 
    : migrateInstructionsToSteps(recipe.instructions);

  return (
    <div className="space-y-6">
      {steps.map((step, index) => (
        <DirectionStepCard 
          key={index}
          step={step}
          variant="spacious"
          allIngredients={recipe.ingredients}
        />
      ))}
    </div>
  );
}

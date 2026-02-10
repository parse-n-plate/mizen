'use client';

import React from 'react';
import { ParsedRecipe, RecipeStep } from '@/contexts/RecipeContext';
import { DirectionStepCard } from '@/components/ui/direction-step-card';
import { isEnhancedInstructions, migrateInstructionsToSteps } from '@/utils/recipe-helpers';

interface VariationProps {
  recipe: ParsedRecipe;
}

export function CompactVariation({ recipe }: VariationProps) {
  // Ensure instructions are in the new format
  const steps: RecipeStep[] = isEnhancedInstructions(recipe.instructions) 
    ? recipe.instructions 
    : migrateInstructionsToSteps(recipe.instructions);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="p-4 bg-stone-50 border-b border-stone-200">
        <h2 className="font-domine text-lg font-semibold text-stone-900">Instructions</h2>
        <p className="text-sm text-stone-500 font-albert">{steps.length} Steps</p>
      </div>
      <div className="px-4">
        {steps.map((step, index) => (
          <DirectionStepCard 
            key={index}
            step={step}
            variant="compact"
            allIngredients={recipe.ingredients}
          />
        ))}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IngredientExpandedContentProps {
  ingredientName: string;
  ingredientAmount?: string;
  ingredientUnits?: string;
  groupName?: string;
  description?: string;
  linkedSteps: number[];
  stepTitlesMap?: Record<number, string>; // Map of step numbers to step titles (e.g., { 1: "Cook Beans", 2: "Prepare Sauce" })
  onStepClick: (stepNumber: number) => void;
  variant?: 'accordion' | 'modal' | 'sidepanel' | 'things3';
  recipeUrl?: string; // Optional recipe URL for note persistence
  onNotesChange?: (notes: string) => void; // Optional callback when notes change
  /** Callback when substitution is requested - foundation for future substitution feature */
  onSubstitute?: (ingredientName: string) => void;
}

export function IngredientExpandedContent({
  ingredientName: _ingredientName,
  linkedSteps,
  stepTitlesMap,
  onStepClick,
  variant = 'things3',
}: IngredientExpandedContentProps) {
  return (
    <div className={cn(
      "space-y-2",
      variant === 'things3' ? "p-4" : "p-2"
    )}>
      {/* Related Steps Section */}
      <div className="flex flex-wrap items-center gap-2">
        {linkedSteps.length > 0 ? (
          linkedSteps.map((stepNum) => {
            // Get the step title from the map, if available
            const stepTitle = stepTitlesMap?.[stepNum];
            // Check if stepTitle is meaningful (not just "Step X" repeated)
            // If stepTitle exists and is different from just the step number, include it
            const hasMeaningfulTitle = stepTitle &&
              stepTitle.trim() !== `Step ${stepNum}` &&
              stepTitle.trim() !== `step ${stepNum}`;
            // Format button text: "Step 3: Cook Beans and Meats" or just "Step 3" if no meaningful title
            const buttonText = hasMeaningfulTitle
              ? `Step ${stepNum}: ${stepTitle}`
              : `Step ${stepNum}`;

            return (
              <Button
                key={stepNum}
                variant="outline"
                size="sm"
                onClick={() => onStepClick(stepNum)}
                className="h-7 px-3 bg-[#F6F6F4] hover:bg-stone-50 border-stone-200 text-stone-600 text-xs font-albert rounded-full"
              >
                {buttonText}
              </Button>
            );
          })
        ) : (
          <span className="text-xs font-albert text-stone-400 italic">No specific steps mentioned.</span>
        )}
      </div>

      {/* TODO: Substitution feature - foundation laid with onSubstitute prop */}
    </div>
  );
}


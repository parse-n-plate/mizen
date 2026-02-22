'use client';

import React from 'react';
import { RecipeStep, ParsedRecipe } from '@/contexts/RecipeContext';
import { IngredientsNeededSection } from './ingredients-needed-section';
import { ToolsNeededSection } from './tools-needed-section';
import { StepTimer } from './step-timer';
import { removeQuantitiesFromInstructions } from '@/utils/recipe-helpers';
import { cn } from '@/lib/utils';

interface DirectionStepCardProps {
  step: RecipeStep;
  variant: 'compact' | 'spacious' | 'minimal';
  allIngredients: ParsedRecipe['ingredients'];
  isActive?: boolean;
}

export function DirectionStepCard({
  step,
  variant,
  allIngredients,
  isActive
}: DirectionStepCardProps) {
  
  if (variant === 'compact') {
    return (
      <div className="py-4 border-b border-stone-100 last:border-0 flex gap-4 group hover:bg-[#FAFAF9] transition-colors duration-200 rounded-lg px-2 -mx-2">
        <div className="flex-shrink-0 w-6 pt-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-stone-600 text-xs font-bold font-albert">
            {step.stepNumber}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4 mb-1">
            <p className="text-[15px] leading-relaxed text-stone-800 font-albert">
              {removeQuantitiesFromInstructions(step.instruction)}
            </p>
            {step.timerMinutes && (
              <div className="flex-shrink-0">
                <StepTimer 
                  durationMinutes={step.timerMinutes} 
                  label={step.timerLabel} 
                  stepNumber={step.stepNumber}
                  variant="compact" 
                />
              </div>
            )}
          </div>
          
          {(step.ingredientsNeeded?.length || 0) > 0 && (
            <IngredientsNeededSection 
              ingredientNames={step.ingredientsNeeded || []} 
              allIngredients={allIngredients}
              variant="compact"
            />
          )}
          
          {(step.toolsNeeded?.length || 0) > 0 && (
            <ToolsNeededSection 
              tools={step.toolsNeeded || []} 
              variant="compact"
            />
          )}
        </div>
      </div>
    );
  }

  if (variant === 'spacious') {
    return (
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFBA25] text-white text-sm font-bold font-albert">
              {step.stepNumber}
            </span>
            {step.timerLabel && (
              <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                {step.timerLabel} Step
              </span>
            )}
          </div>
          
          <p className="text-lg leading-relaxed text-stone-900 font-domine mb-6">
            {removeQuantitiesFromInstructions(step.instruction)}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(step.ingredientsNeeded?.length || 0) > 0 && (
              <div>
                <IngredientsNeededSection 
                  ingredientNames={step.ingredientsNeeded || []} 
                  allIngredients={allIngredients}
                  variant="spacious"
                />
              </div>
            )}
            
            {(step.toolsNeeded?.length || 0) > 0 && (
              <div>
                <ToolsNeededSection 
                  tools={step.toolsNeeded || []} 
                  variant="spacious"
                />
              </div>
            )}
          </div>

          {step.timerMinutes && (
            <div className="mt-6 pt-6 border-t border-stone-100">
              <StepTimer 
                durationMinutes={step.timerMinutes} 
                label={step.timerLabel} 
                stepNumber={step.stepNumber}
                variant="spacious" 
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Minimal Variant
  return (
    <div className={cn(
      "bg-white h-full flex flex-col p-8 rounded-2xl shadow-sm border border-stone-200 transition-all duration-300",
      isActive ? "scale-100 opacity-100" : "scale-95 opacity-50"
    )}>
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex justify-center mb-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-900 text-white text-xl font-bold font-albert shadow-lg">
            {step.stepNumber}
          </span>
        </div>
        
        <p className="text-2xl md:text-3xl text-center leading-tight text-stone-900 font-domine mb-12">
          {removeQuantitiesFromInstructions(step.instruction)}
        </p>
        
        {step.timerMinutes && (
          <div className="max-w-xs mx-auto w-full mb-8">
            <StepTimer 
              durationMinutes={step.timerMinutes} 
              label={step.timerLabel} 
              stepNumber={step.stepNumber}
              variant="minimal" 
            />
          </div>
        )}
      </div>
      
      <div className="border-t border-stone-100 pt-6 space-y-6">
        {(step.ingredientsNeeded?.length || 0) > 0 && (
          <IngredientsNeededSection 
            ingredientNames={step.ingredientsNeeded || []} 
            allIngredients={allIngredients}
            variant="compact" // Use compact chips for cleaner minimal look
          />
        )}
        
        {(step.toolsNeeded?.length || 0) > 0 && (
          <ToolsNeededSection 
            tools={step.toolsNeeded || []} 
            variant="compact"
          />
        )}
      </div>
    </div>
  );
}


'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ParsedRecipe, RecipeStep } from '@/contexts/RecipeContext';
import { DirectionStepCard } from '@/components/ui/direction-step-card';
import { isEnhancedInstructions, migrateInstructionsToSteps } from '@/utils/recipe-helpers';
import { useSwipeable } from 'react-swipeable';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VariationProps {
  recipe: ParsedRecipe;
}

export function MinimalVariation({ recipe }: VariationProps) {
  // Ensure instructions are in the new format
  const steps: RecipeStep[] = isEnhancedInstructions(recipe.instructions) 
    ? recipe.instructions 
    : migrateInstructionsToSteps(recipe.instructions);

  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const handleNext = useCallback(() => {
    setActiveStepIndex(prev => (prev < steps.length - 1 ? prev + 1 : prev));
  }, [steps.length]);

  const handlePrev = useCallback(() => {
    setActiveStepIndex(prev => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  const handlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    trackMouse: true
  });

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
      {/* Progress Bar */}
      <div className="mb-6 px-2">
        <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-stone-900 transition-all duration-300 ease-out"
            style={{ width: `${((activeStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-stone-500 mt-2 font-albert font-medium">
          <span>Step {activeStepIndex + 1} of {steps.length}</span>
          <span>{Math.round(((activeStepIndex + 1) / steps.length) * 100)}% Complete</span>
        </div>
      </div>

      {/* Swipeable Area */}
      <div {...handlers} className="flex-1 relative overflow-hidden px-1 py-2">
        <div 
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeStepIndex * 100}%)` }}
        >
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={cn(
                "w-full flex-shrink-0 px-2 h-full",
                // Only render content for current, prev, next steps for performance
                Math.abs(activeStepIndex - index) <= 1 ? "visible" : "invisible"
              )}
            >
              <DirectionStepCard 
                step={step}
                variant="minimal"
                allIngredients={recipe.ingredients}
                isActive={index === activeStepIndex}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="mt-6 flex justify-between items-center px-2">
        <Button 
          variant="outline" 
          onClick={handlePrev} 
          disabled={activeStepIndex === 0}
          className="w-32"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex gap-1">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                idx === activeStepIndex ? "bg-stone-900" : "bg-stone-200"
              )}
            />
          ))}
        </div>

        <Button 
          variant={activeStepIndex === steps.length - 1 ? "default" : "outline"}
          onClick={handleNext} 
          disabled={activeStepIndex === steps.length - 1}
          className={cn(
            "w-32",
            activeStepIndex === steps.length - 1 ? "bg-green-600 hover:bg-green-700 border-green-600" : ""
          )}
        >
          {activeStepIndex === steps.length - 1 ? (
            "Finish"
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IngredientDrawerContentProps {
  ingredientName: string;
  ingredientAmount?: string;
  substitutions?: string[];
  linkedSteps: number[];
  stepTitlesMap?: Record<number, string>;
  onStepClick: (stepNumber: number) => void;
}

export function IngredientDrawerContent({
  ingredientName,
  ingredientAmount,
  substitutions,
  linkedSteps,
  stepTitlesMap,
  onStepClick
}: IngredientDrawerContentProps) {
  const [notes, setNotes] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [notes]);

  // Build the "used in" description
  const capitalizedName = ingredientName.charAt(0).toUpperCase() + ingredientName.slice(1);
  const usedInDescription = linkedSteps.length > 0
    ? `${capitalizedName} is essential in this dish, enhancing the depth and bringing out the vibrant flavors.${ingredientAmount ? ` You'll need ${ingredientAmount} for this recipe.` : ''}`
    : 'Unable to identify the steps where this ingredient is used.';

  const hasSubstitutes = substitutions && substitutions.length > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Substitutes */}
      {hasSubstitutes && (
        <div className="space-y-3">
          <span className="text-[11px] font-albert font-bold uppercase tracking-widest text-stone-400">
            Substitute
          </span>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {substitutions.map((sub, i) => (
              <div
                key={i}
                className="flex-shrink-0 min-w-[180px] max-w-[220px] bg-white border border-stone-200 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-albert font-semibold text-stone-800">
                    {sub}
                  </span>
                  <ArrowLeftRight className="h-3.5 w-3.5 text-stone-300 flex-shrink-0 ml-2" aria-hidden="true" />
                </div>
                <p className="text-[13px] text-stone-500 font-albert leading-relaxed">
                  Use {sub.toLowerCase()} for a unique twist in this recipe.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used In */}
      <div className="space-y-3">
        <span className="text-[11px] font-albert font-bold uppercase tracking-widest text-stone-400">
          Used in
        </span>
        <p className="text-stone-600 text-[15px] leading-relaxed font-albert">
          {usedInDescription}
        </p>
        {linkedSteps.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {linkedSteps.map((stepNum) => {
              const stepTitle = stepTitlesMap?.[stepNum];
              const hasMeaningfulTitle = stepTitle &&
                stepTitle.trim() !== `Step ${stepNum}` &&
                stepTitle.trim() !== `step ${stepNum}`;
              const buttonText = hasMeaningfulTitle
                ? `Step ${stepNum}: ${stepTitle}`
                : `Step ${stepNum}`;

              return (
                <Button
                  key={stepNum}
                  variant="outline"
                  size="sm"
                  onClick={() => onStepClick(stepNum)}
                  className="h-9 px-4 bg-white hover:bg-stone-50 border-stone-200 text-stone-600 text-[13px] font-albert rounded-xl shadow-sm transition-colors motion-safe:active:scale-95"
                >
                  {buttonText}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <span className="text-[11px] font-albert font-bold uppercase tracking-widest text-stone-400">
          Notes
        </span>
        <div className="flex items-start gap-3 p-3 bg-stone-100 rounded-lg border-2 border-transparent transition-all duration-200 focus-within:bg-white focus-within:border-stone-200 focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note"
            rows={2}
            className="flex-1 bg-transparent border-none outline-none resize-none font-albert text-[15px] font-normal text-stone-800 placeholder:text-stone-400 placeholder:font-normal p-0 m-0"
            aria-label={`Notes for ${ingredientName}`}
          />
        </div>
      </div>
    </div>
  );
}

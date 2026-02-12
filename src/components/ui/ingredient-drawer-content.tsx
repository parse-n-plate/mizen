'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecipe } from '@/contexts/RecipeContext';

interface AiSubstitution {
  name: string;
  description: string;
}

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
  const { parsedRecipe } = useRecipe();

  // AI substitution state
  const [aiSubstitutions, setAiSubstitutions] = useState<AiSubstitution[] | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [notes]);

  const handleGetAiSubstitutions = async () => {
    if (!parsedRecipe) return;

    setIsLoadingAi(true);
    setAiError(null);

    try {
      const response = await fetch('/api/generateSubstitutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientName,
          ingredientAmount: ingredientAmount || '',
          recipeTitle: parsedRecipe.title || '',
          cuisine: parsedRecipe.cuisine || [],
          ingredients: parsedRecipe.ingredients,
          instructions: parsedRecipe.instructions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate substitutions');
      }

      const { data } = await response.json();
      setAiSubstitutions(data.substitutions);
    } catch (error) {
      console.error('Failed to generate AI substitutions:', error);
      setAiError('Could not generate suggestions.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Build the "used in" description
  const capitalizedName = ingredientName.charAt(0).toUpperCase() + ingredientName.slice(1);
  const usedInDescription = linkedSteps.length > 0
    ? `${capitalizedName} is essential in this dish, enhancing the depth and bringing out the vibrant flavors.${ingredientAmount ? ` You'll need ${ingredientAmount} for this recipe.` : ''}`
    : 'Unable to identify the steps where this ingredient is used.';

  const hasStaticSubstitutes = substitutions && substitutions.length > 0;
  const hasAiSubstitutes = aiSubstitutions && aiSubstitutions.length > 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Substitutes */}
      <div className="space-y-3">
        <p className="text-[11px] font-albert font-bold uppercase tracking-widest text-stone-400">
          Substitute
        </p>

        {/* State: Loading */}
        {isLoadingAi && (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[260px] bg-white border border-stone-100 rounded-xl p-4 space-y-2 shadow-sm animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-stone-100 rounded w-2/3" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 bg-stone-100 rounded w-full" />
                  <div className="h-3 bg-stone-100 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* State: AI results */}
        {!isLoadingAi && hasAiSubstitutes && (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {aiSubstitutions.map((sub, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[260px] bg-white border border-stone-100 rounded-xl p-4 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-albert font-semibold text-stone-900">
                    {sub.name}
                  </span>
                </div>
                <p className="text-[13px] text-stone-500 font-albert leading-relaxed">
                  {sub.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* State: Error — retry button below heading */}
        {!isLoadingAi && !hasAiSubstitutes && aiError && (
          <div>
            <button
              onClick={handleGetAiSubstitutions}
              className="flex items-center gap-1.5 text-[13px] font-albert font-semibold text-primary hover:text-primary/80 transition-[color] cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {/* State: Idle with static subs — show cards + suggest button */}
        {!isLoadingAi && !hasAiSubstitutes && !aiError && hasStaticSubstitutes && (
          <>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {substitutions.map((sub, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[260px] bg-white border border-stone-100 rounded-xl p-4 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-albert font-semibold text-stone-900">
                      {sub}
                    </span>
                  </div>
                  <p className="text-[13px] text-stone-500 font-albert leading-relaxed">
                    Use {sub.toLowerCase()} for a unique twist in this recipe.
                  </p>
                </div>
              ))}
            </div>
            {parsedRecipe && (
              <div>
                <button
                  onClick={handleGetAiSubstitutions}
                  className="flex items-center gap-1.5 text-[13px] font-albert font-semibold text-primary hover:text-primary/80 transition-[color] cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Suggest Substitutes
                </button>
              </div>
            )}
          </>
        )}

        {/* State: Idle, no static subs, recipe available — suggest action */}
        {!isLoadingAi && !hasAiSubstitutes && !aiError && !hasStaticSubstitutes && parsedRecipe && (
          <div>
            <button
              onClick={handleGetAiSubstitutions}
              className="flex items-center gap-1.5 text-[13px] font-albert font-semibold text-stone-500 hover:text-stone-800 transition-[color] cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Suggest substitutes
            </button>
          </div>
        )}

        {/* State: No static subs, no recipe context — nothing can be done */}
        {!isLoadingAi && !hasAiSubstitutes && !aiError && !hasStaticSubstitutes && !parsedRecipe && (
          <div className="bg-stone-50/50 rounded-xl border border-stone-100 p-4">
            <p className="text-[13px] text-stone-400 font-albert">
              No substitutions available.
            </p>
          </div>
        )}
      </div>

      {/* Used In */}
      {linkedSteps.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-albert font-bold uppercase tracking-widest text-stone-400">
            Used in
          </p>
          <div className="flex flex-wrap gap-2">
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
                  className="h-9 px-4 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-[13px] font-albert font-medium rounded-xl transition-[background-color,color] motion-safe:active:scale-95"
                >
                  {buttonText}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-3">
        <p className="text-[11px] font-albert font-bold uppercase tracking-widest text-stone-400">
          Notes
        </p>
        <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl border border-stone-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[background-color,border-color,box-shadow] duration-200 focus-within:bg-white focus-within:border-stone-200 focus-within:shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note…"
            rows={2}
            className="flex-1 bg-transparent border-none outline-none resize-none font-albert text-[15px] font-normal text-stone-800 placeholder:text-stone-400 placeholder:font-normal p-0 m-0"
            aria-label={`Notes for ${ingredientName}`}
          />
        </div>
      </div>
    </div>
  );
}

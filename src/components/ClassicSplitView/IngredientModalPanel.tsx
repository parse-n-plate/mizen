'use client';

import { useMemo, useEffect, useRef } from 'react';
import { AdaptiveModal } from '@/components/ui/adaptive-modal';
import { findIngredientsInText, IngredientInfo } from '@/utils/ingredientMatcher';
import { RecipeStep } from './types';

interface IngredientGroup {
  groupName: string;
  ingredients: {
    amount: string;
    units: string;
    ingredient: string;
    description?: string;
    substitutions?: string[];
  }[];
}

interface IngredientModalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  allIngredients: IngredientInfo[];
  steps: RecipeStep[];
  currentStep: number;
  ingredientGroups: IngredientGroup[];
}

function toTitleCase(text: string): string {
  if (!text) return text;
  return text.replace(/\b\w+\b/g, (word) => {
    if (/^[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/.test(word)) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

export default function IngredientModalPanel({
  isOpen,
  onClose,
  allIngredients,
  steps,
  currentStep,
  ingredientGroups,
}: IngredientModalPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get ingredients matched to the current step
  const currentStepIngredientNames = useMemo(() => {
    const step = steps[currentStep];
    if (!step) return new Set<string>();
    const matched = findIngredientsInText(step.detail, allIngredients);
    return new Set(matched.map((m) => m.name.toLowerCase()));
  }, [steps, currentStep, allIngredients]);

  // Auto-scroll to first highlighted ingredient on step change
  useEffect(() => {
    if (!isOpen) return;
    const firstHighlighted = scrollRef.current?.querySelector('[data-highlighted="true"]');
    if (firstHighlighted) {
      firstHighlighted.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStep, isOpen]);

  const handleIngredientClick = (name: string) => {
    const event = new CustomEvent('navigate-to-ingredient', { detail: { name } });
    window.dispatchEvent(event);
  };

  const stepLabel = steps[currentStep]?.step || `Step ${currentStep + 1}`;

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Ingredients"
      subtitle={`Step ${currentStep + 1}: ${stepLabel}`}
    >
      <div ref={scrollRef} className="space-y-6">
        {ingredientGroups.length > 0 ? (
          ingredientGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {ingredientGroups.length > 1 && group.groupName && (
                <p className="font-albert text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 mb-3">
                  {group.groupName}
                </p>
              )}
              <div className="space-y-0">
                {group.ingredients.map((ing, ingIndex) => {
                  const isHighlighted = currentStepIngredientNames.has(ing.ingredient.toLowerCase());
                  return (
                    <button
                      key={ingIndex}
                      data-highlighted={isHighlighted}
                      onClick={() => handleIngredientClick(ing.ingredient)}
                      className={`w-full flex items-center justify-between py-2.5 border-b border-stone-100 last:border-0 cursor-pointer -mx-1 px-1 rounded-lg transition-all ${
                        isHighlighted
                          ? 'bg-stone-50 border-l-2 border-l-stone-900 pl-3'
                          : 'opacity-50 hover:opacity-80'
                      }`}
                    >
                      <span className={`font-albert text-[15px] text-stone-800 text-left ${
                        isHighlighted ? 'font-semibold' : 'font-medium'
                      }`}>
                        {toTitleCase(ing.ingredient)}
                      </span>
                      {(ing.amount || ing.units) && (
                        <span className="font-albert text-[13px] text-stone-400 ml-2 flex-shrink-0">
                          {[ing.amount, ing.units].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          // Fallback to flat allIngredients list when groups aren't available
          <div className="space-y-0">
            {allIngredients.map((ing, index) => {
              const isHighlighted = currentStepIngredientNames.has(ing.name.toLowerCase());
              return (
                <button
                  key={index}
                  data-highlighted={isHighlighted}
                  onClick={() => handleIngredientClick(ing.name)}
                  className={`w-full flex items-center justify-between py-2.5 border-b border-stone-100 last:border-0 cursor-pointer -mx-1 px-1 rounded-lg transition-all ${
                    isHighlighted
                      ? 'bg-stone-50 border-l-2 border-l-stone-900 pl-3'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <span className={`font-albert text-[15px] text-stone-800 text-left ${
                    isHighlighted ? 'font-semibold' : 'font-medium'
                  }`}>
                    {toTitleCase(ing.name)}
                  </span>
                  {(ing.amount || ing.units) && (
                    <span className="font-albert text-[13px] text-stone-400 ml-2 flex-shrink-0">
                      {[ing.amount, ing.units].filter(Boolean).join(' ')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AdaptiveModal>
  );
}

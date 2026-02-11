'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
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

interface StickyIngredientDrawerProps {
  steps: RecipeStep[];
  currentStep: number;
  allIngredients: IngredientInfo[];
  ingredientGroups: IngredientGroup[];
  viewMode: 'list' | 'card';
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

export default function StickyIngredientDrawer({
  steps,
  currentStep,
  allIngredients,
  ingredientGroups,
  viewMode,
}: StickyIngredientDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'step' | 'all'>('step');
  const [observedStep, setObservedStep] = useState(0);

  // Use Intersection Observer in list view to track which step is visible
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (viewMode !== 'list') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the entry with the largest intersection ratio
        let maxRatio = 0;
        let maxIndex = 0;
        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const id = entry.target.id; // e.g., "step-0"
            const index = parseInt(id.replace('step-', ''), 10);
            if (!isNaN(index)) {
              maxIndex = index;
            }
          }
        });
        if (maxRatio > 0) {
          setObservedStep(maxIndex);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    // Observe all step elements
    steps.forEach((_, index) => {
      const el = document.getElementById(`step-${index}`);
      if (el) {
        observerRef.current?.observe(el);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [viewMode, steps]);

  // The effective current step: from prop in card view, from observer in list view
  const effectiveStep = viewMode === 'list' ? observedStep : currentStep;

  // Matched ingredients for the current step
  const matchedIngredients = useMemo(() => {
    const step = steps[effectiveStep];
    if (!step) return [];
    return findIngredientsInText(step.detail, allIngredients);
  }, [steps, effectiveStep, allIngredients]);

  // Set of matched names for highlighting in "All" tab
  const matchedNames = useMemo(
    () => new Set(matchedIngredients.map((m) => m.name.toLowerCase())),
    [matchedIngredients]
  );

  const handleIngredientClick = (name: string) => {
    const event = new CustomEvent('navigate-to-ingredient', { detail: { name } });
    window.dispatchEvent(event);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] rounded-t-2xl max-w-[700px] mx-auto">
      {/* Collapsed bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-stone-50/50 transition-colors"
        aria-expanded={isExpanded}
        aria-label="Step ingredients"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 bg-stone-100 rounded-full font-albert text-[12px] font-bold text-stone-600">
            {matchedIngredients.length}
          </span>
          <span className="font-albert text-[14px] font-medium text-stone-600">
            {matchedIngredients.length === 1 ? '1 ingredient' : `${matchedIngredients.length} ingredients`}
            {' '}
            <span className="text-stone-400">for step {effectiveStep + 1}</span>
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-stone-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-stone-400" />
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="max-h-[40vh] overflow-y-auto px-6 pb-4">
              {/* Tab toggle: This Step / All */}
              <div className="flex gap-1 bg-stone-100 p-1 rounded-lg mb-4">
                <button
                  onClick={() => setActiveTab('step')}
                  className={`flex-1 py-1.5 text-[12px] font-bold uppercase tracking-wider rounded-md transition-all font-albert ${
                    activeTab === 'step'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  This Step
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-1.5 text-[12px] font-bold uppercase tracking-wider rounded-md transition-all font-albert ${
                    activeTab === 'all'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  All
                </button>
              </div>

              {/* Content */}
              {activeTab === 'step' ? (
                <div className="space-y-0">
                  {matchedIngredients.length > 0 ? (
                    matchedIngredients.map((ing, index) => (
                      <button
                        key={index}
                        onClick={() => handleIngredientClick(ing.name)}
                        className="w-full flex items-center justify-between py-2 border-b border-stone-100 last:border-0 cursor-pointer hover:bg-stone-50/50 rounded-lg transition-colors"
                      >
                        <span className="font-albert font-medium text-[15px] text-stone-800 text-left">
                          {toTitleCase(ing.name)}
                        </span>
                        {(ing.amount || ing.units) && (
                          <span className="font-albert text-[13px] text-stone-400 ml-2 flex-shrink-0">
                            {[ing.amount, ing.units]
                              .filter((t): t is string => typeof t === 'string' && t.length > 0)
                              .join(' ')}
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="font-albert text-[14px] text-stone-400 py-4 text-center">
                      No ingredients found for this step
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {ingredientGroups.length > 0 ? (
                    ingredientGroups.map((group, groupIndex) => (
                      <div key={groupIndex}>
                        {ingredientGroups.length > 1 && group.groupName && (
                          <p className="font-albert text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 mb-2">
                            {group.groupName}
                          </p>
                        )}
                        {group.ingredients.map((ing, ingIndex) => {
                          const isHighlighted = matchedNames.has(ing.ingredient.toLowerCase());
                          return (
                            <button
                              key={ingIndex}
                              onClick={() => handleIngredientClick(ing.ingredient)}
                              className={`w-full flex items-center justify-between py-2 border-b border-stone-100 last:border-0 cursor-pointer rounded-lg transition-all ${
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
                    ))
                  ) : (
                    allIngredients.map((ing, index) => {
                      const isHighlighted = matchedNames.has(ing.name.toLowerCase());
                      return (
                        <button
                          key={index}
                          onClick={() => handleIngredientClick(ing.name)}
                          className={`w-full flex items-center justify-between py-2 border-b border-stone-100 last:border-0 cursor-pointer rounded-lg transition-all ${
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
                              {[ing.amount, ing.units]
                                .filter((t): t is string => typeof t === 'string' && t.length > 0)
                                .join(' ')}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

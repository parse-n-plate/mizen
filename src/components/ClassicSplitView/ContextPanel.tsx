'use client';

import { RecipeStep } from './types';
import TimerCard from './TimerCard';
import TipsCard from './TipsCard';
import { motion, AnimatePresence } from 'framer-motion';
import { findIngredientsInText } from '@/utils/ingredientMatcher';
import { useAdminSettings } from '@/contexts/AdminSettingsContext';

interface ContextPanelProps {
  step: RecipeStep;
  allIngredients: any[];
}

export default function ContextPanel({ step, allIngredients }: ContextPanelProps) {
  // Find ingredients mentioned in the step text for detailed view
  const matchedIngredients = findIngredientsInText(step.detail, allIngredients);
  const { settings: adminSettings } = useAdminSettings();

  const handleIngredientClick = (name: string) => {
    // Dispatch a custom event for the page to handle tab switching and scrolling
    const event = new CustomEvent('navigate-to-ingredient', { detail: { name } });
    window.dispatchEvent(event);
  };

  // Check if there's any content to show
  const hasIngredients = adminSettings.showIngredientsForStepList && (
    matchedIngredients.length > 0 || 
    (step.ingredients && step.ingredients.length > 0)
  );
  const hasTimer = step.time && step.time > 0;
  const hasTip = step.tips && step.tips.trim().length > 0;

  // If there's no content to display, don't render the panel
  if (!hasIngredients && !hasTimer && !hasTip) {
    return null;
  }

  return (
    <div className="pt-12 pb-12 cursor-default">
      <AnimatePresence mode="wait">
        <motion.div
          key={step.step} // Use step title as key to trigger re-animation
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-8 cursor-default"
        >
          {/* Ingredients List Section - Detailed View */}
          {adminSettings.showIngredientsForStepList && matchedIngredients.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-2">
                {matchedIngredients.map((ing, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleIngredientClick(ing.name)}
                    className="group flex items-center justify-between py-2 border-b border-stone-100 last:border-0 cursor-pointer hover:bg-stone-50/50 -mx-4 px-4 rounded-lg transition-colors"
                  >
                    <div className="flex items-baseline gap-3">
                      <p className="font-albert font-medium text-[16px] text-stone-800 group-hover:text-black">
                        {ing.name}
                      </p>
                      <p className="font-albert text-[14px] text-stone-400">
                        {ing.amount} {ing.units}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-stone-300"
                      >
                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback to legacy ingredients if no matches found in text but they exist in step object */}
          {adminSettings.showIngredientsForStepList && matchedIngredients.length === 0 && step.ingredients && step.ingredients.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-2">
                {step.ingredients.map((ingredient, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleIngredientClick(ingredient)}
                    className="group flex items-center justify-between py-2 border-b border-stone-100 last:border-0 cursor-pointer hover:bg-stone-50/50 -mx-4 px-4 rounded-lg transition-colors"
                  >
                    <p className="font-albert font-medium text-[16px] text-stone-800 group-hover:text-black">
                      {ingredient}
                    </p>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-stone-300"
                      >
                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Timer and Tips Cards with refined spacing */}
          <div className="grid grid-cols-1 gap-4 pt-4">
            <TimerCard time={step.time} />
            <TipsCard tip={step.tips} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

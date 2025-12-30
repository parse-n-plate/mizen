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

  return (
    <div className="overflow-y-auto pt-8 px-8 pb-8 bg-[#fafafa] rounded-[12px] cursor-default">
      <AnimatePresence mode="wait">
        <motion.div
          key={step.step} // Use step title as key to trigger re-animation
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="space-y-10 cursor-default"
        >
          {/* Ingredients List Section - Detailed View */}
          {adminSettings.showIngredientsForStepList && matchedIngredients.length > 0 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <span className="font-albert font-bold text-[12px] uppercase tracking-[0.2em] text-stone-400">
                  Ingredients for this step
                </span>
                <div className="h-px bg-stone-200 flex-1" />
              </div>
              
              <div className="flex flex-col gap-2">
                {matchedIngredients.map((ing, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleIngredientClick(ing.name)}
                    className="group flex items-center justify-between p-3 -mx-3 rounded-xl cursor-pointer border border-transparent hover:bg-white hover:border-stone-100"
                  >
                    <div className="flex flex-col">
                      <p className="font-albert font-medium text-[17px] text-stone-700 leading-tight group-hover:text-[#193d34]">
                        {ing.name}
                      </p>
                      <p className="font-albert text-[13px] text-stone-400 mt-1">
                        {ing.amount} {ing.units}
                      </p>
                    </div>
                    <motion.div 
                      className="w-5 h-5 shrink-0 text-stone-300 group-hover:text-[#193d34]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0 }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7 17L17 7M17 7H7M17 7V17"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback to legacy ingredients if no matches found in text but they exist in step object */}
          {adminSettings.showIngredientsForStepList && matchedIngredients.length === 0 && step.ingredients && step.ingredients.length > 0 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <span className="font-albert font-bold text-[12px] uppercase tracking-[0.2em] text-stone-400">
                  Ingredients for this step
                </span>
                <div className="h-px bg-stone-300 flex-1" />
              </div>
              
              <div className="flex flex-col gap-2">
                {step.ingredients.map((ingredient, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleIngredientClick(ingredient)}
                    className="group flex items-center justify-between p-3 -mx-3 rounded-xl hover:bg-white cursor-pointer border border-transparent hover:border-stone-100"
                  >
                    <p className="font-albert font-medium text-[17px] text-stone-500 leading-relaxed group-hover:text-[#193d34]">
                      {ingredient}
                    </p>
                    <motion.div 
                      className="w-5 h-5 shrink-0 text-stone-300 group-hover:text-[#193d34]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0 }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7 17L17 7M17 7H7M17 7V17"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Timer and Tips Cards with refined spacing */}
          <div className="grid grid-cols-1 gap-6">
            <TimerCard time={step.time} />
            <TipsCard tip={step.tips} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

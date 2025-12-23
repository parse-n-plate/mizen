'use client';

import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import { RecipeStep } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { findIngredientsInText, IngredientInfo } from '@/utils/ingredientMatcher';
import { useUISettings } from '@/contexts/UISettingsContext';

interface StepDisplayProps {
  step: RecipeStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onBackToList: () => void;
  allIngredients: any[];
}

// Helper function to extract and bold keywords in text
const formatStepText = (text: string): JSX.Element => {
  // Enhanced keyword list for cooking
  const keywords = [
    'overnight', 'carefully', 'gently', 'slowly', 'quickly', 
    'boil', 'simmer', 'sauté', 'whisk', 'fold', 'knead',
    'golden brown', 'tender', 'fragrant', 'smooth'
  ];
  let formattedText = text;
  
  // Replace keywords with bold version (temporary marker)
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    formattedText = formattedText.replace(regex, (match) => `**${match}**`);
  });

  const parts = formattedText.split('**');
  return (
    <>
      {parts.map((part, index) => {
        const isKeyword = keywords.some(kw => part.toLowerCase() === kw.toLowerCase());
        if (isKeyword) {
          return (
            <motion.span 
              key={index} 
              initial={{ color: "#193d34" }}
              whileHover={{ color: "#0072ff" }}
              className="font-bold underline decoration-stone-200 underline-offset-4 transition-colors cursor-help"
            >
              {part}
            </motion.span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export default function StepDisplay({ step, currentStep, totalSteps, onNext, onPrev, onBackToList, allIngredients }: StepDisplayProps) {
  const { settings } = useUISettings();
  const { stepSizing } = settings;

  // Find ingredients mentioned in the step text
  const matchedIngredients = findIngredientsInText(step.detail, allIngredients);

  const handleIngredientClick = (name: string) => {
    // Dispatch a custom event for the page to handle tab switching and scrolling
    const event = new CustomEvent('navigate-to-ingredient', { detail: { name } });
    window.dispatchEvent(event);
  };

  // Sizing maps shifted: sm -> old med, med -> old lg, lg -> new step
  const titleSizeMap = {
    sm: 'text-[36px] md:text-[42px]',
    med: 'text-[44px] md:text-[52px]',
    lg: 'text-[52px] md:text-[62px]',
  };

  const detailSizeMap = {
    sm: 'text-[19px]',
    med: 'text-[24px]',
    lg: 'text-[30px]',
  };

  const paddingMap = {
    sm: 'p-8',
    med: 'p-12',
    lg: 'p-16',
  };

  const gapMap = {
    sm: 'gap-10',
    med: 'gap-14',
    lg: 'gap-20',
  };

  return (
    <div className={`shrink-0 bg-white relative overflow-hidden transition-all duration-300 ${paddingMap[stepSizing]}`}>
      <div className={`flex flex-col ${gapMap[stepSizing]}`}>
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPrev}
            disabled={currentStep === 0}
            className="w-10 h-10 flex items-center justify-center rounded-full text-stone-600 bg-stone-50 border border-stone-200 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-stone-50 disabled:shadow-none transition-all"
            aria-label="Previous Step"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="flex flex-col items-center">
            <button
              onClick={onBackToList}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-stone-50 transition-colors group"
              aria-label="Back to list view"
            >
              <List className="w-4 h-4 text-stone-400 group-hover:text-stone-600" />
              <span className="font-albert font-bold text-[13px] uppercase tracking-widest text-stone-400 group-hover:text-stone-600">
                Step {currentStep + 1} of {totalSteps}
              </span>
            </button>
          </div>
          
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNext}
            disabled={currentStep === totalSteps - 1}
            className="w-10 h-10 flex items-center justify-center rounded-full text-stone-600 bg-stone-50 border border-stone-200 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-stone-50 disabled:shadow-none transition-all"
            aria-label="Next Step"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col gap-4"
          >
            <h2 className={`font-domine text-[#193d34] leading-tight font-bold transition-all duration-300 ${titleSizeMap[stepSizing]}`}>
              {step.step}
            </h2>
            <div className="flex flex-col gap-6">
              <p className={`${settings.fontFamily === 'serif' ? 'font-domine' : 'font-albert'} text-[#193d34]/80 leading-relaxed max-w-2xl transition-all duration-300 ${detailSizeMap[stepSizing]}`}>
                {formatStepText(step.detail)}
              </p>
              
              {/* Ingredient Tags - Minimal and Tag-like */}
              {matchedIngredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {matchedIngredients.map((ing, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleIngredientClick(ing.name)}
                      className="group relative px-3 py-1 rounded-full bg-stone-50 border border-stone-200 text-stone-500 font-albert text-[13px] font-medium transition-all duration-200 hover:bg-stone-100 hover:text-[#193d34] hover:border-[#193d34]/20"
                    >
                      {ing.name}
                      {/* Simple Tooltip on hover */}
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] rounded bg-stone-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {ing.amount} {ing.units} {ing.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

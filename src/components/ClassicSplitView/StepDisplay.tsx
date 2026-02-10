'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RecipeStep } from './types';
import { IngredientInfo } from '@/utils/ingredientMatcher';
import { motion, AnimatePresence } from 'framer-motion';
import { highlightQuantitiesAndIngredients } from '@/lib/utils';
import { useUISettings } from '@/contexts/UISettingsContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface StepDisplayProps {
  step: RecipeStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onBackToList: () => void;
  allIngredients: IngredientInfo[];
}

export default function StepDisplay({ step, currentStep, totalSteps, onNext, onPrev, onBackToList: _onBackToList, allIngredients }: StepDisplayProps) {
  const { settings } = useUISettings();
  const { stepSizing } = settings;

  // Keyboard navigation: Arrow keys to navigate between steps
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle arrow keys if user is typing in an input, textarea, or contenteditable element
      const target = event.target as HTMLElement;
      const isInputElement = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable;

      if (isInputElement) {
        return; // Let the user type normally in input fields
      }

      // Handle left arrow key: go to previous step
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (currentStep > 0) {
          onPrev();
        }
      }
      
      // Handle right arrow key: go to next step
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (currentStep < totalSteps - 1) {
          onNext();
        }
      }
    };

    // Add event listener when component mounts
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up: remove event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStep, totalSteps, onNext, onPrev]); // Re-run if these values change

  // Sizing maps reduced by one: lg -> med, med -> sm, sm -> smaller
  const titleSizeMap = {
    sm: 'text-[32px] md:text-[38px]',
    med: 'text-[36px] md:text-[42px]',
    lg: 'text-[44px] md:text-[52px]',
  };

  const detailSizeMap = {
    sm: 'text-[17px]',
    med: 'text-[19px]',
    lg: 'text-[24px]',
  };

  const paddingMap = {
    sm: 'pt-6 pb-6',
    med: 'pt-8 pb-8',
    lg: 'pt-12 pb-12',
  };

  const gapMap = {
    sm: 'gap-8',
    med: 'gap-10',
    lg: 'gap-14',
  };

  return (
    <div id={`step-${currentStep}`} className={`shrink-0 bg-white relative overflow-hidden transition-all duration-300 ${paddingMap[stepSizing]}`}>
      <div className={`flex flex-col ${gapMap[stepSizing]}`}>
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
            <h2 className={`font-domine text-[#0C0A09] leading-tight font-bold transition-all duration-300 ${titleSizeMap[stepSizing]}`}>
              {step.step}
            </h2>
            <div className="flex flex-col gap-6">
              <p className={`${settings.fontFamily === 'serif' ? 'font-domine' : 'font-albert'} text-[#0C0A09]/80 leading-relaxed max-w-2xl transition-all duration-300 ${detailSizeMap[stepSizing]}`}>
                {highlightQuantitiesAndIngredients(step.detail, allIngredients)}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex items-center gap-6 pt-4">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onPrev}
              disabled={currentStep === 0}
              className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-20 transition-all"
              aria-label="Previous Step"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            
            {/* Step indicator with tooltip showing keyboard shortcut */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-albert font-bold text-[12px] uppercase tracking-[0.2em] text-stone-400 min-w-[80px] text-center cursor-help">
                  {currentStep + 1} / {totalSteps}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                Use ← → arrow keys to navigate
              </TooltipContent>
            </Tooltip>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onNext}
              disabled={currentStep === totalSteps - 1}
              className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-20 transition-all"
              aria-label="Next Step"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

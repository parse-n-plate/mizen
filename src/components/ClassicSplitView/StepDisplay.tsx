'use client';

import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import { RecipeStep } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { highlightQuantitiesAndIngredients } from '@/lib/utils';
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

export default function StepDisplay({ step, currentStep, totalSteps, onNext, onPrev, onBackToList, allIngredients }: StepDisplayProps) {
  const { settings } = useUISettings();
  const { stepSizing } = settings;

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
    <div id={`step-${currentStep}`} className={`shrink-0 bg-white relative overflow-hidden transition-all duration-300 ${paddingMap[stepSizing]}`}>
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
      </div>
    </div>
  );
}

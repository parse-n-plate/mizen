'use client';

import { RecipeStep } from './types';
import StepDisplay from './StepDisplay';
import ContextPanel from './ContextPanel';
import { motion } from 'framer-motion';

interface CardViewProps {
  steps: RecipeStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onBackToList: () => void;
}

export default function CardView({ steps, currentStep, onNext, onPrev, onBackToList }: CardViewProps) {
  // Safety check: ensure we have valid steps and currentStep is in bounds
  if (!steps || steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="font-albert text-stone-500">No steps available</p>
      </div>
    );
  }

  const safeCurrentStep = Math.max(0, Math.min(currentStep, steps.length - 1));
  const step = steps[safeCurrentStep];

  if (!step) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="font-albert text-stone-500">Step not found</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-white border-t border-stone-100"
    >
      {/* Top Half: Step Display */}
      <StepDisplay
        step={step}
        currentStep={safeCurrentStep}
        totalSteps={steps.length}
        onNext={onNext}
        onPrev={onPrev}
        onBackToList={onBackToList}
      />

      {/* Bottom Half: Context Panel */}
      <ContextPanel step={step} />
    </motion.div>
  );
}

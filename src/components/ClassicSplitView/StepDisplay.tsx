'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RecipeStep } from './types';

interface StepDisplayProps {
  step: RecipeStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepDisplay({ step, currentStep, totalSteps, onNext, onPrev }: StepDisplayProps) {
  return (
    <div className="shrink-0 bg-white border-b border-stone-200 p-6">
      <div className="flex flex-col gap-4">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={currentStep === 0}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Previous Step"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="font-albert text-sm text-stone-500">
            Step {currentStep + 1} of {totalSteps}
          </span>
          
          <button
            onClick={onNext}
            disabled={currentStep === totalSteps - 1}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Next Step"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Step Card */}
        <div className="bg-[#cff1e8] rounded-2xl p-6">
          <h2 className="font-domine text-[24px] text-[#193d34] mb-3 leading-tight">
            {step.step}
          </h2>
          <p className="font-albert text-[16px] text-[#193d34] leading-relaxed">
            {step.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

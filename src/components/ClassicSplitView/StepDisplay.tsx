'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RecipeStep } from './types';

interface StepDisplayProps {
  step: RecipeStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onBackToList: () => void;
}

// Helper function to extract and bold keywords in text
const formatStepText = (text: string): JSX.Element => {
  // Simple approach: look for common keywords that should be bold
  // In a real implementation, this could be more sophisticated
  const keywords = ['overnight', 'carefully', 'gently', 'slowly', 'quickly'];
  let formattedText = text;
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    formattedText = formattedText.replace(regex, `**${keyword}**`);
  });

  // Split by ** and create JSX elements
  const parts = formattedText.split('**');
  return (
    <>
      {parts.map((part, index) => {
        if (keywords.some(kw => part.toLowerCase() === kw.toLowerCase())) {
          return <span key={index} className="font-semibold">{part}</span>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export default function StepDisplay({ step, currentStep, totalSteps, onNext, onPrev, onBackToList }: StepDisplayProps) {
  return (
    <div className="shrink-0 bg-white p-6">
      <div className="flex flex-col gap-9">
        {/* Navigation Header */}
        <div className="flex items-center justify-between h-[42px]">
          <button
            onClick={onPrev}
            disabled={currentStep === 0}
            className="w-[42px] h-[42px] flex items-center justify-center rounded-[12px] text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Previous Step"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={onBackToList}
            className="font-albert text-[16px] text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
            aria-label="Back to list view"
          >
            Step {currentStep + 1} of {totalSteps}
          </button>
          
          <button
            onClick={onNext}
            disabled={currentStep === totalSteps - 1}
            className="w-[42px] h-[42px] flex items-center justify-center rounded-[12px] text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Next Step"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Step Content */}
        <div className="flex flex-col gap-3">
          <h2 className="font-domine text-[32px] text-[#193d34] leading-[42px]">
            {step.step}
          </h2>
          <p className="font-albert text-[18px] text-[#193d34] leading-[30px]">
            {formatStepText(step.detail)}
          </p>
        </div>
      </div>
    </div>
  );
}

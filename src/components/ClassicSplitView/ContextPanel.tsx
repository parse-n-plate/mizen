'use client';

import { RecipeStep } from './types';
import TimerCard from './TimerCard';
import TipsCard from './TipsCard';

interface ContextPanelProps {
  step: RecipeStep;
}

export default function ContextPanel({ step }: ContextPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-9">
      {/* Ingredients List with Divider */}
      {step.ingredients && step.ingredients.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* Divider Line */}
          <div className="h-px bg-stone-200 w-full" />
          
          {/* Ingredients List */}
          <div className="flex flex-col gap-3">
            {step.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center justify-between">
                <p className="font-albert text-[18px] text-stone-500 leading-[28px]">
                  {ingredient}
                </p>
                <div className="w-6 h-6 shrink-0">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-stone-400"
                  >
                    <path
                      d="M7 17L17 7M17 7H7M17 7V17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timer Card */}
      <TimerCard time={step.time} />

      {/* Tips Card */}
      <TipsCard tip={step.tips} />
    </div>
  );
}

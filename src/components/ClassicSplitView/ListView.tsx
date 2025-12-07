'use client';

import { RecipeStep } from './types';

interface ListViewProps {
  steps: RecipeStep[];
  onSelectStep: (index: number) => void;
}

export default function ListView({ steps, onSelectStep }: ListViewProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="font-albert text-stone-500">No steps available</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 bg-white">
      <div className="space-y-2 pb-6">
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => onSelectStep(index)}
            className="w-full bg-white border border-[#e7e5e4] rounded-[14px] p-[17px] text-left hover:border-stone-300 transition-all group"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                {/* Number Badge - Gray circular badge */}
                <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                  <span className="font-albert font-semibold text-[12px] text-stone-500 leading-4">
                    {index + 1}
                  </span>
                </div>

                {/* Step Title - No truncation, allow wrapping */}
                <h3 className="font-albert font-medium text-[16px] text-[#193d34] leading-6 flex-1 min-w-0">
                  {step.step}
                </h3>
              </div>
              
              {/* Step Description */}
              <p className="font-albert text-[16px] text-stone-500 leading-[26px] pl-9">
                {step.detail}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

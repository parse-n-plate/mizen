'use client';

import { Clock } from 'lucide-react';
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
    <div className="h-full overflow-y-auto p-6 bg-[#fdf7f3]">
      <div className="space-y-4 pb-6">
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => onSelectStep(index)}
            className="w-full bg-white rounded-2xl border border-stone-200 p-4 shadow-sm text-left hover:border-stone-300 transition-all group"
          >
            <div className="flex items-start gap-4">
              {/* Number Badge */}
              <div className="w-8 h-8 rounded-full bg-[#193d34] flex items-center justify-center shrink-0 text-white font-albert font-medium text-sm mt-0.5 group-hover:bg-[#cff1e8] group-hover:text-[#193d34] transition-colors">
                {index + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-domine text-[18px] text-[#193d34] leading-tight truncate">
                    {step.step}
                  </h3>
                  <div className="flex items-center gap-1.5 text-stone-400 shrink-0 bg-stone-50 px-2 py-1 rounded-md">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-albert text-xs font-medium">{step.time}m</span>
                  </div>
                </div>
                
                <p className="font-albert text-[14px] text-stone-600 line-clamp-2 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

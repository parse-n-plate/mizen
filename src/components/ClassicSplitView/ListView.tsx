'use client';

import { RecipeStep } from './types';
import { highlightQuantities } from '@/lib/utils';
import Image from 'next/image';

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
      <div className="space-y-4 pb-12">
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => onSelectStep(index)}
            className="w-full bg-white border-b border-stone-200 last:border-0 py-4 text-left hover:bg-stone-50/50 transition-all group relative"
          >
            {/* Horizontal layout: text on left, image on right */}
            <div className="flex items-start gap-4 relative z-10">
              {/* Left side: Text content */}
              <div className="flex-1 min-w-0">
                {/* Step header - shows step number at a glance */}
                <div className="mb-2">
                  <span className="font-albert text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Step {index + 1}
                  </span>
                </div>
                <p className="font-albert text-[16px] text-stone-900 leading-relaxed">
                  {highlightQuantities(step.detail)}
                </p>
              </div>
              
              {/* Right side: Square image */}
              {step.imageUrl && (
                <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-stone-200 group-hover:border-stone-300 transition-colors duration-300 bg-stone-100">
                  {/* Use regular img for external URLs, Next.js Image for local paths */}
                  {step.imageUrl.startsWith('/') || step.imageUrl.startsWith('http://localhost') ? (
                    <Image
                      src={step.imageUrl}
                      alt={`Step ${index + 1}: ${step.step}`}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized={step.imageUrl.startsWith('http://localhost')}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={step.imageUrl}
                      alt={`Step ${index + 1}: ${step.step}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

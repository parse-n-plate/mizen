'use client';

import { RecipeStep } from './types';
import { highlightQuantitiesAndIngredients } from '@/lib/utils';
import Image from 'next/image';
import { useUISettings } from '@/contexts/UISettingsContext';
import { IngredientInfo } from '@/utils/ingredientMatcher';

interface ListViewProps {
  steps: RecipeStep[];
  onSelectStep: (index: number) => void;
  allIngredients?: IngredientInfo[];
}

export default function ListView({ steps, onSelectStep, allIngredients = [] }: ListViewProps) {
  const { settings } = useUISettings();
  const { stepSizing } = settings;

  if (!steps || steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="font-albert text-stone-500">No steps available</p>
      </div>
    );
  }

  // Sizing maps shifted: sm -> old med, med -> old lg, lg -> new step
  const paddingMap = {
    sm: 'py-6 px-4',
    med: 'py-8 px-6',
    lg: 'py-10 px-8',
  };

  const fontSizeMap = {
    sm: 'text-[15px]',
    med: 'text-[18px]',
    lg: 'text-[21px]',
  };

  const imageSizeMap = {
    sm: 'w-20 h-20',
    med: 'w-28 h-28',
    lg: 'w-36 h-36',
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 space-y-0 pb-12">
        {steps.map((step, index) => (
          <button
            key={index}
            id={`step-${index}`}
            onClick={() => onSelectStep(index)}
            className={`w-full text-left group relative transition-all duration-200 ease-out rounded-xl hover:bg-stone-50 active:bg-stone-100 ${paddingMap[stepSizing]}`}
          >
            {/* Content container */}
            <div className="flex items-start gap-6 relative z-10">
              {/* Left side: Text content */}
              <div className="flex-1 min-w-0">
                {/* Step header - shows step number at a glance */}
                <div className="mb-2.5">
                  <span className="font-albert text-[12px] font-bold uppercase tracking-[0.1em] text-stone-400 group-hover:text-stone-500 transition-colors duration-200">
                    Step {index + 1}
                  </span>
                </div>
                <p className={`${settings.fontFamily === 'serif' ? 'font-domine' : 'font-albert'} text-stone-900 leading-[1.6] antialiased ${fontSizeMap[stepSizing]}`}>
                  {highlightQuantitiesAndIngredients(step.detail, allIngredients)}
                </p>
              </div>
              
              {/* Right side: Square image */}
              {step.imageUrl && (
                <div className={`flex-shrink-0 rounded-lg overflow-hidden border border-stone-200 bg-stone-50 transition-all duration-300 ${imageSizeMap[stepSizing]}`}>
                  {/* Use regular img for external URLs, Next.js Image for local paths */}
                  {step.imageUrl.startsWith('/') || step.imageUrl.startsWith('http://localhost') ? (
                    <Image
                      src={step.imageUrl}
                      alt={`Step ${index + 1}: ${step.step}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      unoptimized={step.imageUrl.startsWith('http://localhost')}
                      draggable={false}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={step.imageUrl}
                      alt={`Step ${index + 1}: ${step.step}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      draggable="false"
                    />
                  )}
                </div>
              )}
            </div>
            
            {/* Subtle separator line - disappears on hover of itself or neighbors */}
            {index < steps.length - 1 && (
              <div className="absolute bottom-0 left-4 right-4 h-px bg-stone-200/50 group-hover:opacity-0 transition-opacity duration-200" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

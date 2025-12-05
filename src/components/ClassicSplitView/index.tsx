'use client';

import { useState } from 'react';
import { List, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecipeStep } from './types';
import ListView from './ListView';
import CardView from './CardView';

interface ClassicSplitViewProps {
  steps: RecipeStep[];
  title?: string;
}

export default function ClassicSplitView({ steps, title = 'Recipe Steps' }: ClassicSplitViewProps) {
  const [view, setView] = useState<'list' | 'card'>('list');
  const [currentStep, setCurrentStep] = useState(0);

  // Safety check: ensure steps is valid
  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] md:h-[700px] bg-white rounded-2xl border border-stone-200 p-6">
        <p className="font-albert text-stone-500">No recipe steps available</p>
      </div>
    );
  }

  const handleSelectStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStep(index);
      setView('card');
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="classic-split-view-container bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 w-full max-w-[392px] mx-auto md:max-w-full md:w-full flex flex-col h-[600px] md:h-[700px]">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 p-4 flex items-center justify-between shrink-0">
        <div className="font-albert text-stone-400 text-sm">9:41</div>
        
        {/* View Toggle */}
        <div className="bg-stone-100 p-1 rounded-lg flex items-center gap-1">
          <button
            onClick={() => setView('list')}
            className={cn(
              "p-1.5 rounded flex items-center justify-center transition-all",
              view === 'list' ? "bg-white shadow-sm text-stone-900" : "text-stone-400 hover:text-stone-600"
            )}
            aria-label="List View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('card')}
            className={cn(
              "p-1.5 rounded flex items-center justify-center transition-all",
              view === 'card' ? "bg-white shadow-sm text-stone-900" : "text-stone-400 hover:text-stone-600"
            )}
            aria-label="Card View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title Bar */}
      <div className="bg-white px-6 py-4 shrink-0">
        <h2 className="font-domine text-[20px] text-[#193d34] leading-[1.1]">
          {title}
        </h2>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {view === 'list' ? (
          <ListView 
            steps={steps} 
            onSelectStep={handleSelectStep} 
          />
        ) : (
          <CardView 
            steps={steps}
            currentStep={currentStep}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        )}
      </div>
    </div>
  );
}


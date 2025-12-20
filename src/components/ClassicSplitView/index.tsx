'use client';

import { useState } from 'react';
import { RecipeStep } from './types';
import ListView from './ListView';
import CardView from './CardView';
import { motion, AnimatePresence } from 'framer-motion';

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

  const handleBackToList = () => {
    setView('list');
  };

  return (
    <div className="classic-split-view-container bg-white w-full flex flex-col min-h-[calc(100vh-300px)]">
      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              <ListView 
                steps={steps} 
                onSelectStep={handleSelectStep} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              <CardView 
                steps={steps}
                currentStep={currentStep}
                onNext={handleNextStep}
                onPrev={handlePrevStep}
                onBackToList={handleBackToList}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


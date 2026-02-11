'use client';

import { RecipeStep } from './types';
import { IngredientInfo } from '@/utils/ingredientMatcher';
import StepDisplay from './StepDisplay';
import ContextPanel from './ContextPanel';
import { motion } from 'framer-motion';
import { IngredientDisplayMode } from '@/hooks/use-ingredient-display-mode';

interface IngredientGroup {
  groupName: string;
  ingredients: {
    amount: string;
    units: string;
    ingredient: string;
    description?: string;
    substitutions?: string[];
  }[];
}

interface CardViewProps {
  steps: RecipeStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onBackToList: () => void;
  allIngredients: IngredientInfo[];
  ingredientDisplayMode?: IngredientDisplayMode;
  ingredientGroups?: IngredientGroup[];
}

export default function CardView({ steps, currentStep, onNext, onPrev, onBackToList, allIngredients, ingredientDisplayMode = 'inline', ingredientGroups = [] }: CardViewProps) {
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
      className="flex flex-col h-full bg-white max-w-6xl mx-auto px-4 md:px-8"
    >
      {/* Top Half: Step Display */}
      <StepDisplay
        step={step}
        currentStep={safeCurrentStep}
        totalSteps={steps.length}
        onNext={onNext}
        onPrev={onPrev}
        onBackToList={onBackToList}
        allIngredients={allIngredients}
        ingredientDisplayMode={ingredientDisplayMode}
        ingredientGroups={ingredientGroups}
      />

      {/* Bottom Half: Context Panel */}
      <div className="border-t border-stone-100">
        <ContextPanel step={step} allIngredients={allIngredients} />
      </div>
    </motion.div>
  );
}

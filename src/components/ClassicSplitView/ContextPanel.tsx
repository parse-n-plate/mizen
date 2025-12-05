'use client';

import { RecipeStep } from './types';
import TimerCard from './TimerCard';
import IngredientsCard from './IngredientsCard';
import TipsCard from './TipsCard';

interface ContextPanelProps {
  step: RecipeStep;
}

export default function ContextPanel({ step }: ContextPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Timer Card */}
      <TimerCard time={step.time} />

      {/* Ingredients Card */}
      <IngredientsCard ingredients={step.ingredients} />

      {/* Tips Card */}
      <TipsCard tip={step.tips} />
    </div>
  );
}

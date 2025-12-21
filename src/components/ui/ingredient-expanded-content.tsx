'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Tag, Calendar, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IngredientExpandedContentProps {
  ingredientName: string;
  ingredientAmount?: string;
  description?: string;
  linkedSteps: number[];
  onStepClick: (stepNumber: number) => void;
  variant?: 'accordion' | 'modal' | 'sidepanel' | 'things3';
}

export function IngredientExpandedContent({
  ingredientName,
  ingredientAmount,
  description,
  linkedSteps,
  onStepClick,
  variant = 'things3'
}: IngredientExpandedContentProps) {
  return (
    <div className={cn(
      "space-y-4",
      variant === 'things3' ? "p-4" : "p-2"
    )}>
      {/* Description / Notes Section */}
      <div className="space-y-1">
        <div className="min-h-[60px] p-2 bg-stone-50/50 rounded-lg border border-dashed border-stone-200 text-stone-500 text-sm font-albert">
          {description || "Add preparation notes, substitutions, or brand preferences..."}
        </div>
      </div>

      {/* Related Steps Section */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {linkedSteps.length > 0 ? (
            linkedSteps.map((stepNum) => (
              <Button
                key={stepNum}
                variant="outline"
                size="sm"
                onClick={() => onStepClick(stepNum)}
                className="h-7 px-3 bg-white hover:bg-stone-50 border-stone-200 text-stone-600 text-xs font-albert rounded-full"
              >
                Step {stepNum}
              </Button>
            ))
          ) : (
            <span className="text-xs font-albert text-stone-400 italic">No specific steps mentioned.</span>
          )}
        </div>
      </div>

      {/* Action Buttons & Metadata */}
      <div className="pt-4 flex items-center justify-between border-t border-stone-100">
        <div className="flex gap-3 text-stone-300">
          <Tag className="h-4 w-4 hover:text-stone-500 cursor-not-allowed transition-colors" />
          <Calendar className="h-4 w-4 hover:text-stone-500 cursor-not-allowed transition-colors" />
          <Flag className="h-4 w-4 hover:text-stone-500 cursor-not-allowed transition-colors" />
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs font-albert text-stone-500 hover:text-stone-900 hover:bg-stone-50 gap-2"
        >
          <ArrowUpDown className="h-3 w-3" />
          Swap Ingredient
        </Button>
      </div>
    </div>
  );
}


'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  Box,
  ShoppingCart,
  ChefHat,
  Info,
  Lightbulb,
  CheckCircle2,
  RotateCcw,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IngredientDrawerContentProps {
  ingredientName: string;
  ingredientAmount?: string;
  linkedSteps: number[];
  stepTitlesMap?: Record<number, string>; // Map of step numbers to step titles
  onStepClick: (stepNumber: number) => void;
}

export function IngredientDrawerContent({
  ingredientName,
  ingredientAmount,
  linkedSteps,
  stepTitlesMap,
  onStepClick
}: IngredientDrawerContentProps) {
  // Mock data for the "fun/visual" sections
  const substitutes = [
    { name: "Alternative A", icon: "🌱" },
    { name: "Alternative B", icon: "✨" }
  ];

  // Default storage text
  const defaultStorageText = "Keep in a cool, dry place. Best used within 3-5 days.";

  // State for storage and shelf life editing
  const [storageText, setStorageText] = useState<string>(defaultStorageText);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  // Handle reset
  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStorageText(defaultStorageText);
    setIsEditing(false);
  };

  // Handle blur (when user clicks away)
  const handleBlur = () => {
    setIsEditing(false);
    if (textareaRef.current) {
      setStorageText(textareaRef.current.value);
    }
  };

  // Handle click to start editing
  const handleClick = () => {
    setIsEditing(true);
  };

  // Handle key press (Escape to cancel)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      if (textareaRef.current) {
        textareaRef.current.value = storageText;
      }
    }
  };

  const isDefault = storageText === defaultStorageText;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Info */}
      <div className="bg-[#FDFCFB] p-6 rounded-2xl border border-[#F3EFE9] space-y-3">
        <div className="flex items-center gap-2 text-[#D4A373]">
          <Info className="h-4 w-4" />
          <span className="text-[11px] font-albert font-bold uppercase tracking-widest">About this ingredient</span>
        </div>
        <p className="text-stone-600 text-sm leading-relaxed font-albert">
          {ingredientName} is a staple in this dish, providing that signature flavor and texture you love. 
          {ingredientAmount && ` You'll need ${ingredientAmount} for this recipe.`}
        </p>
      </div>

      {/* Grid for Substitutes and Storage */}
      <div className="grid grid-cols-2 gap-4">
        {/* Substitutes */}
        <div className="bg-[#F0F4F8] p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-[#4A6FA5]">
            <ArrowLeftRight className="h-4 w-4" />
            <h4 className="text-xs font-albert font-bold uppercase tracking-wider">Substitutes</h4>
          </div>
          <ul className="space-y-2">
            {substitutes.map((sub, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-stone-600 font-albert">
                <span>{sub.icon}</span>
                <span>{sub.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* How to Store - Editable with Reset */}
        <div className="bg-[#EBF5EE] p-5 rounded-2xl space-y-3 group relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#4F772D]">
              <Box className="h-4 w-4" />
              <h4 className="text-xs font-albert font-bold uppercase tracking-wider">Store</h4>
            </div>
            {/* Reset button - only show if text has been modified */}
            {!isDefault && (
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-[#4F772D] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95"
                title="Reset to default"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              defaultValue={storageText}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Add storage and shelf life instructions..."
              className={cn(
                "w-full min-h-[48px] p-2 bg-white rounded-lg border border-[#4F772D]/20",
                "text-stone-700 text-xs font-albert leading-relaxed",
                "focus:outline-none focus:ring-2 focus:ring-[#4F772D]/30 focus:border-transparent",
                "resize-none transition-all duration-200",
                "placeholder:text-stone-400"
              )}
              rows={2}
            />
          ) : (
            <div
              onClick={handleClick}
              className={cn(
                "min-h-[48px] p-2 bg-white/50 rounded-lg border border-dashed border-[#4F772D]/20",
                "text-xs text-stone-600 leading-relaxed font-albert cursor-text transition-all duration-200",
                "hover:bg-white/80 hover:border-[#4F772D]/30",
                "relative"
              )}
            >
              <div className="whitespace-pre-wrap break-words">
                {storageText}
              </div>
              {/* Edit icon hint on hover */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 className="h-3 w-3 text-[#4F772D]/40" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shopping Tips */}
      <div className="bg-[#FFF9E6] p-6 rounded-2xl border border-[#FEF3C7] space-y-4">
        <div className="flex items-center gap-2 text-[#D97706]">
          <ShoppingCart className="h-4 w-4" />
          <h4 className="text-sm font-albert font-bold uppercase tracking-wider">Shopping Tips</h4>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="h-3 w-3 text-[#D97706]" />
            </div>
            <p className="text-xs text-stone-600 font-albert">Look for a firm texture and vibrant color.</p>
          </div>
          <div className="flex gap-3 items-start">
            <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="h-3 w-3 text-[#D97706]" />
            </div>
            <p className="text-xs text-stone-600 font-albert">Organic options often have more concentrated flavor.</p>
          </div>
        </div>
      </div>

      {/* Related Steps (Functional) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 text-stone-400">
          <ChefHat className="h-4 w-4" />
          <span className="text-[11px] font-albert font-bold uppercase tracking-widest">Where to use it</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {linkedSteps.length > 0 ? (
            linkedSteps.map((stepNum) => {
              // Get the step title from the map, if available
              const stepTitle = stepTitlesMap?.[stepNum];
              // Check if stepTitle is meaningful (not just "Step X" repeated)
              // If stepTitle exists and is different from just the step number, include it
              const hasMeaningfulTitle = stepTitle && 
                stepTitle.trim() !== `Step ${stepNum}` && 
                stepTitle.trim() !== `step ${stepNum}`;
              // Format button text: "Go to Step 3: Cook Beans and Meats" or just "Go to Step 3" if no meaningful title
              const buttonText = hasMeaningfulTitle
                ? `Go to Step ${stepNum}: ${stepTitle}`
                : `Go to Step ${stepNum}`;
              
              return (
                <Button
                  key={stepNum}
                  variant="outline"
                  size="sm"
                  onClick={() => onStepClick(stepNum)}
                  className="h-9 px-4 bg-white hover:bg-stone-50 border-stone-200 text-stone-600 text-xs font-albert rounded-xl shadow-sm transition-all active:scale-95"
                >
                  {buttonText}
                </Button>
              );
            })
          ) : (
            <div className="flex items-center gap-2 p-4 bg-stone-50 rounded-xl w-full">
              <Lightbulb className="h-4 w-4 text-stone-300" />
              <span className="text-xs text-stone-400 italic font-albert">Used throughout the preparation.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




















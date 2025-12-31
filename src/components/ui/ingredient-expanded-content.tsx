'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createIngredientId, getIngredientNotes, saveIngredientNotes } from '@/utils/ingredientNotes';

interface IngredientExpandedContentProps {
  ingredientName: string;
  ingredientAmount?: string;
  ingredientUnits?: string;
  groupName?: string;
  description?: string;
  linkedSteps: number[];
  stepTitlesMap?: Record<number, string>; // Map of step numbers to step titles (e.g., { 1: "Cook Beans", 2: "Prepare Sauce" })
  onStepClick: (stepNumber: number) => void;
  variant?: 'accordion' | 'modal' | 'sidepanel' | 'things3';
  recipeUrl?: string; // Optional recipe URL for note persistence
  onNotesChange?: (notes: string) => void; // Optional callback when notes change
}

export function IngredientExpandedContent({
  ingredientName,
  ingredientAmount,
  ingredientUnits,
  groupName = 'Main',
  description,
  linkedSteps,
  stepTitlesMap,
  onStepClick,
  variant = 'things3',
  recipeUrl,
  onNotesChange
}: IngredientExpandedContentProps) {
  // Create unique ingredient ID for note storage
  const ingredientId = createIngredientId(
    groupName,
    ingredientName,
    ingredientAmount,
    ingredientUnits
  );

  // State for notes editing
  const [notes, setNotes] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = getIngredientNotes(ingredientId, recipeUrl);
    // Use saved notes if available, otherwise fall back to description prop
    setNotes(savedNotes || description || '');
  }, [ingredientId, recipeUrl, description]);

  // Auto-focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end of text
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  // Handle saving notes
  const handleSaveNotes = (newNotes: string) => {
    setNotes(newNotes);
    saveIngredientNotes(ingredientId, newNotes, recipeUrl);
    // Call optional callback if provided
    if (onNotesChange) {
      onNotesChange(newNotes);
    }
  };

  // Handle blur (when user clicks away)
  const handleBlur = () => {
    setIsEditing(false);
    // Save notes when editing ends
    if (textareaRef.current) {
      handleSaveNotes(textareaRef.current.value);
    }
  };

  // Handle click to start editing
  const handleClick = () => {
    setIsEditing(true);
  };

  // Handle key press (Escape to cancel, Enter+Shift for new line, Enter alone to save)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      // Cancel editing and restore previous value
      setIsEditing(false);
      if (textareaRef.current) {
        textareaRef.current.value = notes;
      }
    }
    // Let Enter work normally for multi-line text
    // Shift+Enter also works normally
  };

  // Determine display text and placeholder
  const displayText = notes.trim() || description || '';
  const placeholder = "Add preparation notes, substitutions, or brand preferences...";
  const isEmpty = !displayText.trim();

  return (
    <div className={cn(
      "space-y-4",
      variant === 'things3' ? "p-4" : "p-2"
    )}>
      {/* Description / Notes Section - Now Editable */}
      <div className="space-y-1">
        {isEditing ? (
          // Editing mode: Show textarea
          <textarea
            ref={textareaRef}
            defaultValue={displayText}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "w-full min-h-[60px] p-2 bg-white rounded-lg border border-stone-300",
              "text-stone-900 text-sm font-albert",
              "focus:outline-none focus:ring-2 focus:ring-[#FFBA25] focus:border-transparent",
              "resize-none transition-all duration-200",
              "placeholder:text-stone-400"
            )}
            rows={3}
            style={{ 
              fontFamily: 'var(--font-albert), sans-serif',
            }}
          />
        ) : (
          // View mode: Show clickable div
          <div
            onClick={handleClick}
            className={cn(
              "min-h-[60px] p-2 bg-stone-50/50 rounded-lg border border-dashed border-stone-200",
              "text-sm font-albert cursor-text transition-all duration-200",
              "hover:bg-stone-100/50 hover:border-stone-300",
              isEmpty ? "text-stone-500" : "text-stone-700",
              "group relative"
            )}
          >
            {/* Display notes or placeholder */}
            <div className="whitespace-pre-wrap break-words">
              {displayText || placeholder}
            </div>
            {/* Edit icon hint on hover */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 className="h-3.5 w-3.5 text-stone-400" />
            </div>
          </div>
        )}
      </div>

      {/* Related Steps Section */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {linkedSteps.length > 0 ? (
            linkedSteps.map((stepNum) => {
              // Get the step title from the map, if available
              const stepTitle = stepTitlesMap?.[stepNum];
              // Format button text: "Step 3: Cook Beans and Meats" or just "Step 3" if no title
              const buttonText = stepTitle 
                ? `Step ${stepNum}: ${stepTitle}`
                : `Step ${stepNum}`;
              
              return (
                <Button
                  key={stepNum}
                  variant="outline"
                  size="sm"
                  onClick={() => onStepClick(stepNum)}
                  className="h-7 px-3 bg-white hover:bg-stone-50 border-stone-200 text-stone-600 text-xs font-albert rounded-full"
                >
                  {buttonText}
                </Button>
              );
            })
          ) : (
            <span className="text-xs font-albert text-stone-400 italic">No specific steps mentioned.</span>
          )}
          
          {/* Swap Ingredient button - right aligned */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs font-albert text-stone-500 hover:text-stone-900 hover:bg-stone-50 gap-2 ml-auto shrink-0"
          >
            <ArrowUpDown className="h-3 w-3" />
            Swap Ingredient
          </Button>
        </div>
      </div>
    </div>
  );
}


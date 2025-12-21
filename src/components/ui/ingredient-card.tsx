'use client';

import { ArrowUpDown, ChefHat, Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { findStepsForIngredient } from '@/utils/ingredientMatcher';
import { useUISettings } from '@/contexts/UISettingsContext';
import { IngredientExpandedAccordion } from './ingredient-expanded-accordion';
import { IngredientExpandedModal } from './ingredient-expanded-modal';
import { IngredientExpandedSidePanel } from './ingredient-expanded-sidepanel';
import { IngredientExpandedThings3 } from './ingredient-expanded-things3';
import { IngredientExpandedDrawer } from './ingredient-expanded-drawer';
import { cn } from '@/lib/utils';

/**
 * IngredientCard Component (Linear List Style)
 * 
 * Displays an ingredient in a linear list format matching the Figma design.
 * Shows ingredient name with amount/units, and a description field
 * (hidden when empty - not connected to backend yet).
 * 
 * @param ingredient - The ingredient object with amount, units, and ingredient name
 * @param description - Optional description/preparation notes (not yet connected to backend)
 * @param isLast - Whether this is the last item in the list (to hide bottom divider)
 * @param recipeSteps - Optional array of recipe steps to find bidirectional links
 */

interface IngredientCardProps {
  ingredient: string | {
    amount?: string;
    units?: string;
    ingredient: string;
  };
  description?: string; // Future: will be populated from backend
  isLast?: boolean; // Hide divider if this is the last item
  recipeSteps?: { instruction: string }[];
  /** Controlled checked state */
  checked?: boolean;
  /** Callback when checked state changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Controlled expanded state (for accordion behavior - only one expanded at a time) */
  isExpanded?: boolean;
  /** Callback when expansion state changes */
  onExpandChange?: (expanding: boolean) => void;
}

export default function IngredientCard({ 
  ingredient, 
  description, 
  isLast = false, 
  recipeSteps = [],
  checked,
  onCheckedChange,
  isExpanded: controlledIsExpanded,
  onExpandChange
}: IngredientCardProps) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isChecked = checked !== undefined ? checked : internalChecked;
  
  // Use controlled expansion state if provided, otherwise fall back to internal state
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : internalExpanded;
  const { settings } = useUISettings();

  // Extract just the ingredient name for matching
  const ingredientNameOnly = useMemo(() => {
    if (typeof ingredient === 'string') return ingredient;
    return ingredient.ingredient;
  }, [ingredient]);

  // Find which steps use this ingredient
  const linkedSteps = useMemo(() => {
    return findStepsForIngredient(ingredientNameOnly, recipeSteps);
  }, [ingredientNameOnly, recipeSteps]);

  const handleStepClick = (stepNumber: number) => {
    // Dispatch custom event to navigate to a specific step in the Cook tab
    const event = new CustomEvent('navigate-to-step', { detail: { stepNumber } });
    window.dispatchEvent(event);
  };

  // Format the ingredient text (combines amount, units, and ingredient name)
  const formatIngredientText = (): string => {
    // Handle string ingredients
    if (typeof ingredient === 'string') {
      return ingredient;
    }

    // Handle object ingredients
    if (typeof ingredient === 'object' && ingredient !== null) {
      const parts: string[] = [];
      
      // Add amount if it exists and is valid
      if (ingredient.amount && ingredient.amount.trim() && ingredient.amount !== 'as much as you like') {
        parts.push(ingredient.amount.trim());
      }
      
      // Add units if they exist
      if (ingredient.units && ingredient.units.trim()) {
        parts.push(ingredient.units.trim());
      }
      
      // Add ingredient name
      const ingredientName = ingredient.ingredient && ingredient.ingredient.trim();
      if (ingredientName) {
        parts.push(ingredientName);
      }
      
      return parts.join(' ');
    }

    return '';
  };

  const ingredientAmount = useMemo(() => {
    if (typeof ingredient === 'string') return '';
    return `${ingredient.amount || ''} ${ingredient.units || ''}`.trim();
  }, [ingredient]);

  const ingredientText = formatIngredientText();
  const hasDescription = description && description.trim() !== '';

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const nextChecked = e.target.checked;
    if (onCheckedChange) {
      onCheckedChange(nextChecked);
    } else {
      setInternalChecked(nextChecked);
    }
  };

  const toggleExpand = () => {
    const nextExpanded = !isExpanded;
    // If controlled, notify parent; otherwise update internal state
    if (onExpandChange) {
      onExpandChange(nextExpanded);
    } else {
      setInternalExpanded(nextExpanded);
    }
  };

  return (
    <div className="relative">
      <motion.div 
        id={`ingredient-${ingredientNameOnly.toLowerCase().replace(/\s+/g, '-')}`}
        onClick={toggleExpand}
        className={cn(
          "ingredient-list-item group cursor-pointer transition-all duration-200",
          isChecked ? 'is-checked' : '',
          isExpanded && settings.ingredientExpandStyle === 'things3' ? "bg-stone-50/50 shadow-sm rounded-xl border border-stone-100 -mx-1 px-1" : ""
        )}
      >
        {/* Divider line at the bottom (hidden for last item or when expanded in things3) */}
        {!isLast && !(isExpanded && settings.ingredientExpandStyle === 'things3') && (
          <div className="ingredient-list-divider transition-opacity group-hover:opacity-0" />
        )}
        
        {/* Main content row */}
        <div className="ingredient-list-content">
          {/* Checkbox on the left */}
          <div className="ingredient-list-checkbox">
            <motion.input
              whileTap={{ scale: 0.8 }}
              type="checkbox"
              className="ingredient-checkbox-input transition-all duration-200"
              aria-label={`Select ${ingredientText}`}
              checked={isChecked}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Ingredient details in the center */}
          <div className="ingredient-list-text-content">
            {/* Primary text: Ingredient name with amount/units */}
            <div className="ingredient-list-primary flex items-center justify-between">
              <motion.p 
                animate={{ 
                  opacity: isChecked ? 0.5 : 1,
                  x: isChecked ? 4 : 0
                }}
                className="ingredient-list-name transition-all duration-300"
              >
                {/* Render amount/unit in black and ingredient name in gray */}
                {typeof ingredient === 'string' ? (
                  <span className="text-stone-600">{ingredientText}</span>
                ) : (
                  <>
                    {/* Amount and unit in black */}
                    {ingredientAmount && (
                      <span className="text-stone-900 font-medium">{ingredientAmount} </span>
                    )}
                    {/* Ingredient name in gray */}
                    <span className="text-stone-600">{ingredientNameOnly}</span>
                  </>
                )}
              </motion.p>
              
              {/* Expand Indicator instead of step badges */}
              <div className={cn(
                "p-1 rounded-full text-stone-300 group-hover:text-stone-500 transition-all",
                isExpanded ? "rotate-45 text-[#FFBA25]" : ""
              )}>
                <Plus className="h-4 w-4" />
              </div>
            </div>

            {/* Secondary text: Description (hidden when empty) */}
            <AnimatePresence>
              {hasDescription && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="ingredient-list-secondary overflow-hidden"
                >
                  <p className="ingredient-list-description">{description}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Swap icon on the right */}
          <button
            type="button"
            className="ingredient-list-swap-button"
            aria-label={`Reorder ${ingredientText}`}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center justify-center"
            >
              <ArrowUpDown className="ingredient-list-swap-icon" />
            </motion.div>
          </button>
        </div>
      </motion.div>

      {/* Expansion Views based on UISettings */}
      {settings.ingredientExpandStyle === 'accordion' && (
        <IngredientExpandedAccordion
          ingredientName={ingredientNameOnly}
          ingredientAmount={ingredientAmount}
          description={description}
          linkedSteps={linkedSteps}
          onStepClick={handleStepClick}
          isOpen={isExpanded}
        />
      )}

      {settings.ingredientExpandStyle === 'things3' && (
        <IngredientExpandedThings3
          ingredientName={ingredientNameOnly}
          ingredientAmount={ingredientAmount}
          description={description}
          linkedSteps={linkedSteps}
          onStepClick={handleStepClick}
          isOpen={isExpanded}
        />
      )}

      <IngredientExpandedModal
        ingredientName={ingredientNameOnly}
        ingredientAmount={ingredientAmount}
        description={description}
        linkedSteps={linkedSteps}
        onStepClick={handleStepClick}
        isOpen={isExpanded && settings.ingredientExpandStyle === 'modal'}
        onClose={() => setIsExpanded(false)}
      />

      <IngredientExpandedSidePanel
        ingredientName={ingredientNameOnly}
        ingredientAmount={ingredientAmount}
        description={description}
        linkedSteps={linkedSteps}
        onStepClick={handleStepClick}
        isOpen={isExpanded && settings.ingredientExpandStyle === 'sidepanel'}
        onClose={() => setIsExpanded(false)}
      />

      <IngredientExpandedDrawer
        ingredientName={ingredientNameOnly}
        ingredientAmount={ingredientAmount}
        linkedSteps={linkedSteps}
        onStepClick={handleStepClick}
        isOpen={isExpanded && settings.ingredientExpandStyle === 'mobile-drawer'}
        onClose={() => setIsExpanded(false)}
      />
    </div>
  );
}



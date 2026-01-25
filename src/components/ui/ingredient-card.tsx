'use client';

import { ChefHat } from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { findStepsForIngredient } from '@/utils/ingredientMatcher';
import { useUISettings } from '@/contexts/UISettingsContext';
import { IngredientExpandedAccordion } from './ingredient-expanded-accordion';
import { IngredientExpandedModal } from './ingredient-expanded-modal';
import { IngredientExpandedSidePanel } from './ingredient-expanded-sidepanel';
import { IngredientExpandedThings3 } from './ingredient-expanded-things3';
import { IngredientExpandedDrawer } from './ingredient-expanded-drawer';
import { cn, convertTextFractionsToSymbols } from '@/lib/utils';

/**
 * Converts text to title case (capitalizes first letter of each word)
 * Preserves numbers, fractions, and special characters
 */
function toTitleCase(text: string): string {
  if (!text) return text;
  
  // Split by word boundaries, preserving spaces and punctuation
  return text.replace(/\b\w+\b/g, (word) => {
    // Skip if it's a number or starts with a number/fraction symbol
    if (/^[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/.test(word)) {
      return word;
    }
    // Capitalize first letter, lowercase the rest
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

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
  recipeSteps?: { instruction: string; title?: string }[]; // Step data with instruction and optional title
  /** Ingredient group name (e.g., "Main", "Sauce") */
  groupName?: string;
  /** Recipe URL for note persistence */
  recipeUrl?: string;
  /** Controlled checked state */
  checked?: boolean;
  /** Callback when checked state changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Controlled expanded state (for accordion behavior - only one expanded at a time) */
  isExpanded?: boolean;
  /** Callback when expansion state changes */
  onExpandChange?: (expanding: boolean) => void;
  /** Callback when notes change */
  onNotesChange?: (notes: string) => void;
}

export default function IngredientCard({ 
  ingredient, 
  description, 
  isLast = false, 
  recipeSteps = [],
  groupName = 'Main',
  recipeUrl,
  checked,
  onCheckedChange,
  isExpanded: controlledIsExpanded,
  onExpandChange,
  onNotesChange
}: IngredientCardProps) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isChecked = checked !== undefined ? checked : internalChecked;
  
  // Use controlled expansion state if provided, otherwise fall back to internal state
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : internalExpanded;
  const { settings } = useUISettings();

  // Helper function to parse amount/unit from ingredient string
  const parseIngredientString = (ingredientStr: string): { amount: string; unit: string; name: string } => {
    // Pattern 1: matches amount (can include fractions like 1½, 2½, ⅛) + unit + ingredient name
    // Examples: "1½ Tbsp soy sauce", "2½ cups dashi", "1 tsp sugar"
    const match = ingredientStr.match(/^([\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+(?:\s*[–-]\s*[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+)?)\s+([a-zA-Z]+)\s+(.+)$/);
    if (match) {
      return {
        amount: match[1].trim(),
        unit: match[2].trim(),
        name: match[3].trim()
      };
    }
    // Pattern 2: try simpler pattern without fractions (amount + unit + ingredient name)
    const simpleMatch = ingredientStr.match(/^(\d+(?:\s*[–-]\s*\d+)?)\s+([a-zA-Z]+)\s+(.+)$/);
    if (simpleMatch) {
      return {
        amount: simpleMatch[1].trim(),
        unit: simpleMatch[2].trim(),
        name: simpleMatch[3].trim()
      };
    }
    // Pattern 3: matches amount + ingredient name (no unit) - e.g., "3 eggs", "2 apples"
    const noUnitMatch = ingredientStr.match(/^([\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+(?:\s*[–-]\s*[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+)?)\s+(.+)$/);
    if (noUnitMatch) {
      return {
        amount: noUnitMatch[1].trim(),
        unit: '',
        name: noUnitMatch[2].trim()
      };
    }
    // Pattern 4: simpler pattern for amount + ingredient name without fractions
    const simpleNoUnitMatch = ingredientStr.match(/^(\d+(?:\s*[–-]\s*\d+)?)\s+(.+)$/);
    if (simpleNoUnitMatch) {
      return {
        amount: simpleNoUnitMatch[1].trim(),
        unit: '',
        name: simpleNoUnitMatch[2].trim()
      };
    }
    // No match found, return empty amount/unit
    return { amount: '', unit: '', name: ingredientStr };
  };

  // Extract just the ingredient name for matching
  const ingredientNameOnly = useMemo(() => {
    if (typeof ingredient === 'string') return ingredient;
    
    // If amount/units are empty, try to parse from ingredient string to get just the name
    if (!ingredient.amount && !ingredient.units && ingredient.ingredient) {
      const parsed = parseIngredientString(ingredient.ingredient);
      if (parsed.amount) {
        return parsed.name; // Return just the name part (works with or without unit)
      }
    }
    
    return ingredient.ingredient;
  }, [ingredient]);

  // Find which steps use this ingredient
  const linkedSteps = useMemo(() => {
    return findStepsForIngredient(ingredientNameOnly, recipeSteps);
  }, [ingredientNameOnly, recipeSteps]);

  // Create a map of step numbers to step titles for displaying in buttons
  const stepTitlesMap = useMemo(() => {
    const map: Record<number, string> = {};
    recipeSteps.forEach((step, index) => {
      // Step numbers are 1-indexed, array indices are 0-indexed
      const stepNumber = index + 1;
      // Use title if available, otherwise fallback to empty string (will show just step number)
      map[stepNumber] = step.title || '';
    });
    return map;
  }, [recipeSteps]);

  const handleStepClick = (stepNumber: number) => {
    // Dispatch custom event to navigate to a specific step in the Cook tab
    const event = new CustomEvent('navigate-to-step', { detail: { stepNumber } });
    window.dispatchEvent(event);
  };

  // Format the ingredient text (combines amount, units, and ingredient name)
  // Also converts text fractions to Unicode symbols (1/2 → ½)
  const formatIngredientText = (): string => {
    // Handle string ingredients
    if (typeof ingredient === 'string') {
      return convertTextFractionsToSymbols(ingredient);
    }

    // Handle object ingredients
    if (typeof ingredient === 'object' && ingredient !== null) {
      const parts: string[] = [];
      
      // Add amount if it exists and is valid (convert fractions to symbols)
      if (ingredient.amount && ingredient.amount.trim() && ingredient.amount !== 'as much as you like') {
        parts.push(convertTextFractionsToSymbols(ingredient.amount.trim()));
      }
      
      // Add units if they exist
      if (ingredient.units && ingredient.units.trim()) {
        parts.push(ingredient.units.trim());
      }
      
      // Add ingredient name (convert fractions in case they appear in the name)
      const ingredientName = ingredient.ingredient && ingredient.ingredient.trim();
      if (ingredientName) {
        parts.push(convertTextFractionsToSymbols(ingredientName));
      }
      
      return parts.join(' ');
    }

    return '';
  };

  const ingredientAmount = useMemo(() => {
    if (typeof ingredient === 'string') return '';
    
    // If amount/units are empty, try to parse from ingredient string
    if (!ingredient.amount && !ingredient.units && ingredient.ingredient) {
      const parsed = parseIngredientString(ingredient.ingredient);
      if (parsed.amount) {
        // Return amount with unit if unit exists, otherwise just amount
        // Convert fractions to symbols
        const amountWithSymbols = convertTextFractionsToSymbols(parsed.amount);
        return parsed.unit ? `${amountWithSymbols} ${parsed.unit}` : amountWithSymbols;
      }
    }
    
    // Convert fractions to symbols in the computed amount
    const computed = `${ingredient.amount || ''} ${ingredient.units || ''}`.trim();
    return convertTextFractionsToSymbols(computed);
  }, [ingredient]);

  // Extract units separately for note storage
  const ingredientUnits = useMemo(() => {
    if (typeof ingredient === 'string') {
      // Try to parse units from string
      const parsed = parseIngredientString(ingredient);
      return parsed.unit || '';
    }
    
    // Return units from object, or try to parse if not available
    if (ingredient.units) {
      return ingredient.units;
    }
    
    // If no units but we have an ingredient string, try parsing
    if (ingredient.ingredient && !ingredient.amount) {
      const parsed = parseIngredientString(ingredient.ingredient);
      return parsed.unit || '';
    }
    
    return '';
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
          "ingredient-list-item group cursor-pointer",
          isChecked ? 'is-checked' : '',
          isExpanded && settings.ingredientExpandStyle === 'things3' ? "bg-stone-50/50 shadow-sm rounded-xl border border-stone-100 -mx-1 px-1" : ""
        )}
      >
        {/* Divider line at the bottom (hidden for last item or when expanded in things3) */}
        {!isLast && !(isExpanded && settings.ingredientExpandStyle === 'things3') && (
          <div className="ingredient-list-divider group-hover:opacity-0" />
        )}
        
        {/* Main content row */}
        <div className="ingredient-list-content">
          {/* Checkbox on the left */}
          <div className="ingredient-list-checkbox">
            <motion.input
              whileTap={{ scale: 0.8 }}
              type="checkbox"
              className="ingredient-checkbox-input cursor-pointer"
              aria-label={`Select ${ingredientText}`}
              checked={isChecked}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Ingredient details in the center */}
          <div className="ingredient-list-text-content">
            {/* Primary text: Ingredient name with amount/units - matching cook mode format */}
            <motion.div 
              animate={{ 
                opacity: isChecked ? 0.5 : 1
              }}
              className="ingredient-list-primary flex items-baseline gap-3 transition-all duration-[180ms]"
            >
              {/* Format: ingredient name first (medium, stone-800, 16px), then amount/units (regular, stone-400, 14px) */}
              {typeof ingredient === 'string' ? (
                (() => {
                  // For string ingredients, try to parse to separate name and amount
                  const parsed = parseIngredientString(ingredientText);
                  if (parsed.amount) {
                    // Has amount: show name first, then amount/unit
                    const amountDisplay = parsed.unit ? `${parsed.amount} ${parsed.unit}` : parsed.amount;
                    return (
                      <>
                        <p className="font-albert font-medium text-[16px] text-stone-800 group-hover:text-black">{toTitleCase(parsed.name)}</p>
                        <p className="font-albert text-[14px] text-stone-400 text-right ml-auto">{toTitleCase(amountDisplay)}</p>
                      </>
                    );
                  }
                  // No amount found: show full text as name (check for parentheses)
                  const parenMatch = ingredientText.match(/^([^(]+?)\s*(\(.+\))$/);
                  if (parenMatch) {
                    return (
                      <>
                        <p className="font-albert font-medium text-[16px] text-stone-800 group-hover:text-black">{toTitleCase(parenMatch[1].trim())}</p>
                        <p className="font-albert text-[14px] text-stone-400 text-right ml-auto">{toTitleCase(parenMatch[2])}</p>
                      </>
                    );
                  }
                  return <p className="font-albert font-medium text-[16px] text-stone-800">{toTitleCase(ingredientText)}</p>;
                })()
              ) : (
                <>
                  {ingredientAmount ? (
                    // Has amount/unit: show name first, then amount/unit
                    <>
                      <p className="font-albert font-medium text-[16px] text-stone-800 group-hover:text-black">{toTitleCase(ingredientNameOnly)}</p>
                      <p className="font-albert text-[14px] text-stone-400 text-right ml-auto">{toTitleCase(ingredientAmount)}</p>
                    </>
                  ) : (
                    // No amount/unit: show main name, check for parentheses
                    (() => {
                      const parenMatch = ingredientText.match(/^([^(]+?)\s*(\(.+\))$/);
                      if (parenMatch) {
                        return (
                          <>
                            <p className="font-albert font-medium text-[16px] text-stone-800 group-hover:text-black">{toTitleCase(parenMatch[1].trim())}</p>
                            <p className="font-albert text-[14px] text-stone-400 text-right ml-auto">{toTitleCase(parenMatch[2])}</p>
                          </>
                        );
                      }
                      return <p className="font-albert font-medium text-[16px] text-stone-800 group-hover:text-black">{toTitleCase(ingredientText)}</p>;
                    })()
                  )}
                </>
              )}
            </motion.div>

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
        </div>
      </motion.div>

      {/* Expansion Views based on UISettings */}
      {settings.ingredientExpandStyle === 'accordion' && (
        <IngredientExpandedAccordion
          ingredientName={ingredientNameOnly}
          ingredientAmount={ingredientAmount}
          ingredientUnits={ingredientUnits}
          groupName={groupName}
          description={description}
          linkedSteps={linkedSteps}
          stepTitlesMap={stepTitlesMap}
          onStepClick={handleStepClick}
          isOpen={isExpanded}
          recipeUrl={recipeUrl}
          onNotesChange={onNotesChange}
        />
      )}

      {settings.ingredientExpandStyle === 'things3' && (
        <IngredientExpandedThings3
          ingredientName={ingredientNameOnly}
          ingredientAmount={ingredientAmount}
          ingredientUnits={ingredientUnits}
          groupName={groupName}
          description={description}
          linkedSteps={linkedSteps}
          stepTitlesMap={stepTitlesMap}
          onStepClick={handleStepClick}
          isOpen={isExpanded}
          recipeUrl={recipeUrl}
          onNotesChange={onNotesChange}
        />
      )}

      <IngredientExpandedModal
        ingredientName={ingredientNameOnly}
        ingredientAmount={ingredientAmount}
        ingredientUnits={ingredientUnits}
        groupName={groupName}
        description={description}
        linkedSteps={linkedSteps}
        stepTitlesMap={stepTitlesMap}
        onStepClick={handleStepClick}
        isOpen={isExpanded && settings.ingredientExpandStyle === 'modal'}
        onClose={() => onExpandChange ? onExpandChange(false) : setInternalExpanded(false)}
        recipeUrl={recipeUrl}
        onNotesChange={onNotesChange}
      />

      <IngredientExpandedSidePanel
        ingredientName={ingredientNameOnly}
        ingredientAmount={ingredientAmount}
        ingredientUnits={ingredientUnits}
        groupName={groupName}
        description={description}
        linkedSteps={linkedSteps}
        stepTitlesMap={stepTitlesMap}
        onStepClick={handleStepClick}
        isOpen={isExpanded && settings.ingredientExpandStyle === 'sidepanel'}
        onClose={() => onExpandChange ? onExpandChange(false) : setInternalExpanded(false)}
        recipeUrl={recipeUrl}
        onNotesChange={onNotesChange}
      />

      <IngredientExpandedDrawer
        ingredientName={ingredientNameOnly}
        ingredientAmount={ingredientAmount}
        linkedSteps={linkedSteps}
        stepTitlesMap={stepTitlesMap}
        onStepClick={handleStepClick}
        isOpen={isExpanded && settings.ingredientExpandStyle === 'mobile-drawer'}
        onClose={() => onExpandChange ? onExpandChange(false) : setInternalExpanded(false)}
      />
    </div>
  );
}



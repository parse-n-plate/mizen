'use client';

import { ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

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
 */

interface IngredientCardProps {
  ingredient: string | {
    amount?: string;
    units?: string;
    ingredient: string;
  };
  description?: string; // Future: will be populated from backend
  isLast?: boolean; // Hide divider if this is the last item
}

export default function IngredientCard({ ingredient, description, isLast = false }: IngredientCardProps) {
  const [isChecked, setIsChecked] = useState(false);

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

  const ingredientText = formatIngredientText();
  const hasDescription = description && description.trim() !== '';

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  return (
    <div className={`ingredient-list-item ${isChecked ? 'is-checked' : ''}`}>
      {/* Divider line at the bottom (hidden for last item) */}
      {!isLast && <div className="ingredient-list-divider" />}
      
      {/* Main content row */}
      <div className="ingredient-list-content">
        {/* Checkbox on the left */}
        <div className="ingredient-list-checkbox">
          <input
            type="checkbox"
            className="ingredient-checkbox-input"
            aria-label={`Select ${ingredientText}`}
            checked={isChecked}
            onChange={handleCheckboxChange}
          />
        </div>

        {/* Ingredient details in the center */}
        <div className="ingredient-list-text-content">
          {/* Primary text: Ingredient name with amount/units */}
          <div className="ingredient-list-primary">
            <p className="ingredient-list-name">{ingredientText}</p>
          </div>

          {/* Secondary text: Description (hidden when empty) */}
          {hasDescription && (
            <div className="ingredient-list-secondary">
              <p className="ingredient-list-description">{description}</p>
            </div>
          )}
        </div>

        {/* Swap icon on the right */}
        <button
          type="button"
          className="ingredient-list-swap-button"
          aria-label={`Reorder ${ingredientText}`}
        >
          <ArrowUpDown className="ingredient-list-swap-icon" />
        </button>
      </div>
    </div>
  );
}


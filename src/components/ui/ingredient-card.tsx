'use client';

/**
 * IngredientCard Component
 * 
 * Displays an ingredient in a card format matching the Figma design.
 * Shows ingredient name with amount/units, and a description field
 * (currently showing empty state since description isn't connected to backend yet).
 * 
 * @param ingredient - The ingredient object with amount, units, and ingredient name
 * @param description - Optional description/preparation notes (not yet connected to backend)
 */

interface IngredientCardProps {
  ingredient: string | {
    amount?: string;
    units?: string;
    ingredient: string;
  };
  description?: string; // Future: will be populated from backend
}

export default function IngredientCard({ ingredient, description }: IngredientCardProps) {
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
      if (ingredient.ingredient && ingredient.ingredient.trim()) {
        parts.push(ingredient.ingredient.trim());
      }
      
      return parts.join(' ');
    }

    return '';
  };

  const ingredientText = formatIngredientText();
  const hasDescription = description && description.trim() !== '';

  return (
    <div className="ingredient-card">
      {/* Checkbox on the left */}
      <div className="ingredient-card-checkbox">
        <input
          type="checkbox"
          className="ingredient-checkbox-input"
          aria-label={`Select ${ingredientText}`}
        />
      </div>

      {/* Ingredient details in the center */}
      <div className="ingredient-card-content">
        {/* Primary text: Ingredient name with amount/units */}
        <div className="ingredient-card-primary">
          <p className="ingredient-card-name">{ingredientText}</p>
        </div>

        {/* Secondary text: Description (empty state for now) */}
        <div className="ingredient-card-secondary">
          {hasDescription ? (
            <p className="ingredient-card-description">{description}</p>
          ) : (
            <p className="ingredient-card-description-empty">
              No preparation notes
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


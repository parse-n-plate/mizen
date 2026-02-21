import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ParsedRecipe } from '@/contexts/RecipeContext';

interface IngredientsNeededSectionProps {
  ingredientNames: string[];
  allIngredients: ParsedRecipe['ingredients'];
  variant?: 'compact' | 'spacious' | 'minimal';
}

export function IngredientsNeededSection({ 
  ingredientNames, 
  allIngredients, 
  variant = 'compact' 
}: IngredientsNeededSectionProps) {
  if (!ingredientNames || ingredientNames.length === 0) return null;

  // Helper to find full ingredient details
  const getIngredientDetails = (name: string) => {
    if (!allIngredients) return { name, amount: '', units: '' };

    for (const group of allIngredients) {
      for (const ing of group.ingredients) {
        if (ing.ingredient.toLowerCase().includes(name.toLowerCase()) || 
            name.toLowerCase().includes(ing.ingredient.toLowerCase())) {
          return { 
            name: ing.ingredient, 
            amount: ing.amount, 
            units: ing.units 
          };
        }
      }
    }
    return { name, amount: '', units: '' };
  };

  const ingredients = ingredientNames.map(name => getIngredientDetails(name));

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {ingredients.map((ing, i) => (
          <Badge key={i} variant="secondary" className="text-xs font-normal bg-stone-100 text-stone-700 border-stone-200">
            {ing.amount && <span className="font-semibold mr-1">{ing.amount} {ing.units}</span>}
            {ing.name}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1">
        <span>Ingredients</span>
      </h4>
      <div className="grid grid-cols-1 gap-2">
        {ingredients.map((ing, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-stone-800 bg-stone-50 p-2 rounded-md border border-stone-100">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400 flex-shrink-0" />
            <span className="font-medium">
              {ing.amount} {ing.units}
            </span>
            <span>{ing.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


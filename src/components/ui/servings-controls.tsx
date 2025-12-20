'use client';

import { Plus, Minus } from 'lucide-react';

/**
 * ServingsControls Component
 * 
 * A reusable component that allows users to adjust recipe servings
 * and select a multiplier (1x, 2x, 3x) for scaling ingredients.
 * 
 * @param servings - Current number of servings (1-10)
 * @param onServingsChange - Callback function when servings change
 * @param multiplier - Current multiplier value ('1x', '2x', or '3x')
 * @param onMultiplierChange - Callback function when multiplier changes
 */
interface ServingsControlsProps {
  servings: number;
  onServingsChange: (servings: number) => void;
  multiplier: string;
  onMultiplierChange: (multiplier: string) => void;
}

export function ServingsControls({
  servings,
  onServingsChange,
  multiplier,
  onMultiplierChange,
}: ServingsControlsProps) {
  // Handle incrementing servings (max 10)
  const handleIncrementServings = () => {
    if (servings < 10) {
      onServingsChange(servings + 1);
    }
  };

  // Handle decrementing servings (min 1)
  const handleDecrementServings = () => {
    if (servings > 1) {
      onServingsChange(servings - 1);
    }
  };

  return (
    <div className="servings-controls-container items-center justify-between p-6 bg-stone-50 rounded-2xl border border-stone-100">
      {/* YIELD Section - Servings Adjuster */}
      <div className="flex items-center gap-4">
        <span className="font-albert font-semibold text-stone-700">YIELD</span>
        <div className="control-card">
          <button
            onClick={handleDecrementServings}
            disabled={servings <= 1}
            className="control-button"
            aria-label="Decrease servings"
          >
            <Minus className="control-button-icon" />
          </button>
          <div className="flex items-center gap-2">
            <span className="servings-value">{servings}</span>
            <span className="servings-label">servings</span>
          </div>
          <button
            onClick={handleIncrementServings}
            disabled={servings >= 10}
            className="control-button"
            aria-label="Increase servings"
          >
            <Plus className="control-button-icon" />
          </button>
        </div>
      </div>

      {/* SCALE INGREDIENTS Section - Multiplier Component */}
      <div className="flex items-center gap-4">
        <span className="font-albert font-semibold text-stone-700">SCALE INGREDIENTS</span>
        <div className="multiplier-container">
          {['1x', '2x', '3x'].map((mult) => (
            <button
              key={mult}
              onClick={() => onMultiplierChange(mult)}
              className={`multiplier-button ${
                multiplier === mult ? 'multiplier-button-selected' : ''
              }`}
              aria-label={`Set multiplier to ${mult}`}
            >
              {mult}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


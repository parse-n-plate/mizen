'use client';

import { Plus, Minus } from 'lucide-react';

/**
 * ServingsControls Component - Improved UX & Visual Design
 * 
 * A beautifully designed component for adjusting recipe servings
 * and selecting multipliers for scaling ingredients.
 * 
 * Design improvements:
 * - Clear visual hierarchy with prominent values
 * - Subtle labels that don't compete with actions
 * - Smooth micro-interactions and hover states
 * - Polished, modern appearance with refined shadows
 * - Better touch targets for mobile usability
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
    <div className="yield-adjuster-container">
      {/* ── YIELD Section ── */}
      <div className="yield-section">
        {/* Small subtle label above the control */}
        <span className="yield-section-label">Yield</span>
        
        {/* Main servings control card with stepper */}
        <div className="yield-stepper-card">
          {/* Decrement button */}
          <button
            onClick={handleDecrementServings}
            disabled={servings <= 1}
            className="yield-stepper-btn yield-stepper-btn-left"
            aria-label="Decrease servings"
          >
            <Minus className="yield-stepper-icon" strokeWidth={2.5} />
          </button>
          
          {/* Central value display */}
          <div className="yield-value-display">
            <span className="yield-value-number">{servings}</span>
            <span className="yield-value-unit">servings</span>
          </div>
          
          {/* Increment button */}
          <button
            onClick={handleIncrementServings}
            disabled={servings >= 10}
            className="yield-stepper-btn yield-stepper-btn-right"
            aria-label="Increase servings"
          >
            <Plus className="yield-stepper-icon" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Vertical divider between sections */}
      <div className="yield-divider" aria-hidden="true" />

      {/* ── SCALE Section ── */}
      <div className="yield-section">
        <span className="yield-section-label">Scale</span>
        
        {/* Multiplier pill group */}
        <div className="yield-multiplier-group">
          {['1x', '2x', '3x'].map((mult) => (
            <button
              key={mult}
              onClick={() => onMultiplierChange(mult)}
              className={`yield-multiplier-pill ${
                multiplier === mult ? 'yield-multiplier-pill-active' : ''
              }`}
              aria-label={`Scale ingredients by ${mult}`}
              aria-pressed={multiplier === mult}
            >
              {mult}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

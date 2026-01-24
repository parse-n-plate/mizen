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
  servings: number | undefined;
  onServingsChange: (servings: number) => void;
  multiplier: string;
  onMultiplierChange: (multiplier: string) => void;
  originalServings?: number; // Original recipe servings for reset functionality
  onResetServings?: () => void; // Callback to reset servings to original
}

export function ServingsControls({
  servings,
  onServingsChange,
  multiplier,
  onMultiplierChange,
  originalServings,
  onResetServings,
}: ServingsControlsProps) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/211f35f0-b7c4-4493-a3d1-13dbeecaabb1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'servings-controls.tsx:30',message:'ServingsControls received props',data:{servings,servingsType:typeof servings,servingsUndefined:servings===undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  // Handle incrementing servings (max 10)
  const handleIncrementServings = () => {
    if (servings === undefined) {
      // If servings are unknown, start at 1 when user clicks increment
      onServingsChange(1);
    } else if (servings < 10) {
      onServingsChange(servings + 1);
    }
  };

  // Handle decrementing servings (min 1)
  const handleDecrementServings = () => {
    if (servings !== undefined && servings > 1) {
      onServingsChange(servings - 1);
    }
  };
  
  // If servings are unknown, show "Unknown" instead of a number
  const displayServings = servings !== undefined ? servings : null;

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
            disabled={servings === undefined || servings <= 1}
            className="yield-stepper-btn yield-stepper-btn-left cursor-pointer"
            aria-label="Decrease servings"
          >
            <Minus className="yield-stepper-icon" strokeWidth={2.5} />
          </button>
          
          {/* Central value display - clickable to reset to original */}
          <button
            onClick={onResetServings}
            disabled={!onResetServings || originalServings === undefined || (servings === originalServings && multiplier === '1x')}
            className="yield-value-display cursor-pointer hover:opacity-80 transition-opacity disabled:cursor-default disabled:opacity-100"
            aria-label={`Reset to original ${originalServings} servings`}
            title={originalServings !== undefined ? `Reset to ${originalServings} servings` : undefined}
          >
            {displayServings !== null ? (
              <>
                <span className="yield-value-number">{displayServings}</span>
                <span className="yield-value-unit">servings</span>
              </>
            ) : (
              <>
                <span className="yield-value-number" style={{ fontSize: '0.875rem', opacity: 0.5, fontStyle: 'italic' }}>Unknown</span>
                <span className="yield-value-unit" style={{ fontSize: '0.75rem', opacity: 0.5 }}>yield</span>
              </>
            )}
          </button>
          
          {/* Increment button */}
          <button
            onClick={handleIncrementServings}
            disabled={servings !== undefined && servings >= 10}
            className="yield-stepper-btn yield-stepper-btn-right cursor-pointer"
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
              className={`yield-multiplier-pill cursor-pointer ${
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

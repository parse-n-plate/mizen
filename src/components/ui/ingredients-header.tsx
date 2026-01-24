"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import User from "@solar-icons/react/csr/users/User"
import Magnifer from "@solar-icons/react/csr/search/Magnifer"
import { ChevronDown, MoreHorizontal, X } from "lucide-react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import type { UnitSystem } from "@/utils/unitConverter"

interface IngredientsHeaderProps {
  unitSystem: UnitSystem;
  onUnitSystemChange: (system: UnitSystem) => void;
  servings?: number;
  originalServings?: number;
  onServingsChange?: (servings: number) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function IngredientsHeader({
  unitSystem,
  onUnitSystemChange,
  servings,
  originalServings,
  onServingsChange,
  searchQuery = '',
  onSearchChange,
}: IngredientsHeaderProps) {
  // State to toggle the servings slider card
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  // State to track unit dropdown menu open state for animation
  const [isUnitMenuOpen, setIsUnitMenuOpen] = useState(false);
  
  // Track slider dragging state
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Accessibility: respect user's reduced motion preference
  const shouldReduceMotion = useReducedMotion();
  
  // Close unit menu when clicking outside
  const unitMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (unitMenuRef.current && !unitMenuRef.current.contains(event.target as Node)) {
        setIsUnitMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // State for servings input
  const [servingsInputValue, setServingsInputValue] = useState<string>('');
  const servingsInputRef = useRef<HTMLInputElement>(null);
  
  // Determine mode: multiplier mode when originalServings is undefined
  const isMultiplierMode = originalServings === undefined;
  
  // Slider configuration - dual mode based on whether originalServings is defined
  const minServings = 1;
  const maxAllowedServings = 99;
  
  // Calculate slider range based on mode
  let sliderMin: number;
  let sliderMax: number;
  let currentValue: number;
  
  if (isMultiplierMode) {
    // Multiplier Mode: x0.5 to x4 range
    sliderMin = 0.5;  // x0.5
    sliderMax = 4;    // x4
    currentValue = servings ?? 1; // Default to x1 if undefined
  } else {
    // Servings Mode: fixed offset +/- 5 from original
    const offset = 5;
    sliderMin = Math.max(1, originalServings - offset);
    sliderMax = originalServings + offset;
    currentValue = servings ?? originalServings;
  }
  
  // Calculate slider percentage based on current value in range
  const sliderRange = sliderMax - sliderMin;
  const percentage = sliderRange > 0 
    ? Math.max(0, Math.min(100, ((currentValue - sliderMin) / sliderRange) * 100))
    : 50; // Fallback to center if range is invalid
  
  // Format display text based on mode
  const servingsDisplay = isMultiplierMode 
    ? `x${currentValue % 1 === 0 ? currentValue : currentValue.toFixed(1)}` // Show decimals for 0.5
    : (servings !== undefined ? servings : '?');
  
  // Sync input value with servings/multiplier
  useEffect(() => {
    if (servings !== undefined) {
      setServingsInputValue(servings.toString());
    } else if (isMultiplierMode) {
      // Default to x1 in multiplier mode
      setServingsInputValue('1');
    }
  }, [servings, isMultiplierMode]);
  
  // Handle servings input change
  const handleServingsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (isMultiplierMode) {
      // Multiplier mode: allow decimals (e.g., 0.5, 1.5, 2.0)
      // Pattern: allows numbers with optional decimal point and one decimal place
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        const numValue = parseFloat(value);
        // Allow empty, or values between 0.5 and 4 (or up to maxAllowedServings for flexibility)
        if (value === '' || (!isNaN(numValue) && numValue >= sliderMin && numValue <= Math.max(sliderMax, maxAllowedServings))) {
          setServingsInputValue(value);
          if (!isNaN(numValue) && numValue >= sliderMin && onServingsChange) {
            onServingsChange(numValue);
          }
        }
      }
    } else {
      // Servings mode: integers only
      if (value === '' || /^\d+$/.test(value)) {
        const numValue = parseInt(value, 10);
        // Only update if within valid range or empty
        if (value === '' || (numValue >= minServings && numValue <= maxAllowedServings)) {
          setServingsInputValue(value);
          if (!isNaN(numValue) && numValue >= minServings && onServingsChange) {
            onServingsChange(numValue);
          }
        }
      }
    }
  };
  
  // Handle servings input blur - validate and set value
  const handleServingsInputBlur = () => {
    if (isMultiplierMode) {
      const numValue = parseFloat(servingsInputValue);
      if (isNaN(numValue) || numValue < sliderMin) {
        // Reset to current value if invalid
        setServingsInputValue(currentValue.toString());
      } else if (onServingsChange) {
        // Round to nearest 0.5 increment, then clamp to valid range
        const roundedValue = Math.round(numValue * 2) / 2;
        const clampedValue = Math.max(sliderMin, Math.min(sliderMax, roundedValue));
        onServingsChange(clampedValue);
        // Update input to show the rounded value
        setServingsInputValue(clampedValue % 1 === 0 ? clampedValue.toString() : clampedValue.toFixed(1));
      }
    } else {
      const numValue = parseInt(servingsInputValue, 10);
      if (isNaN(numValue) || numValue < minServings) {
        // Reset to current value if invalid
        setServingsInputValue(currentValue.toString());
      } else if (onServingsChange) {
        onServingsChange(numValue);
      }
    }
  };
  
  // Check if value has been changed from original/default
  const hasChanged = isMultiplierMode
    ? (servings !== undefined && servings !== 1)  // In multiplier mode, changed if not x1
    : (originalServings !== undefined && servings !== undefined && servings !== originalServings);  // In servings mode, changed if not original
  
  // Handle reset to original/default value
  const handleResetServings = () => {
    if (isMultiplierMode) {
      // Reset to x1 in multiplier mode
      if (onServingsChange) {
        onServingsChange(1);
        setServingsInputValue('1');
      }
    } else if (originalServings !== undefined && onServingsChange) {
      // Reset to original servings in servings mode
      onServingsChange(originalServings);
      setServingsInputValue(originalServings.toString());
    }
  };

  // Handle slider interaction - converts slider position to servings/multiplier
  const updateServingsFromPosition = (clientX: number) => {
    if (!sliderRef.current || !onServingsChange) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    
    // Convert percentage to value using the calculated slider range
    const sliderRange = sliderMax - sliderMin;
    let newValue: number;
    
    if (isMultiplierMode) {
      // In multiplier mode, snap to 0.5 increments (0.5, 1.0, 1.5, 2.0, etc.)
      newValue = sliderMin + (percent / 100) * sliderRange;
      newValue = Math.round(newValue * 2) / 2; // Round to nearest 0.5
    } else {
      // In servings mode, round to integers
      newValue = Math.round(sliderMin + (percent / 100) * sliderRange);
    }
    
    // Clamp to valid range
    const clampedValue = Math.max(sliderMin, Math.min(sliderMax, newValue));
    onServingsChange(clampedValue);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateServingsFromPosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updateServingsFromPosition(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateServingsFromPosition(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        updateServingsFromPosition(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  return (
    <div className="ingredients-header-container">
      {/* Header Row */}
      <div className="ingredients-header">
        <div className="ingredients-header-left">
          <h2 className="ingredients-header-title">Ingredients</h2>
          {/* Ellipsis menu icon - opens unit type options */}
          <div className="relative" ref={unitMenuRef}>
            <button
              onClick={() => setIsUnitMenuOpen(!isUnitMenuOpen)}
              className={`p-2 rounded-full transition-colors ${isUnitMenuOpen ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:bg-stone-50'}`}
              aria-label="Unit type options"
              aria-expanded={isUnitMenuOpen}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {isUnitMenuOpen && (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={shouldReduceMotion ? false : { opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ 
                    duration: shouldReduceMotion ? 0 : 0.12,
                    ease: [0.23, 1, 0.32, 1]
                  }}
                  className="absolute left-0 mt-2 w-[180px] bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      onUnitSystemChange('original');
                      setIsUnitMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-stone-50 ${
                      unitSystem === 'original' ? 'bg-stone-50' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full border-2 flex-shrink-0 ${
                      unitSystem === 'original' 
                        ? 'bg-[#0C0A09] border-[#0C0A09]' 
                        : 'border-stone-300'
                    }`} />
                    <span className="menu-action-label flex-1 text-[14px] text-stone-700">Original</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onUnitSystemChange('metric');
                      setIsUnitMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-stone-50 ${
                      unitSystem === 'metric' ? 'bg-stone-50' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full border-2 flex-shrink-0 ${
                      unitSystem === 'metric' 
                        ? 'bg-[#0C0A09] border-[#0C0A09]' 
                        : 'border-stone-300'
                    }`} />
                    <span className="menu-action-label flex-1 text-[14px] text-stone-700">Metric</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onUnitSystemChange('imperial');
                      setIsUnitMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-stone-50 ${
                      unitSystem === 'imperial' ? 'bg-stone-50' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full border-2 flex-shrink-0 ${
                      unitSystem === 'imperial' 
                        ? 'bg-[#0C0A09] border-[#0C0A09]' 
                        : 'border-stone-300'
                    }`} />
                    <span className="menu-action-label flex-1 text-[14px] text-stone-700">Imperial</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Servings/Scale Button - toggles slider card */}
        <button
          onClick={() => setIsSliderOpen(!isSliderOpen)}
          className="ingredients-header-servings-btn"
          aria-label={isMultiplierMode ? "Adjust scale" : "Adjust servings"}
          aria-expanded={isSliderOpen}
        >
          <ChevronDown 
            className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${isSliderOpen ? 'rotate-180' : ''}`} 
          />
          {!isMultiplierMode && (
            <span className="user-icon-wrapper">
              <User weight="Bold" className="w-4 h-4 text-stone-600" />
            </span>
          )}
          <span className="ingredients-header-servings-text">
            {isMultiplierMode ? `Scale ${servingsDisplay}` : `Serves ${servingsDisplay}`}
          </span>
        </button>
      </div>

      {/* Servings Slider Card - appears when toggled with snappy animation */}
      <AnimatePresence>
        {isSliderOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 350,
              opacity: { duration: 0.2 }
            }}
            style={{ overflow: 'visible' }}
          >
            <div className="servings-slider-card">
              <p className="servings-slider-label">{isMultiplierMode ? 'Scale' : 'Servings'}</p>
              
              <div className="servings-slider-row">
                {/* Current servings/scale indicator - editable input */}
                <div className="servings-indicator">
                  {!isMultiplierMode && (
                    <span className="user-icon-wrapper">
                      <User weight="Bold" className="w-5 h-5 text-stone-500" />
                    </span>
                  )}
                  <span className="servings-indicator-text">
                    {isMultiplierMode ? 'x' : 'Serves'}
                    <input
                      ref={servingsInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={servingsInputValue}
                      onChange={handleServingsInputChange}
                      onBlur={handleServingsInputBlur}
                      className="servings-indicator-input"
                      aria-label={isMultiplierMode ? "Multiplier value" : "Number of servings"}
                      min={minServings}
                      max={maxAllowedServings}
                    />
                  </span>
                </div>
                
                {/* Reset button - appears when value has changed, positioned outside gray box to the right */}
                {hasChanged && (
                  <button
                    onClick={handleResetServings}
                    className="servings-reset-btn"
                    aria-label={isMultiplierMode ? "Reset to x1" : "Reset to original servings"}
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {/* Slider track */}
                <div 
                  ref={sliderRef}
                  className="servings-slider-track-container"
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                >
                  <div className="servings-slider-track">
                    <div 
                      className="servings-slider-fill" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {/* Slider handle */}
                  <div 
                    className="servings-slider-handle"
                    style={{ left: `${percentage}%` }}
                  >
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                      <circle cx="18" cy="18" r="14" fill="#0088ff" />
                      <circle cx="18" cy="18" r="12" fill="#0088ff" stroke="white" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar - positioned directly under the header */}
      {onSearchChange && (
        <div className="ingredients-search-container">
          <div className="ingredients-search-wrapper">
            <Magnifer className="ingredients-search-icon" />
            <input
              type="text"
              placeholder="Search ingredients"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="ingredients-search-input"
              aria-label="Search ingredients"
            />
          </div>
        </div>
      )}
    </div>
  )
}

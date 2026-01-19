"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import User from "@solar-icons/react/csr/users/User"
import { ChevronDown, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import type { UnitSystem } from "@/utils/unitConverter"

interface IngredientsHeaderProps {
  unitSystem: UnitSystem;
  onUnitSystemChange: (system: UnitSystem) => void;
  servings?: number;
  originalServings?: number;
  onServingsChange?: (servings: number) => void;
}

export function IngredientsHeader({
  unitSystem,
  onUnitSystemChange,
  servings,
  originalServings,
  onServingsChange,
}: IngredientsHeaderProps) {
  // State to toggle the servings slider card
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  
  // Track slider dragging state
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Format servings display - show "Serves X" or "Serves ?" if undefined
  const servingsDisplay = servings !== undefined ? servings : '?';
  
  // Calculate slider percentage (1-20 range for servings)
  const minServings = 1;
  const maxServings = Math.max(originalServings ? originalServings * 4 : 20, 20);
  const currentServings = servings ?? originalServings ?? 2;
  const percentage = ((currentServings - minServings) / (maxServings - minServings)) * 100;

  // Handle slider interaction
  const updateServingsFromPosition = (clientX: number) => {
    if (!sliderRef.current || !onServingsChange) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newServings = Math.round(minServings + (percent / 100) * (maxServings - minServings));
    onServingsChange(newServings);
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="ingredients-header-menu-btn"
                aria-label="Unit type options"
              >
                <MoreHorizontal className="w-5 h-5 text-stone-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              <DropdownMenuRadioGroup 
                value={unitSystem} 
                onValueChange={(value) => onUnitSystemChange(value as UnitSystem)}
              >
                <DropdownMenuRadioItem value="original">
                  Original
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="metric">
                  Metric
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="imperial">
                  Imperial
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Servings Button - toggles slider card */}
        <button
          onClick={() => setIsSliderOpen(!isSliderOpen)}
          className="ingredients-header-servings-btn"
          aria-label="Adjust servings"
          aria-expanded={isSliderOpen}
        >
          <ChevronDown 
            className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${isSliderOpen ? 'rotate-180' : ''}`} 
          />
          <span className="user-icon-wrapper">
            <User weight="Bold" className="w-4 h-4 text-stone-600" />
          </span>
          <span className="ingredients-header-servings-text">
            Serves {servingsDisplay}
          </span>
        </button>
      </div>

      {/* Servings Slider Card - appears when toggled */}
      {isSliderOpen && (
        <div className="servings-slider-card">
          <p className="servings-slider-label">Servings</p>
          
          <div className="servings-slider-row">
            {/* Current servings indicator */}
            <div className="servings-indicator">
              <span className="user-icon-wrapper">
                <User weight="Bold" className="w-5 h-5 text-stone-500" />
              </span>
              <span className="servings-indicator-text">
                Serves <span className="servings-indicator-value">{currentServings}</span>
              </span>
            </div>
            
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
      )}
    </div>
  )
}

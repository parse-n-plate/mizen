"use client";

import * as React from "react";
import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import User from "@solar-icons/react/csr/users/User";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ServingsAdjusterProps {
  servings: number;
  originalServings: number;
  onServingsChange: (servings: number) => void;
  isOpen: boolean;
}

export function ServingsAdjuster({
  servings,
  originalServings,
  onServingsChange,
  isOpen,
}: ServingsAdjusterProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const lastDragValueRef = useRef<number | null>(null);
  const [, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState<string>(String(servings));
  const [isEditingInput, setIsEditingInput] = useState(false);

  // Slider range: originalServings ± 5, min 1
  const sliderMin = Math.max(1, originalServings - 5);
  const sliderMax = originalServings + 5;
  const displayedValue = dragValue ?? servings;

  const sliderRange = sliderMax - sliderMin;
  const percentage =
    sliderRange > 0
      ? Math.max(0, Math.min(100, ((displayedValue - sliderMin) / sliderRange) * 100))
      : 50;

  const hasChanged = Math.round(displayedValue) !== originalServings;

  const inputDisplayValue = isEditingInput || isDragging ? inputValue : String(servings);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      const numValue = parseInt(value, 10);
      if (value === "" || (numValue >= 1 && numValue <= 99)) {
        setInputValue(value);
        if (!isNaN(numValue) && numValue >= 1) {
          onServingsChange(numValue);
        }
      }
    }
  };

  const handleInputBlur = () => {
    setIsEditingInput(false);
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < 1) {
      setInputValue(String(servings));
    } else {
      onServingsChange(numValue);
    }
  };

  const handleReset = () => {
    setIsEditingInput(false);
    setDragValue(null);
    onServingsChange(originalServings);
    setInputValue(String(originalServings));
  };

  const updateFromPosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const newValue = Math.round(sliderMin + (percent / 100) * sliderRange);
      const clamped = Math.max(sliderMin, Math.min(sliderMax, newValue));

      if (lastDragValueRef.current === clamped) return;
      lastDragValueRef.current = clamped;
      setDragValue(clamped);
      setIsEditingInput(false);
      setInputValue(String(clamped));
      startTransition(() => onServingsChange(clamped));
    },
    [onServingsChange, sliderMin, sliderMax, sliderRange, startTransition],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateFromPosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateFromPosition(e.touches[0].clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => updateFromPosition(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      e.preventDefault();
      updateFromPosition(e.touches[0].clientX);
    };
    const handleEnd = () => {
      setIsDragging(false);
      lastDragValueRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
    };
  }, [isDragging, updateFromPosition]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 350,
            opacity: { duration: 0.2 },
          }}
          className="print:hidden overflow-visible"
        >
          <div className="mt-2 max-w-md bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 px-4 py-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
            <p className="text-[13px] font-semibold text-stone-500 dark:text-stone-400 capitalize mb-2">
              Servings
            </p>

            <div className="flex items-center gap-3">
              {/* Indicator pill */}
              <div className={`relative flex items-center gap-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg pl-3 py-1.5 border border-stone-200 dark:border-stone-700 focus-within:border-[#0088ff] focus-within:outline focus-within:outline-1 focus-within:outline-[#0088ff] transition-[padding] duration-150 ${hasChanged ? "pr-8" : "pr-3"}`}>
                <span className="flex items-center justify-center w-4 h-4 text-stone-500 dark:text-stone-400">
                  <User weight="Bold" className="w-4 h-4" />
                </span>
                <span className="text-[13px] text-stone-500 dark:text-stone-400 whitespace-nowrap flex items-center gap-0.5">
                  Serves
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={inputDisplayValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsEditingInput(true)}
                    onBlur={handleInputBlur}
                    className="w-[3ch] text-[13px] font-semibold text-stone-800 dark:text-stone-200 bg-transparent border-none outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:text-[#0088ff]"
                    aria-label="Number of servings"
                  />
                </span>

                <AnimatePresence>
                  {hasChanged && (
                    <motion.button
                      key="reset"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      onClick={handleReset}
                      className="absolute top-0 bottom-0 right-1.5 my-auto flex items-center justify-center w-5 h-5 rounded-full text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
                      aria-label="Reset to original servings"
                      type="button"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Slider */}
              <div
                ref={sliderRef}
                className="flex-1 relative h-7 flex items-center cursor-pointer select-none"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                <div className="w-full h-[5px] bg-stone-200 dark:bg-stone-700 rounded-full relative overflow-hidden">
                  <div
                    className="h-full bg-[#0088ff] rounded-full"
                    style={{
                      width: `${percentage}%`,
                      transition: isDragging ? "none" : "width 50ms ease-out",
                    }}
                  />
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 cursor-grab active:cursor-grabbing z-[1]"
                  style={{
                    left: `${percentage}%`,
                    transition: isDragging ? "none" : "left 50ms ease-out",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="11" fill="#0088ff" />
                    <circle cx="14" cy="14" r="9.5" fill="#0088ff" stroke="white" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

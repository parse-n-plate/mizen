"use client";

import * as React from "react";
import { useState, useRef, useEffect, useTransition, useCallback, useId } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface ServingsAdjusterProps {
  servings: number;
  originalServings: number;
  onServingsChange: (servings: number) => void;
  isOpen: boolean;
  panelClassName?: string;
  /** Render the card in place. Floating parents own open state and motion. */
  embedded?: boolean;
}

export function ServingsAdjuster({
  servings,
  originalServings,
  onServingsChange,
  isOpen,
  panelClassName,
  embedded = false,
}: ServingsAdjusterProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const lastDragValueRef = useRef<number | null>(null);
  const [, startTransition] = useTransition();
  const shouldReduceMotion = useReducedMotion();
  const headingId = useId();

  const sliderMin = Math.max(1, Math.min(originalServings - 5, servings));
  const sliderMax = Math.max(originalServings + 5, servings);
  const displayedValue = dragValue ?? servings;

  const sliderRange = sliderMax - sliderMin;
  const percentage =
    sliderRange > 0
      ? Math.max(0, Math.min(100, ((displayedValue - sliderMin) / sliderRange) * 100))
      : 50;

  const hasChanged = Math.round(displayedValue) !== originalServings;
  const roundedDisplay = Math.round(displayedValue);

  const handleReset = () => {
    setDragValue(null);
    onServingsChange(originalServings);
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
      startTransition(() => onServingsChange(clamped));
    },
    [onServingsChange, sliderMin, sliderMax, sliderRange, startTransition]
  );

  const nudgeServings = useCallback(
    (delta: number) => {
      const next = Math.max(sliderMin, Math.min(sliderMax, roundedDisplay + delta));
      setDragValue(null);
      onServingsChange(next);
    },
    [onServingsChange, roundedDisplay, sliderMax, sliderMin]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        nudgeServings(-1);
        break;
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        nudgeServings(1);
        break;
      case "Home":
        e.preventDefault();
        onServingsChange(sliderMin);
        break;
      case "End":
        e.preventDefault();
        onServingsChange(sliderMax);
        break;
      default:
        break;
    }
  };

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
      setDragValue(null);
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

  const panel = (
    <div
      className={`${embedded ? "w-full" : "mt-2 max-w-md"} rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-[var(--shadow-soft)] dark:border-stone-800 dark:bg-stone-900 ${panelClassName ?? ""}`}
    >
      <p
        id={headingId}
        className="text-[13px] font-semibold text-stone-500 dark:text-stone-400 capitalize mb-2"
      >
        Servings
      </p>

      <div
        ref={sliderRef}
        role="slider"
        tabIndex={0}
        aria-labelledby={headingId}
        aria-valuemin={sliderMin}
        aria-valuemax={sliderMax}
        aria-valuenow={roundedDisplay}
        aria-valuetext={`${roundedDisplay} servings`}
        className="relative h-7 flex items-center cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDown}
      >
        <div className="w-full h-[5px] bg-stone-200 dark:bg-stone-700 rounded-full relative overflow-hidden">
          <div
            className={`h-full rounded-full ${hasChanged ? "bg-[var(--color-blue)]" : "bg-primary"}`}
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
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle
              cx="14"
              cy="14"
              r="11"
              fill={hasChanged ? "var(--color-blue)" : "var(--primary)"}
            />
            <circle
              cx="14"
              cy="14"
              r="9.5"
              fill={hasChanged ? "var(--color-blue)" : "var(--primary)"}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>

      {hasChanged && (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[12px] text-[var(--color-blue)]">
            Recipe originally serves {originalServings}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 text-[12px] font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return isOpen ? panel : null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={
            shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }
          }
          className="print:hidden overflow-visible"
        >
          {panel}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressPieProps {
  /** Completion percentage (0 to 100) */
  percentage: number;
  /** Size in pixels (default: 18) */
  size?: number;
  /** Stroke width (default: 1.5) */
  strokeWidth?: number;
  /** Custom color for the fill (default: text-primary) */
  color?: string;
  /** Additional classes */
  className?: string;
}

/**
 * Things 3-style circular progress pie indicator.
 * Fills clockwise as percentage increases.
 */
export function ProgressPie({
  percentage,
  size = 18,
  strokeWidth = 1.5,
  color = "currentColor",
  className
}: ProgressPieProps) {
  // Ensure percentage is between 0 and 100
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  
  // SVG calculations
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("transform -rotate-90 transition-opacity duration-300", className)}
      aria-hidden="true"
    >
      {/* Background ring (Empty state) */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="transparent"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="opacity-20"
      />
      
      {/* Progress arc (Filled state) */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        style={{
          strokeDashoffset: offset,
          transition: 'stroke-dashoffset 0.2s ease-out'
        }}
        strokeLinecap="round"
      />
    </svg>
  );
}


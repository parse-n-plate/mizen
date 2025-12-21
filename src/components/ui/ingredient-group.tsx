'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressPie } from './progress-pie';
import { cn } from '@/lib/utils';

interface IngredientGroupProps {
  title: string;
  totalCount: number;
  checkedCount: number;
  isInitialExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
  children: React.ReactNode;
  /** Layout option for the progress pie: 'inline' or 'below' */
  pieLayout?: 'inline' | 'below';
}

/**
 * A collapsible group for ingredients with a Things 3-style progress indicator.
 */
export function IngredientGroup({
  title,
  totalCount,
  checkedCount,
  isInitialExpanded = true,
  onToggle,
  children,
  pieLayout = 'inline'
}: IngredientGroupProps) {
  const [isExpanded, setIsExpanded] = useState(isInitialExpanded);
  
  // Calculate percentage for the pie
  const percentage = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  const isComplete = checkedCount === totalCount && totalCount > 0;

  const toggleExpand = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    if (onToggle) onToggle(nextState);
  };

  return (
    <div className="mb-6 last:mb-0">
      {/* Group Header */}
      <div 
        className="flex items-center justify-between cursor-pointer group py-1"
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-stone-400 group-hover:text-stone-600 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.div>
          
          <h3 className="font-domine text-[18px] text-[#193d34] leading-none truncate">
            {title}
          </h3>

          {pieLayout === 'inline' && (
            <div className="flex items-center gap-1.5 ml-1">
              <ProgressPie 
                percentage={percentage} 
                color={isComplete ? "var(--color-primary-fresh-green)" : "var(--color-things3-blue)"}
                size={16}
                strokeWidth={2}
              />
              <span className="ingredient-group-progress-counter">
                {checkedCount}/{totalCount}
              </span>
            </div>
          )}
        </div>

        {/* Optional Right Side Decoration if needed */}
      </div>

      {/* Pie below header option */}
      {pieLayout === 'below' && (
        <div className="flex items-center gap-2 mt-1 mb-3 ml-6">
          <ProgressPie 
            percentage={percentage} 
            color={isComplete ? "var(--color-primary-fresh-green)" : "var(--color-things3-blue)"}
            size={14}
            strokeWidth={1.5}
          />
          <span className="ingredient-group-progress-counter-below">
            {checkedCount} of {totalCount} ingredients checked
          </span>
        </div>
      )}

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 ml-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


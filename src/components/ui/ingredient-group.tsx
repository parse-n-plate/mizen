'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ProgressPie } from './progress-pie';

/**
 * IngredientGroup Component
 * 
 * Displays a collapsible group of ingredients with a progress indicator.
 * Shows the group title, progress pie (checked/total), and wraps the ingredient list.
 * 
 * @param title - The name of the ingredient group (e.g., "Main", "Sauce")
 * @param totalCount - Total number of ingredients in this group
 * @param checkedCount - Number of checked/completed ingredients
 * @param isInitialExpanded - Whether the group starts expanded (default: true)
 * @param onToggle - Callback when group is expanded/collapsed
 * @param pieLayout - Layout for progress pie: "inline" (next to title) or "below" (below title)
 * @param children - The ingredient list content (typically IngredientCard components)
 */

interface IngredientGroupProps {
  title: string;
  totalCount: number;
  checkedCount: number;
  isInitialExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
  pieLayout?: 'inline' | 'below';
  children: React.ReactNode;
}

export function IngredientGroup({
  title,
  totalCount,
  checkedCount,
  isInitialExpanded = true,
  onToggle,
  pieLayout = 'inline',
  children
}: IngredientGroupProps) {
  // Internal state for expansion (can be controlled via onToggle)
  const [isExpanded, setIsExpanded] = useState(isInitialExpanded);

  // Update internal state when isInitialExpanded changes
  useEffect(() => {
    setIsExpanded(isInitialExpanded);
  }, [isInitialExpanded]);

  // Calculate progress percentage
  const progressPercentage = totalCount > 0 
    ? Math.round((checkedCount / totalCount) * 100) 
    : 0;

  // Handle toggle
  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (onToggle) {
      onToggle(newExpanded);
    }
  };

  return (
    <div className="ingredient-group mb-6">
      {/* Group Header - Clickable to toggle expansion */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between py-3 pl-2 pr-0 group cursor-pointer transition-colors duration-[180ms] hover:opacity-80 relative"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title} ingredient group`}
      >
        {/* Container for title and progress pie */}
        <div className="flex items-center gap-3 flex-1">
          {/* Group Title */}
          <h3 className="font-domine text-[18px] text-[#193d34] font-semibold leading-[1.2]">
            {title}
          </h3>

          {/* Progress Pie - Inline Layout (right next to title) */}
          {pieLayout === 'inline' && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <ProgressPie 
                percentage={progressPercentage} 
                size={18} 
                strokeWidth={1.5}
                color="#193d34"
              />
            </div>
          )}
        </div>

        {/* Chevron Icon - Right aligned, rotates when expanded, fades in on hover */}
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex-shrink-0 ingredient-group-chevron"
        >
          <ChevronDown className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors duration-[180ms]" />
        </motion.div>
      </button>

      {/* Progress Pie - Below Layout (shown when inline is not used) */}
      {pieLayout === 'below' && (
        <div className="flex items-center gap-2 px-8 pb-2">
          <ProgressPie 
            percentage={progressPercentage} 
            size={18} 
            strokeWidth={1.5}
            color="#193d34"
          />
        </div>
      )}

      {/* Collapsible Content - Ingredient List */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


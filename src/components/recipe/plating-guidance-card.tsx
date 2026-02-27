'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlatingGuidanceCardProps {
  platingNotes?: string;
  servingVessel?: string;
  servingTemp?: string;
}

export default function PlatingGuidanceCard({
  platingNotes,
  servingVessel: _servingVessel,
  servingTemp: _servingTemp,
}: PlatingGuidanceCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Default plating notes if none provided
  const displayNotes = platingNotes || 'No plating suggestions available yet.';

  return (
    <div className="bg-[#fafaf9] rounded-[24px] border border-[#f5f5f4] overflow-hidden w-full">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-[24px]">🍽️</div>
          <p className="font-albert font-semibold text-[20px] text-[#292524] leading-tight">
            Plating Suggestions
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-stone-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-stone-400" />
        )}
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-0">
              {/* Divider */}
              <div className="h-px bg-stone-200 mb-4" />

              {/* Plating notes */}
              <p
                className="font-albert text-[16px] leading-[1.6] whitespace-pre-wrap"
                style={{ color: 'rgba(87, 83, 78, 1)' }}
              >
                {displayNotes}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

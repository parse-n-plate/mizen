'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlatingGuidanceCardProps {
  platingNotes?: string;
  servingVessel?: string;
  servingTemp?: string;
  onNotesChange?: (notes: string) => void;
}

export default function PlatingGuidanceCard({
  platingNotes,
  servingVessel,
  servingTemp,
  onNotesChange,
}: PlatingGuidanceCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(platingNotes || '');

  const handleSave = () => {
    if (onNotesChange) {
      onNotesChange(editedNotes);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedNotes(platingNotes || '');
    setIsEditing(false);
  };

  // Default plating notes if none provided
  const displayNotes = platingNotes || editedNotes || 'No plating suggestions available yet.';

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
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter alone (without Shift) saves and exits editing mode
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault(); // Prevent default newline behavior
                        handleSave();
                      }
                      // Shift+Enter allows normal newline behavior
                    }}
                    className="w-full min-h-[120px] p-3 border border-stone-200 rounded-lg font-albert text-[16px] text-[#57534e] leading-[1.6] focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
                    style={{
                      color: 'rgba(87, 83, 78, 1)',
                      backgroundColor: 'var(--color-white)',
                    }}
                    placeholder="Add your plating notes here..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-stone-900 text-white rounded-lg font-albert text-[14px] font-medium hover:bg-stone-800 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg font-albert text-[14px] font-medium hover:bg-stone-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-albert text-[16px] text-[#57534e] leading-[1.6] whitespace-pre-wrap">
                    {displayNotes}
                  </p>

                  {/* Serving details */}
                  {(servingVessel || servingTemp) && (
                    <div className="flex gap-4 flex-wrap mt-4">
                      {servingVessel && (
                        <div className="bg-white px-3 py-2 rounded-lg border border-stone-200">
                          <p className="font-albert text-[12px] text-stone-500 leading-tight mb-0.5">
                            Serve in
                          </p>
                          <p className="font-albert text-[14px] text-stone-700 leading-tight font-medium">
                            {servingVessel}
                          </p>
                        </div>
                      )}
                      {servingTemp && (
                        <div className="bg-white px-3 py-2 rounded-lg border border-stone-200">
                          <p className="font-albert text-[12px] text-stone-500 leading-tight mb-0.5">
                            Temperature
                          </p>
                          <p className="font-albert text-[14px] text-stone-700 leading-tight font-medium">
                            {servingTemp}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit button */}
                  {onNotesChange && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-3 text-[14px] font-albert text-stone-600 hover:text-stone-900 underline underline-offset-2"
                    >
                      Edit notes
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

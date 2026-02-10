'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, Refrigerator, Snowflake, Clock, RotateCcw, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StorageGuidanceCardProps {
  storageGuide?: string;
  shelfLife?: {
    fridge?: number | null;
    freezer?: number | null;
  };
  storedAt?: string;
  onMarkAsStored?: () => void;
  onResetStorage?: () => void;
}

export default function StorageGuidanceCard({
  storageGuide,
  shelfLife,
  storedAt,
  onMarkAsStored,
  onResetStorage,
}: StorageGuidanceCardProps) {
  // Use AI-generated storage guide, or minimal fallback for legacy recipes without storage data
  const defaultStorageText = storageGuide || "Storage guidance not available. Refrigerate leftovers promptly.";

  // State for storage text editing
  const [storageText, setStorageText] = useState<string>(defaultStorageText);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update storage text when storageGuide prop changes (e.g., when AI generates new guidance)
  useEffect(() => {
    setStorageText(storageGuide || "Storage guidance not available. Refrigerate leftovers promptly.");
  }, [storageGuide]);

  // Auto-focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  // Handle reset
  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStorageText(defaultStorageText);
    setIsEditing(false);
  };

  // Handle blur (when user clicks away)
  const handleBlur = () => {
    setIsEditing(false);
    if (textareaRef.current) {
      setStorageText(textareaRef.current.value);
    }
  };

  // Handle click to start editing
  const handleClick = () => {
    setIsEditing(true);
  };

  // Handle key press (Escape to cancel, Shift+Enter for new line, Enter alone to save)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      // Cancel editing and restore previous value
      setIsEditing(false);
      if (textareaRef.current) {
        textareaRef.current.value = storageText;
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // Enter alone (without Shift) saves and exits editing mode
      e.preventDefault(); // Prevent default newline behavior
      setIsEditing(false);
      if (textareaRef.current) {
        setStorageText(textareaRef.current.value);
      }
    }
    // Shift+Enter allows normal newline behavior (no preventDefault)
  };

  const isDefault = storageText === defaultStorageText;
  // Calculate days remaining if stored
  const daysRemaining = useMemo(() => {
    if (!storedAt || !shelfLife?.fridge) return null;

    const stored = new Date(storedAt);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - stored.getTime()) / (1000 * 60 * 60 * 24));
    const remaining = shelfLife.fridge - daysPassed;

    return Math.max(0, remaining);
  }, [storedAt, shelfLife]);

  // Calculate percentage for progress bar
  const percentageUsed = useMemo(() => {
    if (!storedAt || !shelfLife?.fridge || daysRemaining === null) return 0;

    return Math.min(100, ((shelfLife.fridge - daysRemaining) / shelfLife.fridge) * 100);
  }, [storedAt, shelfLife, daysRemaining]);

  // Determine warning state
  const isNearExpiration = daysRemaining !== null && daysRemaining <= 1;
  const isExpired = daysRemaining !== null && daysRemaining === 0;

  return (
    <div className="bg-[#fafaf9] rounded-[24px] border border-[#f5f5f4] overflow-hidden p-6 w-full group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-[24px]">📦</div>
          <p className="font-albert font-semibold text-[20px] text-[#292524] leading-tight">
            Storage & Shelf Life
          </p>
        </div>
        {/* Reset button - only show if text has been modified */}
        {!isDefault && (
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-white hover:bg-stone-50 text-stone-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95 border border-stone-200"
            title="Reset to default"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Storage instructions - Editable */}
      <div className="mb-4 relative">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            defaultValue={storageText}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Add storage instructions..."
            className={cn(
              "w-full min-h-[60px] p-3 bg-white rounded-lg border border-stone-300",
              "font-albert text-[16px] text-[#57534e] leading-[1.6]",
              "focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent",
              "resize-none transition-all duration-200",
              "placeholder:text-stone-400"
            )}
            rows={2}
          />
        ) : (
          <div
            onClick={handleClick}
            className={cn(
              "min-h-[60px] p-3 bg-white/50 rounded-lg border border-dashed border-stone-200",
              "font-albert text-[16px] text-[#57534e] leading-[1.6] cursor-text transition-all duration-200",
              "hover:bg-white hover:border-stone-300",
              "relative"
            )}
          >
            <div className="whitespace-pre-wrap break-words">
              {storageText}
            </div>
            {/* Edit icon hint on hover */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 className="h-3.5 w-3.5 text-stone-400" />
            </div>
          </div>
        )}
      </div>

      {/* Shelf life information */}
      {shelfLife && (
        <div className="space-y-3 mb-4">
          {shelfLife.fridge && (
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-stone-200">
              <Refrigerator className="w-5 h-5 text-[#0088ff]" />
              <div className="flex-1">
                <p className="font-albert text-[12px] text-stone-500 leading-tight mb-0.5">
                  Fridge
                </p>
                <p className="font-albert text-[15px] text-stone-700 leading-tight font-semibold">
                  {shelfLife.fridge} {shelfLife.fridge === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>
          )}
          {shelfLife.freezer && (
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-stone-200">
              <Snowflake className="w-5 h-5 text-[#00b4d8]" />
              <div className="flex-1">
                <p className="font-albert text-[12px] text-stone-500 leading-tight mb-0.5">
                  Freezer
                </p>
                <p className="font-albert text-[15px] text-stone-700 leading-tight font-semibold">
                  {shelfLife.freezer} {shelfLife.freezer === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Storage tracking */}
      {storedAt ? (
        <div className="bg-white px-4 py-3 rounded-lg border border-stone-200 relative group/storage">
          {/* Reset storage button */}
          {onResetStorage && (
            <button
              onClick={onResetStorage}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-600 opacity-0 group-hover/storage:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95 border border-stone-200"
              title="Reset storage tracking"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Days remaining counter */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-500" />
              <p className="font-albert text-[14px] text-stone-600 font-medium">
                Days Left
              </p>
            </div>
            <p
              className={`font-albert text-[18px] font-bold ${
                isExpired
                  ? 'text-red-600'
                  : isNearExpiration
                  ? 'text-orange-600'
                  : 'text-stone-700'
              }`}
            >
              {daysRemaining}/{shelfLife?.fridge || 0}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-300 ${
                isExpired
                  ? 'bg-red-500'
                  : isNearExpiration
                  ? 'bg-orange-500'
                  : 'bg-[#0088ff]'
              }`}
              style={{ width: `${percentageUsed}%` }}
            />
          </div>

          {/* Stored date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stone-400" />
            <p className="font-albert text-[12px] text-stone-500">
              Stored on {new Date(storedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>

          {/* Warning message */}
          {isExpired && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2">
              <p className="font-albert text-[12px] text-red-700 font-medium">
                ⚠️ This dish has expired. Please discard for safety.
              </p>
            </div>
          )}
          {isNearExpiration && !isExpired && (
            <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-2">
              <p className="font-albert text-[12px] text-orange-700 font-medium">
                ⚠️ Use soon! This dish should be consumed today.
              </p>
            </div>
          )}
        </div>
      ) : (
        // Not stored yet - show CTA button
        onMarkAsStored && (
          <button
            onClick={onMarkAsStored}
            className="w-full bg-[#0c0a09] text-white px-4 py-3 rounded-[12px] font-albert text-[16px] font-medium hover:bg-[#1c1a19] transition-colors flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            Mark as Stored
          </button>
        )
      )}
    </div>
  );
}

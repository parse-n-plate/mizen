'use client';

import React, { useState, useEffect } from 'react';
import { MousePointer2, Play, X, ShoppingBasket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminSettings } from '@/contexts/AdminSettingsContext';
import LoadingAnimation from '@/components/ui/loading-animation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { ERROR_CODES } from '@/utils/formatError';

interface AdminPrototypingPanelProps {
  /** Optional callback when ingredients button is clicked */
  onIngredientsClick?: () => void;
}

export function AdminPrototypingPanel({ onIngredientsClick }: AdminPrototypingPanelProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState<'gathering' | 'reading' | 'plating' | 'done' | undefined>(undefined);
  const { settings: adminSettings, toggleShowIngredientsForStepList } = useAdminSettings();
  const { showError, showSuccess, showWarning, showInfo } = useToast();

  const sampleUrl = 'https://www.allrecipes.com/recipe/example';

  // Add keyboard shortcut support (Cmd/Ctrl + Shift + P)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux) + Shift + P
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
      // Also support Escape to close
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Function to trigger loading animation for 5 seconds with progress simulation
  const triggerLoadingAnimation = () => {
    setShowLoadingAnimation(true);
    setLoadingProgress(0);
    setLoadingPhase('gathering');

    // Simulate progress over 5 seconds
    const startTime = Date.now();
    const duration = 5000; // 5 seconds

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setLoadingProgress(progress);

      // Update phase based on progress
      if (progress < 33) {
        setLoadingPhase('gathering');
      } else if (progress < 66) {
        setLoadingPhase('reading');
      } else if (progress < 100) {
        setLoadingPhase('plating');
      } else {
        setLoadingPhase('done');
      }

      if (progress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        // Hide after completion
        setTimeout(() => {
          setShowLoadingAnimation(false);
          setLoadingProgress(0);
          setLoadingPhase(undefined);
        }, 500);
      }
    };

    requestAnimationFrame(updateProgress);
  };

  return (
    <>
      {/* Floating buttons container - only visible when panel is closed */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[99] flex items-center gap-2">
          {/* Ingredients Button - positioned to the left of prototype button */}
          {onIngredientsClick && (
            <button
              onClick={onIngredientsClick}
              className={cn(
                "w-10 h-10 rounded-full",
                "bg-stone-900/60 backdrop-blur-sm",
                "border border-stone-700/40",
                "flex items-center justify-center",
                "text-white/70 hover:text-white",
                "hover:bg-stone-900/80",
                "transition-all duration-200",
                "shadow-lg hover:shadow-xl",
                "opacity-60 hover:opacity-100",
                "group"
              )}
              aria-label="Go to Ingredients"
              title="Go to Ingredients"
            >
              <ShoppingBasket className="h-4 w-4 transition-transform group-hover:scale-110" />
            </button>
          )}
          
          {/* Prototype Lab Button - shifted left to make room for ingredients button */}
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              "w-10 h-10 rounded-full",
              "bg-stone-900/60 backdrop-blur-sm",
              "border border-stone-700/40",
              "flex items-center justify-center",
              "text-white/70 hover:text-white",
              "hover:bg-stone-900/80",
              "transition-all duration-200",
              "shadow-lg hover:shadow-xl",
              "opacity-60 hover:opacity-100",
              "group"
            )}
            aria-label="Open Prototype Lab (Cmd/Ctrl + Shift + P)"
            title="Open Prototype Lab (Cmd/Ctrl + Shift + P)"
          >
            <MousePointer2 className="h-4 w-4 transition-transform group-hover:scale-110" />
          </button>
        </div>
      )}

      {/* Modal Backdrop - appears when modal is open */}
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 z-[100]",
            "bg-black/40 backdrop-blur-sm",
            "animate-in fade-in duration-200"
          )}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Centered Modal - completely hidden when closed */}
      {isOpen && (
        <div 
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101]",
            "bg-white border border-[#E0E0E0]",
            "shadow-2xl",
            "rounded-xl",
            "w-[90vw] max-w-md",
            "max-h-[85vh] overflow-y-auto",
            "animate-in fade-in zoom-in-95 duration-200"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 space-y-6">
            {/* Header with close button */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <MousePointer2 className="h-4 w-4 text-[#FFBA25]" />
                <h2 className="font-domine font-bold text-stone-900">Prototype Lab</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={cn(
                  "w-6 h-6 rounded-full",
                  "flex items-center justify-center",
                  "text-stone-400 hover:text-stone-900",
                  "hover:bg-stone-100",
                  "transition-colors"
                )}
                aria-label="Close Prototype Lab"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Toggle Controls Section */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-albert font-bold uppercase tracking-widest text-stone-400">Display Options</h3>
              
              {/* Toggle for Ingredients List */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors">
                <div className="flex flex-col">
                  <span className="text-xs font-albert font-medium text-stone-900">Ingredients for Step</span>
                  <span className="text-[10px] font-albert text-stone-400 mt-0.5">Show ingredients list in context panel</span>
                </div>
                <button
                  onClick={toggleShowIngredientsForStepList}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0C0A09]/20 focus:ring-offset-2",
                    adminSettings.showIngredientsForStepList ? "bg-stone-900" : "bg-stone-200"
                  )}
                  aria-label="Toggle ingredients for step list"
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      adminSettings.showIngredientsForStepList ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Loading Animation Test Section */}
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <h3 className="text-[10px] font-albert font-bold uppercase tracking-widest text-stone-400">Animation Tests</h3>

              {/* Button to trigger loading animation */}
              <Button
                onClick={triggerLoadingAnimation}
                disabled={showLoadingAnimation}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-albert font-medium py-2"
                aria-label="Trigger loading animation for 5 seconds"
              >
                <Play className="h-3 w-3 mr-2" />
                Test Loading Animation
              </Button>
              {showLoadingAnimation && (
                <p className="text-[10px] font-albert text-stone-400 text-center">
                  Animation will run for 5 seconds
                </p>
              )}
            </div>

            {/* Toast Previews Section */}
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <h3 className="text-[10px] font-albert font-bold uppercase tracking-widest text-stone-400">Toast Previews</h3>

              {/* Success */}
              <button
                onClick={() => showSuccess('Recipe parsed successfully!', 'Navigating to recipe page...', sampleUrl)}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <span className="text-xs font-albert font-medium text-stone-900">Success</span>
                <span className="block text-[10px] font-albert text-stone-400 mt-0.5">With "View original" link</span>
              </button>

              {/* Error: No Recipe Found */}
              <button
                onClick={() => showError({ code: ERROR_CODES.ERR_NO_RECIPE_FOUND, sourceUrl: sampleUrl })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <span className="text-xs font-albert font-medium text-stone-900">No Recipe Found</span>
                <span className="block text-[10px] font-albert text-stone-400 mt-0.5">With "Visit page" action</span>
              </button>

              {/* Error: Fetch Failed */}
              <button
                onClick={() => showError({ code: ERROR_CODES.ERR_FETCH_FAILED, sourceUrl: sampleUrl })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <span className="text-xs font-albert font-medium text-stone-900">Fetch Failed</span>
                <span className="block text-[10px] font-albert text-stone-400 mt-0.5">Site unreachable / blocking</span>
              </button>

              {/* Error: AI Parse Failed */}
              <button
                onClick={() => showError({ code: ERROR_CODES.ERR_AI_PARSE_FAILED, sourceUrl: sampleUrl })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <span className="text-xs font-albert font-medium text-stone-900">AI Parse Failed</span>
                <span className="block text-[10px] font-albert text-stone-400 mt-0.5">Page found but extraction failed</span>
              </button>

              {/* Error: Timeout */}
              <button
                onClick={() => showError({ code: ERROR_CODES.ERR_TIMEOUT, sourceUrl: sampleUrl })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <span className="text-xs font-albert font-medium text-stone-900">Timeout</span>
                <span className="block text-[10px] font-albert text-stone-400 mt-0.5">Website too slow</span>
              </button>

              {/* Error: Invalid URL */}
              <button
                onClick={() => showError({ code: ERROR_CODES.ERR_INVALID_URL })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <span className="text-xs font-albert font-medium text-stone-900">Invalid URL</span>
                <span className="block text-[10px] font-albert text-stone-400 mt-0.5">No action button</span>
              </button>

              {/* Error: Rate Limit */}
              <button
                onClick={() => showError({ code: ERROR_CODES.ERR_RATE_LIMIT, retryAfter: Date.now() + 45000 })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <span className="text-xs font-albert font-medium text-stone-900">Rate Limit</span>
                <span className="block text-[10px] font-albert text-stone-400 mt-0.5">With retry countdown</span>
              </button>

              {/* Error: API Unavailable */}
              <button
                onClick={() => showError({ code: ERROR_CODES.ERR_API_UNAVAILABLE })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <span className="text-xs font-albert font-medium text-stone-900">API Unavailable</span>
                <span className="block text-[10px] font-albert text-stone-400 mt-0.5">Service down</span>
              </button>

              {/* Error: Unknown */}
              <button
                onClick={() => showError({ code: ERROR_CODES.ERR_UNKNOWN })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <span className="text-xs font-albert font-medium text-stone-900">Unknown Error</span>
                <span className="block text-[10px] font-albert text-stone-400 mt-0.5">Generic fallback</span>
              </button>

              {/* Info: Not a URL */}
              <button
                onClick={() => showInfo({ code: ERROR_CODES.ERR_NOT_A_URL })}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <span className="text-xs font-albert font-medium text-stone-900">Not a URL</span>
                <span className="block text-[10px] font-albert text-stone-400 mt-0.5">Info toast</span>
              </button>

              {/* Warning */}
              <button
                onClick={() => showWarning('Check your input', 'Something looks off but we can still try.')}
                className="w-full text-left p-2 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <span className="text-xs font-albert font-medium text-stone-900">Warning</span>
                <span className="block text-[10px] font-albert text-stone-400 mt-0.5">Generic warning toast</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Animation Component */}
      <LoadingAnimation 
        isVisible={showLoadingAnimation}
        progress={loadingProgress}
        phase={loadingPhase}
      />
    </>
  );
}


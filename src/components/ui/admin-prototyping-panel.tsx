'use client';

import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { MousePointer2, Play, X, Database, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePrototypeLab } from '@/contexts/PrototypeLabContext';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { TEST_FIXTURE_RECIPES } from '@/lib/mockRecipeData';
import LoadingAnimation from '@/components/ui/loading-animation';
import { Button } from '@/components/ui/button';

export function AdminPrototypingPanel() {
  const { isOpen, closeLab } = usePrototypeLab();
  const { addRecipe, clearRecipes, recentRecipes } = useParsedRecipes();
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState<'gathering' | 'reading' | 'plating' | 'done' | undefined>(undefined);
  const [selectedFixtures, setSelectedFixtures] = useState<Set<number>>(
    () => new Set(TEST_FIXTURE_RECIPES.map((_, i) => i)),
  );
  const [isSeeding, setIsSeeding] = useState(false);

  const toggleFixture = (index: number) => {
    setSelectedFixtures(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedFixtures.size === TEST_FIXTURE_RECIPES.length) {
      setSelectedFixtures(new Set());
    } else {
      setSelectedFixtures(new Set(TEST_FIXTURE_RECIPES.map((_, i) => i)));
    }
  };

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

  const handleSeedRecipes = () => {
    if (selectedFixtures.size === 0) return;
    setIsSeeding(true);
    try {
      clearRecipes();
      const recipesToSeed = TEST_FIXTURE_RECIPES.filter((_, i) => selectedFixtures.has(i));
      for (const fixture of recipesToSeed) {
        addRecipe(fixture.recipe as Parameters<typeof addRecipe>[0]);
      }
      toast.success(`Seeded ${recipesToSeed.length} test recipes`, {
        description: recipesToSeed.map(f => f.label).join(', '),
      });
    } catch {
      toast.error('Failed to seed recipes');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearRecipes = () => {
    clearRecipes();
    toast.success('Cleared all recipes');
  };

  return (
    <>
      {/* Modal Backdrop - appears when modal is open */}
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 z-[100]",
            "bg-black/40 backdrop-blur-sm",
            "animate-in fade-in duration-200"
          )}
          onClick={closeLab}
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
          {/* Header */}
          <div className="px-6 pt-6 pb-0">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <MousePointer2 className="h-4 w-4 text-[#FFBA25]" />
                <h2 className="font-domine font-bold text-stone-900">Prototype Lab</h2>
              </div>
              <button
                onClick={closeLab}
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
          </div>

          {/* Tabbed content */}
          <Tabs.Root defaultValue="fixtures">
            <Tabs.List className="flex border-b border-stone-200 px-6">
              <Tabs.Trigger
                value="fixtures"
                className="px-3 py-2 text-xs font-albert font-medium text-stone-500 border-b-2 border-transparent data-[state=active]:text-stone-900 data-[state=active]:border-stone-900 transition-colors"
              >
                Test Fixtures
              </Tabs.Trigger>
              <Tabs.Trigger
                value="animations"
                className="px-3 py-2 text-xs font-albert font-medium text-stone-500 border-b-2 border-transparent data-[state=active]:text-stone-900 data-[state=active]:border-stone-900 transition-colors"
              >
                Animations
              </Tabs.Trigger>
            </Tabs.List>

            {/* Test Fixtures Tab */}
            <Tabs.Content value="fixtures" className="px-6 py-4 space-y-3">
              {/* Select all / description row */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-albert text-stone-400">
                  Select recipes to seed. Seeding replaces existing recipes.
                </p>
                <button
                  onClick={toggleAll}
                  className="text-[10px] font-albert font-medium text-stone-500 hover:text-stone-900 transition-colors whitespace-nowrap ml-2"
                >
                  {selectedFixtures.size === TEST_FIXTURE_RECIPES.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              {/* Fixture checklist */}
              <div className="max-h-[240px] overflow-y-auto space-y-0.5">
                {TEST_FIXTURE_RECIPES.map((fixture, index) => {
                  const checked = selectedFixtures.has(index);
                  return (
                    <button
                      key={fixture.label}
                      onClick={() => toggleFixture(index)}
                      className={cn(
                        "w-full flex items-center gap-2.5 p-2 rounded-lg transition-colors text-left",
                        "hover:bg-stone-50",
                        checked ? "opacity-100" : "opacity-50"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                          checked
                            ? "bg-stone-900 border-stone-900"
                            : "border-stone-300 bg-white"
                        )}
                      >
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-xs font-albert font-medium text-stone-900 truncate">
                        {fixture.label}
                      </span>
                      <div className="flex gap-1 flex-shrink-0 ml-auto">
                        {fixture.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className="text-[9px] font-albert px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleSeedRecipes}
                  disabled={isSeeding || selectedFixtures.size === 0}
                  className="flex-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-albert font-medium py-2"
                >
                  <Database className="h-3 w-3 mr-2" />
                  {isSeeding ? 'Seeding...' : `Seed ${selectedFixtures.size} Recipe${selectedFixtures.size !== 1 ? 's' : ''}`}
                </Button>
                <Button
                  onClick={handleClearRecipes}
                  disabled={recentRecipes.length === 0}
                  variant="destructive"
                  className="text-xs font-albert font-medium py-2"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Clear All
                </Button>
              </div>

              {/* Current storage indicator */}
              <p className="text-[10px] font-albert text-stone-400 text-center">
                {recentRecipes.length} recipe{recentRecipes.length !== 1 ? 's' : ''} currently in storage
              </p>
            </Tabs.Content>

            {/* Animations Tab */}
            <Tabs.Content value="animations" className="px-6 py-4 space-y-3">
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
            </Tabs.Content>
          </Tabs.Root>
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

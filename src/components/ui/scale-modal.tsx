'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { Slider } from './slider';

interface Ingredient {
  amount?: string;
  units?: string;
  ingredient: string;
}

interface IngredientGroup {
  groupName: string;
  ingredients: (string | Ingredient)[];
}

interface ScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  servings: number;
  onServingsChange: (n: number) => void;
  customMultiplier: number;
  onCustomMultiplierChange: (n: number) => void;
  ingredientGroups: IngredientGroup[];
  ingredientScaleOverrides: Record<string, number>;
  onIngredientScaleOverridesChange: (overrides: Record<string, number>) => void;
  originalServings: number;
  onResetServings: () => void;
}

export function ScaleModal({
  isOpen,
  onClose,
  servings,
  onServingsChange,
  customMultiplier,
  onCustomMultiplierChange,
  ingredientGroups,
  ingredientScaleOverrides,
  onIngredientScaleOverridesChange,
  originalServings,
  onResetServings,
}: ScaleModalProps) {
  const [activeTab, setActiveTab] = useState('amount');
  const [selectedIngredientKey, setSelectedIngredientKey] = useState<string | null>(null);

  const handleCustomMultiplierSliderChange = (values: number[]) => {
    onCustomMultiplierChange(values[0]);
  };

  const handleCustomMultiplierInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0.5 && value <= 10) {
      onCustomMultiplierChange(value);
    }
  };

  const handleServingsSliderChange = (values: number[]) => {
    onServingsChange(values[0]);
  };

  const handleServingsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      onServingsChange(value);
    }
  };

  const handleIngredientSliderChange = (ingredientKey: string, values: number[]) => {
    onIngredientScaleOverridesChange({
      ...ingredientScaleOverrides,
      [ingredientKey]: values[0],
    });
  };

  const handleIngredientInputChange = (ingredientKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0.5 && value <= 10) {
      onIngredientScaleOverridesChange({
        ...ingredientScaleOverrides,
        [ingredientKey]: value,
      });
    } else if (e.target.value === '') {
      // Remove override if input is cleared
      const newOverrides = { ...ingredientScaleOverrides };
      delete newOverrides[ingredientKey];
      onIngredientScaleOverridesChange(newOverrides);
    }
  };

  // Flatten all ingredients for the ingredient tab
  const allIngredients = ingredientGroups.flatMap((group) =>
    group.ingredients
      .filter((ing): ing is Ingredient => typeof ing !== 'string')
      .map((ing) => ({
        ...ing,
        groupName: group.groupName,
        key: `${group.groupName}-${ing.ingredient}`,
      }))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-[201] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-domine font-bold text-xl text-stone-900">Scale Recipe</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-stone-50 rounded-full text-stone-400 hover:text-stone-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b border-stone-100 px-6">
                <Tabs.List className="flex gap-1">
                  <Tabs.Trigger
                    value="amount"
                    className="font-albert font-medium text-sm px-4 py-3 text-stone-600 hover:text-stone-900 transition-colors border-b-2 border-transparent data-[state=active]:border-stone-900 data-[state=active]:text-stone-900"
                  >
                    Amount
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="serving"
                    className="font-albert font-medium text-sm px-4 py-3 text-stone-600 hover:text-stone-900 transition-colors border-b-2 border-transparent data-[state=active]:border-stone-900 data-[state=active]:text-stone-900"
                  >
                    Serving
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="ingredient"
                    className="font-albert font-medium text-sm px-4 py-3 text-stone-600 hover:text-stone-900 transition-colors border-b-2 border-transparent data-[state=active]:border-stone-900 data-[state=active]:text-stone-900"
                  >
                    Ingredient
                  </Tabs.Trigger>
                </Tabs.List>
              </div>

              <div className="p-6 max-h-[400px] overflow-y-auto">
                {/* Amount Tab */}
                <Tabs.Content value="amount" className="outline-none">
                  <div className="space-y-4">
                    <div>
                      <p className="font-albert text-xs text-stone-500 mb-4">
                        Scale the entire recipe between 0.5x and 10x
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Slider
                            min={0.5}
                            max={10}
                            step={0.5}
                            value={[customMultiplier]}
                            onValueChange={handleCustomMultiplierSliderChange}
                            className="w-full"
                          />
                        </div>
                        <input
                          type="number"
                          min="0.5"
                          max="10"
                          step="0.5"
                          value={customMultiplier}
                          onChange={handleCustomMultiplierInputChange}
                          className="w-20 font-albert text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent text-center"
                        />
                      </div>
                    </div>
                  </div>
                </Tabs.Content>

                {/* Serving Tab */}
                <Tabs.Content value="serving" className="outline-none">
                  <div className="space-y-4">
                    <div>
                      <p className="font-albert text-xs text-stone-500 mb-4">
                        Adjust the number of servings for this recipe
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Slider
                            min={1}
                            max={Math.max(originalServings * 4, 20)}
                            step={1}
                            value={[servings]}
                            onValueChange={handleServingsSliderChange}
                            className="w-full"
                          />
                        </div>
                        <input
                          type="number"
                          min="1"
                          value={servings}
                          onChange={handleServingsInputChange}
                          className="w-20 font-albert text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent text-center"
                        />
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <p className="font-albert text-xs text-stone-400">
                          Original: {originalServings} servings
                        </p>
                        <button
                          onClick={onResetServings}
                          className="font-albert text-xs text-stone-600 hover:text-stone-900 underline"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </Tabs.Content>

                {/* Ingredient Tab */}
                <Tabs.Content value="ingredient" className="outline-none">
                  <div className="space-y-4">
                    {!selectedIngredientKey ? (
                      /* Ingredient Selection View */
                      <div>
                        <p className="font-albert text-xs text-stone-500 mb-4">
                          Choose an ingredient to adjust its scale multiplier
                        </p>
                        <div className="space-y-2 max-h-[280px] overflow-y-auto">
                          {allIngredients.map((ing) => (
                            <button
                              key={ing.key}
                              onClick={() => setSelectedIngredientKey(ing.key)}
                              className="w-full p-3 text-left hover:bg-stone-50 rounded-lg transition-colors border border-stone-200 hover:border-stone-300"
                            >
                              <p className="font-albert text-sm text-stone-900">{ing.ingredient}</p>
                              <p className="font-albert text-xs text-stone-400">
                                {ing.amount} {ing.units}
                                {ingredientScaleOverrides[ing.key] && (
                                  <span className="ml-2 text-stone-600">• {ingredientScaleOverrides[ing.key]}x</span>
                                )}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Ingredient Scale Adjustment View */
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={() => setSelectedIngredientKey(null)}
                            className="font-albert text-sm text-stone-600 hover:text-stone-900 flex items-center gap-1"
                          >
                            ← Back
                          </button>
                          {ingredientScaleOverrides[selectedIngredientKey] && (
                            <button
                              onClick={() => {
                                const newOverrides = { ...ingredientScaleOverrides };
                                delete newOverrides[selectedIngredientKey];
                                onIngredientScaleOverridesChange(newOverrides);
                              }}
                              className="font-albert text-xs text-stone-600 hover:text-stone-900 underline"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        {(() => {
                          const selectedIng = allIngredients.find(ing => ing.key === selectedIngredientKey);
                          if (!selectedIng) return null;
                          return (
                            <div>
                              <div className="mb-4 p-3 bg-stone-50 rounded-lg">
                                <p className="font-albert text-sm font-medium text-stone-900">{selectedIng.ingredient}</p>
                                <p className="font-albert text-xs text-stone-400">
                                  Original: {selectedIng.amount} {selectedIng.units}
                                </p>
                              </div>
                              <label className="block font-albert text-sm font-medium text-stone-700 mb-2">
                                Scale Multiplier
                              </label>
                              <p className="font-albert text-xs text-stone-500 mb-4">
                                Adjust between 0.5x and 10x
                              </p>
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <Slider
                                    min={0.5}
                                    max={10}
                                    step={0.5}
                                    value={[ingredientScaleOverrides[selectedIngredientKey] || 1]}
                                    onValueChange={(values) => handleIngredientSliderChange(selectedIngredientKey, values)}
                                    className="w-full"
                                  />
                                </div>
                                <input
                                  type="number"
                                  min="0.5"
                                  max="10"
                                  step="0.5"
                                  value={ingredientScaleOverrides[selectedIngredientKey] || ''}
                                  onChange={(e) => handleIngredientInputChange(selectedIngredientKey, e)}
                                  placeholder="1.0"
                                  className="w-20 font-albert text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent text-center"
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </Tabs.Content>
              </div>
            </Tabs.Root>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

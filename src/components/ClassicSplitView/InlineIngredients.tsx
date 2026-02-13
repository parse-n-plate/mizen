'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { findIngredientsInText, IngredientInfo } from '@/utils/ingredientMatcher';

interface IngredientGroup {
  groupName: string;
  ingredients: {
    amount: string;
    units: string;
    ingredient: string;
    description?: string;
    substitutions?: string[];
  }[];
}

interface InlineIngredientsProps {
  stepDetail: string;
  allIngredients: IngredientInfo[];
  ingredientGroups?: IngredientGroup[];
}

function toTitleCase(text: string): string {
  if (!text) return text;
  return text.replace(/\b\w+\b/g, (word) => {
    if (/^[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/.test(word)) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

function findIngredientDetails(
  name: string,
  groups: IngredientGroup[]
): { description?: string; substitutions?: string[] } | null {
  const lowerName = name.toLowerCase();
  for (const group of groups) {
    for (const ing of group.ingredients) {
      if (ing.ingredient.toLowerCase() === lowerName) {
        return { description: ing.description, substitutions: ing.substitutions };
      }
    }
  }
  return null;
}

export default function InlineIngredients({ stepDetail, allIngredients, ingredientGroups = [] }: InlineIngredientsProps) {
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);

  const matchedIngredients = useMemo(
    () => findIngredientsInText(stepDetail, allIngredients),
    [stepDetail, allIngredients]
  );

  if (matchedIngredients.length === 0) return null;

  const handlePillClick = (name: string) => {
    setExpandedIngredient(prev => prev === name ? null : name);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3" role="list" aria-label="Step ingredients">
      {matchedIngredients.map((ing, index) => {
        const isExpanded = expandedIngredient === ing.name;
        const details = ingredientGroups.length > 0
          ? findIngredientDetails(ing.name, ingredientGroups)
          : null;
        const hasDetails = details?.description || (details?.substitutions && details.substitutions.length > 0);
        const label = [ing.amount, ing.units, toTitleCase(ing.name)]
          .filter((t): t is string => typeof t === 'string' && t.length > 0)
          .join(' ');

        return (
          <div key={index} className={isExpanded ? 'w-full' : ''} role="listitem">
            <button
              onClick={() => handlePillClick(ing.name)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-albert text-[13px] font-medium transition-colors cursor-pointer ${
                isExpanded
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {label}
            </button>

            <AnimatePresence>
              {isExpanded && hasDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="overflow-hidden"
                >
                  <div className="bg-[#F6F6F4] rounded-xl border border-stone-100 p-4 space-y-3">
                    {details!.description && (
                      <p className="font-albert text-[14px] text-stone-600 leading-relaxed">
                        {details!.description}
                      </p>
                    )}
                    {details!.substitutions && details!.substitutions.length > 0 && (
                      <div>
                        <p className="text-[11px] font-albert font-bold uppercase tracking-widest text-stone-400 mb-2">
                          Substitutes
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {details!.substitutions.map((sub, i) => (
                            <span
                              key={i}
                              className="inline-flex px-2.5 py-0.5 rounded-full bg-white border border-stone-200 font-albert text-[13px] text-stone-600"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

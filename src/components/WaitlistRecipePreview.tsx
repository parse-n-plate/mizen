"use client";

import { useState, useMemo } from "react";
import type { ParsedRecipe } from "@/lib/types";
import { RecipeHeader, formatTime } from "@/components/RecipeHeader";
import { IngredientList } from "@/components/IngredientList";
import { StepList } from "@/components/StepList";
import { scaleIngredients } from "@/utils/ingredientScaler";

interface WaitlistRecipePreviewProps {
  recipe: ParsedRecipe;
}

export function WaitlistRecipePreview({ recipe }: WaitlistRecipePreviewProps) {
  const originalServings = recipe.servings ?? 1;
  const [servings, setServings] = useState(originalServings);
  const [activeTab, setActiveTab] = useState<"prep" | "cook">("prep");

  const scaledIngredients = useMemo(() => {
    return scaleIngredients(recipe.ingredients, originalServings, servings);
  }, [recipe.ingredients, originalServings, servings]);

  const hasInstructions = recipe.instructions.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header area — not scrollable */}
      <div className="px-5 sm:px-8 pt-6 pb-0">
        <div className="mb-5">
          <RecipeHeader
            recipe={recipe}
            servings={servings}
            originalServings={originalServings}
            onServingsChange={setServings}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-end w-full relative gap-0 px-5 sm:px-8 border-b border-stone-200 dark:border-stone-700">
        <button
          onClick={() => setActiveTab("prep")}
          className={`folder-tab-trigger press-scale h-12 px-5 sm:px-10 font-sans text-[15px] ${
            activeTab === "prep" ? "font-semibold" : "font-medium"
          }`}
          data-state={activeTab === "prep" ? "active" : "inactive"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/icon-prep.png" alt="" width={24} height={24} className="tab-icon-prep h-6 w-6" />
          Prep
          {recipe.prepTimeMinutes ? (
            <span className="font-normal text-stone-400 dark:text-stone-500 ml-1.5">
              {formatTime(recipe.prepTimeMinutes)}
            </span>
          ) : null}
        </button>
        {hasInstructions && (
          <button
            onClick={() => setActiveTab("cook")}
            className={`folder-tab-trigger press-scale h-12 px-5 sm:px-10 font-sans text-[15px] ${
              activeTab === "cook" ? "font-semibold" : "font-medium"
            }`}
            data-state={activeTab === "cook" ? "active" : "inactive"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/icon-cook.svg" alt="" width={24} height={24} className="tab-icon-cook h-6 w-6" />
            Cook
            {recipe.cookTimeMinutes ? (
              <span className="font-normal text-stone-400 dark:text-stone-500 ml-1.5">
                {formatTime(recipe.cookTimeMinutes)}
              </span>
            ) : null}
          </button>
        )}
      </div>

      {/* Tab content — scrollable */}
      <div
        className={`flex-1 overflow-y-auto bg-white dark:bg-stone-900 ${
          activeTab === "prep" ? "rounded-tr-lg" : "rounded-t-lg"
        }`}
      >
        <div className="px-5 sm:px-8 pt-5 pb-6">
          {activeTab === "prep" ? (
            <div key="prep" className="tab-content-animate">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-6 pl-2">
                Ingredients
              </h3>
              <IngredientList groups={scaledIngredients} />
            </div>
          ) : (
            <div key="cook" className="tab-content-animate">
              <StepList steps={recipe.instructions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

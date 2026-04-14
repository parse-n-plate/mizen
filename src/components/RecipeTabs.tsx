"use client";

import { useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrepSection } from "@/components/PrepSection";
import { StepList } from "@/components/StepList";
import { formatTime } from "@/lib/utils";
import type { ParsedRecipe } from "@/lib/types";

interface RecipeTabsProps {
  recipe: ParsedRecipe;
}

export function RecipeTabs({ recipe }: RecipeTabsProps) {
  const [tab, setTab] = useState("prep");

  const handleStepClick = useCallback((stepNumber: number) => {
    setTab("cook");
    requestAnimationFrame(() => {
      document
        .getElementById(`step-${stepNumber}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
      <TabsList className="flex items-end w-full relative rounded-none border-b border-stone-200 dark:border-stone-700 bg-transparent p-0 gap-0">
        <TabsTrigger
          value="prep"
          className="folder-tab-trigger h-11 px-5 sm:px-8 font-sans text-[14px] font-medium"
        >
          Prep
          {recipe.prepTimeMinutes ? (
            <>
              <span className="text-stone-300 dark:text-stone-600" aria-hidden>
                ·
              </span>
              <span className="font-normal text-stone-400 dark:text-stone-500">
                {formatTime(recipe.prepTimeMinutes)}
              </span>
            </>
          ) : null}
        </TabsTrigger>
        <TabsTrigger
          value="cook"
          className="folder-tab-trigger h-11 px-5 sm:px-8 font-sans text-[14px] font-medium"
        >
          Cook
          {recipe.cookTimeMinutes ? (
            <>
              <span className="text-stone-300 dark:text-stone-600" aria-hidden>
                ·
              </span>
              <span className="font-normal text-stone-400 dark:text-stone-500">
                {formatTime(recipe.cookTimeMinutes)}
              </span>
            </>
          ) : null}
        </TabsTrigger>
      </TabsList>

      {/* Tab content */}
      <div className="bg-white dark:bg-stone-900 rounded-b-lg border border-t-0 border-stone-200 dark:border-stone-700 flex-1">
        <div className="max-w-3xl mx-auto px-5 pt-5 pb-12">
          <TabsContent value="prep" className="space-y-0">
            <PrepSection
              ingredients={recipe.ingredients}
              steps={recipe.instructions}
              equipment={recipe.equipment}
              onStepClick={handleStepClick}
            />
          </TabsContent>
          <TabsContent value="cook" className="space-y-0">
            <StepList steps={recipe.instructions} />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}

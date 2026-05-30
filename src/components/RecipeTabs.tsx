"use client";

import { useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrepSection } from "@/components/PrepSection";
import { StepList } from "@/components/StepList";
import { useTabScrollMemory } from "@/hooks/useTabScrollMemory";
import { formatTime } from "@/lib/utils";
import type { ParsedRecipe } from "@/lib/types";

interface RecipeTabsProps {
  recipe: ParsedRecipe;
}

export function RecipeTabs({ recipe }: RecipeTabsProps) {
  const [tab, setTab] = useState("prep");
  useTabScrollMemory(tab);

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
      <TabsList variant="line" className="w-full justify-start border-b border-border px-1">
        <TabsTrigger
          value="prep"
          data-recipe-tab-trigger
          className="h-11 flex-none px-5 text-[14px] font-medium sm:px-8"
        >
          Prep
          {recipe.prepTimeMinutes ? (
            <>
              <span className="text-muted-foreground/50" aria-hidden>
                ·
              </span>
              <span className="font-normal text-muted-foreground">
                {formatTime(recipe.prepTimeMinutes)}
              </span>
            </>
          ) : null}
        </TabsTrigger>
        <TabsTrigger
          value="cook"
          data-recipe-tab-trigger
          className="h-11 flex-none px-5 text-[14px] font-medium sm:px-8"
        >
          Cook
          {recipe.cookTimeMinutes ? (
            <>
              <span className="text-muted-foreground/50" aria-hidden>
                ·
              </span>
              <span className="font-normal text-muted-foreground">
                {formatTime(recipe.cookTimeMinutes)}
              </span>
            </>
          ) : null}
        </TabsTrigger>
      </TabsList>

      {/* Tab content */}
      <div className="flex-1 rounded-b-lg border border-t-0 border-border bg-card text-card-foreground">
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

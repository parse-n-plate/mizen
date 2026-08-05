"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import type { ParsedRecipe } from "@/lib/types";
import { PrepSection } from "@/components/PrepSection";
import {
  RecipeDesktopTabsBar,
  type RecipeTabValue,
  type RecipeUnitSystem,
} from "@/components/RecipeDesktopTabsBar";
import { MobileNavShell, type MobileNavItem } from "@/components/MobileBottomNav";
import { StepList } from "@/components/StepList";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTabScrollMemory } from "@/hooks/useTabScrollMemory";
import { useHorizontalTabSwipe } from "@/hooks/useHorizontalTabSwipe";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { convertIngredientGroups } from "@/lib/recipe-preferences";
import { getNumberFormat } from "@/lib/numberFormat";
import { recipeToCopyMarkdown } from "@/lib/recipe-copy";
import { displayAmount, displayText } from "@/utils/ingredientScaler";
import { detectUnitSystem } from "@/utils/unitConverter";
import { Copy, EllipsisVertical, Printer, Share2 } from "lucide-react";

interface DemoRecipeViewProps {
  recipe: ParsedRecipe;
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function DemoRecipeView({ recipe }: DemoRecipeViewProps) {
  const [activeTab, setActiveTab] = useState<RecipeTabValue>("prep");
  const [tabTransition, setTabTransition] = useState<"forward" | "backward">("forward");
  const [unitSystem, setUnitSystemState] = useState<RecipeUnitSystem>("original");
  const [copied, setCopied] = useState(false);
  useTabScrollMemory(activeTab);
  const isMobileRecipeLayout = useMediaQuery("(max-width: 767px)");

  const numberFormat = useSyncExternalStore(
    subscribeToStorage,
    getNumberFormat,
    () => "fractions" as const
  );

  const recipeUnitSystem = useMemo(
    () => detectUnitSystem(recipe.ingredients),
    [recipe.ingredients]
  );
  const isConverted = unitSystem !== "original";
  const displayedIngredients = useMemo(
    () => convertIngredientGroups(recipe.ingredients, unitSystem),
    [recipe.ingredients, unitSystem]
  );

  const selectTab = useCallback(
    (tab: RecipeTabValue) => {
      if (tab === activeTab) return;
      setTabTransition(tab === "cook" ? "forward" : "backward");
      setActiveTab(tab);
    },
    [activeTab]
  );

  const swipeHandlers = useHorizontalTabSwipe(activeTab, selectTab);
  const tabContentClass = `tab-content-animate${
    isMobileRecipeLayout ? ` tab-content-slide-${tabTransition}` : ""
  }`;

  const handleStepClick = useCallback(
    (stepNumber: number) => {
      selectTab("cook");
      requestAnimationFrame(() => {
        document
          .getElementById(`step-${stepNumber}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    },
    [selectTab]
  );

  const handleCopyRecipe = async () => {
    const copyText = recipeToCopyMarkdown({
      recipe,
      ingredients: displayedIngredients.map((group) => ({
        ...group,
        ingredients: group.ingredients.map((ingredient) => ({
          ...ingredient,
          amount: ingredient.amount ? displayAmount(ingredient.amount, numberFormat) : "",
        })),
      })),
      instructions: recipe.instructions.map((step) => ({
        ...step,
        detail: displayText(step.detail, numberFormat),
      })),
    });

    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Recipe copied");
    } catch {
      toast.error("Failed to copy recipe");
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : recipe.sourceUrl || "";
    const shareData = {
      title: recipe.title,
      ...(recipe.summary && { text: recipe.summary }),
      ...(url && { url }),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url || recipe.title);
        toast.success("Link copied to clipboard");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Failed to share");
    }
  };

  const recipeMobileNavItems: MobileNavItem[] = [
    {
      id: "prep",
      type: "button",
      label: "Prep",
      active: activeTab === "prep",
      pressed: activeTab === "prep",
      onClick: () => selectTab("prep"),
      icon: (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/assets/icon-prep.png" alt="" className="h-6 w-6" aria-hidden="true" />
      ),
    },
    {
      id: "cook",
      type: "button",
      label: "Cook",
      active: activeTab === "cook",
      pressed: activeTab === "cook",
      onClick: () => selectTab("cook"),
      icon: (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/assets/icon-cook.svg" alt="" className="h-6 w-6" aria-hidden="true" />
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-1 flex-col md:hidden">
        <div className="flex-1" {...swipeHandlers}>
          <div className="pb-[calc(8.75rem+env(safe-area-inset-bottom)+1rem)]">
            {activeTab === "prep" ? (
              <div key="mobile-prep" className={tabContentClass}>
                <PrepSection
                  ingredients={displayedIngredients}
                  steps={recipe.instructions}
                  equipment={recipe.equipment}
                  onStepClick={handleStepClick}
                />
              </div>
            ) : (
              <div key="mobile-cook" className={tabContentClass}>
                <StepList steps={recipe.instructions} />
              </div>
            )}
          </div>
        </div>

        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-[19] h-28 bg-gradient-to-t from-white/90 via-white/45 to-transparent dark:from-stone-950/80 dark:via-stone-950/35 dark:to-transparent" />

        <MobileNavShell
          items={recipeMobileNavItems}
          showLabels
          actionSlot={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More recipe actions"
                  className="press-scale inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-light)]/80 bg-[var(--color-surface)] text-[var(--color-text-heading)] shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-blue)] dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                >
                  <EllipsisVertical className="h-5 w-5" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                className="border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
              >
                <DropdownMenuItem
                  onSelect={handleCopyRecipe}
                  aria-label="Copy recipe formatted for an AI chat"
                  className="text-stone-700 focus:bg-stone-100 focus:text-stone-900 dark:text-stone-300 dark:focus:bg-stone-800 dark:focus:text-stone-50"
                >
                  Copy recipe
                  <Copy className="ml-auto h-4 w-4" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={handleShare}
                  className="text-stone-700 focus:bg-stone-100 focus:text-stone-900 dark:text-stone-300 dark:focus:bg-stone-800 dark:focus:text-stone-50"
                >
                  Share
                  <Share2 className="ml-auto h-4 w-4" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => window.print()}
                  className="text-stone-700 focus:bg-stone-100 focus:text-stone-900 dark:text-stone-300 dark:focus:bg-stone-800 dark:focus:text-stone-50"
                >
                  Print
                  <Printer className="ml-auto h-4 w-4" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      </div>

      <div className="hidden flex-1 flex-col md:flex">
        <RecipeDesktopTabsBar
          recipe={recipe}
          activeTab={activeTab}
          onTabChange={selectTab}
          isConverted={isConverted}
          recipeUnitSystem={recipeUnitSystem}
          unitSystem={unitSystem}
          onUnitSystemChange={setUnitSystemState}
          copied={copied}
          onCopyRecipe={handleCopyRecipe}
          onShare={handleShare}
        />

        <div
          className={`flex-1 border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900 ${
            activeTab === "prep" ? "rounded-b-lg rounded-tr-lg" : "rounded-lg"
          }`}
        >
          <div className="px-6 pb-16 pt-5">
            {activeTab === "prep" ? (
              <div key="prep" className={tabContentClass}>
                <PrepSection
                  ingredients={displayedIngredients}
                  steps={recipe.instructions}
                  equipment={recipe.equipment}
                  onStepClick={handleStepClick}
                />
              </div>
            ) : (
              <div key="cook" className={tabContentClass}>
                <StepList steps={recipe.instructions} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

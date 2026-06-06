"use client";

import { useState } from "react";
import type { ParsedRecipe } from "@/lib/types";
import AltArrowDown from "@solar-icons/react/csr/arrows/AltArrowDown";
import User from "@solar-icons/react/csr/users/User";
import SidebarMinimalistic from "@solar-icons/react/csr/it/SidebarMinimalistic";
import { ServingsAdjuster } from "@/components/ServingsAdjuster";
import { useSidebar } from "@/components/AppShell";
import { RecipeSwitcher } from "@/components/RecipeSwitcher";
import { formatTime } from "@/lib/utils";

interface RecipeHeaderProps {
  recipe: ParsedRecipe;
  servings?: number;
  originalServings?: number;
  onServingsChange?: (n: number) => void;
  isServingsOpen?: boolean;
  onServingsOpenChange?: (open: boolean) => void;
  showSwitcher?: boolean;
}

export { formatTime } from "@/lib/utils";

export function RecipeHeader({
  recipe,
  servings,
  originalServings,
  onServingsChange,
  isServingsOpen,
  onServingsOpenChange,
  showSwitcher = false,
}: RecipeHeaderProps) {
  const [isSliderOpenLocal, setIsSliderOpenLocal] = useState(false);
  const { collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed } = useSidebar();
  const showPrepAndCook = !!recipe.prepTimeMinutes || !!recipe.cookTimeMinutes;
  const isSliderOpen = isServingsOpen ?? isSliderOpenLocal;

  const setIsSliderOpen = (open: boolean) => {
    if (onServingsOpenChange) {
      onServingsOpenChange(open);
      return;
    }
    setIsSliderOpenLocal(open);
  };

  const canAdjustServings = !!(originalServings && originalServings > 0 && onServingsChange);
  const displayServings = servings ?? originalServings ?? recipe.servings;
  const isAdjusted = !!(servings && originalServings && servings !== originalServings);

  // Non-servings metadata items
  const meta: { label: string; value: string }[] = [];
  if (recipe.totalTimeMinutes && recipe.totalTimeMinutes > 0 && !showPrepAndCook)
    meta.push({ label: "Total", value: formatTime(recipe.totalTimeMinutes) });

  const hasServings = !!(recipe.servings && recipe.servings > 0);

  return (
    <div className="flex min-w-0 flex-col gap-1 md:gap-1.5">
      <div className="flex min-w-0 items-start">
        {/* Inline expand-sidebar button — sits to the left of the recipe title when sidebar is collapsed */}
        <div
          className={`hidden md:block shrink-0 overflow-hidden transition-[width] ease-[cubic-bezier(0.165,0.84,0.44,1)] motion-reduce:transition-none ${
            sidebarCollapsed ? "w-9 duration-[220ms]" : "w-0 duration-[180ms]"
          }`}
        >
          <button
            onClick={() => setSidebarCollapsed(false)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-[opacity] ease-out motion-reduce:transition-none mt-1.5 ${
              sidebarCollapsed
                ? "opacity-100 duration-150 delay-100"
                : "opacity-0 pointer-events-none duration-75"
            }`}
            aria-label="Expand sidebar"
            aria-expanded={!sidebarCollapsed}
            aria-controls="primary-sidebar"
            tabIndex={sidebarCollapsed ? 0 : -1}
          >
            <SidebarMinimalistic size={14} />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          {showSwitcher ? (
            <RecipeSwitcher title={recipe.title} variant="h1" />
          ) : (
            <h1 className="break-words font-serif text-3xl font-bold leading-tight tracking-tight text-pretty md:text-4xl">
              {recipe.title}
            </h1>
          )}
        </div>
      </div>

      {recipe.summary && (
        <p className="max-w-2xl break-words font-sans text-base leading-relaxed text-stone-500 dark:text-stone-400 md:text-lg">
          {recipe.summary}
        </p>
      )}

      {/* Inline metadata row */}
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-sans text-sm text-stone-500 dark:text-stone-400 md:gap-3">
        {recipe.author && <span className="text-base">{recipe.author}</span>}

        {recipe.sourceUrl && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-full truncate text-[16px] text-stone-400 transition-colors hover:text-stone-600 hover:underline dark:text-stone-500 dark:hover:text-stone-300"
          >
            {new URL(recipe.sourceUrl).hostname.replace("www.", "")}
          </a>
        )}

        {meta.map((m) => (
          <span key={m.label} className="flex items-center gap-1.5">
            <span>
              <span className="text-stone-400 dark:text-stone-500">{m.label}</span>{" "}
              <span className="font-medium text-stone-600 dark:text-stone-300">{m.value}</span>
            </span>
          </span>
        ))}

        {/* Servings: interactive button if adjustable, static text otherwise */}
        {hasServings &&
          (canAdjustServings ? (
            <>
              <button
                onClick={() => setIsSliderOpen(!isSliderOpen)}
                className={`hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded-md transition-colors cursor-pointer ${isAdjusted ? "hover:bg-[var(--color-blue)]/8" : "hover:bg-stone-100 dark:hover:bg-stone-800"}`}
                aria-expanded={isSliderOpen}
                aria-label="Adjust servings"
              >
                <span
                  className={`flex items-center justify-center w-3.5 h-3.5 ${isAdjusted ? "text-[var(--color-blue)]" : "text-stone-400 dark:text-stone-500"}`}
                >
                  <User weight="Bold" className="w-3.5 h-3.5" />
                </span>
                <span
                  className={
                    isAdjusted ? "text-[var(--color-blue)]" : "text-stone-400 dark:text-stone-500"
                  }
                >
                  Serves
                </span>{" "}
                <span
                  className={`font-medium ${isAdjusted ? "text-[var(--color-blue)]" : "text-stone-600 dark:text-stone-300"}`}
                >
                  {displayServings}
                </span>
                <AltArrowDown
                  className={`w-3 h-3 transition-transform duration-200 ${isAdjusted ? "text-[var(--color-blue)]" : "text-stone-400 dark:text-stone-500"} ${isSliderOpen ? "rotate-180" : ""}`}
                />
              </button>

              <span className="flex items-center gap-1 md:hidden">
                <span
                  className={`flex items-center justify-center w-3.5 h-3.5 ${isAdjusted ? "text-[var(--color-blue)]" : "text-stone-400 dark:text-stone-500"}`}
                >
                  <User weight="Bold" className="w-3.5 h-3.5" />
                </span>
                <span>
                  <span
                    className={
                      isAdjusted ? "text-[var(--color-blue)]" : "text-stone-400 dark:text-stone-500"
                    }
                  >
                    Serves
                  </span>{" "}
                  <span
                    className={`font-medium ${isAdjusted ? "text-[var(--color-blue)]" : "text-stone-600 dark:text-stone-300"}`}
                  >
                    {displayServings}
                  </span>
                </span>
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1.5">
              <span>
                <span className="text-stone-400 dark:text-stone-500">Serves</span>{" "}
                <span className="font-medium text-stone-600 dark:text-stone-300">
                  {displayServings}
                </span>
              </span>
            </span>
          ))}
      </div>

      {/* Servings slider card */}
      {canAdjustServings && (
        <div className="hidden md:block">
          <ServingsAdjuster
            servings={servings!}
            originalServings={originalServings!}
            onServingsChange={onServingsChange!}
            isOpen={isSliderOpen}
          />
        </div>
      )}
    </div>
  );
}

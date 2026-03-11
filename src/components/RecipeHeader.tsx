"use client";

import { useState } from "react";
import type { ParsedRecipe } from "@/lib/types";
import AltArrowDown from "@solar-icons/react/csr/arrows/AltArrowDown";
import User from "@solar-icons/react/csr/users/User";
import { ServingsAdjuster } from "@/components/ServingsAdjuster";

interface RecipeHeaderProps {
  recipe: ParsedRecipe;
  servings?: number;
  originalServings?: number;
  onServingsChange?: (n: number) => void;
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function Dot() {
  return (
    <span className="text-stone-300 dark:text-stone-600" aria-hidden>
      ·
    </span>
  );
}

export function RecipeHeader({
  recipe,
  servings,
  originalServings,
  onServingsChange,
}: RecipeHeaderProps) {
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const showPrepAndCook = !!recipe.prepTimeMinutes || !!recipe.cookTimeMinutes;

  const canAdjustServings = !!(originalServings && originalServings > 0 && onServingsChange);
  const displayServings = servings ?? originalServings ?? recipe.servings;
  const isAdjusted = !!(servings && originalServings && servings !== originalServings);

  // Non-servings metadata items
  const meta: { label: string; value: string }[] = [];
  if (recipe.totalTimeMinutes && recipe.totalTimeMinutes > 0 && !showPrepAndCook)
    meta.push({ label: "Total", value: formatTime(recipe.totalTimeMinutes) });

  // Count items after author/source to decide where dots go
  const hasServings = !!(recipe.servings && recipe.servings > 0);
  const hasTrailingItems = meta.length > 0 || hasServings;

  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="font-serif text-3xl font-bold leading-tight md:text-4xl tracking-tight">
        {recipe.title}
      </h1>

      {recipe.summary && (
        <p className="font-sans text-lg text-stone-500 dark:text-stone-400 max-w-2xl leading-relaxed">
          {recipe.summary}
        </p>
      )}

      {/* Inline metadata row */}
      <div className="flex items-center gap-1.5 flex-wrap font-sans text-sm text-stone-500 dark:text-stone-400">
        {recipe.author && (
          <>
            <span className="text-base">{recipe.author}</span>
            {(recipe.sourceUrl || hasTrailingItems) && <Dot />}
          </>
        )}

        {recipe.sourceUrl && (
          <>
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[16px] text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors hover:underline underline-offset-4 decoration-stone-300 dark:decoration-stone-600"
            >
              {new URL(recipe.sourceUrl).hostname.replace("www.", "")}
            </a>
            {hasTrailingItems && <Dot />}
          </>
        )}

        {meta.map((m, i) => (
          <span key={m.label} className="flex items-center gap-1.5">
            <span>
              <span className="text-stone-400 dark:text-stone-500">{m.label}</span>{" "}
              <span className="font-medium text-stone-600 dark:text-stone-300">{m.value}</span>
            </span>
            {(i < meta.length - 1 || hasServings) && <Dot />}
          </span>
        ))}

        {/* Servings: interactive button if adjustable, static text otherwise */}
        {hasServings &&
          (canAdjustServings ? (
            <button
              onClick={() => setIsSliderOpen(!isSliderOpen)}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded-md transition-colors cursor-pointer ${isAdjusted ? "hover:bg-[var(--color-blue)]/8" : "hover:bg-stone-100 dark:hover:bg-stone-800"}`}
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
        <ServingsAdjuster
          servings={servings!}
          originalServings={originalServings!}
          onServingsChange={onServingsChange!}
          isOpen={isSliderOpen}
        />
      )}
    </div>
  );
}

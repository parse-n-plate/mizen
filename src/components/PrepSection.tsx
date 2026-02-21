"use client";

import { useState } from "react";
import type { IngredientGroup, InstructionStep } from "@/lib/types";
import { IngredientList } from "@/components/IngredientList";

interface PrepSectionProps {
  ingredients: IngredientGroup[];
  steps: InstructionStep[];
}

export function PrepSection({ ingredients, steps }: PrepSectionProps) {
  const tips = steps
    .filter((s) => s.tips)
    .map((s, i) => ({ tip: s.tips!, stepTitle: s.title, index: i }));

  return (
    <div className="space-y-6">
      {tips.length > 0 && <TipsCallout tips={tips} />}

      <div>
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3 pl-2">
          Ingredients
        </h3>
        <IngredientList groups={ingredients} />
      </div>
    </div>
  );
}

function TipsCallout({
  tips,
}: {
  tips: { tip: string; stepTitle: string; index: number }[];
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-lg border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer group"
        aria-expanded={!collapsed}
      >
        <svg
          className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
          <path d="M10 21h4" />
        </svg>
        <span className="font-sans text-sm font-semibold text-amber-800 dark:text-amber-300">
          {tips.length} {tips.length === 1 ? "Tip" : "Tips"}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-amber-400 dark:text-amber-500 ml-auto transition-transform duration-200 ${
            collapsed ? "-rotate-90" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-3.5 pb-3 space-y-2">
            {tips.map((t) => (
              <div key={t.index} className="flex gap-2.5">
                <span className="font-sans text-xs text-amber-400 dark:text-amber-600 flex-shrink-0 pt-0.5">
                  &bull;
                </span>
                <p className="font-sans text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  {t.tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

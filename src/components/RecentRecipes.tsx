"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRecipe } from "@/context/RecipeContext";
import type { HistoryEntry } from "@/context/RecipeContext";
import AltArrowDown from "@solar-icons/react/csr/arrows/AltArrowDown";

const COLLAPSED_COUNT = 3;
const EXPAND_EASE = [0.215, 0.61, 0.355, 1] as const;
const COLLAPSE_EASE = [0.25, 0.46, 0.45, 0.94] as const;
const LABEL_EASE = [0.25, 0.46, 0.45, 0.94] as const;

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `${hrs} hr${hrs > 1 ? "s" : ""} ${mins} mins`;
}

function RecipeRow({ entry, onClick }: { entry: HistoryEntry; onClick: () => void }) {
  const time =
    entry.recipe.totalTimeMinutes ||
    (entry.recipe.prepTimeMinutes || 0) + (entry.recipe.cookTimeMinutes || 0) ||
    null;

  return (
    <button
      onClick={onClick}
      className="-mx-3 flex items-baseline justify-between gap-4 rounded-xl px-3 py-2.5 text-left transition-none hover:bg-stone-200/60 dark:hover:bg-stone-700/35"
    >
      <p className="truncate font-sans text-[15px] font-medium text-stone-900 dark:text-stone-100">
        {entry.recipe.title}
      </p>
      {time ? (
        <p className="shrink-0 font-sans text-sm text-stone-400 dark:text-stone-500">
          {formatTime(time)}
        </p>
      ) : null}
    </button>
  );
}

export function RecentRecipes() {
  const { history, setRecipe } = useRecipe();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const expandableId = useId();

  if (history.length === 0) return null;

  const canExpand = history.length > COLLAPSED_COUNT;
  const hiddenCount = history.length - COLLAPSED_COUNT;
  const toggleLabel = expanded ? "Show less" : `${hiddenCount} more`;
  const panelAnimateTransition = shouldReduceMotion
    ? { duration: 0 }
    : {
        height: { duration: 0.24, ease: EXPAND_EASE },
        opacity: { duration: 0.16, ease: LABEL_EASE },
      };
  const panelExit = shouldReduceMotion
    ? undefined
    : {
        height: 0,
        opacity: 0,
        transition: {
          height: { duration: 0.18, ease: COLLAPSE_EASE },
          opacity: { duration: 0.12, ease: LABEL_EASE },
        },
      };
  const labelTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.14, ease: LABEL_EASE };

  const handleClick = (entry: HistoryEntry) => {
    setRecipe(entry.recipe);
    router.push("/recipe");
  };

  return (
    <section className="w-full max-w-3xl">
      <div className="mb-4">
        <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">
          Recent Recipes
        </h2>
      </div>

      <div className="flex flex-col">
        {history.slice(0, COLLAPSED_COUNT).map((entry) => (
          <RecipeRow key={entry.parsedAt} entry={entry} onClick={() => handleClick(entry)} />
        ))}

        {canExpand && (
          <>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  id={expandableId}
                  key="recent-recipes-expanded"
                  initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={panelExit}
                  transition={panelAnimateTransition}
                  className="-mx-3 overflow-hidden"
                >
                  <div className="flex flex-col px-3">
                    {history.slice(COLLAPSED_COUNT).map((entry) => (
                      <RecipeRow
                        key={entry.parsedAt}
                        entry={entry}
                        onClick={() => handleClick(entry)}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <button
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-controls={expandableId}
              className="press-scale -mx-3 mt-1 flex items-center gap-1.5 rounded-xl px-3 py-2 font-sans text-sm font-medium text-stone-400 dark:text-stone-500 transition-none hover:text-stone-600 dark:hover:text-stone-300"
            >
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={
                  shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: EXPAND_EASE }
                }
                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center"
              >
                <AltArrowDown size={14} />
              </motion.span>
              <motion.span
                layout
                transition={labelTransition}
                className="relative inline-flex min-w-0 overflow-hidden"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={toggleLabel}
                    initial={shouldReduceMotion ? false : { y: 4, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={shouldReduceMotion ? undefined : { y: -4, opacity: 0 }}
                    transition={labelTransition}
                    className="whitespace-nowrap"
                  >
                    {toggleLabel}
                  </motion.span>
                </AnimatePresence>
              </motion.span>
            </button>
          </>
        )}
      </div>
    </section>
  );
}

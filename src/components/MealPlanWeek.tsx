"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RecipePickerDialog } from "@/components/RecipePickerDialog";
import AltArrowLeft from "@solar-icons/react/csr/arrows/AltArrowLeft";
import AltArrowRight from "@solar-icons/react/csr/arrows/AltArrowRight";
import CloseCircle from "@solar-icons/react/csr/ui/CloseCircle";
import AddCircle from "@solar-icons/react/csr/ui/AddCircle";
import type { MealPlanEntry, MealType, SavedRecipe } from "@/lib/types";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MealPlanWeek() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ date: string; mealType: MealType } | null>(
    null
  );

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const start = formatDate(weekStart);
      const end = formatDate(weekEnd);
      const res = await fetch(`/api/meal-plan?start=${start}&end=${end}`);
      const data = await res.json();
      if (Array.isArray(data)) setEntries(data);
    } catch {
      toast.error("Failed to load meal plan");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart.getTime()]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleAddRecipe = async (recipe: SavedRecipe) => {
    if (!pickerTarget) return;
    try {
      const res = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_id: recipe.id,
          date: pickerTarget.date,
          meal_type: pickerTarget.mealType,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Added "${recipe.recipe.title}" to ${MEAL_LABELS[pickerTarget.mealType]}`);
      fetchEntries();
    } catch {
      toast.error("Failed to add recipe to meal plan");
    }
    setPickerTarget(null);
  };

  const handleRemoveEntry = async (entryId: string) => {
    try {
      const res = await fetch(`/api/meal-plan/${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast.success("Recipe removed from meal plan");
    } catch {
      toast.error("Failed to remove recipe");
    }
  };

  const goToPrevWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  };

  const goToToday = () => {
    setWeekStart(getMonday(new Date()));
  };

  const today = formatDate(new Date());
  const isCurrentWeek = formatDate(getMonday(new Date())) === formatDate(weekStart);

  const getEntry = (date: string, mealType: MealType) =>
    entries.find((e) => e.date === date && e.meal_type === mealType);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">
            {formatDateShort(weekStart)} &ndash; {formatDateShort(weekEnd)}
          </h2>
          {!isCurrentWeek && (
            <button
              onClick={goToToday}
              className="font-sans text-xs font-medium text-[var(--color-blue)] hover:underline"
            >
              Today
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevWeek}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-none"
            aria-label="Previous week"
          >
            <AltArrowLeft size={16} />
          </button>
          <button
            onClick={goToNextWeek}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-none"
            aria-label="Next week"
          >
            <AltArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Day sections */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {days.map((day, i) => {
            const dateStr = formatDate(day);
            const isToday = dateStr === today;

            return (
              <div
                key={dateStr}
                className={cn(
                  "rounded-xl border p-4",
                  isToday
                    ? "border-[var(--color-blue)]/30 bg-[var(--color-blue-light)]/30"
                    : "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50"
                )}
              >
                {/* Day header */}
                <div className="flex items-baseline gap-2 mb-3">
                  <h3
                    className={cn(
                      "font-sans text-sm font-semibold",
                      isToday ? "text-[var(--color-blue)]" : "text-stone-800 dark:text-stone-200"
                    )}
                  >
                    {DAY_NAMES[i]}
                  </h3>
                  <span className="font-sans text-xs text-stone-400 dark:text-stone-500">
                    {formatDateShort(day)}
                  </span>
                  {isToday && (
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-[var(--color-blue)]">
                      Today
                    </span>
                  )}
                </div>

                {/* Meal slots */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {MEAL_TYPES.map((mealType) => {
                    const entry = getEntry(dateStr, mealType);

                    return (
                      <div
                        key={mealType}
                        className={cn(
                          "rounded-lg border min-h-[4.5rem] flex flex-col",
                          entry
                            ? "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                            : "border-dashed border-stone-200 dark:border-stone-700"
                        )}
                      >
                        <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-3 pt-2">
                          {MEAL_LABELS[mealType]}
                        </span>
                        {entry ? (
                          <div className="flex items-center gap-2 px-3 py-2 flex-1">
                            {entry.recipe?.recipe?.imageUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={entry.recipe.recipe.imageUrl}
                                alt=""
                                className="h-8 w-8 rounded object-cover shrink-0"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded bg-stone-100 dark:bg-stone-800 shrink-0" />
                            )}
                            <span className="font-sans text-sm text-stone-700 dark:text-stone-300 truncate flex-1">
                              {entry.recipe?.recipe?.title || "Recipe"}
                            </span>
                            <button
                              onClick={() => handleRemoveEntry(entry.id)}
                              className="flex h-6 w-6 items-center justify-center rounded text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 shrink-0 transition-none"
                              aria-label="Remove recipe"
                            >
                              <CloseCircle size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setPickerTarget({ date: dateStr, mealType });
                              setPickerOpen(true);
                            }}
                            className="flex items-center justify-center gap-1.5 flex-1 py-2 text-stone-300 dark:text-stone-600 hover:text-stone-400 dark:hover:text-stone-500 transition-none"
                          >
                            <AddCircle size={16} />
                            <span className="font-sans text-xs">Add</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RecipePickerDialog
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open);
          if (!open) setPickerTarget(null);
        }}
        onSelect={handleAddRecipe}
      />
    </div>
  );
}

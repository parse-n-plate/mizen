"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import CalendarMinimalistic from "@solar-icons/react/csr/time/CalendarMinimalistic";
import type { MealPlanEntry } from "@/lib/types";

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

interface GroceryItem {
  ingredient: string;
  amounts: string[];
  recipes: string[];
}

function buildGroceryList(entries: MealPlanEntry[]): GroceryItem[] {
  const map = new Map<string, GroceryItem>();

  for (const entry of entries) {
    if (!entry.recipe?.recipe?.ingredients) continue;
    const recipeTitle = entry.recipe.recipe.title;

    for (const group of entry.recipe.recipe.ingredients) {
      for (const ing of group.ingredients) {
        const key = ing.ingredient.toLowerCase().trim();
        if (!key) continue;

        const existing = map.get(key);
        const amount = [ing.amount, ing.units].filter(Boolean).join(" ").trim();

        if (existing) {
          if (amount && !existing.amounts.includes(amount)) {
            existing.amounts.push(amount);
          }
          if (!existing.recipes.includes(recipeTitle)) {
            existing.recipes.push(recipeTitle);
          }
        } else {
          map.set(key, {
            ingredient: ing.ingredient,
            amounts: amount ? [amount] : [],
            recipes: [recipeTitle],
          });
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.ingredient.localeCompare(b.ingredient));
}

function getCheckedKey(weekStart: Date): string {
  return `mizen-grocery-checked-${formatDate(weekStart)}`;
}

export default function GroceryListPage() {
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const weekStart = useMemo(() => getMonday(new Date()), []);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

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
  }, [weekStart, weekEnd]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Load checked state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getCheckedKey(weekStart));
      if (stored) setChecked(new Set(JSON.parse(stored)));
    } catch {}
  }, [weekStart]);

  const persistChecked = (next: Set<string>) => {
    setChecked(next);
    try {
      localStorage.setItem(getCheckedKey(weekStart), JSON.stringify([...next]));
    } catch {}
  };

  const toggleItem = (ingredient: string) => {
    const key = ingredient.toLowerCase().trim();
    const next = new Set(checked);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    persistChecked(next);
  };

  const clearChecked = () => {
    persistChecked(new Set());
  };

  const groceryItems = useMemo(() => buildGroceryList(entries), [entries]);
  const checkedCount = groceryItems.filter((item) =>
    checked.has(item.ingredient.toLowerCase().trim())
  ).length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col pb-6 md:pb-0">
      <div className="px-6 pt-8 pb-0">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-serif text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Grocery List
            </h1>
            <Link
              href="/meal-plan"
              className="flex items-center gap-2 rounded-lg px-3 py-2 font-sans text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-none"
            >
              <CalendarMinimalistic size={16} />
              Meal Plan
            </Link>
          </div>

          <p className="font-sans text-sm text-stone-400 dark:text-stone-500 mb-6">
            {formatDateShort(weekStart)} &ndash; {formatDateShort(weekEnd)}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
            </div>
          ) : groceryItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="font-sans text-sm text-stone-400 dark:text-stone-500">
                No recipes in this week&apos;s meal plan yet.
              </p>
              <Link
                href="/meal-plan"
                className="font-sans text-sm text-[var(--color-blue)] hover:underline"
              >
                Add recipes to your meal plan
              </Link>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-sans text-xs text-stone-400 dark:text-stone-500">
                  {checkedCount} of {groceryItems.length} items checked
                </span>
                {checkedCount > 0 && (
                  <button
                    onClick={clearChecked}
                    className="font-sans text-xs text-[var(--color-blue)] hover:underline"
                  >
                    Clear checked
                  </button>
                )}
              </div>

              {/* Grocery items */}
              <div className="flex flex-col gap-px">
                {groceryItems.map((item) => {
                  const isChecked = checked.has(item.ingredient.toLowerCase().trim());

                  return (
                    <label
                      key={item.ingredient}
                      className={cn(
                        "flex items-start gap-3 rounded-lg px-3 py-3 cursor-pointer transition-none",
                        "hover:bg-stone-50 dark:hover:bg-stone-900/50",
                        isChecked && "opacity-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(item.ingredient)}
                        className="mt-0.5 h-4 w-4 rounded border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100 focus:ring-stone-500 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "font-sans text-sm text-stone-800 dark:text-stone-200",
                            isChecked && "line-through"
                          )}
                        >
                          <span className="font-medium">{item.ingredient}</span>
                          {item.amounts.length > 0 && (
                            <span className="text-stone-400 dark:text-stone-500 ml-1.5">
                              &mdash; {item.amounts.join(", ")}
                            </span>
                          )}
                        </p>
                        <p className="font-sans text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                          {item.recipes.join(", ")}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { MealType } from "@/lib/types";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

interface AddToMealPlanDialogProps {
  recipeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToMealPlanDialog({ recipeId, open, onOpenChange }: AddToMealPlanDialogProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null);
  const [saving, setSaving] = useState(false);

  const weekStart = getMonday(new Date());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const today = formatDate(new Date());

  const handleAdd = async () => {
    if (!selectedDate || !selectedMeal || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_id: recipeId,
          date: selectedDate,
          meal_type: selectedMeal,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        `Added to ${MEAL_LABELS[selectedMeal]} on ${formatDateShort(new Date(selectedDate + "T12:00:00"))}`
      );
      onOpenChange(false);
      setSelectedDate(null);
      setSelectedMeal(null);
    } catch {
      toast.error("Failed to add to meal plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Add to Meal Plan</DialogTitle>
          <DialogDescription className="font-sans text-sm text-stone-500 dark:text-stone-400">
            Choose a day and meal
          </DialogDescription>
        </DialogHeader>

        {/* Day picker */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const dateStr = formatDate(day);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg py-2 font-sans text-xs transition-none",
                  isSelected
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                    : isToday
                      ? "bg-[var(--color-blue-light)] text-[var(--color-blue)]"
                      : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                )}
              >
                <span className="font-medium">{DAY_NAMES[i]}</span>
                <span className="text-[10px]">{day.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* Meal type picker */}
        {selectedDate && (
          <div className="flex flex-col gap-1.5">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedMeal(type)}
                className={cn(
                  "rounded-lg px-4 py-2.5 font-sans text-sm text-left transition-none",
                  selectedMeal === type
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium"
                    : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                )}
              >
                {MEAL_LABELS[type]}
              </button>
            ))}
          </div>
        )}

        {/* Confirm button */}
        {selectedDate && selectedMeal && (
          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-full h-9 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-sans text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add to Meal Plan"}
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}

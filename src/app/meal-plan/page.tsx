"use client";

import { MealPlanWeek } from "@/components/MealPlanWeek";
import Link from "next/link";
import CartLarge from "@solar-icons/react/csr/shopping/CartLarge";

export default function MealPlanPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col pb-6 md:pb-0">
      <div className="px-6 pt-8 pb-0">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-serif text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Meal Plan
            </h1>
            <Link
              href="/grocery-list"
              className="flex items-center gap-2 rounded-lg px-3 py-2 font-sans text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-none"
            >
              <CartLarge size={16} />
              Grocery List
            </Link>
          </div>
          <MealPlanWeek />
        </div>
      </div>
    </div>
  );
}

"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function IngredientCheckbox({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <input
      {...props}
      type="checkbox"
      className={cn(
        "ingredient-checkbox-input disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  );
}

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface UnitSystemSelectOption<TValue extends string> {
  value: TValue;
  label: string;
  meta?: string;
}

interface UnitSystemSelectProps<TValue extends string> {
  value: TValue;
  options: UnitSystemSelectOption<TValue>[];
  onValueChange: (value: TValue) => void;
  className?: string;
  density?: "compact" | "mobile";
  "aria-label"?: string;
}

export function UnitSystemSelect<TValue extends string>({
  value,
  options,
  onValueChange,
  className,
  density = "compact",
  "aria-label": ariaLabel = "Unit display",
}: UnitSystemSelectProps<TValue>) {
  const isMobileDensity = density === "mobile";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "w-[244px] rounded-lg border border-stone-200 bg-white p-1.5 shadow-[0_10px_24px_rgba(44,42,37,0.12)] dark:border-stone-700 dark:bg-stone-900",
        isMobileDensity && "w-full border-0 p-0 shadow-none",
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onValueChange(option.value)}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-md px-2 text-left font-sans text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900",
                isMobileDensity && "h-[54px] gap-3 rounded-[10px] px-3 text-[15px]",
                selected
                  ? "bg-[#F6F6F6] font-medium text-stone-900 dark:bg-stone-800 dark:text-stone-50"
                  : "text-stone-700 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800/70"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-[18px] shrink-0 items-center justify-center rounded-full border",
                  isMobileDensity && "size-5",
                  selected ? "border-[var(--color-blue)]" : "border-[#D7D3CA]"
                )}
              >
                {selected ? (
                  <span
                    className={cn(
                      "block size-2.5 rounded-full bg-[var(--color-blue)]",
                      isMobileDensity && "size-2"
                    )}
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.meta ? (
                <span className="shrink-0 text-xs font-normal text-stone-500 dark:text-stone-400">
                  {option.meta}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

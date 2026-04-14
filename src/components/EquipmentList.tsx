"use client";

import { useState } from "react";
import type { EquipmentItem, InstructionStep } from "@/lib/types";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface EquipmentListProps {
  equipment: EquipmentItem[];
  steps?: InstructionStep[];
  onStepClick?: (stepNumber: number) => void;
}

export function EquipmentList({ equipment, steps, onStepClick }: EquipmentListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleCheck = (name: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center px-3 mb-4">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          Equipment
        </h3>
      </div>

      {equipment.map((item, i) => {
        const isChecked = checked.has(item.name);
        const isLast = i === equipment.length - 1;

        return (
          <div
            key={item.name}
            className={`ingredient-list-item group ${isChecked ? "is-checked" : ""}`}
          >
            <div
              className="ingredient-list-content cursor-pointer"
              onClick={() => toggleCheck(item.name)}
            >
              <div className="flex-shrink-0 flex items-center">
                <input
                  type="checkbox"
                  className="ingredient-checkbox-input cursor-pointer"
                  aria-label={item.name}
                  checked={isChecked}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleCheck(item.name);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`flex items-center justify-between transition-opacity duration-[180ms] ${
                    isChecked ? "opacity-50" : "opacity-100"
                  }`}
                >
                  <p
                    className={`font-sans font-medium text-base text-stone-800 dark:text-stone-200 capitalize truncate ${
                      isChecked ? "line-through" : ""
                    }`}
                  >
                    {item.name}
                  </p>
                  {item.stepNumbers.length > 0 && (
                    <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                      {item.stepNumbers.map((stepNum) => {
                        const step = steps?.[stepNum - 1];
                        const tag = (
                          <button
                            key={stepNum}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStepClick?.(stepNum);
                            }}
                            className={`inline-flex items-center justify-center rounded-md bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 font-sans text-[11px] font-medium text-stone-500 dark:text-stone-400 transition-none ${
                              onStepClick
                                ? "cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-stone-300"
                                : ""
                            }`}
                          >
                            Step {stepNum}
                          </button>
                        );

                        if (step) {
                          const preview =
                            step.detail.length > 120
                              ? step.detail.slice(0, 120) + "…"
                              : step.detail;

                          return (
                            <Tooltip key={stepNum}>
                              <TooltipTrigger asChild>{tag}</TooltipTrigger>
                              <TooltipContent
                                side="top"
                                sideOffset={8}
                                hideArrow
                                className="max-w-[280px] p-0 overflow-hidden bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-xl"
                              >
                                <div className="px-3 py-2 bg-stone-50 dark:bg-stone-700/50 border-b border-stone-200 dark:border-stone-600">
                                  <p className="font-sans text-xs font-semibold text-stone-700 dark:text-stone-200">
                                    Step {stepNum}
                                    {step.title ? ` — ${step.title}` : ""}
                                  </p>
                                </div>
                                <div className="px-3 py-2.5">
                                  <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                                    {preview}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        return tag;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!isLast && (
              <div className="ingredient-list-divider absolute bottom-0 h-px bg-stone-100 dark:bg-stone-800 transition-opacity duration-150 group-hover:opacity-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

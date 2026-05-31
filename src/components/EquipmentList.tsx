"use client";

import { useState } from "react";
import type { EquipmentItem, InstructionStep } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
      <div className="flex items-center md:px-3 mb-4">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Equipment
        </h3>
      </div>

      {equipment.map((item, i) => {
        const isChecked = checked.has(item.name);
        const isLast = i === equipment.length - 1;

        return (
          <div key={item.name} className="group relative w-full rounded-md">
            <div
              className="relative flex cursor-pointer items-center gap-3 px-0 py-3.5 md:px-3 hover:bg-muted/60 rounded-md"
              onClick={() => toggleCheck(item.name)}
            >
              <div className="flex-shrink-0 flex items-center">
                <Checkbox
                  aria-label={item.name}
                  checked={isChecked}
                  onCheckedChange={() => toggleCheck(item.name)}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`flex items-center justify-between transition-opacity duration-[180ms] ${
                    isChecked ? "opacity-50" : "opacity-100"
                  }`}
                >
                  <p
                    className={`font-sans font-medium text-base text-foreground capitalize truncate ${
                      isChecked ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {item.name}
                  </p>
                  {item.stepNumbers.length > 0 && (
                    <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                      {item.stepNumbers.map((stepNum) => {
                        const step = steps?.[stepNum - 1];
                        const tag = (
                          <Badge key={stepNum} asChild variant="secondary">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStepClick?.(stepNum);
                              }}
                              className="text-[11px]"
                            >
                              Step {stepNum}
                            </button>
                          </Badge>
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
                                className="max-w-[280px] overflow-hidden border bg-popover p-0 text-popover-foreground shadow-md"
                              >
                                <div className="border-b bg-muted px-3 py-2">
                                  <p className="font-sans text-xs font-semibold text-foreground">
                                    Step {stepNum}
                                    {step.title ? ` - ${step.title}` : ""}
                                  </p>
                                </div>
                                <div className="px-3 py-2.5">
                                  <p className="font-sans text-xs text-muted-foreground leading-relaxed">
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
              <div className="absolute bottom-0 left-8 right-0 h-px bg-border md:left-11 md:right-3" />
            )}
          </div>
        );
      })}
    </div>
  );
}

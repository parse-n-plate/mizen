"use client";

import { useState, useSyncExternalStore } from "react";
import { ChevronDown } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import type { IngredientGroup } from "@/lib/types";
import { ProgressPie } from "@/components/shared/progress-pie";
import { type NumberFormat, getNumberFormat } from "@/lib/numberFormat";
import { displayAmount } from "@/utils/ingredientScaler";
import type { DiffMap } from "@/hooks/useIngredientDiff";

function subscribeToStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function useNumberFormat(): NumberFormat {
  return useSyncExternalStore(
    subscribeToStorage,
    getNumberFormat,
    () => "fractions" as NumberFormat
  );
}

interface IngredientListProps {
  groups: IngredientGroup[];
  diffMap?: DiffMap;
  diffGeneration?: number;
}

export function IngredientList({ groups, diffMap, diffGeneration }: IngredientListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const numberFormat = useNumberFormat();

  const toggleCheck = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAll = (keys: string[]) => {
    setChecked((prev) => {
      const next = new Set(prev);
      const allChecked = keys.every((key) => prev.has(key));
      for (const key of keys) {
        if (allChecked) {
          next.delete(key);
        } else {
          next.add(key);
        }
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 md:pl-3 mb-4">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex-shrink-0">
          Ingredients
        </h3>
      </div>

      {groups.map((group) => (
        <IngredientGroupSection
          key={group.groupName}
          group={group}
          checked={checked}
          onToggle={toggleCheck}
          onToggleAll={toggleAll}
          numberFormat={numberFormat}
          diffMap={diffMap}
          diffGeneration={diffGeneration}
        />
      ))}
    </div>
  );
}

function IngredientGroupSection({
  group,
  checked,
  onToggle,
  onToggleAll,
  numberFormat,
  diffMap,
  diffGeneration,
}: {
  group: IngredientGroup;
  checked: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: (keys: string[]) => void;
  numberFormat: NumberFormat;
  diffMap?: DiffMap;
  diffGeneration?: number;
}) {
  const ingredientKeys = group.ingredients.map(
    (_, sourceIndex) => `${group.groupName}-${sourceIndex}`
  );
  const totalCount = ingredientKeys.length;
  const checkedCount = ingredientKeys.filter((key) => checked.has(key)).length;
  const progressPercentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      defaultValue="ingredients"
      className="ingredient-group mb-6"
    >
      <AccordionPrimitive.Item value="ingredients" className="ingredient-group-accordion">
        <div className="flex items-center gap-2">
          <AccordionPrimitive.Header className="min-w-0 flex-1">
            <AccordionPrimitive.Trigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="ingredient-group-trigger group h-auto min-w-0 flex-1 justify-start rounded-lg py-2.5 px-0 active:!transform-none md:px-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <h3 className="font-sans text-base font-semibold text-foreground capitalize">
                    {group.groupName}
                  </h3>

                  <ChevronDown className="ingredient-group-chevron size-4 text-muted-foreground" />
                </div>
              </Button>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={`shrink-0 transition-[opacity,width] active:!transform-none ${
              checkedCount > 0 ? "opacity-100" : "w-0 overflow-hidden opacity-0 pointer-events-none"
            }`}
            onClick={() => onToggleAll(ingredientKeys)}
            tabIndex={checkedCount > 0 ? 0 : -1}
            aria-label={`${checkedCount === totalCount ? "Uncheck" : "Check"} all ingredients in ${group.groupName}`}
          >
            <ProgressPie
              percentage={progressPercentage}
              size={18}
              strokeWidth={1.5}
              color="var(--primary)"
            />
          </Button>
        </div>

        <AccordionPrimitive.Content className="ingredient-group-content overflow-hidden">
          <div className="ingredient-group-content-inner">
            {group.ingredients.map((ing, i) => {
              const key = `${group.groupName}-${i}`;
              const isChecked = checked.has(key);
              const isLast = i === group.ingredients.length - 1;
              const amount = `${displayAmount(ing.amount, numberFormat)} ${ing.units || ""}`.trim();
              const diffEntry = diffMap?.get(key);
              const hasAlerts = Boolean(ing.alerts && ing.alerts.length > 0);

              return (
                <div
                  key={key}
                  className={`ingredient-list-item group ${isChecked ? "is-checked" : ""}`}
                >
                  <div
                    className="ingredient-list-content cursor-pointer"
                    onClick={() => onToggle(key)}
                  >
                    <div className="flex-shrink-0 flex items-center">
                      <input
                        type="checkbox"
                        className="ingredient-checkbox-input cursor-pointer"
                        aria-label={ing.ingredient}
                        checked={isChecked}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggle(key);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`flex items-baseline justify-between transition-opacity duration-[180ms] ${
                          isChecked ? "opacity-50" : "opacity-100"
                        }`}
                      >
                        <div className="flex items-baseline gap-1.5 min-w-0">
                          <p
                            className={`font-sans font-medium text-base text-stone-800 dark:text-stone-200 capitalize truncate ${
                              isChecked ? "line-through" : ""
                            }`}
                          >
                            {ing.ingredient}
                          </p>
                        </div>
                        <div className="flex items-baseline gap-2 ml-3 flex-shrink-0">
                          {amount && (
                            <p className="font-sans text-sm text-stone-400 dark:text-stone-500">
                              {diffEntry ? (
                                <span key={diffGeneration}>
                                  <span className="amount-diff-old">{diffEntry.oldAmount}</span>{" "}
                                  <span className="amount-diff-new">{amount}</span>
                                </span>
                              ) : (
                                amount
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      {hasAlerts && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="font-sans text-[11px] text-amber-600 dark:text-amber-400">
                            Conflicts:
                          </span>
                          {ing.alerts?.map((alert) => (
                            <span
                              key={alert}
                              className="rounded-md bg-amber-50 px-1.5 py-0.5 font-sans text-[11px] text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                            >
                              {alert}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isLast && (
                    <div className="ingredient-list-divider absolute bottom-0 h-px bg-stone-100 dark:bg-stone-800 transition-opacity duration-150 group-hover:opacity-0" />
                  )}
                </div>
              );
            })}
          </div>
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  );
}

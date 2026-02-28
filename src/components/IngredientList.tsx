"use client";

import { useState } from "react";
import type { IngredientGroup } from "@/lib/types";
import { ProgressPie } from "@/components/shared/progress-pie";

interface IngredientListProps {
  groups: IngredientGroup[];
}

export function IngredientList({ groups }: IngredientListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

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

  const toggleAll = (groupName: string, totalCount: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      const keys = Array.from({ length: totalCount }, (_, i) => `${groupName}-${i}`);
      const allChecked = keys.every((k) => prev.has(k));
      for (const k of keys) {
        if (allChecked) {
          next.delete(k);
        } else {
          next.add(k);
        }
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <IngredientGroupSection
          key={group.groupName}
          group={group}
          checked={checked}
          expanded={expanded}
          onToggle={toggleCheck}
          onExpand={(key) => setExpanded(expanded === key ? null : key)}
          onToggleAll={toggleAll}
        />
      ))}
    </div>
  );
}

function IngredientGroupSection({
  group,
  checked,
  expanded,
  onToggle,
  onExpand,
  onToggleAll,
}: {
  group: IngredientGroup;
  checked: Set<string>;
  expanded: string | null;
  onToggle: (key: string) => void;
  onExpand: (key: string) => void;
  onToggleAll: (groupName: string, totalCount: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const totalCount = group.ingredients.length;
  const checkedCount = group.ingredients.filter(
    (_, i) => checked.has(`${group.groupName}-${i}`)
  ).length;
  const progressPercentage = totalCount > 0
    ? Math.round((checkedCount / totalCount) * 100)
    : 0;

  return (
    <div className="ingredient-group">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center py-3 pl-2 pr-0 group cursor-pointer transition-colors duration-[180ms] hover:opacity-80"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-3 flex-1">
          <h3 className="font-sans text-base font-semibold text-stone-900 dark:text-stone-100 capitalize">
            {group.groupName}
          </h3>

          {/* Progress Pie - appears when at least one ingredient is checked */}
          <div
            className={`flex items-center flex-shrink-0 transition-all duration-150 ease-out ${
              checkedCount > 0 ? "opacity-100" : "opacity-0 w-0 -ml-3 overflow-hidden pointer-events-none"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleAll(group.groupName, totalCount);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onToggleAll(group.groupName, totalCount);
              }
            }}
            role="button"
            tabIndex={checkedCount > 0 ? 0 : -1}
            aria-label={`${checkedCount === totalCount ? "Uncheck" : "Check"} all ingredients in ${group.groupName}`}
          >
            <ProgressPie
              percentage={progressPercentage}
              size={18}
              strokeWidth={1.5}
              color="#18A1F7"
            />
          </div>

          <svg
            className={`w-4 h-4 text-stone-400 dark:text-stone-500 transition-transform duration-200 ${
              collapsed ? "-rotate-90" : ""
            } ${!collapsed ? "ingredient-group-chevron" : ""}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
        }`}
      >
        <div className="overflow-hidden">
          {group.ingredients.map((ing, i) => {
            const key = `${group.groupName}-${i}`;
            const isChecked = checked.has(key);
            const isLast = i === group.ingredients.length - 1;
            const amount = `${ing.amount || ""} ${ing.units || ""}`.trim();
            const hasDetails = ing.description || (ing.substitutions && ing.substitutions.length > 0);
            const isExpanded = expanded === key;

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
                      <p
                        className={`font-sans font-medium text-base text-stone-800 dark:text-stone-200 capitalize ${
                          isChecked ? "line-through" : ""
                        }`}
                      >
                        {ing.ingredient}
                      </p>
                      <div className="flex items-baseline gap-2 ml-3 flex-shrink-0">
                        {amount && (
                          <p className="font-sans text-sm text-stone-400 dark:text-stone-500">
                            {amount}
                          </p>
                        )}
                        {hasDetails && !isChecked && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onExpand(key);
                            }}
                            className="text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors"
                            aria-label={isExpanded ? "Hide details" : "Show details"}
                          >
                            <svg
                              className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expandable detail row */}
                {hasDetails && (
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-10 pr-2 pb-3 space-y-1.5">
                        {ing.description && (
                          <p className="font-sans text-xs italic text-stone-500 dark:text-stone-400">
                            {ing.description}
                          </p>
                        )}
                        {ing.substitutions && ing.substitutions.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-sans text-[11px] text-stone-400 dark:text-stone-500">Sub:</span>
                            {ing.substitutions.map((sub) => (
                              <span
                                key={sub}
                                className="font-sans text-[11px] px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!isLast && (
                  <div className="ingredient-list-divider absolute bottom-0 left-2 right-2 h-px bg-stone-100 dark:bg-stone-800 transition-opacity duration-150 group-hover:opacity-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

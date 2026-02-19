"use client";

import { useState } from "react";
import type { IngredientGroup } from "@/lib/types";

interface IngredientListProps {
  groups: IngredientGroup[];
}

export function IngredientList({ groups }: IngredientListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

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

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <IngredientGroupSection
          key={group.groupName}
          group={group}
          checked={checked}
          onToggle={toggleCheck}
        />
      ))}
    </div>
  );
}

function IngredientGroupSection({
  group,
  checked,
  onToggle,
}: {
  group: IngredientGroup;
  checked: Set<string>;
  onToggle: (key: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="ingredient-group">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center py-3 pl-2 pr-0 group cursor-pointer transition-colors duration-[180ms] hover:opacity-80"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-3 flex-1">
          <h3 className="font-sans text-sm font-semibold text-stone-900 capitalize">
            {group.groupName}
          </h3>
          <svg
            className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
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

            return (
              <div
                key={key}
                className={`ingredient-list-item group ${isChecked ? "is-checked" : ""}`}
                onClick={() => onToggle(key)}
              >
                <div className="ingredient-list-content cursor-pointer">
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
                        className={`font-sans font-medium text-sm text-stone-800 group-hover:text-black ${
                          isChecked ? "line-through" : ""
                        }`}
                      >
                        {ing.ingredient}
                      </p>
                      {amount && (
                        <p className="font-sans text-xs text-stone-400 ml-3 flex-shrink-0">
                          {amount}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {!isLast && (
                  <div className="ingredient-list-divider group-hover:opacity-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

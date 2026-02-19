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
  const checkedCount = group.ingredients.filter((_, i) =>
    checked.has(`${group.groupName}-${i}`)
  ).length;

  return (
    <div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="group flex w-full items-center justify-between pb-2"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-stone-500">
            {group.groupName}
          </h3>
          <span className="font-sans text-xs tabular-nums text-stone-400">
            {checkedCount}/{group.ingredients.length}
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-stone-400 transition-transform ${
            collapsed ? "-rotate-90" : ""
          }`}
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

      {!collapsed && (
        <div className="divide-y divide-stone-100">
          {group.ingredients.map((ing, i) => {
            const key = `${group.groupName}-${i}`;
            const isChecked = checked.has(key);
            return (
              <div
                key={key}
                className={`ingredient-list-item ${isChecked ? "is-checked" : ""}`}
                onClick={() => onToggle(key)}
              >
                <div className="ingredient-list-content cursor-pointer">
                  <div
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded ${
                      isChecked
                        ? "bg-stone-900"
                        : "bg-stone-200"
                    }`}
                  >
                    {isChecked && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="ingredient-list-name font-sans text-sm font-medium">
                    {ing.amount && (
                      <span className="text-stone-400">{ing.amount} </span>
                    )}
                    {ing.units && (
                      <span className="text-stone-400">{ing.units} </span>
                    )}
                    <span className="text-stone-800">{ing.ingredient}</span>
                  </p>
                </div>
                <div className="ingredient-list-divider" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

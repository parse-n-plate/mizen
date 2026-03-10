"use client";

import { useState, useRef, useEffect, useMemo, useSyncExternalStore } from "react";
import Magnifer from "@solar-icons/react/csr/search/Magnifer";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Ingredient, IngredientGroup } from "@/lib/types";
import { ProgressPie } from "@/components/shared/progress-pie";
import { type NumberFormat, getNumberFormat } from "@/lib/numberFormat";
import { displayAmount } from "@/utils/ingredientScaler";

function subscribeToStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function useNumberFormat(): NumberFormat {
  return useSyncExternalStore(subscribeToStorage, getNumberFormat, () => "fractions" as NumberFormat);
}

interface IngredientListProps {
  groups: IngredientGroup[];
}

interface FilteredIngredient {
  ingredient: Ingredient;
  sourceIndex: number;
}

interface FilteredIngredientGroup {
  groupName: string;
  ingredients: FilteredIngredient[];
}

export function IngredientList({ groups }: IngredientListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredGroups = useMemo(() => {
    const normalizedGroups: FilteredIngredientGroup[] = groups.map((group) => ({
      groupName: group.groupName,
      ingredients: group.ingredients.map((ingredient, sourceIndex) => ({
        ingredient,
        sourceIndex,
      })),
    }));

    if (!searchQuery.trim()) return normalizedGroups;

    const query = searchQuery.toLowerCase().trim();
    return normalizedGroups
      .map((group) => ({
        ...group,
        ingredients: group.ingredients.filter(
          ({ ingredient }) =>
            ingredient.ingredient.toLowerCase().includes(query) ||
            (ingredient.description && ingredient.description.toLowerCase().includes(query)) ||
            (ingredient.substitutions &&
              ingredient.substitutions.some((sub) => sub.toLowerCase().includes(query)))
        ),
      }))
      .filter((group) => group.ingredients.length > 0);
  }, [groups, searchQuery]);
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

  const [showDials, setShowDials] = useState(false);
  const [pressScale, setPressScale] = useState(0.98);
  const [pressDuration, setPressDuration] = useState(150);
  const [pressEasing, setPressEasing] = useState("ease");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.style.setProperty("--press-scale", String(pressScale));
    el.style.setProperty("--press-duration", `${pressDuration}ms`);
    el.style.setProperty("--press-easing", pressEasing);
  }, [pressScale, pressDuration, pressEasing]);

  return (
    <div className="space-y-6" ref={listRef}>
      <PressDialKit
        show={showDials}
        onToggle={() => setShowDials(!showDials)}
        scale={pressScale}
        onScaleChange={setPressScale}
        duration={pressDuration}
        onDurationChange={setPressDuration}
        easing={pressEasing}
        onEasingChange={setPressEasing}
      />
      <div className="relative w-full max-w-[700px] mx-auto">
        <Magnifer className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search ingredients"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search ingredients"
          className="pl-10 pr-9 h-11 rounded-lg border-transparent bg-stone-100 dark:bg-stone-800 font-sans text-[15px] placeholder:text-muted-foreground focus-visible:bg-background focus-visible:border-input"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {filteredGroups.length === 0 && searchQuery.trim() ? (
        <p className="font-sans text-sm text-muted-foreground text-center py-4">
          No ingredients match &ldquo;{searchQuery}&rdquo;
        </p>
      ) : (
        filteredGroups.map((group) => (
          <IngredientGroupSection
            key={group.groupName}
            group={group}
            checked={checked}
            expanded={expanded}
            onToggle={toggleCheck}
            onExpand={(key) => setExpanded(expanded === key ? null : key)}
            onToggleAll={toggleAll}
            numberFormat={numberFormat}
          />
        ))
      )}
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
  numberFormat,
}: {
  group: FilteredIngredientGroup;
  checked: Set<string>;
  expanded: string | null;
  onToggle: (key: string) => void;
  onExpand: (key: string) => void;
  onToggleAll: (keys: string[]) => void;
  numberFormat: NumberFormat;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const ingredientKeys = group.ingredients.map(
    ({ sourceIndex }) => `${group.groupName}-${sourceIndex}`
  );
  const totalCount = ingredientKeys.length;
  const checkedCount = ingredientKeys.filter((key) => checked.has(key)).length;
  const progressPercentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

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
              checkedCount > 0
                ? "opacity-100"
                : "opacity-0 w-0 -ml-3 overflow-hidden pointer-events-none"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleAll(ingredientKeys);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onToggleAll(ingredientKeys);
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
              color="var(--primary)"
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
          {group.ingredients.map(({ ingredient: ing, sourceIndex }, i) => {
            const key = `${group.groupName}-${sourceIndex}`;
            const isChecked = checked.has(key);
            const isLast = i === group.ingredients.length - 1;
            const amount = `${displayAmount(ing.amount, numberFormat)} ${ing.units || ""}`.trim();
            const hasSubstitutions = ing.substitutions && ing.substitutions.length > 0;
            const isExpanded = expanded === key;
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
                          className={`font-sans font-medium text-base text-stone-800 dark:text-stone-200 capitalize flex-shrink-0 ${
                            isChecked ? "line-through" : ""
                          }`}
                        >
                          {ing.ingredient}
                        </p>
                        {ing.description && (
                          <p className="font-sans text-sm text-stone-400 dark:text-stone-500 truncate">
                            {ing.description.charAt(0).toUpperCase() + ing.description.slice(1).toLowerCase()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2 ml-3 flex-shrink-0">
                        {amount && (
                          <p className="font-sans text-sm text-stone-400 dark:text-stone-500">
                            {amount}
                          </p>
                        )}
                        {hasSubstitutions && !isChecked && (
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

                {/* Expandable substitutions row */}
                {hasSubstitutions && (
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-10 pr-2 pb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-sans text-[11px] text-stone-400 dark:text-stone-500">Sub:</span>
                          {ing.substitutions!.map((sub) => (
                            <span
                              key={sub}
                              className="font-sans text-[11px] px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
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

const EASING_OPTIONS = [
  { label: "ease", value: "ease" },
  { label: "ease-out", value: "ease-out" },
  { label: "ease-out (quad)", value: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" },
  { label: "ease-out (cubic)", value: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
  { label: "ease-out (quart)", value: "cubic-bezier(0.165, 0.84, 0.44, 1)" },
  { label: "ease-in-out", value: "ease-in-out" },
  { label: "linear", value: "linear" },
];

function PressDialKit({
  show,
  onToggle,
  scale,
  onScaleChange,
  duration,
  onDurationChange,
  easing,
  onEasingChange,
}: {
  show: boolean;
  onToggle: () => void;
  scale: number;
  onScaleChange: (v: number) => void;
  duration: number;
  onDurationChange: (v: number) => void;
  easing: string;
  onEasingChange: (v: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans text-[13px]">
      <button
        type="button"
        onClick={onToggle}
        className="absolute bottom-0 right-0 size-8 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-lg hover:bg-stone-700 transition-colors"
        aria-label="Toggle press animation dials"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>

      {show && (
        <div className="absolute bottom-10 right-0 w-64 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl p-4 space-y-4">
          <p className="font-semibold text-stone-800 dark:text-stone-200 text-[13px] tracking-wide uppercase">
            Press Animation
          </p>

          {/* Scale */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-stone-500 dark:text-stone-400">Scale</label>
              <span className="tabular-nums text-stone-800 dark:text-stone-200 font-medium">{scale.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.9"
              max="1"
              step="0.005"
              value={scale}
              onChange={(e) => onScaleChange(Number(e.target.value))}
              className="w-full accent-stone-900 dark:accent-stone-100"
            />
            <div className="flex justify-between text-[11px] text-stone-400">
              <span>0.9</span>
              <span>1.0</span>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-stone-500 dark:text-stone-400">Duration</label>
              <span className="tabular-nums text-stone-800 dark:text-stone-200 font-medium">{duration}ms</span>
            </div>
            <input
              type="range"
              min="50"
              max="400"
              step="10"
              value={duration}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              className="w-full accent-stone-900 dark:accent-stone-100"
            />
            <div className="flex justify-between text-[11px] text-stone-400">
              <span>50ms</span>
              <span>400ms</span>
            </div>
          </div>

          {/* Easing */}
          <div className="space-y-1.5">
            <label className="text-stone-500 dark:text-stone-400">Easing</label>
            <select
              value={easing}
              onChange={(e) => onEasingChange(e.target.value)}
              className="w-full rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2 py-1.5 text-[13px] text-stone-800 dark:text-stone-200"
            >
              {EASING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* CSS output */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            <p className="text-[11px] text-stone-400 mb-1">CSS output</p>
            <code className="block text-[11px] bg-stone-50 dark:bg-stone-800 rounded-md p-2 text-stone-600 dark:text-stone-300 break-all leading-relaxed select-all">
              {`scale(${scale}) · ${duration}ms ${easing}`}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}

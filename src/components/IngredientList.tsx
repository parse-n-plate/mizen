"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Magnifer from "@solar-icons/react/csr/search/Magnifer";
import { ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { Ingredient, IngredientGroup } from "@/lib/types";
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

interface FilteredIngredient {
  ingredient: Ingredient;
  sourceIndex: number;
}

interface FilteredIngredientGroup {
  groupName: string;
  ingredients: FilteredIngredient[];
}

export function IngredientList({ groups, diffMap, diffGeneration }: IngredientListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSearchContainer, setMobileSearchContainer] = useState<HTMLElement | null>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const isSearchExpanded = isSearchOpen || !!searchQuery;
  const numberFormat = useNumberFormat();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMobileSearchContainer(
        document.getElementById("mobile-recipe-search-action") ??
          document.getElementById("mobile-ingredient-search-action")
      );
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    const input = isMobileViewport ? mobileSearchInputRef.current : desktopSearchInputRef.current;
    input?.focus({ preventScroll: true });
  }, [isSearchOpen]);

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
        ingredients: group.ingredients.filter(({ ingredient }) =>
          ingredient.ingredient.toLowerCase().includes(query)
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

  const searchControl = (placement: "desktop" | "mobile") => {
    const isMobile = placement === "mobile";

    return (
      <div
        className={`group relative h-9 transition-[width] duration-200 ease-in-out ${
          isSearchExpanded
            ? isMobile
              ? "w-[min(260px,calc(100vw-5.25rem))]"
              : "w-[260px] max-w-full"
            : isMobile
              ? "w-9"
              : "w-7"
        }`}
      >
        <div className={isMobile && isSearchExpanded ? "absolute right-0 top-0 h-9 w-full" : ""}>
          {!searchQuery && (
            <Magnifer
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 size-[16px] text-muted-foreground pointer-events-none z-10 transition-colors ${
                isSearchExpanded ? "" : "group-hover:text-foreground"
              }`}
            />
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search ingredients"
                aria-hidden={isSearchExpanded}
                tabIndex={isSearchExpanded ? -1 : 0}
                className={`absolute inset-0 size-auto rounded-xl transition-opacity duration-150 ease-out ${
                  isSearchExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">Search ingredients</TooltipContent>
          </Tooltip>
          <Input
            ref={isMobile ? mobileSearchInputRef : desktopSearchInputRef}
            type="text"
            placeholder="Search Ingredients"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={() => {
              if (!searchQuery) setIsSearchOpen(false);
            }}
            aria-label="Search ingredients"
            tabIndex={isSearchExpanded ? 0 : -1}
            aria-hidden={!isSearchExpanded}
            className={`absolute inset-0 h-9 w-full rounded-xl bg-muted pl-3 pr-9 text-[13px] transition-opacity duration-200 ease-out ${
              isSearchExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {mobileSearchContainer &&
        createPortal(
          <div className="md:hidden">{searchControl("mobile")}</div>,
          mobileSearchContainer
        )}

      <div className="flex items-center justify-between gap-4 md:pl-3 mb-4">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-shrink-0">
          Ingredients
        </h3>
        <div className="hidden md:block">{searchControl("desktop")}</div>
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
            onToggle={toggleCheck}
            onToggleAll={toggleAll}
            numberFormat={numberFormat}
            diffMap={diffMap}
            diffGeneration={diffGeneration}
          />
        ))
      )}
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
  group: FilteredIngredientGroup;
  checked: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: (keys: string[]) => void;
  numberFormat: NumberFormat;
  diffMap?: DiffMap;
  diffGeneration?: number;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const ingredientKeys = group.ingredients.map(
    ({ sourceIndex }) => `${group.groupName}-${sourceIndex}`
  );
  const totalCount = ingredientKeys.length;
  const checkedCount = ingredientKeys.filter((key) => checked.has(key)).length;
  const progressPercentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCollapsed(!collapsed)}
          className="group h-auto min-w-0 flex-1 justify-start rounded-lg py-2.5 md:px-3"
          aria-expanded={!collapsed}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <h3 className="font-sans text-base font-semibold text-foreground capitalize">
              {group.groupName}
            </h3>

            <ChevronDown
              className={`size-4 text-muted-foreground transition-transform duration-200 ${
                collapsed ? "-rotate-90" : ""
              }`}
            />
          </div>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={`shrink-0 transition-[opacity,width] ${
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
            const diffEntry = diffMap?.get(key);
            const hasAlerts = Boolean(ing.alerts && ing.alerts.length > 0);

            return (
              <div key={key} className="group relative w-full rounded-md">
                <div
                  className="relative flex cursor-pointer items-center gap-3 px-0 py-3.5 md:px-3 hover:bg-muted/60 rounded-md"
                  onClick={() => onToggle(key)}
                >
                  <div className="flex-shrink-0 flex items-center">
                    <Checkbox
                      aria-label={ing.ingredient}
                      checked={isChecked}
                      onCheckedChange={() => onToggle(key)}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
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
                          className={`font-sans font-medium text-base text-foreground capitalize truncate ${
                            isChecked ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {ing.ingredient}
                        </p>
                      </div>
                      <div className="flex items-baseline gap-2 ml-3 flex-shrink-0">
                        {amount && (
                          <p className="font-sans text-sm text-muted-foreground">
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
                        <span className="font-sans text-[11px] text-muted-foreground">
                          Conflicts:
                        </span>
                        {ing.alerts?.map((alert) => (
                          <Badge key={alert} variant="secondary" className="text-[11px]">
                            {alert}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {!isLast && (
                  <div className="absolute bottom-0 left-8 right-0 h-px bg-border md:left-11 md:right-3" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

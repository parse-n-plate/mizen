import { useEffect, useRef, useState } from "react";
import type { IngredientGroup } from "@/lib/types";
import { displayAmount } from "@/utils/ingredientScaler";
import type { NumberFormat } from "@/lib/numberFormat";

export interface DiffEntry {
  oldAmount: string;
  oldUnits: string;
}

export type DiffMap = Map<string, DiffEntry>;

/**
 * Tracks ingredient amount changes when unitSystem toggles.
 * Returns a diffMap of old→new changes, persisted until the next unit change.
 */
export function useIngredientDiff(
  groups: IngredientGroup[],
  unitSystem: string,
  numberFormat: NumberFormat
): { diffMap: DiffMap; diffGeneration: number } {
  const prevGroupsRef = useRef<IngredientGroup[] | null>(null);
  const prevUnitSystemRef = useRef<string | undefined>(undefined);
  const [diffMap, setDiffMap] = useState<DiffMap>(new Map());
  const [diffGeneration, setDiffGeneration] = useState(0);

  useEffect(() => {
    const prevUnitSystem = prevUnitSystemRef.current;
    const prevGroups = prevGroupsRef.current;

    // Skip initial render
    if (prevUnitSystem === undefined) {
      prevGroupsRef.current = groups;
      prevUnitSystemRef.current = unitSystem;
      return;
    }

    // Only diff when unitSystem actually changes
    if (prevUnitSystem === unitSystem) {
      prevGroupsRef.current = groups;
      return;
    }

    // Clear diffs when returning to original units
    if (unitSystem === "original") {
      prevGroupsRef.current = groups;
      prevUnitSystemRef.current = unitSystem;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDiffMap(new Map());
      return;
    }

    const oldGroups = prevGroups;
    prevGroupsRef.current = groups;
    prevUnitSystemRef.current = unitSystem;

    if (!oldGroups) return;

    const newDiff: DiffMap = new Map();

    for (const prevGroup of oldGroups) {
      const currentGroup = groups.find((g) => g.groupName === prevGroup.groupName);
      if (!currentGroup) continue;

      for (let i = 0; i < prevGroup.ingredients.length; i++) {
        const prev = prevGroup.ingredients[i];
        const curr = currentGroup.ingredients[i];
        if (!curr) continue;

        const prevAmount = displayAmount(prev.amount, numberFormat);
        const currAmount = displayAmount(curr.amount, numberFormat);
        const prevUnits = prev.units || "";
        const currUnits = curr.units || "";

        if (prevAmount !== currAmount || prevUnits !== currUnits) {
          const key = `${prevGroup.groupName}-${i}`;
          newDiff.set(key, { oldAmount: `${prevAmount} ${prevUnits}`.trim(), oldUnits: prevUnits });
        }
      }
    }

    if (newDiff.size === 0) {
      setDiffMap(new Map());
      return;
    }

    setDiffMap(newDiff);
    setDiffGeneration((g) => g + 1);
  }, [groups, unitSystem, numberFormat]);

  return { diffMap, diffGeneration };
}

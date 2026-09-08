"use client";

import { PrepNotesCard } from "@/components/PrepNotesCard";
import type { EquipmentItem, IngredientGroup, InstructionStep, PrepNote } from "@/lib/types";
import { IngredientList } from "@/components/IngredientList";
import { EquipmentList } from "@/components/EquipmentList";
import type { DiffMap } from "@/hooks/useIngredientDiff";

interface PrepSectionProps {
  prepNotes?: PrepNote[];
  recipeIdentity?: string;
  ingredients: IngredientGroup[];
  steps: InstructionStep[];
  equipment?: EquipmentItem[];
  diffMap?: DiffMap;
  diffGeneration?: number;
  onStepClick?: (stepNumber: number) => void;
  checkedIngredients?: Set<string>;
  onCheckedIngredientsChange?: (checkedItems: Set<string>) => void;
  checkedEquipment?: Set<string>;
  onCheckedEquipmentChange?: (checkedItems: Set<string>) => void;
}

export function PrepSection({
  prepNotes,
  recipeIdentity,
  ingredients,
  steps,
  equipment,
  diffMap,
  diffGeneration,
  onStepClick,
  checkedIngredients,
  onCheckedIngredientsChange,
  checkedEquipment,
  onCheckedEquipmentChange,
}: PrepSectionProps) {
  return (
    <div className="space-y-6">
      {prepNotes && prepNotes.length > 0 && recipeIdentity && (
        <PrepNotesCard notes={prepNotes} recipeIdentity={recipeIdentity} />
      )}

      <div>
        <IngredientList
          groups={ingredients}
          diffMap={diffMap}
          diffGeneration={diffGeneration}
          checkedItems={checkedIngredients}
          onCheckedItemsChange={onCheckedIngredientsChange}
        />
      </div>

      {equipment && equipment.length > 0 && (
        <div>
          <EquipmentList
            equipment={equipment}
            steps={steps}
            onStepClick={onStepClick}
            checkedItems={checkedEquipment}
            onCheckedItemsChange={onCheckedEquipmentChange}
          />
        </div>
      )}
    </div>
  );
}

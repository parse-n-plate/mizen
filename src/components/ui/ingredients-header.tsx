"use client"

import * as React from "react"
import { Scale } from "lucide-react"
import { UnitsDropdown } from "./units-dropdown"
import type { UnitSystem } from "@/utils/unitConverter"

interface IngredientsHeaderProps {
  onScaleClick: () => void;
  unitSystem: UnitSystem;
  onUnitSystemChange: (system: UnitSystem) => void;
}

export function IngredientsHeader({
  onScaleClick,
  unitSystem,
  onUnitSystemChange,
}: IngredientsHeaderProps) {
  return (
    <div className="ingredients-header">
      <h2 className="ingredients-header-title">Ingredients</h2>
      <div className="ingredients-header-controls">
        <button
          onClick={onScaleClick}
          className="p-2.5 rounded-full bg-white shadow-sm border border-stone-200/50 hover:shadow-md hover:bg-stone-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:ring-offset-2"
          aria-label="Scale recipe"
        >
          <Scale className="w-5 h-5 text-stone-400" />
        </button>
        <UnitsDropdown
          unitSystem={unitSystem}
          onUnitSystemChange={onUnitSystemChange}
        />
      </div>
    </div>
  )
}

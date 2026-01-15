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
          className="p-2.5 rounded-full bg-transparent border-0 shadow-none hover:shadow-none hover:bg-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-300 focus:ring-offset-2"
          aria-label="Scale recipe"
        >
          <Scale className="w-5 h-5 text-stone-400 hover:text-stone-700 transition-colors" />
        </button>
        <UnitsDropdown
          unitSystem={unitSystem}
          onUnitSystemChange={onUnitSystemChange}
        />
      </div>
    </div>
  )
}

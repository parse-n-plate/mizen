"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import Settings from "@solar-icons/react/csr/settings/Settings"
import type { UnitSystem } from "@/utils/unitConverter"

interface UnitsDropdownProps {
  unitSystem: UnitSystem;
  onUnitSystemChange: (system: UnitSystem) => void;
}

export function UnitsDropdown({ unitSystem, onUnitSystemChange }: UnitsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2.5 rounded-full bg-white shadow-sm border border-stone-200/50 hover:shadow-md hover:bg-stone-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:ring-offset-2"
          aria-label="Unit settings"
        >
          <Settings className="w-5 h-5 text-stone-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuRadioGroup value={unitSystem} onValueChange={(value) => onUnitSystemChange(value as UnitSystem)}>
          <DropdownMenuRadioItem value="original">
            Original
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="metric">
            Metric
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="imperial">
            Imperial
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

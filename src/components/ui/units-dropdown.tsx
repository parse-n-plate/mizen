"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { MoreHorizontal } from "lucide-react"
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
          className="p-2 rounded-full transition-colors text-stone-400 hover:bg-stone-50 data-[state=open]:bg-stone-100 data-[state=open]:text-stone-900"
          aria-label="Unit settings"
        >
          <MoreHorizontal className="w-5 h-5" />
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

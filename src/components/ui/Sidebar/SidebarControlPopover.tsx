'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import type { SidebarMode } from '@/contexts/SidebarContext';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { PanelLeft } from 'lucide-react';

const modes: { value: SidebarMode; label: string }[] = [
  { value: 'expanded', label: 'Expanded' },
  { value: 'collapsed', label: 'Collapsed' },
  { value: 'hover', label: 'Expand on hover' },
];

interface SidebarControlPopoverProps {
  isRail: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SidebarControlPopover({ isRail, onOpenChange }: SidebarControlPopoverProps) {
  const { sidebarMode, setSidebarMode } = useSidebar();

  const trigger = (
    <DropdownMenuTrigger asChild>
      <button
        className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
        aria-label="Sidebar control"
      >
        <PanelLeft className="w-5 h-5 text-stone-400" />
      </button>
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      {isRail ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right">Sidebar control</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <DropdownMenuContent
        side={isRail ? 'right' : 'top'}
        align={isRail ? 'start' : 'end'}
      >
        <DropdownMenuLabel>Sidebar control</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={sidebarMode}
          onValueChange={(value) => setSidebarMode(value as SidebarMode)}
        >
          {modes.map((mode) => (
            <DropdownMenuRadioItem key={mode.value} value={mode.value}>
              {mode.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

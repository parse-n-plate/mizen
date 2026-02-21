'use client';

import SidebarMinimalistic from '@solar-icons/react/csr/it/SidebarMinimalistic';
import WindowFrame from '@solar-icons/react/csr/it/WindowFrame';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import type { ModalViewMode } from '@/hooks/use-modal-view-mode';

interface ModalViewSwitcherProps {
  mode: ModalViewMode;
  onModeChange: (mode: ModalViewMode) => void;
}

export function ModalViewSwitcher({ mode, onModeChange }: ModalViewSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'p-2 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-50 transition-[background-color,color] focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none',
          )}
          aria-label="Change view mode"
        >
          {mode === 'side-peek' ? (
            <SidebarMinimalistic className="size-5" aria-hidden="true" />
          ) : (
            <WindowFrame className="size-5" aria-hidden="true" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="z-[300]">
        <DropdownMenuCheckboxItem
          checked={mode === 'side-peek'}
          onCheckedChange={() => onModeChange('side-peek')}
        >
          <SidebarMinimalistic className="size-4 text-stone-400" aria-hidden="true" />
          <span className="font-albert text-sm text-stone-700">Side peek</span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={mode === 'floating'}
          onCheckedChange={() => onModeChange('floating')}
        >
          <WindowFrame className="size-4 text-stone-400" aria-hidden="true" />
          <span className="font-albert text-sm text-stone-700">Floating</span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

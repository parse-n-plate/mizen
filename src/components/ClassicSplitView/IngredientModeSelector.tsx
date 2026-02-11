'use client';

import { useIngredientDisplayMode, IngredientDisplayMode } from '@/hooks/use-ingredient-display-mode';
import SidebarMinimalistic from '@solar-icons/react/csr/it/SidebarMinimalistic';
import { TextSearch, PanelBottom } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const modes: { value: IngredientDisplayMode; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { value: 'inline', icon: TextSearch, label: 'Inline ingredients' },
  { value: 'modal', icon: SidebarMinimalistic, label: 'Ingredient panel' },
  { value: 'drawer', icon: PanelBottom, label: 'Ingredient drawer' },
];

export default function IngredientModeSelector() {
  const [mode, setMode] = useIngredientDisplayMode();

  return (
    <div className="flex bg-stone-100/60 p-1 rounded-full">
      {modes.map(({ value, icon: Icon, label }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setMode(value)}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors transition-shadow ${
                mode === value
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
              aria-label={label}
              aria-pressed={mode === value}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {label}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

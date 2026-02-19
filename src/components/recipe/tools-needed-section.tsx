import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wrench, CookingPot, Utensils } from 'lucide-react';

interface ToolsNeededSectionProps {
  tools: string[];
  variant?: 'compact' | 'spacious' | 'minimal';
}

export function ToolsNeededSection({ 
  tools, 
  variant = 'compact' 
}: ToolsNeededSectionProps) {
  if (!tools || tools.length === 0) return null;

  // Simple icon mapping
  const getIcon = (tool: string) => {
    const lower = tool.toLowerCase();
    if (lower.includes('pot') || lower.includes('pan') || lower.includes('skillet')) return <CookingPot className="h-3 w-3" />;
    if (lower.includes('spoon') || lower.includes('whisk') || lower.includes('knife')) return <Utensils className="h-3 w-3" />;
    return <Wrench className="h-3 w-3" />;
  };

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {tools.map((tool, i) => (
          <Badge key={i} variant="outline" className="text-xs font-normal text-stone-600 border-stone-200 gap-1">
            {getIcon(tool)}
            {tool}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1">
        <span>Tools</span>
      </h4>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-stone-700 bg-white p-2 rounded-md border border-stone-200 shadow-sm">
            {getIcon(tool)}
            <span>{tool}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


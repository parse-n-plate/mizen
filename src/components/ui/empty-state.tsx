'use client';

import { Search, SearchX, ChefHat, Link as LinkIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export type EmptyStateVariant = 'no-input' | 'no-results' | 'no-recent';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  compact?: boolean;
  className?: string;
  onAction?: () => void;
}

const emptyStateConfig = {
  'no-input': {
    icon: LinkIcon,
    heading: "Enter a recipe URL to get started",
    description: "Paste any recipe link and we'll parse it for you",
    showAction: false,
  },
  'no-results': {
    icon: SearchX,
    heading: "No recipes found",
    description: "Try searching with different keywords",
    showAction: false,
  },
  'no-recent': {
    icon: ChefHat,
    heading: "No recent recipes yet",
    description: "Parse your first recipe to see it here",
    showAction: true,
    actionLabel: "Get Started",
  },
};

export default function EmptyState({
  variant,
  compact = false,
  className,
  onAction,
}: EmptyStateProps) {
  const config = emptyStateConfig[variant];
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-8 px-4 text-center',
          className
        )}
      >
        <Icon className="w-8 h-8 text-stone-400 mb-3" />
        <h3 className="font-albert font-medium text-sm text-stone-700 mb-1">
          {config.heading}
        </h3>
        <p className="font-albert text-xs text-stone-500 max-w-xs">
          {config.description}
        </p>
        {config.showAction && onAction && (
          <Button
            onClick={onAction}
            variant="outline"
            size="sm"
            className="mt-4 font-albert"
          >
            {config.actionLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-stone-400" />
      </div>
      <h3 className="font-albert font-semibold text-base text-stone-800 mb-2">
        {config.heading}
      </h3>
      <p className="font-albert text-sm text-stone-600 max-w-sm mb-6">
        {config.description}
      </p>
      {config.showAction && onAction && (
        <Button
          onClick={onAction}
          variant="default"
          size="default"
          className="font-albert"
        >
          {config.actionLabel}
        </Button>
      )}
    </div>
  );
}








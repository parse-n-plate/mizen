import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Textarea Component
 * 
 * A reusable textarea component with consistent styling across the app.
 * Based on the design system with stone-50 background and stone-300 border.
 * 
 * Features:
 * - Stone-50 background (#FAFAF9)
 * - Stone-300 border
 * - Responsive sizing
 * - Focus states with ring
 * - Font-albert typography
 * 
 * @example
 * <Textarea 
 *   placeholder="Enter your notes..."
 *   value={notes}
 *   onChange={(e) => setNotes(e.target.value)}
 *   rows={4}
 * />
 */
export interface TextareaProps extends React.ComponentProps<'textarea'> {
  className?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          // Base styles
          'w-full p-4 bg-stone-50 border border-stone-300 rounded-xl',
          // Typography
          'font-albert text-sm md:text-base text-stone-800',
          // Placeholder
          'placeholder-stone-400',
          // Focus states
          'focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent',
          // Resize and transitions
          'resize-none transition-all',
          // Responsive min-height
          'min-h-[100px] md:min-h-[120px]',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };

'use client';

import { useState, useEffect } from 'react';
import ChefHatHeartBold from '@solar-icons/react/csr/food/ChefHatHeart';
import { X } from 'lucide-react';

/**
 * HomepageBanner Component
 *
 * Displays a sticky banner directly under the navigation bar, flush against it.
 * Features a filled heart chef hat icon from Solar icons and spans only
 * the width of the content (matching navbar max-w-6xl).
 *
 * Progressive Disclosure Enhancement:
 * - Banner can be dismissed by clicking the X button
 * - Dismissal state persists in localStorage (per session)
 * - Once dismissed, banner stays hidden until localStorage is cleared
 *
 * Design specifications from Figma:
 * - Flush against the nav bar (no gap)
 * - Spans only the width of the content (matching navbar max-w-6xl)
 * - Only bottom left and right corners are rounded (rounded-b-lg)
 * - Uses filled Solar icon ChefHatHeartBold
 * - Fully responsive
 * - Sticky positioning: remains visible at top of viewport when scrolling
 */
export default function HomepageBanner() {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Read localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    if (localStorage.getItem('homepage-banner-dismissed') === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Handle dismiss button click
  const handleDismiss = () => {
    setIsDismissed(true);
    // Persist dismissal state in localStorage
    localStorage.setItem('homepage-banner-dismissed', 'true');
  };

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  return (
    <div className="w-full sticky top-0 z-20">
      {/* Container matches navbar width for consistent alignment - same max-w-6xl and padding */}
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Banner with rounded bottom corners only - flush against navbar, no top margin/padding */}
        {/* Using rounded-b-lg for bottom corners only */}
        {/* Sticky positioning: stays at top of viewport when scrolling */}
        <div className="flex items-center justify-center gap-3 py-3 md:py-4 bg-blue-100 dark:bg-[#1E3A5F] rounded-b-lg relative">
          {/* Chef Hat Icon with Heart - using filled Solar icon */}
          {/* Icon size responsive: smaller on mobile, larger on desktop */}
          <ChefHatHeartBold 
            weight="Bold"
            className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-300 flex-shrink-0"
            aria-hidden="true"
          />
          
          {/* Banner Text - responsive font sizes */}
          <p className="font-albert text-[14px] md:text-[15px] text-blue-600 dark:text-blue-300 font-medium">
            This website is still being cooked up
          </p>

          {/* Dismiss Button - positioned absolutely on the right */}
          <button
            onClick={handleDismiss}
            className="absolute right-4 p-1 rounded-full hover:bg-blue-200/50 dark:hover:bg-blue-800/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4 text-blue-600 dark:text-blue-300" />
          </button>
        </div>
      </div>
    </div>
  );
}


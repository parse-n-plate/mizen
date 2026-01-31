'use client';

import ChefHatHeartBold from '@solar-icons/react/csr/food/ChefHatHeart';

/**
 * HomepageBanner Component
 * 
 * Displays a sticky banner directly under the navigation bar, flush against it.
 * Features a filled heart chef hat icon from Solar icons and spans only
 * the width of the content (matching navbar max-w-6xl).
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
  return (
    <div className="w-full sticky top-0 z-10">
      {/* Container matches navbar width for consistent alignment - same max-w-6xl and padding */}
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Banner with rounded bottom corners only - flush against navbar, no top margin/padding */}
        {/* Using rounded-b-lg for bottom corners only */}
        {/* Sticky positioning: stays at top of viewport when scrolling */}
        <div className="flex items-center justify-center gap-3 py-3 md:py-4 bg-blue-100 rounded-b-lg">
          {/* Chef Hat Icon with Heart - using filled Solar icon */}
          {/* Icon size responsive: smaller on mobile, larger on desktop */}
          <ChefHatHeartBold 
            weight="Bold"
            className="w-5 h-5 md:w-6 md:h-6 text-blue-600 flex-shrink-0" 
            aria-hidden="true"
          />
          
          {/* Banner Text - responsive font sizes */}
          <p className="font-albert text-[14px] md:text-[15px] text-blue-600 font-medium">
            This website is still being cooked up
          </p>
        </div>
      </div>
    </div>
  );
}


'use client';

import Image from 'next/image';

/**
 * PotIcon Component
 * 
 * Displays the cooking pot icon used in the hero section and category headers.
 * 
 * If you have a pot icon SVG in /assets/icons/pot-icon.svg, it will use that.
 * Otherwise, it falls back to an emoji placeholder.
 */
export default function PotIcon({ className = '' }: { className?: string }) {
  // Try to use pot icon from assets, fallback to emoji if not available
  // Add pot-icon.svg to /assets/icons/ if you have the asset
  const hasPotIcon = false; // Set to true once you add the icon file

  return (
    <div className={`h-[35.739px] relative shrink-0 w-[43.5px] ${className}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        {hasPotIcon ? (
          <Image
            src="/assets/icons/pot-icon.svg"
            alt=""
            width={43.5}
            height={35.739}
            className="object-contain"
          />
        ) : (
          // Fallback emoji - replace with actual icon when available
          <div className="text-2xl">🍳</div>
        )}
      </div>
    </div>
  );
}






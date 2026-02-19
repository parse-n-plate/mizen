'use client';

import { motion } from 'framer-motion';

/**
 * AnimatedFish Component
 * 
 * Main animated fish component that wraps the eye group with motion.g
 * and applies blinking animation using scaleY.
 * 
 * Props:
 * - blinkEnabled: Whether blinking animation is enabled
 * - blinkSpeed: Speed multiplier for blink animation (0.1x to 3x)
 * - easingType: Easing curve type (linear, ease-in, ease-out, ease-in-out, bounce)
 */

interface AnimatedFishProps {
  blinkEnabled: boolean;
  blinkSpeed: number;
  easingType: string;
}

// Helper function to convert easing type string to cubic bezier array
function getEasing(easingType: string): [number, number, number, number] {
  switch (easingType.toLowerCase()) {
    case 'linear':
      return [0, 0, 1, 1];
    case 'ease-in':
      return [0.42, 0, 1, 1];
    case 'ease-out':
      return [0, 0, 0.58, 1];
    case 'ease-in-out':
      return [0.42, 0, 0.58, 1];
    case 'bounce':
      return [0.68, -0.55, 0.265, 1.55];
    default:
      return [0.42, 0, 0.58, 1]; // Default to ease-in-out
  }
}

// FishBody component - placeholder structure
// TODO: Copy actual FishBody component from WholeFish.tsx
function FishBody({ blinkEnabled, blinkSpeed, easingType }: AnimatedFishProps) {
  const easing = getEasing(easingType);
  
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fish body paths - placeholder */}
      {/* TODO: Copy actual fish body paths from WholeFish.tsx */}
      <path
        d="M100 50 Q150 100 100 150 Q50 100 100 50"
        fill="#2686FF"
        stroke="#154DF6"
        strokeWidth="2"
      />
      
      {/* Eye group wrapped with motion.g for animation */}
      <motion.g
        id="Eye"
        style={{
          transformOrigin: '50% 50%',
        }}
        animate={
          blinkEnabled
            ? {
                scaleY: [1, 0.05, 1],
              }
            : {}
        }
        transition={
          blinkEnabled
            ? {
                duration: 2 / blinkSpeed,
                repeat: Infinity,
                times: [0, 0.05, 0.15],
                ease: easing,
              }
            : {}
        }
      >
        {/* Eye circle - placeholder */}
        {/* TODO: Copy actual eye paths from WholeFish.tsx Eye group */}
        <circle cx="120" cy="90" r="8" fill="#0C0A09" />
        <circle cx="120" cy="90" r="4" fill="#FFFFFF" />
      </motion.g>
      
      {/* Other fish body elements */}
      {/* TODO: Copy remaining fish body elements from WholeFish.tsx */}
    </svg>
  );
}

// Hat component - placeholder structure
// TODO: Copy actual Hat component from WholeFish.tsx
function Hat() {
  return (
    <g id="Hat">
      {/* Hat paths - placeholder */}
      {/* TODO: Copy actual hat paths from WholeFish.tsx */}
      <path
        d="M80 40 L120 40 L110 20 L90 20 Z"
        fill="#FFFCFA"
        stroke="#F2ECE8"
        strokeWidth="1"
      />
    </g>
  );
}

export default function AnimatedFish({
  blinkEnabled,
  blinkSpeed,
  easingType,
}: AnimatedFishProps) {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Render FishBody with animation props */}
        <FishBody
          blinkEnabled={blinkEnabled}
          blinkSpeed={blinkSpeed}
          easingType={easingType}
        />
        
        {/* Render Hat */}
        <Hat />
      </svg>
    </div>
  );
}

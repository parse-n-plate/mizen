'use client';

interface StarIconProps {
  filled: boolean;
  size?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * StarIcon Component
 * 
 * A reusable star icon for rating interfaces.
 * Based on the prototype at /Users/gageminamoto/Desktop/Prototype Plate Tab/
 * 
 * @param filled - Whether the star should be filled (yellow) or empty (gray)
 * @param size - Size in pixels (default: 48)
 * @param onClick - Optional click handler
 * @param className - Additional CSS classes
 */
export default function StarIcon({ filled, size = 48, onClick, className = '' }: StarIconProps) {
  const fillColor = filled ? '#FFB800' : '#CACACA';
  
  // Check if className contains responsive width/height classes
  // If so, use className for SVG sizing and don't set inline styles
  // Otherwise, use the size prop with inline styles
  const hasSizeClasses = /[wh]-\[?\d/.test(className) || className.includes('w-') || className.includes('h-');
  const svgStyle = hasSizeClasses ? {} : { width: `${size}px`, height: `${size}px` };
  const svgClassName = hasSizeClasses ? className : '';

  return (
    <button
      onClick={onClick}
      className="cursor-pointer hover:scale-110 transition-transform"
      type="button"
      aria-label={filled ? 'Filled star' : 'Empty star'}
    >
      <svg 
        className={svgClassName}
        style={svgStyle}
        fill="none" 
        preserveAspectRatio="none" 
        viewBox="0 0 34.2452 32.7067"
      >
        <path
          d="M17.1217 27.4L8.82173 32.4C8.45511 32.6333 8.07173 32.7333 7.67176 32.7C7.27173 32.6667 6.92176 32.5333 6.62172 32.3C6.32175 32.0667 6.08841 31.7753 5.92172 31.426C5.75508 31.0766 5.72173 30.6847 5.82173 30.25L8.02173 20.8L0.671718 14.45C0.338392 14.15 0.130387 13.808 0.0477636 13.424C-0.0349197 13.04 -0.0102536 12.6653 0.121762 12.3C0.253718 11.9347 0.453763 11.6346 0.721775 11.4C0.989727 11.1653 1.3564 11.0153 1.82175 10.95L11.5218 10.1L15.2718 1.19996C15.4384 0.799996 15.6971 0.50002 16.0477 0.299976C16.3984 0.0999921 16.7564 0 17.1217 0C17.4871 0 17.8451 0.0999921 18.1958 0.299976C18.5464 0.50002 18.8051 0.799996 18.9718 1.19996L22.7218 10.1L32.4218 10.95C32.8884 11.0167 33.2551 11.1667 33.5217 11.4C33.7884 11.6333 33.9884 11.9333 34.1217 12.3C34.2551 12.6667 34.2804 13.042 34.1977 13.426C34.115 13.81 33.9064 14.1513 33.5717 14.45L26.2218 20.8L28.4217 30.25C28.5218 30.6833 28.4884 31.0753 28.3217 31.426C28.1551 31.7766 27.9218 32.068 27.6217 32.3C27.3217 32.532 26.9718 32.6653 26.5717 32.7C26.1717 32.7346 25.7884 32.6346 25.4217 32.4L17.1217 27.4Z"
          fill={fillColor}
        />
      </svg>
    </button>
  );
}

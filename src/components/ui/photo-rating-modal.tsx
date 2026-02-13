'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import StarIcon from './star-icon';

interface PhotoRatingModalProps {
  photos: Array<{ data: string; filename: string }>;
  recipeTitle?: string;
  onConfirm: (rating: number) => void;
  onClose: () => void;
}

/**
 * PhotoRatingModal Component
 * 
 * Displays a rating prompt after a user captures a photo of their dish.
 * Based on the Figma designs for desktop and mobile layouts.
 * 
 * Features:
 * - White background modal with rounded corners and shadow
 * - Close button (X) - top-right on desktop, top-left on mobile
 * - Single photo preview with slight rotation
 * - 5-star rating interface (interactive) with rating labels
 * - "Continue" button to proceed
 * - Viewport locked (prevents scrolling when modal is open)
 * 
 * Flow: Photo Capture → Rating Modal → Share Sheet
 * 
 * @param photos - Array of photo objects with data URLs
 * @param recipeTitle - Optional recipe title to display in title
 * @param onConfirm - Callback function called with rating (1-5) when user confirms
 * @param onClose - Callback function called when user clicks close button
 */
export default function PhotoRatingModal({ 
  photos,
  recipeTitle,
  onConfirm,
  onClose
}: PhotoRatingModalProps) {
  // Default rating starts at 3 stars (middle rating)
  const [rating, setRating] = useState(3);

  // Rating labels based on star count
  const getRatingLabel = (stars: number): string => {
    switch (stars) {
      case 1:
        return 'Not Great';
      case 2:
        return 'Could Be Better';
      case 3:
        return 'Pretty Good!';
      case 4:
        return 'Great!';
      case 5:
        return 'Amazing!';
      default:
        return '';
    }
  };

  // Lock viewport scroll when modal is open and hide navbar
  useEffect(() => {
    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Hide navbar by finding it via its z-index
    const navbar = document.querySelector('[class*="sticky"][class*="z-[10000]"]') as HTMLElement;
    if (navbar) {
      navbar.style.display = 'none';
    }
    
    return () => {
      // Restore body scroll
      document.body.style.overflow = originalOverflow;
      
      // Show navbar again
      if (navbar) {
        navbar.style.display = '';
      }
    };
  }, []);

  const handleConfirm = () => {
    onConfirm(rating);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[10001] flex items-center justify-center p-4 md:p-6"
    >
      {/* Inner card with animation - White background matching Figma design */}
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
      >
        {/* Close Button - Top-left on mobile, top-right on desktop */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 md:top-6 md:left-auto md:right-6 text-stone-600 hover:text-stone-800 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-6 h-6 md:w-7 md:h-7" />
        </button>

        {/* Photo Preview - Single tilted card matching Figma */}
        <div className="mb-5 md:mb-6 relative w-full h-[180px] md:h-[200px] flex items-center justify-center">
          {photos.length > 0 && (
            <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              <div
                className="transform bg-white border-[3.8px] border-white rounded-[15px] w-[99px] md:w-[120px] h-[122px] md:h-[148px] overflow-hidden shadow-lg"
                style={{
                  transform: 'rotate(-8deg)',
                  transformOrigin: 'center',
                }}
              >
                <img
                  src={photos[0].data}
                  alt="Your dish"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Title - Matching Figma design with recipe title */}
        <h2 className="font-domine text-stone-800 text-xl md:text-2xl font-semibold text-center mb-4 md:mb-5 leading-heading">
          How did your {recipeTitle || 'dish'} turn out?
        </h2>

        {/* Star Rating - 5 interactive stars */}
        <div className="flex justify-center gap-2 md:gap-3 mb-2 md:mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon
              key={star}
              filled={star <= rating}
              size={48}
              onClick={() => setRating(star)}
            />
          ))}
        </div>

        {/* Rating Label - Dynamic text based on selected stars */}
        <p className="font-albert text-stone-600 text-center mb-5 md:mb-6 text-sm md:text-base">
          {getRatingLabel(rating)}
        </p>

        {/* Continue Button - Black background with white text matching Figma */}
        <button
          onClick={handleConfirm}
          className="font-albert w-full bg-black text-white py-3.5 md:py-4 rounded-full font-semibold text-base md:text-lg hover:bg-stone-800 transition-colors active:scale-[0.98]"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}

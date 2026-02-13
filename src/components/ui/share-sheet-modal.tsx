'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, MessageCircle, Link as LinkIcon } from 'lucide-react';
import StarIcon from './star-icon';
import Image from 'next/image';
import { CUISINE_ICON_MAP } from '@/config/cuisineConfig';


interface ShareSheetModalProps {
  photos: Array<{ data: string; filename: string }>;
  rating: number;
  onRatingChange: (rating: number) => void;
  recipeTitle?: string;
  recipeAuthor?: string;
  cuisine?: string[];
  onClose: () => void;
}

// Color options for the share card - matching the design with white ring selection
const CARD_COLORS = [
  { name: 'Green', value: '#2D6651' }, // Forest green
  { name: 'Blue', value: '#0088FF' }, // Sky blue
  { name: 'Black', value: '#000000' }, // Solid black
];

/**
 * ShareSheetModal Component
 * 
 * Full-screen modal displaying a shareable card preview with share options.
 * Based on the prototype at /Users/gageminamoto/Desktop/Prototype Plate Tab/src/app/components/ShareSheet.tsx
 * 
 * Features:
 * - Header with close button
 * - Share card preview (photo, title, cuisine, rating, metadata)
 * - Share options row (Messages, IG Story, Photos, More)
 * - Editable rating on the card
 * 
 * Flow: Photo Capture → Rating Modal → Share Sheet
 * 
 * @param photos - Array of photo objects with data URLs
 * @param rating - Current rating (1-5 stars)
 * @param onRatingChange - Callback to update rating
 * @param recipeTitle - Recipe title to display
 * @param recipeAuthor - Recipe author/source
 * @param cuisine - Array of cuisine types (e.g., ["Japanese"])
 * @param onClose - Callback to close the modal
 */
export default function ShareSheetModal({
  photos,
  rating,
  onRatingChange,
  recipeTitle = 'Your Dish',
  recipeAuthor,
  cuisine,
  onClose,
}: ShareSheetModalProps) {
  // Get today's date formatted
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Get selected cuisines for display (all of them, not just the first)
  const selectedCuisines = cuisine && cuisine.length > 0 ? cuisine : [];

  // Ref for the share card element to capture
  const shareCardRef = useRef<HTMLDivElement>(null);
  
  // State for selected card color
  const [selectedColor, setSelectedColor] = useState('#2D6651'); // Default green (matching design)

  // Lock viewport scroll when modal is open and hide navbar
  useEffect(() => {
    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Hide navbar by adding a class or setting style
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

  // Handle share card download - capture and download the entire card
  const handleSavePhoto = async () => {
    // Wait a bit to ensure the element is rendered (framer-motion animation)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const cardElement = shareCardRef.current;
    if (!cardElement) {
      console.error('Share card ref not found');
      alert('Card not ready to save! Please try again.');
      return;
    }

    try {
      // Dynamically import html2canvas for capturing the card
      const html2canvas = (await import('html2canvas-pro')).default;
      
      // Create a full-resolution clone for export
      // The displayed card is scaled to fit viewport, but we want full resolution for export
      const clone = cardElement.cloneNode(true) as HTMLElement;
      
      // Set clone to full resolution width (remove viewport constraints)
      const exportWidth = 1200; // Full resolution width for export
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = `${exportWidth}px`;
      clone.style.maxWidth = 'none'; // Remove max-width constraint
      clone.style.transform = 'none'; // Remove any transforms
      clone.style.opacity = '1'; // Ensure it's visible for capture
      clone.style.zIndex = '9999'; // Ensure it's on top for capture
      
      // Remove height constraints on photo container to allow images to render at full resolution
      // The photo container has responsive height classes (h-[180px] sm:h-[200px] md:h-[220px])
      // We'll remove these and let it scale naturally with the larger width
      const photoContainer = clone.querySelector('[data-photo-container="true"]') as HTMLElement;
      if (photoContainer) {
        // Remove fixed height - let it scale proportionally
        // Calculate proportional height: if display is ~440px wide with ~220px height, 
        // then at 1200px width, height should be ~600px (maintaining aspect ratio)
        photoContainer.style.height = 'auto';
        photoContainer.style.minHeight = '600px'; // Set a larger min-height for export
      }
      
      // Append clone to body temporarily
      document.body.appendChild(clone);
      
      // Wait for images to load at full resolution
      // Load all images first to ensure they're ready
      const images = clone.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map((img) => {
          return new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Resolve even on error to not block
            }
          });
        })
      );
      
      // Additional wait to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Capture the full-resolution clone
      const canvas = await html2canvas(clone, {
        backgroundColor: selectedColor, // Use selected color for any transparent areas
        scale: 2, // Use scale 2 for even higher quality export (2400px final width)
        useCORS: true,
        logging: false,
        allowTaint: true,
        width: exportWidth,
        // Let height be calculated automatically to maintain aspect ratio
        imageTimeout: 15000, // Give images more time to load
      });

      // Remove the clone from DOM
      document.body.removeChild(clone);

      // Convert canvas to blob and download
      canvas.toBlob((blob: Blob | null) => {
        if (!blob) {
          alert('Could not create image. Please try again.');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${recipeTitle.replace(/\s+/g, '-').toLowerCase()}-share-card-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Error saving share card:', error);
      alert('Could not save share card. Please try again.');
    }
  };

  // Handle native share - share the most recent photo
  const _handleMoreShare = async () => {
    if (!photos || photos.length === 0) {
      alert('No photos to share!');
      return;
    }

    try {
      // Get the most recent photo
      const photoToShare = photos[photos.length - 1];
      // Convert base64 to blob
      const base64Response = await fetch(photoToShare.data);
      const blob = await base64Response.blob();
      const file = new File([blob], `${recipeTitle}.jpg`, { type: 'image/jpeg' });

      // Check if Web Share API is supported
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `My ${recipeTitle}`,
          text: `Check out my ${recipeTitle}!`,
          files: [file],
        });
      } else {
        alert('Sharing not available on this device');
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[10001] overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      <div className="h-screen flex flex-col items-center justify-between p-2 sm:p-3 md:p-4 max-w-full w-full box-border [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Header with close button - Compact layout */}
        <div className="flex items-center justify-between w-full max-w-md mb-2 sm:mb-3 px-1 flex-shrink-0">
          <button 
            onClick={onClose}
            className="bg-white rounded-full size-8 sm:size-9 md:size-10 flex items-center justify-center hover:opacity-70 transition-opacity shadow-sm flex-shrink-0"
          >
            <X className="size-5 sm:size-6 md:size-7 text-black" />
          </button>
          
          <h1 className="font-albert font-bold text-sm sm:text-base md:text-lg lg:text-xl text-heading leading-tight text-center flex-1 mx-2 sm:mx-3">
            Share your masterpiece!
          </h1>
          
          {/* Spacer for centering */}
          <div className="w-8 sm:w-9 md:w-10 flex-shrink-0" />
        </div>

        {/* Content wrapper - Scrollable if content exceeds viewport */}
        {/* Added padding (pt, pb, px) to prevent shadow clipping - shadows need space outside content area */}
        {/* shadow-2xl can extend ~25-30px, so we use px-6/px-8 and pt/pb-6/8 to give enough room */}
        <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 md:gap-4 w-full max-w-md flex-1 min-h-0 px-6 sm:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8 box-border overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Color Picker Section - Matching design with white ring */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-3 sm:gap-4"
            >
              {CARD_COLORS.map((color) => {
                const isSelected = selectedColor === color.value;
                return (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`rounded-full transition-all hover:scale-110 flex-shrink-0 focus:outline-none ${
                      isSelected 
                        ? 'w-8 h-8 border-2 border-white' 
                        : 'w-7 h-7'
                    }`}
                    style={{
                      backgroundColor: color.value,
                      // Add subtle border for white/light colors to make them visible
                      ...(color.value === '#FFFFFF' && !isSelected && {
                        border: '1px solid #e5e5e5',
                      }),
                    }}
                    aria-label={`Select ${color.name} color`}
                  />
                );
              })}
            </motion.div>
          </div>

          {/* Share Card Preview - Responsive padding and scaling */}
          <motion.div
            ref={shareCardRef}
            data-share-card="true"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl sm:rounded-[28px] p-4 sm:p-6 md:p-8 lg:p-9 w-full max-w-full shadow-2xl transition-colors duration-500 overflow-hidden box-border flex-shrink-0"
            style={{ backgroundColor: selectedColor }}
          >
            <div className="w-full flex flex-col gap-2 sm:gap-3 md:gap-4 items-center">
              {/* Title section - Responsive typography */}
              <div className="w-full">
                <p className="font-albert font-normal text-xs sm:text-sm md:text-base text-white/80 leading-tight">
                  I whipped up
                </p>
                <h2 className="font-domine font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl text-white leading-tight mt-0.5 break-words">
                  {recipeTitle}
                </h2>
              </div>

              {/* Cuisine pills - Responsive padding and sizing */}
              {selectedCuisines.length > 0 && (
                <div className="flex items-start w-full">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {selectedCuisines.map((cuisineName) => {
                      const iconPath = CUISINE_ICON_MAP[cuisineName] || '';
                      return (
                        <div
                          key={cuisineName}
                          className="bg-white/20 backdrop-blur-md rounded-full px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-1.5 border border-white/30 flex-shrink-0"
                        >
                          {/* Cuisine Icon */}
                          {iconPath && (
                            <span className="flex-shrink-0">
                              <Image
                                src={iconPath}
                                alt={`${cuisineName} cuisine icon`}
                                width={32}
                                height={32}
                                quality={100}
                                unoptimized={true}
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 object-contain"
                                draggable={false}
                              />
                            </span>
                          )}
                          {/* Cuisine Text */}
                          <span className="font-albert text-[9px] sm:text-[10px] md:text-xs font-bold text-white uppercase tracking-wide">
                            {cuisineName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Photo preview - Responsive height that scales with viewport */}
              <div data-photo-container="true" className="flex items-center justify-center h-[160px] sm:h-[180px] md:h-[200px] lg:h-[220px] xl:h-[240px] w-full max-w-full relative overflow-hidden">
                {photos.length > 0 ? (
                  photos.slice(0, 3).map((photo, index) => {
                    const rotations = [12, -8, 4];
                    const xOffsets = [0, 35, 70];
                    const zIndexes = [30, 20, 10];
                    const photoWidth = '42%';
                    const photoHeight = '75%';

                    return (
                      <div
                        key={index}
                        className="absolute"
                        style={{
                          left: `calc(50% - 21% + ${(xOffsets[index] - 35) * 0.8}px)`,
                          top: '50%',
                          transform: `translateY(-50%)`,
                          zIndex: zIndexes[index],
                          width: photoWidth,
                          height: photoHeight,
                        }}
                      >
                        <div
                          className="w-full h-full bg-white border-2 sm:border-[3px] md:border-[4px] border-white rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-lg sm:shadow-xl md:shadow-2xl transition-transform hover:scale-105 duration-300"
                          style={{
                            transform: `rotate(${rotations[index]}deg)`,
                            transformOrigin: 'center',
                          }}
                        >
                          <img
                            src={photo.data}
                            alt={`Your dish ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full bg-white/10 backdrop-blur-sm flex items-center justify-center rounded-xl sm:rounded-2xl border border-white/20">
                    <p className="font-albert text-white/60 text-xs sm:text-sm italic">No photos captured</p>
                  </div>
                )}
                
                {/* Show count badge if more than 3 photos */}
                {photos.length > 3 && (
                  <div
                    className="absolute bg-white text-[#0088ff] rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center font-albert font-bold text-xs sm:text-sm shadow-xl z-40"
                    style={{
                      right: '8%',
                      bottom: '15%',
                    }}
                  >
                    +{photos.length - 3}
                  </div>
                )}
              </div>

              {/* Star rating - Responsive sizing */}
              <div className="flex gap-1 sm:gap-1.5 items-center bg-white/10 backdrop-blur-md px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-white/20">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    filled={star <= rating}
                    size={20}
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
                    onClick={() => onRatingChange(star)}
                  />
                ))}
              </div>

              {/* Metadata section - Responsive padding and typography */}
              <div className="bg-white/20 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 w-full flex flex-col gap-2 sm:gap-3 md:gap-4 border border-white/30">
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  <div className="flex flex-col gap-0.5">
                    <p className="font-albert font-normal text-[8px] sm:text-[9px] md:text-[10px] text-white/60 uppercase tracking-wider">
                      Cooked by
                    </p>
                    <p className="font-albert font-bold text-xs sm:text-sm md:text-base text-white leading-tight break-words">
                      Chef __
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-0.5">
                    <p className="font-albert font-normal text-[8px] sm:text-[9px] md:text-[10px] text-white/60 uppercase tracking-wider">
                      Cooked On
                    </p>
                    <p className="font-albert font-bold text-xs sm:text-sm md:text-base text-white leading-tight break-words">
                      {formattedDate}
                    </p>
                  </div>
                </div>

                {recipeAuthor && (
                  <div className="flex flex-col gap-0.5 pt-1.5 sm:pt-2 md:pt-3 border-t border-white/10">
                    <p className="font-albert font-normal text-[8px] sm:text-[9px] md:text-[10px] text-white/60 uppercase tracking-wider">
                      Recipe from
                    </p>
                    <p className="font-albert font-bold text-xs sm:text-sm md:text-base text-white leading-tight break-words">
                      {recipeAuthor}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Share options row - Responsive sizing and spacing */}
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 w-full max-w-full box-border flex-shrink-0 mt-1 sm:mt-2 pb-2">
            {/* First Row - Social and Action Sharing Options */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 overflow-visible scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {/* Copy Link button */}
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }}
                className="flex flex-col gap-1 sm:gap-1.5 md:gap-2 items-center group flex-shrink-0"
              >
                <div className="bg-white rounded-full size-12 sm:size-14 md:size-16 flex items-center justify-center border border-stone-200 shadow-sm group-hover:scale-110 transition-transform">
                  <LinkIcon className="size-5 sm:size-6 md:size-7 text-stone-600" />
                </div>
                <p className="font-albert font-medium text-[9px] sm:text-[10px] md:text-xs text-stone-700 leading-tight text-center">
                  Copy Link
                </p>
              </button>

              {/* Save Photo button */}
              <button 
                onClick={handleSavePhoto}
                className="flex flex-col gap-1 sm:gap-1.5 md:gap-2 items-center group flex-shrink-0"
              >
                <div className="bg-white rounded-full size-12 sm:size-14 md:size-16 flex items-center justify-center border border-stone-200 shadow-sm group-hover:scale-110 transition-transform">
                  <svg className="size-5 sm:size-6 md:size-7 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                </div>
                <p className="font-albert font-medium text-[9px] sm:text-[10px] md:text-xs text-stone-700 leading-tight text-center">
                  Save
                </p>
              </button>

              {/* Messages button */}
              <button 
                onClick={() => alert('Sharing to Messages!')}
                className="flex flex-col gap-1 sm:gap-1.5 md:gap-2 items-center group flex-shrink-0"
              >
                <div className="bg-[#34C759] rounded-full size-12 sm:size-14 md:size-16 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <MessageCircle className="size-5 sm:size-6 md:size-7 text-white" />
                </div>
                <p className="font-albert font-medium text-[9px] sm:text-[10px] md:text-xs text-stone-700 leading-tight text-center">
                  Messages
                </p>
              </button>

              {/* X (Twitter) button */}
              <button 
                onClick={() => alert('Sharing to X!')}
                className="flex flex-col gap-1 sm:gap-1.5 md:gap-2 items-center group flex-shrink-0"
              >
                <div className="bg-black rounded-full size-12 sm:size-14 md:size-16 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <svg className="size-5 sm:size-6 md:size-7 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <p className="font-albert font-medium text-[9px] sm:text-[10px] md:text-xs text-stone-700 leading-tight text-center">
                  X
                </p>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

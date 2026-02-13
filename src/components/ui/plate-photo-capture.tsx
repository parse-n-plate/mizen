'use client';

import { useRef, useState } from 'react';
import { Camera, X, Share2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, validateImageFile } from '@/lib/imageUtils';
import PhotoRatingModal from './photo-rating-modal';
import ShareSheetModal from './share-sheet-modal';

export interface Photo {
  data: string;
  filename: string;
  capturedAt: string;
  rating?: number;
}

interface PlatePhotoCaptureProps {
  photos?: Photo[];
  recipeTitle?: string;
  recipeAuthor?: string;
  cuisine?: string[];
  onPhotoCapture: (photoData: string, filename: string, rating?: number) => void;
  onPhotoRemove?: (index: number) => void;
  onPhotoRatingUpdate?: (index: number, rating: number) => void;
  onShare?: () => void;
}

export default function PlatePhotoCapture({
  photos = [],
  recipeTitle,
  recipeAuthor,
  cuisine,
  onPhotoCapture,
  onPhotoRemove,
  onPhotoRatingUpdate,
  onShare,
}: PlatePhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareStatus] = useState<string | null>(null);

  // Flow orchestration state
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<{ data: string; filename: string } | null>(null);
  const [currentRating, setCurrentRating] = useState(3);

  const MAX_PHOTOS = 5;
  const hasReachedLimit = photos.length >= MAX_PHOTOS;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Clear any previous errors
    setError(null);

    // Check if adding these files would exceed the limit
    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots === 0) {
      setError(`Maximum of ${MAX_PHOTOS} photos allowed`);
      return;
    }

    setIsProcessing(true);

    try {
      // Process files one by one, up to the remaining slots
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      for (const file of filesToProcess) {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          setError(validation.error || 'Invalid file');
          continue;
        }

        // Compress image
        const compressedDataUrl = await compressImage(file);

        // Save photo immediately (no rating modal on upload)
        onPhotoCapture(compressedDataUrl, file.name);
      }

      if (files.length > remainingSlots) {
        setError(`Only ${remainingSlots} photo${remainingSlots === 1 ? '' : 's'} could be added (max ${MAX_PHOTOS} total)`);
      }
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle rating confirmation - show share sheet
  const handleRatingConfirm = (rating: number) => {
    setCurrentRating(rating);
    setShowRatingPrompt(false);
    setIsShareSheetOpen(true);
  };

  // Handle rating modal close
  const handleRatingModalClose = () => {
    setShowRatingPrompt(false);
    setCurrentRating(3);
  };

  // Handle share sheet close - update photo rating if changed
  const handleShareSheetClose = () => {
    setIsShareSheetOpen(false);
    
    // Update the photo's rating if it changed
    if (pendingPhoto && onPhotoRatingUpdate) {
      const photoIndex = photos.findIndex(p => p.data === pendingPhoto.data);
      if (photoIndex !== -1 && photos[photoIndex].rating !== currentRating) {
        // Update the photo's rating through parent callback
        onPhotoRatingUpdate(photoIndex, currentRating);
      }
    }
    
    setPendingPhoto(null);
    setCurrentRating(3); // Reset for next time
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = (index: number) => {
    if (onPhotoRemove) {
      onPhotoRemove(index);
    }
    setError(null);
  };

  const handleShare = async () => {
    if (!photos || photos.length === 0) return;

    // Get the most recent photo (or first photo if only one)
    const photoToShare = photos[photos.length - 1];
    
    if (!photoToShare) return;

    // Set up the share flow: Rating Modal → Share Sheet
    setPendingPhoto({ 
      data: photoToShare.data, 
      filename: photoToShare.filename 
    });
    
    // Use existing rating if available, otherwise default to 3
    setCurrentRating(photoToShare.rating || 3);
    
    // Show rating modal first
    setShowRatingPrompt(true);

    // Call parent's onShare callback if provided (for tracking)
    if (onShare) {
      onShare();
    }
  };

  return (
    <div className="w-full">
      {/* Hidden file input - now supports multiple files */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Photo Display or Upload CTA */}
      {photos.length > 0 ? (
        // Photos captured state
        <div className="bg-[#0088ff] rounded-[24px] p-6 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-albert font-semibold text-[20px] text-white leading-tight mb-2">
                {photos.length === 1 ? 'Nice shot!' : `${photos.length} great shots!`}
              </p>
              <p className="font-albert text-[16px] text-white/90 leading-[1.4] mb-4">
                {photos.length === 1
                  ? 'Your masterpiece is saved.'
                  : `Your ${photos.length} photos are saved.`}
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleShare}
                  className="bg-white text-[#0088ff] px-4 py-2.5 rounded-[12px] font-albert text-[16px] font-medium flex items-center gap-2 hover:bg-white/90 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  {shareStatus || 'Share'}
                </button>
              </div>
            </div>

            {/* Photo previews - Show up to 3 photos in stacked layout */}
            <div className="relative w-[180px] h-[122px] flex-shrink-0">
              {photos.slice(0, 3).map((photo, index) => {
                // Rotation and position for each photo (stacked effect)
                const rotations = [14, -8, 6];
                const xOffsets = [0, 30, 60];
                const zIndexes = [30, 20, 10];

                return (
                  <div
                    key={index}
                    className="absolute"
                    style={{
                      left: `${xOffsets[index]}px`,
                      top: 0,
                      zIndex: zIndexes[index],
                    }}
                  >
                    <div
                      className="transform bg-white border-[3.8px] border-white rounded-[15px] w-[99px] h-[122px] overflow-hidden shadow-lg group relative"
                      style={{
                        transform: `rotate(${rotations[index]}deg)`,
                        transformOrigin: 'center',
                      }}
                    >
                      <img
                        src={photo.data}
                        alt={`Dish photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Remove button on hover */}
                      {onPhotoRemove && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(index);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Clickable "Add More" placeholder card - appears after existing photos */}
              {!hasReachedLimit && (
                <div
                  className="absolute cursor-pointer"
                  style={{
                    left: `${photos.length < 3 ? [0, 30, 60][photos.length] : 60}px`,
                    top: 0,
                    zIndex: photos.length < 3 ? [30, 20, 10][photos.length] : 5,
                  }}
                >
                  <button
                    onClick={handleUploadClick}
                    disabled={isProcessing}
                    className="transform bg-white/30 border-[3.8px] border-white rounded-[15px] w-[99px] h-[122px] overflow-hidden shadow-lg flex items-center justify-center hover:bg-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                    style={{
                      transform: `rotate(${[14, -8, 6][Math.min(photos.length, 2)]}deg)`,
                      transformOrigin: 'center',
                    }}
                  >
                    <Plus className="w-8 h-8 text-white/70 group-hover:text-white transition-colors" />
                  </button>
                </div>
              )}

              {/* Show count badge if more than 3 photos */}
              {photos.length > 3 && (
                <div
                  className="absolute bg-white text-[#0088ff] rounded-full w-8 h-8 flex items-center justify-center font-albert font-bold text-[14px] shadow-lg"
                  style={{
                    right: '0px',
                    bottom: '0px',
                    zIndex: 40,
                  }}
                >
                  +{photos.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Empty state - CTA to capture photos
        <div className="bg-[#0088ff] rounded-[24px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-albert font-semibold text-[20px] text-white leading-tight mb-2">
                Take a pic!
              </p>
              <p className="font-albert text-[16px] text-white/90 leading-[1.4] mb-4">
                Upload up to {MAX_PHOTOS} photos from your gallery
              </p>
              <button
                onClick={handleUploadClick}
                disabled={isProcessing}
                className="bg-[#0c0a09] text-white px-4 py-2.5 rounded-[12px] font-albert text-[16px] flex items-center gap-2 hover:bg-[#1c1a19] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-5 h-5" />
                {isProcessing ? 'Processing...' : 'Upload'}
              </button>
            </div>

            {/* Placeholder image previews - 3 stacked cards */}
            <div className="relative w-[180px] h-[122px] flex-shrink-0">
              {[0, 1, 2].map((index) => {
                const rotations = [14, -8, 6];
                const xOffsets = [0, 30, 60];
                const zIndexes = [30, 20, 10];

                return (
                  <div
                    key={index}
                    className="absolute"
                    style={{
                      left: `${xOffsets[index]}px`,
                      top: 0,
                      zIndex: zIndexes[index],
                    }}
                  >
                    <div
                      className="transform bg-[#b6e0f2] border-[3.8px] border-white rounded-[15px] w-[99px] h-[122px] overflow-hidden shadow-lg flex items-center justify-center"
                      style={{
                        transform: `rotate(${rotations[index]}deg)`,
                        transformOrigin: 'center',
                        opacity: 1 - index * 0.2,
                      }}
                    >
                      <Camera className="w-8 h-8 text-white/40" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <p className="font-albert text-[14px] text-red-700">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingPrompt && photos.length > 0 && (
          <PhotoRatingModal
            photos={photos}
            recipeTitle={recipeTitle}
            onConfirm={handleRatingConfirm}
            onClose={handleRatingModalClose}
          />
        )}
      </AnimatePresence>

      {/* Share Sheet Modal */}
      <AnimatePresence>
        {isShareSheetOpen && photos.length > 0 && (
          <ShareSheetModal
            photos={photos}
            rating={currentRating}
            onRatingChange={setCurrentRating}
            recipeTitle={recipeTitle}
            recipeAuthor={recipeAuthor}
            cuisine={cuisine}
            onClose={handleShareSheetClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

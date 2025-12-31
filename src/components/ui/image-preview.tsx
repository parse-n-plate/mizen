'use client';

import { useState } from 'react';
import { Download, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface ImagePreviewProps {
  imageData: string; // Base64 data URL
  filename?: string;
  className?: string;
}

/**
 * ImagePreview Component
 * 
 * Displays a preview of an uploaded image with options to:
 * - View full-size image in a modal
 * - Download the image
 * 
 * Used for recipes parsed from uploaded images instead of showing a link.
 */
export default function ImagePreview({ imageData, filename = 'recipe-image', className }: ImagePreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle image download
  const handleDownload = () => {
    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = imageData;
      link.download = filename || 'recipe-image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  // Extract file extension from filename or default to jpg
  const getFileExtension = () => {
    if (filename) {
      const match = filename.match(/\.(\w+)$/);
      if (match) return match[1];
    }
    // Try to detect from data URL
    if (imageData.startsWith('data:image/')) {
      const match = imageData.match(/data:image\/(\w+);/);
      if (match) return match[1];
    }
    return 'jpg';
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className || ''}`}>
        {/* Thumbnail Preview */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="relative w-12 h-12 rounded-md overflow-hidden border border-stone-200 hover:border-stone-300 transition-colors cursor-pointer group"
          aria-label="View full-size image"
        >
          <img
            src={imageData}
            alt="Recipe image preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>

        {/* Filename and Download Button */}
        <div className="flex items-center gap-1.5">
          <span className="font-albert text-[14px] text-stone-600">
            {filename || 'Uploaded image'}
          </span>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center p-1 rounded-md text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer group"
            aria-label="Download image"
            title="Download image"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Full-Size Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close image preview"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Image */}
              <img
                src={imageData}
                alt="Full-size recipe image"
                className="max-w-full max-h-full object-contain rounded-lg"
              />

              {/* Download Button Overlay */}
              <button
                onClick={handleDownload}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Download image"
                title="Download image"
              >
                <Download className="w-5 h-5 text-white" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import {
  recipeScrape,
  validateRecipeUrl,
  parseRecipeFromImage,
} from '@/utils/recipe-parse';
import { errorLogger } from '@/utils/errorLogger';
import { isUrl } from '@/utils/searchUtils';
import { addToSearchHistory } from '@/lib/searchHistory';
import { useToast } from '@/hooks/useToast';
import { ERROR_CODES } from '@/utils/formatError';
import LoadingAnimation from '@/components/ui/loading-animation';

/**
 * HomepageSearch Component
 * 
 * Modern pill-shaped search bar for the homepage with integrated URL and image parsing.
 * Features:
 * - Clean, minimal design matching Figma specifications
 * - URL parsing via recipeScrape()
 * - Image upload and parsing via parseRecipeFromImage()
 * - Command+K keyboard shortcut to focus
 * - Image chip preview when file is selected
 * - Albert Sans typography throughout
 */
export default function HomepageSearch() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setParsedRecipe } = useRecipe();
  const { addRecipe } = useParsedRecipes();
  const { showError, showInfo } = useToast();
  const router = useRouter();

  // Note: Command+K handling is now done globally via CommandKContext
  // This component's input will be focused when Command+K is pressed on the homepage

  // Handle ESC key to blur/unfocus the search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If ESC is pressed and the search input is focused, blur it
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.blur();
        setIsSearchFocused(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Create and cleanup image preview URL
  useEffect(() => {
    if (selectedImage) {
      const objectUrl = URL.createObjectURL(selectedImage);
      setImagePreviewUrl(objectUrl);
      
      // Cleanup function to revoke the object URL
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setImagePreviewUrl(null);
    }
  }, [selectedImage]);

  // Handle file selection with validation
  const handleFileSelect = (file: File) => {
    // Validate file type - only allow images
    if (!file.type.startsWith('image/')) {
      errorLogger.log(ERROR_CODES.ERR_INVALID_FILE_TYPE, 'Invalid file type', file.name);
      showError({
        code: ERROR_CODES.ERR_INVALID_FILE_TYPE,
      });
      return;
    }

    // Validate file size - max 10MB
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      errorLogger.log(ERROR_CODES.ERR_FILE_TOO_LARGE, 'File too large', file.name);
      showError({
        code: ERROR_CODES.ERR_FILE_TOO_LARGE,
      });
      return;
    }

    // Set the selected file and clear URL input
    setSelectedImage(file);
    setSearchValue('');
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle search input change - clear image when typing URL
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    if (value && selectedImage) {
      setSelectedImage(null); // Clear image when typing URL
    }
  };

  // Handle image parsing
  const handleImageParse = useCallback(async () => {
    if (!selectedImage) return;

    try {
      setLoading(true);

      console.log('[HomepageSearch] Parsing recipe from image:', selectedImage.name);

      // Convert image to base64 for storage
      // This allows us to display the image preview later
      const imageDataPromise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      // Call the image parsing function
      const response = await parseRecipeFromImage(selectedImage);

      // Check if parsing failed
      if (!response.success || response.error) {
        const errorCode = response.error?.code || 'ERR_NO_RECIPE_FOUND';
        errorLogger.log(errorCode, response.error?.message || 'Image parsing failed', selectedImage.name);
        showError({
          code: errorCode,
          message: response.error?.message,
          retryAfter: response.error?.retryAfter, // Pass through retry-after timestamp
        });
        setLoading(false);
        return;
      }

      console.log('[HomepageSearch] Successfully parsed recipe from image:', response.title);

      // Wait for image data conversion to complete
      const imageData = await imageDataPromise;

      // Store parsed recipe with image data
      const recipeToStore = {
        title: response.title,
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author,
        sourceUrl: response.sourceUrl || `image:${selectedImage.name}`,
        summary: response.summary,
        cuisine: response.cuisine,
        ...(response.servings !== undefined && { servings: response.servings }), // Include servings/yield if available
        ...(response.prepTimeMinutes !== undefined && { prepTimeMinutes: response.prepTimeMinutes }), // Include prep time if available
        ...(response.cookTimeMinutes !== undefined && { cookTimeMinutes: response.cookTimeMinutes }), // Include cook time if available
        ...(response.totalTimeMinutes !== undefined && { totalTimeMinutes: response.totalTimeMinutes }), // Include total time if available
        imageData: imageData, // Store base64 image data for preview
        imageFilename: selectedImage.name, // Store original filename
      };

      setParsedRecipe(recipeToStore);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Add to recent recipes
      const recipeSummary = Array.isArray(response.instructions)
        ? response.instructions
            .map((inst: any) => (typeof inst === 'string' ? inst : inst.detail))
            .join(' ')
            .slice(0, 140)
        : response.instructions.slice(0, 140);

      addRecipe({
        title: response.title,
        summary: recipeSummary,
        description: response.summary,
        url: `image:${selectedImage.name}`,
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author,
        sourceUrl: response.sourceUrl || `image:${selectedImage.name}`,
        cuisine: response.cuisine,
        ...(response.servings !== undefined && { servings: response.servings }), // Include servings/yield if available
        ...(response.prepTimeMinutes !== undefined && { prepTimeMinutes: response.prepTimeMinutes }), // Include prep time if available
        ...(response.cookTimeMinutes !== undefined && { cookTimeMinutes: response.cookTimeMinutes }), // Include cook time if available
        ...(response.totalTimeMinutes !== undefined && { totalTimeMinutes: response.totalTimeMinutes }), // Include total time if available
        imageData: imageData, // Store base64 image data for preview
        imageFilename: selectedImage.name, // Store original filename
      });

      // Navigate to recipe page
      router.push('/parsed-recipe-page');
      setSelectedImage(null);
      setSearchValue('');
    } catch (err) {
      console.error('[HomepageSearch] Image parse error:', err);
      errorLogger.log('ERR_UNKNOWN', 'An unexpected error occurred during image parsing', selectedImage.name);
      showError({
        code: 'ERR_UNKNOWN',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedImage, setParsedRecipe, addRecipe, showError, router]);

  // Handle URL parsing
  const handleParse = useCallback(
    async (url: string) => {
      if (!url.trim()) return;

      try {
        setLoading(true);

        // Step 0: Check if input looks like a URL (early validation)
        if (!isUrl(url)) {
          errorLogger.log('ERR_NOT_A_URL', 'Input is not a URL', url);
          showInfo({
            code: 'ERR_NOT_A_URL',
          });
          setLoading(false);
          return;
        }

        // Step 1: Validate URL format and check if it's a recipe page
        const validUrlResponse = await validateRecipeUrl(url);

        if (!validUrlResponse.success) {
          errorLogger.log(
            validUrlResponse.error.code,
            validUrlResponse.error.message,
            url,
          );
          showError({
            code: validUrlResponse.error.code,
            message: validUrlResponse.error.message,
          });
          setLoading(false);
          return;
        }

        if (!validUrlResponse.isRecipe) {
          errorLogger.log('ERR_NO_RECIPE_FOUND', 'No recipe found on this page', url);
          showError({
            code: 'ERR_NO_RECIPE_FOUND',
          });
          setLoading(false);
          return;
        }

        // Step 2: Parse recipe using unified AI-based parser
        const response = await recipeScrape(url);

        if (!response.success || response.error) {
          const errorCode = response.error?.code || 'ERR_NO_RECIPE_FOUND';
          errorLogger.log(errorCode, response.error?.message || 'Parsing failed', url);
          showError({
            code: errorCode,
            message: response.error?.message,
            retryAfter: response.error?.retryAfter, // Pass through retry-after timestamp
          });
          setLoading(false);
          return;
        }

        // Store parsed recipe
        const recipeToStore = {
          title: response.title,
          ingredients: response.ingredients,
          instructions: response.instructions,
          author: response.author,
          sourceUrl: response.sourceUrl || url,
          summary: response.summary,
          cuisine: response.cuisine,
          ...(response.servings !== undefined && { servings: response.servings }), // Include servings/yield if available
          ...(response.prepTimeMinutes !== undefined && { prepTimeMinutes: response.prepTimeMinutes }), // Include prep time if available
          ...(response.cookTimeMinutes !== undefined && { cookTimeMinutes: response.cookTimeMinutes }), // Include cook time if available
          ...(response.totalTimeMinutes !== undefined && { totalTimeMinutes: response.totalTimeMinutes }), // Include total time if available
        };

        setParsedRecipe(recipeToStore);

        await new Promise((resolve) => setTimeout(resolve, 0));

        // Add to recent recipes
        const recipeSummary = Array.isArray(response.instructions)
          ? response.instructions
              .map((inst: any) => (typeof inst === 'string' ? inst : inst.detail))
              .join(' ')
              .slice(0, 140)
          : response.instructions.slice(0, 140);

        addRecipe({
          title: response.title,
          summary: recipeSummary,
          description: response.summary,
          url: url,
          ingredients: response.ingredients,
          instructions: response.instructions,
          author: response.author,
          sourceUrl: response.sourceUrl || url,
          cuisine: response.cuisine,
          ...(response.servings !== undefined && { servings: response.servings }), // Include servings/yield if available
          ...(response.prepTimeMinutes !== undefined && { prepTimeMinutes: response.prepTimeMinutes }), // Include prep time if available
          ...(response.cookTimeMinutes !== undefined && { cookTimeMinutes: response.cookTimeMinutes }), // Include cook time if available
          ...(response.totalTimeMinutes !== undefined && { totalTimeMinutes: response.totalTimeMinutes }), // Include total time if available
        });

        // Add to search history
        addToSearchHistory(url, response.title);

        // Navigate to recipe page
        router.push('/parsed-recipe-page');
        setSearchValue('');
      } catch (err) {
        console.error('[HomepageSearch] Parse error:', err);
        errorLogger.log('ERR_UNKNOWN', 'An unexpected error occurred', url);
        showError({
          code: 'ERR_UNKNOWN',
          message: 'An unexpected error occurred. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    },
    [setParsedRecipe, addRecipe, showError, showInfo, router],
  );

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prioritize image if selected
    if (selectedImage) {
      handleImageParse();
      return;
    }
    
    // Otherwise check for URL input
    if (searchValue.trim()) {
      handleParse(searchValue);
      return;
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle cancel loading
  const handleCancelLoading = () => {
    setLoading(false);
  };

  return (
    <>
      <LoadingAnimation isVisible={loading} onCancel={handleCancelLoading} />
      <div className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="w-full">
          <div 
            className={`bg-[#fafaf9] content-stretch flex min-h-[77px] items-center px-[24px] py-[12px] relative rounded-[999px] shrink-0 w-full transition-all group ${
              isSearchFocused ? 'bg-white shadow-[0_0_0_3px_rgba(0,114,251,0.15)]' : ''
            }`}
          >
            {/* Border overlay - changes color on focus */}
            <div 
              aria-hidden="true" 
              className={`absolute border-2 border-solid inset-0 pointer-events-none rounded-[999px] transition-all ${
                isSearchFocused ? 'border-[#0072fb]' : 'border-[#e7e5e4]'
              }`} 
            />
            
            {/* Main Content Area */}
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0 flex-1">
              {/* URL Icon Indicator - Hide when image is selected */}
              {!selectedImage && (
                <div className="shrink-0">
                  <Link className={`size-[24px] transition-colors ${isSearchFocused ? 'text-[#0072fb]' : 'text-[#78716c]'}`} />
                </div>
              )}

              {/* Input Field with Image Chip */}
              <div className="flex-1 flex items-center gap-2">
                {/* Image Chip - Shows inside search bar when image is selected */}
                {selectedImage && (
                  <div className="flex items-center gap-1.5 bg-[#ebf3ff] rounded-full pl-2 pr-3 py-1.5 border border-[#0072fb]/20 animate-in fade-in slide-in-from-left-2 duration-200">
                    {imagePreviewUrl && (
                      <img 
                        src={imagePreviewUrl} 
                        alt={selectedImage.name}
                        className="size-[28px] rounded object-cover flex-shrink-0"
                        draggable="false"
                      />
                    )}
                    <span className="font-albert font-medium text-[#0c0a09] text-[13px]">{selectedImage.name}</span>
                    <span className="font-albert font-normal text-[#78716c] text-[12px]">({(selectedImage.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(null);
                      }}
                      className="hover:bg-[#0072fb]/10 rounded-full p-0.5 transition-colors flex-shrink-0"
                      title="Remove image"
                    >
                      <svg className="size-[12px]" fill="none" viewBox="0 0 24 24">
                        <path stroke="#78716C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                
                {/* URL Input - Only shown when no image is selected */}
                {!selectedImage && (
                  <input
                    ref={searchInputRef}
                    data-search-input="homepage"
                    type="text"
                    value={searchValue}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Enter a recipe URL"
                    className="font-albert font-normal leading-[1.3] w-full bg-transparent border-none outline-none text-[#0c0a09] text-[16px] placeholder:text-[#78716c]"
                  />
                )}
              </div>

              {/* Right side buttons */}
              <div className="shrink-0 flex items-center gap-2">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                
                {/* Command+K Shortcut Indicator - Only shown when not focused and no text, hidden on mobile */}
                {!isSearchFocused && !searchValue && !selectedImage && (
                  <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-[#e7e5e4] rounded border border-[#d6d3d1] animate-in fade-in duration-200">
                    <kbd className="text-[12px] text-[#57534e] font-albert font-medium">⌘K</kbd>
                  </div>
                )}
                
                {/* Clear Text Button - Only shown when typing */}
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => setSearchValue('')}
                    className="p-2 transition-all hover:opacity-60"
                    title="Clear text"
                  >
                    <svg className="size-[16px]" fill="none" viewBox="0 0 24 24">
                      <path stroke="#57534e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                {/* Upload Button - Always visible */}
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="p-2 transition-all"
                  title="Upload image"
                  disabled={loading}
                >
                  <Upload className="size-[20px] text-[#78716c] hover:text-[#0072fb] transition-colors" />
                </button>
                
                {/* Submit Button - Only visible when there's valid input */}
                {(searchValue || selectedImage) && (
                  <button
                    type="submit"
                    className="bg-[#0072fb] hover:bg-[#0066e0] rounded-full px-6 py-2 transition-all animate-in fade-in duration-200"
                    title="Process recipe"
                    disabled={loading}
                  >
                    <svg className="size-[20px]" fill="none" viewBox="0 0 24 24">
                      <path stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7-7l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, Upload, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import {
  recipeScrape,
  validateRecipeUrl,
  parseRecipeFromImage,
} from '@/utils/recipe-parse';
import { errorLogger } from '@/utils/errorLogger';
import { isUrl, normalizeUrl } from '@/utils/searchUtils';
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingPhase, setLoadingPhase] = useState<'gathering' | 'reading' | 'plating' | 'done' | undefined>(undefined);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setParsedRecipe } = useRecipe();
  const { addRecipe } = useParsedRecipes();
  const { showError, showSuccess, showInfo, showWarning } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Note: Command+K handling is now done globally via CommandKContext
  // This component's input will be focused when Command+K is pressed on the homepage

  // Auto-focus the search input when the component mounts
  useEffect(() => {
    // Small delay to ensure the page has fully rendered
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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

  // Derive image preview URL from selectedImage
  const imagePreviewUrl = useMemo(() => {
    if (!selectedImage) return null;
    return URL.createObjectURL(selectedImage);
  }, [selectedImage]);

  // Cleanup object URLs when they change or unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

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
      setLoadingProgress(10);
      setLoadingPhase('gathering');

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

      setLoadingProgress(30);
      setLoadingPhase('reading');

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
        setLoadingProgress(0);
        setLoadingPhase(undefined);
        return;
      }

      console.log('[HomepageSearch] Successfully parsed recipe from image:', response.title);
      console.log(`[HomepageSearch] Parser used: ${response.method === 'ai' ? 'AI parser only' : response.method === 'json-ld+ai' ? 'JSON-LD + AI enrichment' : response.method || 'unknown'}`);

      setLoadingProgress(85);

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
        ...(response.storageGuide !== undefined && { storageGuide: response.storageGuide }),
        ...(response.shelfLife !== undefined && { shelfLife: response.shelfLife }),
        ...(response.platingNotes !== undefined && { platingNotes: response.platingNotes }),
        ...(response.servingVessel !== undefined && { servingVessel: response.servingVessel }),
        ...(response.servingTemp !== undefined && { servingTemp: response.servingTemp }),
        imageData: imageData, // Store base64 image data for preview
        imageFilename: selectedImage.name, // Store original filename
      };

      setLoadingProgress(90);
      setLoadingPhase('plating');

      setParsedRecipe(recipeToStore);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Add to recent recipes
      const recipeSummary = Array.isArray(response.instructions)
        ? response.instructions
            .map((inst: string | { detail?: string }) => (typeof inst === 'string' ? inst : inst.detail))
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
        ...(response.storageGuide !== undefined && { storageGuide: response.storageGuide }),
        ...(response.shelfLife !== undefined && { shelfLife: response.shelfLife }),
        ...(response.platingNotes !== undefined && { platingNotes: response.platingNotes }),
        ...(response.servingVessel !== undefined && { servingVessel: response.servingVessel }),
        ...(response.servingTemp !== undefined && { servingTemp: response.servingTemp }),
        imageData: imageData, // Store base64 image data for preview
        imageFilename: selectedImage.name, // Store original filename
      });

      setLoadingProgress(100);
      setLoadingPhase('done');

      // Brief pause for the loading animation to flash completion before navigating
      setTimeout(() => {
        setLoading(false);
        setLoadingProgress(0);
        setLoadingPhase(undefined);
        router.push('/parsed-recipe-page');
        setSelectedImage(null);
        setSearchValue('');
      }, 500);
    } catch (err) {
      console.error('[HomepageSearch] Image parse error:', err);
      errorLogger.log('ERR_UNKNOWN', 'An unexpected error occurred during image parsing', selectedImage.name);
      showError({
        code: 'ERR_UNKNOWN',
        message: 'An unexpected error occurred. Please try again.',
      });
      setLoading(false);
      setLoadingProgress(0);
      setLoadingPhase(undefined);
    }
  }, [selectedImage, setParsedRecipe, addRecipe, showError, router]);

  // Handle URL parsing
  const handleParse = async (url: string) => {
      if (!url.trim()) return;

      try {
        setLoading(true);
        setLoadingProgress(0);
        setLoadingPhase('gathering');

        // Step 0: Check if input looks like a URL (early validation)
        if (!isUrl(url)) {
          errorLogger.log('ERR_NOT_A_URL', 'Input is not a URL', url);
          showInfo({
            code: 'ERR_NOT_A_URL',
          });
          setLoading(false);
          setLoadingProgress(0);
          setLoadingPhase(undefined);
          return;
        }

        // Normalize the URL by adding protocol/www if missing
        // This enables users to type "allrecipes.com/recipe" instead of full URL
        const normalizedUrl = normalizeUrl(url);

        setLoadingProgress(10);

        // Step 1: Validate URL format and check if it's a recipe page
        const validUrlResponse = await validateRecipeUrl(normalizedUrl);

        setLoadingProgress(20);

        if (!validUrlResponse.success) {
          errorLogger.log(
            validUrlResponse.error.code,
            validUrlResponse.error.message,
            normalizedUrl,
          );
          showError({
            code: validUrlResponse.error.code,
            message: validUrlResponse.error.message,
            sourceUrl: normalizedUrl,
          });
          setLoading(false);
          setLoadingProgress(0);
          setLoadingPhase(undefined);
          return;
        }

        if (!validUrlResponse.isRecipe) {
          errorLogger.log('ERR_NO_RECIPE_FOUND', 'No recipe found on this page', normalizedUrl);
          showError({
            code: 'ERR_NO_RECIPE_FOUND',
            sourceUrl: normalizedUrl,
          });
          setLoading(false);
          setLoadingProgress(0);
          setLoadingPhase(undefined);
          return;
        }

        setLoadingProgress(30);
        setLoadingPhase('reading');

        // Step 2: Parse recipe using unified AI-based parser
        const response = await recipeScrape(normalizedUrl);

        setLoadingProgress(85);

        if (!response.success || response.error) {
          const errorCode = response.error?.code || 'ERR_NO_RECIPE_FOUND';
          errorLogger.log(errorCode, response.error?.message || 'Parsing failed', normalizedUrl);
          showError({
            code: errorCode,
            message: response.error?.message,
            retryAfter: response.error?.retryAfter, // Pass through retry-after timestamp
            sourceUrl: normalizedUrl,
          });
          setLoading(false);
          setLoadingProgress(0);
          setLoadingPhase(undefined);
          return;
        }

        setLoadingProgress(90);
        setLoadingPhase('plating');

        if (response.warnings?.includes('AI_NOT_CONFIGURED')) {
          showWarning('AI enrichment unavailable', 'GROQ_API_KEY is not configured. Plating, storage, and summary data will be missing.');
        } else if (response.warnings?.includes('AI_ENRICHMENT_FAILED')) {
          showWarning('Partial recipe data', 'AI enrichment failed for this recipe. Plating, storage, and summary data may be missing.');
        }

        // Store parsed recipe
        const recipeToStore = {
          title: response.title,
          ingredients: response.ingredients,
          instructions: response.instructions,
          author: response.author,
          sourceUrl: response.sourceUrl || normalizedUrl,
          summary: response.summary,
          cuisine: response.cuisine,
          ...(response.servings !== undefined && { servings: response.servings }), // Include servings/yield if available
          ...(response.prepTimeMinutes !== undefined && { prepTimeMinutes: response.prepTimeMinutes }), // Include prep time if available
          ...(response.cookTimeMinutes !== undefined && { cookTimeMinutes: response.cookTimeMinutes }), // Include cook time if available
          ...(response.totalTimeMinutes !== undefined && { totalTimeMinutes: response.totalTimeMinutes }), // Include total time if available
          ...(response.storageGuide !== undefined && { storageGuide: response.storageGuide }), // Include storage instructions if available
          ...(response.shelfLife !== undefined && { shelfLife: response.shelfLife }), // Include shelf life info if available
          ...(response.platingNotes !== undefined && { platingNotes: response.platingNotes }), // Include plating suggestions if available
          ...(response.servingVessel !== undefined && { servingVessel: response.servingVessel }), // Include serving vessel recommendation if available
          ...(response.servingTemp !== undefined && { servingTemp: response.servingTemp }), // Include serving temperature if available
        };

        setParsedRecipe(recipeToStore);

        await new Promise((resolve) => setTimeout(resolve, 0));

        // Add to recent recipes
        const recipeSummary = Array.isArray(response.instructions)
          ? response.instructions
              .map((inst: string | { detail?: string }) => (typeof inst === 'string' ? inst : inst.detail))
              .join(' ')
              .slice(0, 140)
          : response.instructions.slice(0, 140);

        addRecipe({
          title: response.title,
          summary: recipeSummary,
          description: response.summary,
          url: normalizedUrl,
          ingredients: response.ingredients,
          instructions: response.instructions,
          author: response.author,
          sourceUrl: response.sourceUrl || normalizedUrl,
          cuisine: response.cuisine,
          ...(response.servings !== undefined && { servings: response.servings }), // Include servings/yield if available
          ...(response.prepTimeMinutes !== undefined && { prepTimeMinutes: response.prepTimeMinutes }), // Include prep time if available
          ...(response.cookTimeMinutes !== undefined && { cookTimeMinutes: response.cookTimeMinutes }), // Include cook time if available
          ...(response.totalTimeMinutes !== undefined && { totalTimeMinutes: response.totalTimeMinutes }), // Include total time if available
          ...(response.storageGuide !== undefined && { storageGuide: response.storageGuide }),
          ...(response.shelfLife !== undefined && { shelfLife: response.shelfLife }),
          ...(response.platingNotes !== undefined && { platingNotes: response.platingNotes }),
          ...(response.servingVessel !== undefined && { servingVessel: response.servingVessel }),
          ...(response.servingTemp !== undefined && { servingTemp: response.servingTemp }),
        });

        // Add to search history
        addToSearchHistory(normalizedUrl, response.title);

        setLoadingProgress(100);
        setLoadingPhase('done');

        // Show success toast
        showSuccess('Recipe parsed successfully!', 'Navigating to recipe page...', normalizedUrl);

        // Brief pause for the loading animation to flash completion before navigating
        setTimeout(() => {
          setLoading(false);
          setLoadingProgress(0);
          setLoadingPhase(undefined);
          router.push('/parsed-recipe-page');
          setSearchValue('');
        }, 500);
      } catch (err) {
        console.error('[HomepageSearch] Parse error:', err);
        errorLogger.log('ERR_UNKNOWN', 'An unexpected error occurred', url.trim());
        showError({
          code: 'ERR_UNKNOWN',
          message: 'An unexpected error occurred. Please try again.',
        });
        setLoading(false);
        setLoadingProgress(0);
        setLoadingPhase(undefined);
      }
  };

  // Handle query params from SearchCommandModal (e.g. ?action=upload-image or ?url=...)
  useEffect(() => {
    const action = searchParams.get('action');
    const urlParam = searchParams.get('url');

    if (action === 'upload-image') {
      router.replace('/', { scroll: false });
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 200);
    } else if (urlParam) {
      router.replace('/', { scroll: false });
      setTimeout(() => {
        setSearchValue(urlParam);
        handleParse(urlParam);
      }, 200);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setLoadingProgress(0);
    setLoadingPhase(undefined);
  };

  return (
    <>
      <LoadingAnimation isVisible={loading} progress={loadingProgress} phase={loadingPhase} onCancel={handleCancelLoading} />
      <div className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="w-full">
          <div 
            className={`bg-[#fafaf9] dark:bg-stone-800 content-stretch flex min-h-[77px] items-center px-[24px] py-[12px] relative rounded-[24px] shrink-0 w-full transition-all group ${
              isSearchFocused ? 'bg-white dark:bg-stone-900 shadow-[0_0_0_3px_rgba(0,114,251,0.15)] dark:shadow-[0_0_0_3px_rgba(59,139,255,0.25)]' : ''
            }`}
          >
            {/* Border overlay - changes color on focus */}
            <div 
              aria-hidden="true" 
              className={`absolute border-2 border-solid inset-0 pointer-events-none rounded-[24px] transition-all ${
                isSearchFocused ? 'border-[#0072fb] dark:border-[#3B8BFF]' : 'border-[#e7e5e4] dark:border-stone-700'
              }`} 
            />
            
            {/* Main Content Area */}
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0 flex-1">
              {/* URL Icon Indicator - Hide when image is selected */}
              {!selectedImage && (
                <div className="shrink-0">
                  <Link className={`size-[24px] transition-colors ${isSearchFocused ? 'text-[#0072fb] dark:text-[#3B8BFF]' : 'text-[#78716c] dark:text-stone-500'}`} />
                </div>
              )}

              {/* Input Field with Image Chip */}
              <div className="flex-1 flex items-center gap-2">
                {/* Image Chip - Shows inside search bar when image is selected */}
                {selectedImage && (
                  <div className="flex items-center gap-1.5 bg-[#ebf3ff] dark:bg-[#1E3A5F] rounded-full pl-2 pr-3 py-1.5 border border-[#0072fb]/20 dark:border-blue-400/20 animate-in fade-in slide-in-from-left-2 duration-200">
                    {imagePreviewUrl && (
                      <img 
                        src={imagePreviewUrl} 
                        alt={selectedImage.name}
                        className="size-[28px] rounded object-cover flex-shrink-0"
                        draggable="false"
                      />
                    )}
                    <span className="font-albert font-medium text-[#0c0a09] dark:text-stone-200 text-[13px]">{selectedImage.name}</span>
                    <span className="font-albert font-normal text-[#78716c] dark:text-stone-500 text-[12px]">({(selectedImage.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(null);
                      }}
                      className="hover:bg-[#0072fb]/10 dark:hover:bg-blue-400/10 rounded-full p-0.5 transition-colors flex-shrink-0"
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
                    className="font-albert font-normal leading-[1.3] w-full bg-transparent border-none outline-none text-[#0c0a09] dark:text-stone-100 text-[16px] placeholder:text-[#78716c] dark:placeholder:text-stone-500"
                  />
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Right side buttons - only show when focused or has input */}
              {(isSearchFocused || searchValue || selectedImage) && (
                <div className="shrink-0 flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                  {/* Clear Text Button - Only shown when typing */}
                  {searchValue && (
                    <button
                      type="button"
                      onClick={() => setSearchValue('')}
                      className="p-2 transition-all hover:opacity-60 flex-shrink-0"
                      title="Clear text"
                      aria-label="Clear search"
                    >
                      <X className="size-[16px] text-[#57534e] dark:text-stone-400" />
                    </button>
                  )}

                  {/* Upload Button - uses onMouseDown to fire before blur hides the button */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent blur from firing
                      triggerFileInput();
                    }}
                    className="p-2 transition-all"
                    title="Upload image"
                    disabled={loading}
                  >
                    <Upload className="size-[20px] text-[#78716c] dark:text-stone-500 hover:text-[#0072fb] dark:hover:text-[#3B8BFF] transition-colors" />
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
              )}

            </div>
          </div>
        </form>
      </div>
    </>
  );
}

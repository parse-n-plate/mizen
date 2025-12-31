'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  recipeScrape,
  validateRecipeUrl,
  parseRecipeFromImage,
} from '@/utils/recipe-parse';
import { useRouter } from 'next/navigation';
import { useRecipe } from '@/contexts/RecipeContext';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { errorLogger } from '@/utils/errorLogger';
import { Search, X, Upload, Image as ImageIcon, Link as LinkIcon, ChevronDown } from 'lucide-react';
import LoadingAnimation from './loading-animation';
import { ParsedRecipe } from '@/lib/storage';
import { useToast } from '@/hooks/useToast';
import EmptyState from './empty-state';

interface SearchFormProps {
  initialUrl?: string;
}

export default function SearchForm({
  initialUrl = '',
}: SearchFormProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<ParsedRecipe[]>([]);
  // Image upload states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'url' | 'image'>('url'); // Toggle between URL and image mode
  
  const { setParsedRecipe } = useRecipe();
  const { addRecipe, recentRecipes } = useParsedRecipes();
  const { showError, showSuccess, showInfo } = useToast();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if query looks like a URL
  const isUrl = (text: string) => {
    return (
      text.includes('http') ||
      text.includes('www.') ||
      text.includes('.com') ||
      text.includes('.org')
    );
  };

  // Search through cached recipes
  const searchRecipes = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim() || isUrl(searchQuery)) {
        setSearchResults([]);
        return;
      }

      const filtered = recentRecipes.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.summary.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      setSearchResults(filtered.slice(0, 5)); // Show max 5 results
    },
    [recentRecipes],
  );

  // Handle focus state for animation
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay to allow clicking on dropdown items
    setTimeout(() => {
      if (!query.trim() && !loading) {
        setIsFocused(false);
        setShowDropdown(false);
      }
    }, 200);
  };

  // Handle recipe selection from dropdown
  const handleRecipeSelect = (recipe: ParsedRecipe) => {
    setParsedRecipe({
      title: recipe.title,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      author: recipe.author, // Include author if available
      sourceUrl: recipe.sourceUrl, // Include source URL if available
      prepTimeMinutes: recipe.prepTimeMinutes, // Include prep time if available
      cookTimeMinutes: recipe.cookTimeMinutes, // Include cook time if available
      totalTimeMinutes: recipe.totalTimeMinutes, // Include total time if available
    });
    setQuery('');
    setShowDropdown(false);
    setIsFocused(false);
    router.push('/parsed-recipe-page');
  };

  // Handle image file selection
  // This function runs when the user selects an image file from their computer
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - only allow images
    if (!file.type.startsWith('image/')) {
      showError({
        code: 'ERR_INVALID_FILE_TYPE',
        message: 'Please select a valid image file',
      });
      return;
    }

    // Validate file size - max 10MB
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      showError({
        code: 'ERR_FILE_TOO_LARGE',
        message: 'Image size must be less than 10MB',
      });
      return;
    }

    // Set the selected file
    setSelectedImage(file);

    // Create a preview URL for the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Toggle between URL and image input modes
  // This switches the UI between showing URL input and image upload
  const toggleInputMode = () => {
    const newMode = inputMode === 'url' ? 'image' : 'url';
    setInputMode(newMode);
    // Clear both inputs when switching modes
    setQuery('');
    setSelectedImage(null);
    setImagePreview(null);
    setShowDropdown(false);
  };

  // Parse recipe from uploaded image
  // This function sends the image to the backend for AI processing
  const handleImageParse = useCallback(async () => {
    if (!selectedImage) return;

    try {
      setLoading(true);

      console.log('[Client] Parsing recipe from image:', selectedImage.name);
      
      // Call the new image parsing function
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
        return;
      }

      console.log('[Client] Successfully parsed recipe from image:', response.title);

      // Store parsed recipe in context with image data
      // imagePreview is already a base64 data URL from handleImageSelect
      setParsedRecipe({
        title: response.title,
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author, // Include author if available
        sourceUrl: response.sourceUrl || `image:${selectedImage.name}`, // Include source URL if available, or use image reference
        summary: response.summary, // Include AI-generated summary if available
        imageData: imagePreview || undefined, // Store base64 image data for preview
        imageFilename: selectedImage.name, // Store original filename
        ...(response.prepTimeMinutes !== undefined && { prepTimeMinutes: response.prepTimeMinutes }), // Include prep time if available
        ...(response.cookTimeMinutes !== undefined && { cookTimeMinutes: response.cookTimeMinutes }), // Include cook time if available
        ...(response.totalTimeMinutes !== undefined && { totalTimeMinutes: response.totalTimeMinutes }), // Include total time if available
      });

      // Add to recent recipes
      const recipeSummary = Array.isArray(response.instructions)
        ? response.instructions.join(' ').slice(0, 140)
        : response.instructions.slice(0, 140);

      addRecipe({
        title: response.title,
        summary: recipeSummary,
        url: `image:${selectedImage.name}`, // Store as image reference
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author, // Include author if available
        sourceUrl: response.sourceUrl, // Include source URL if available
        ...(response.servings !== undefined && { servings: response.servings }), // Include servings/yield if available
        ...(response.prepTimeMinutes !== undefined && { prepTimeMinutes: response.prepTimeMinutes }), // Include prep time if available
        ...(response.cookTimeMinutes !== undefined && { cookTimeMinutes: response.cookTimeMinutes }), // Include cook time if available
        ...(response.totalTimeMinutes !== undefined && { totalTimeMinutes: response.totalTimeMinutes }), // Include total time if available
        imageData: imagePreview || undefined, // Store base64 image data for preview
        imageFilename: selectedImage.name, // Store original filename
      });

      // Show success toast
      showSuccess('Recipe parsed successfully!', 'Navigating to recipe page...');

      // Navigate to parsed recipe page
      router.push('/parsed-recipe-page');
    } catch (err) {
      console.error('[Client] Image parse error:', err);
      errorLogger.log(
        'ERR_UNKNOWN',
        'An unexpected error occurred during image parsing',
        selectedImage.name,
      );
      showError({
        code: 'ERR_UNKNOWN',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [
    selectedImage,
    setParsedRecipe,
    addRecipe,
    showError,
    showSuccess,
    router,
  ]);

  const handleParse = useCallback(async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);

      // Step 0: Check if input looks like a URL (early validation)
      if (!isUrl(query)) {
        errorLogger.log('ERR_NOT_A_URL', 'Input is not a URL', query);
        showInfo({
          code: 'ERR_NOT_A_URL',
        });
        setLoading(false);
        return;
      }

      // Step 1: Quick validation to ensure URL contains recipe-related keywords
      // This provides fast feedback before making the full parsing request
      const validUrlResponse = await validateRecipeUrl(query);

      if (!validUrlResponse.success) {
        errorLogger.log(
          validUrlResponse.error.code,
          validUrlResponse.error.message,
          query,
        );
        showError({
          code: validUrlResponse.error.code,
          message: validUrlResponse.error.message,
        });
        return;
      }

      if (!validUrlResponse.isRecipe) {
        errorLogger.log(
          'ERR_NO_RECIPE_FOUND',
          'No recipe found on this page',
          query,
        );
        showError({
          code: 'ERR_NO_RECIPE_FOUND',
        });
        return;
      }

      // Step 2: Parse recipe using unified AI-based parser
      // This handles all the complexity internally:
      // - Fetches and cleans HTML
      // - Tries JSON-LD extraction first (fast, no AI tokens)
      // - Falls back to AI parsing if needed
      // - Returns consistently structured data
      console.log('[Client] Calling unified recipe parser...');
      const response = await recipeScrape(query);

      // Check if parsing failed
      if (!response.success || response.error) {
        const errorCode = response.error?.code || 'ERR_NO_RECIPE_FOUND';
        errorLogger.log(errorCode, response.error?.message || 'Parsing failed', query);
        showError({
          code: errorCode,
          message: response.error?.message,
          retryAfter: response.error?.retryAfter, // Pass through retry-after timestamp
        });
        return;
      }

      console.log('[Client] Successfully parsed recipe:', response.title);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/211f35f0-b7c4-4493-a3d1-13dbeecaabb1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search-form.tsx:298',message:'API response received',data:{hasServings:'servings' in response,servings:response.servings,servingsType:typeof response.servings,servingsValue:response.servings,hasAuthor:'author' in response,author:response.author,responseKeys:Object.keys(response)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Step 3: Store parsed recipe in context
      // The new parser already returns data in the correct grouped format
      const recipeToStore = {
        title: response.title,
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author, // Include author if available
        sourceUrl: response.sourceUrl || query, // Use sourceUrl from response or fallback to query URL
        summary: response.summary, // Include AI-generated summary if available
        cuisine: response.cuisine, // Include cuisine tags if available
        ...(response.servings !== undefined && { servings: response.servings }), // Include servings/yield if available
        ...(response.prepTimeMinutes !== undefined && { prepTimeMinutes: response.prepTimeMinutes }), // Include prep time if available
        ...(response.cookTimeMinutes !== undefined && { cookTimeMinutes: response.cookTimeMinutes }), // Include cook time if available
        ...(response.totalTimeMinutes !== undefined && { totalTimeMinutes: response.totalTimeMinutes }), // Include total time if available
      };
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/211f35f0-b7c4-4493-a3d1-13dbeecaabb1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'search-form.tsx:310',message:'recipeToStore created',data:{hasServings:'servings' in recipeToStore,servings:recipeToStore.servings,servingsType:typeof recipeToStore.servings,servingsValue:recipeToStore.servings,keys:Object.keys(recipeToStore)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // Store recipe first (this writes to localStorage synchronously)
      setParsedRecipe(recipeToStore);
      
      // Ensure localStorage write completes before navigation
      // localStorage.setItem is synchronous, but we want to ensure React state
      // has a chance to update. Use setTimeout to defer navigation slightly.
      await new Promise(resolve => setTimeout(resolve, 0));

      // Step 4: Add to recent recipes for quick access
      const recipeSummary = Array.isArray(response.instructions)
        ? response.instructions
            .map((inst: any) => (typeof inst === 'string' ? inst : inst.detail))
            .join(' ')
            .slice(0, 140)
        : response.instructions.slice(0, 140);

      addRecipe({
        title: response.title,
        summary: recipeSummary,
        description: response.summary, // Store the AI-generated summary
        url: query,
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author, // Include author if available
        sourceUrl: response.sourceUrl || query, // Include source URL if available
        cuisine: response.cuisine, // Include cuisine tags if available
        ...(response.servings !== undefined && { servings: response.servings }), // Include servings/yield if available
        ...(response.prepTimeMinutes !== undefined && { prepTimeMinutes: response.prepTimeMinutes }), // Include prep time if available
        ...(response.cookTimeMinutes !== undefined && { cookTimeMinutes: response.cookTimeMinutes }), // Include cook time if available
        ...(response.totalTimeMinutes !== undefined && { totalTimeMinutes: response.totalTimeMinutes }), // Include total time if available
      });

      // Show success toast
      showSuccess('Recipe parsed successfully!', 'Navigating to recipe page...');

      // Step 5: Navigate to the parsed recipe page
      router.push('/parsed-recipe-page');
    } catch (err) {
      console.error('[Client] Parse error:', err);
      errorLogger.log(
        'ERR_UNKNOWN',
        'An unexpected error occurred during parsing',
        query,
      );
      showError({
        code: 'ERR_UNKNOWN',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [
    query,
    setParsedRecipe,
    addRecipe,
    showError,
    showSuccess,
    showInfo,
    router,
  ]);

  // Handle input changes and search
  useEffect(() => {
    searchRecipes(query);
    setShowDropdown(isFocused && query.trim() !== '' && !isUrl(query));

    if (query.trim()) {
      setIsFocused(true);
    }
  }, [query, isFocused, recentRecipes, searchRecipes]);

  // Handle initialUrl from navbar
  useEffect(() => {
    if (initialUrl) {
      setQuery(initialUrl);
      setIsFocused(true);
      // Auto-trigger parsing after a short delay
      setTimeout(() => {
        if (isUrl(initialUrl)) {
          handleParse();
        }
      }, 500);
    }
  }, [initialUrl, handleParse]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isUrl(query)) {
        handleParse();
      }
    }
  };

  const clearInput = () => {
    setQuery('');
    setIsFocused(false);
    setShowDropdown(false);
    // Focus back to input after clearing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <>
      <LoadingAnimation isVisible={loading} />
      <div className="relative w-full">
        {/* URL Input Mode */}
        {inputMode === 'url' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isUrl(query)) handleParse();
            }}
          >
            <div
              className={`
                bg-stone-100 rounded-lg border border-[#d9d9d9] 
                transition-all duration-300 ease-in-out
                hover:border-[#4F46E5] hover:border-opacity-80
                ${isFocused ? 'shadow-sm border-[#4F46E5] border-opacity-60' : ''}
              `}
            >
              <div className="flex items-center px-4 py-3 relative">
                {/* URL Icon - replaced Search icon */}
                <LinkIcon className="w-5 h-5 text-stone-600 flex-shrink-0" />

              {/* Input */}
              <div className="flex-1 ml-3 relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Enter a recipe URL"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  className={`
                    w-full bg-transparent font-albert text-[14px] text-stone-600 
                    placeholder:text-stone-500 focus:outline-none border-none
                    transition-all duration-300 ease-in-out
                  `}
                  disabled={loading}
                />
              </div>

              {/* Mode Toggle Chevron - switches between URL and Image */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggleInputMode();
                }}
                className="ml-2 p-1.5 hover:bg-stone-200 rounded transition-all duration-200 flex-shrink-0"
                aria-label="Switch input mode"
                disabled={loading}
              >
                <ChevronDown className="w-4 h-4 text-stone-600" />
              </button>

              {/* Clear Button */}
              {query && (
                <button
                  type="button"
                  onClick={clearInput}
                  className="ml-1 p-1 hover:bg-stone-200 rounded transition-all duration-200 flex-shrink-0"
                  disabled={loading}
                >
                  <X className="w-4 h-4 text-stone-600" />
                </button>
              )}

              {/* Parse Button (for URLs) */}
              {query && isUrl(query) && (
                <button
                  type="submit"
                  className="ml-2 bg-[#FFA423] hover:bg-[#FF9500] text-white font-albert text-[12px] px-3 py-1.5 rounded transition-colors duration-200 flex-shrink-0"
                  disabled={loading}
                >
                  Parse Recipe
                </button>
              )}
              </div>
            </div>
          </form>
        )}

        {/* Image Upload Mode */}
        {inputMode === 'image' && (
          <div className="space-y-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Image Input Field - matches URL input style */}
            <div
              className={`
                bg-stone-100 rounded-lg border border-[#d9d9d9] 
                transition-all duration-300 ease-in-out
                hover:border-[#4F46E5] hover:border-opacity-80
              `}
            >
              <div className="flex items-center px-4 py-3 relative">
                {/* Image Icon */}
                <ImageIcon className="w-5 h-5 text-stone-600 flex-shrink-0" />

                {/* Clickable area to trigger file input */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex-1 ml-3 text-left font-albert text-[14px] text-stone-500 hover:text-stone-600 transition-colors"
                >
                  {selectedImage ? selectedImage.name : 'Upload recipe image'}
                </button>

                {/* Mode Toggle Chevron - switches between URL and Image */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleInputMode();
                  }}
                  className="ml-2 p-1.5 hover:bg-stone-200 rounded transition-all duration-200 flex-shrink-0"
                  aria-label="Switch input mode"
                  disabled={loading}
                >
                  <ChevronDown className="w-4 h-4 text-stone-600" />
                </button>

                {/* Remove Image Button */}
                {selectedImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="ml-1 p-1 hover:bg-stone-200 rounded transition-all duration-200 flex-shrink-0"
                    disabled={loading}
                  >
                    <X className="w-4 h-4 text-stone-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-[#d9d9d9]">
                  <img
                    src={imagePreview}
                    alt="Recipe preview"
                    className="w-full h-auto max-h-96 object-contain bg-stone-50"
                  />
                </div>

                {/* Parse Button */}
                <button
                  type="button"
                  onClick={handleImageParse}
                  disabled={loading}
                  className="w-full bg-[#FFA423] hover:bg-[#FF9500] text-white font-albert font-medium text-[14px] px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Parse Recipe from Image
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search Results Dropdown - Only show in URL mode */}
        {inputMode === 'url' && showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#d9d9d9] rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            {searchResults.length > 0 ? (
              <div className="p-2">
                <div className="text-xs font-albert font-medium text-stone-500 px-3 py-2 border-b border-stone-200">
                  Recent Recipes ({searchResults.length})
                </div>
                {searchResults.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleRecipeSelect(recipe)}
                    className="w-full text-left p-3 hover:bg-stone-50 transition-colors duration-200 border-b border-stone-100 last:border-b-0"
                  >
                    <div className="font-albert font-medium text-[14px] text-stone-800 truncate">
                      {recipe.title}
                    </div>
                    <div className="font-albert text-[12px] text-stone-500 mt-1 line-clamp-2">
                      {recipe.summary}
                    </div>
                    <div className="font-albert text-[10px] text-stone-400 mt-1">
                      {new Date(recipe.parsedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            ) : query.trim() && !isUrl(query) ? (
              <EmptyState variant="no-results" compact />
            ) : recentRecipes.length === 0 ? (
              <EmptyState variant="no-recent" compact />
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

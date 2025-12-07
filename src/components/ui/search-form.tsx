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
import { useRecipeErrorHandler } from '@/hooks/useRecipeErrorHandler';
import { errorLogger } from '@/utils/errorLogger';
import { Search, X, Upload, Image as ImageIcon } from 'lucide-react';
import LoadingAnimation from './loading-animation';
import { ParsedRecipe } from '@/lib/storage';

interface SearchFormProps {
  setErrorAction: (error: boolean) => void;
  setErrorMessage?: (message: string) => void;
  initialUrl?: string;
}

export default function SearchForm({
  setErrorAction,
  setErrorMessage,
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
  const { handle: handleError } = useRecipeErrorHandler();
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
      setErrorAction(true);
      if (setErrorMessage) setErrorMessage('Please select a valid image file');
      return;
    }

    // Validate file size - max 10MB
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setErrorAction(true);
      if (setErrorMessage) setErrorMessage('Image size must be less than 10MB');
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
      setErrorAction(false);
      if (setErrorMessage) setErrorMessage('');

      console.log('[Client] Parsing recipe from image:', selectedImage.name);
      
      // Call the new image parsing function
      const response = await parseRecipeFromImage(selectedImage);

      // Check if parsing failed
      if (!response.success || response.error) {
        const errorCode = response.error?.code || 'ERR_NO_RECIPE_FOUND';
        const errorMessage = handleError(errorCode);
        errorLogger.log(errorCode, response.error?.message || 'Image parsing failed', selectedImage.name);
        setErrorAction(true);
        if (setErrorMessage) setErrorMessage(errorMessage);
        return;
      }

      console.log('[Client] Successfully parsed recipe from image:', response.title);

      // Store parsed recipe in context
      setParsedRecipe({
        title: response.title,
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author, // Include author if available
        sourceUrl: response.sourceUrl, // Include source URL if available
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
      });

      // Navigate to parsed recipe page
      router.push('/parsed-recipe-page');
    } catch (err) {
      console.error('[Client] Image parse error:', err);
      errorLogger.log(
        'ERR_UNKNOWN',
        'An unexpected error occurred during image parsing',
        selectedImage.name,
      );
      setErrorAction(true);
      if (setErrorMessage)
        setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    selectedImage,
    setErrorAction,
    setErrorMessage,
    setParsedRecipe,
    addRecipe,
    handleError,
    router,
  ]);

  const handleParse = useCallback(async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setErrorAction(false);
      if (setErrorMessage) setErrorMessage('');

      // Step 1: Quick validation to ensure URL contains recipe-related keywords
      // This provides fast feedback before making the full parsing request
      const validUrlResponse = await validateRecipeUrl(query);

      if (!validUrlResponse.success) {
        const errorMessage = handleError(validUrlResponse.error.code);
        errorLogger.log(
          validUrlResponse.error.code,
          validUrlResponse.error.message,
          query,
        );
        setErrorAction(true);
        if (setErrorMessage) setErrorMessage(errorMessage);
        return;
      }

      if (!validUrlResponse.isRecipe) {
        const errorMessage = handleError('ERR_NO_RECIPE_FOUND');
        errorLogger.log(
          'ERR_NO_RECIPE_FOUND',
          'No recipe found on this page',
          query,
        );
        setErrorAction(true);
        if (setErrorMessage) setErrorMessage(errorMessage);
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
        const errorMessage = handleError(errorCode);
        errorLogger.log(errorCode, response.error?.message || 'Parsing failed', query);
        setErrorAction(true);
        if (setErrorMessage) setErrorMessage(errorMessage);
        return;
      }

      console.log('[Client] Successfully parsed recipe:', response.title);

      // Step 3: Store parsed recipe in context
      // The new parser already returns data in the correct grouped format
      setParsedRecipe({
        title: response.title,
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author, // Include author if available
        sourceUrl: response.sourceUrl || query, // Use sourceUrl from response or fallback to query URL
      });

      // Step 4: Add to recent recipes for quick access
      const recipeSummary = Array.isArray(response.instructions)
        ? response.instructions.join(' ').slice(0, 140)
        : response.instructions.slice(0, 140);

      addRecipe({
        title: response.title,
        summary: recipeSummary,
        url: query,
        ingredients: response.ingredients,
        instructions: response.instructions,
        author: response.author, // Include author if available
        sourceUrl: response.sourceUrl || query, // Include source URL if available
      });

      // Step 5: Navigate to the parsed recipe page
      router.push('/parsed-recipe-page');
    } catch (err) {
      console.error('[Client] Parse error:', err);
      errorLogger.log(
        'ERR_UNKNOWN',
        'An unexpected error occurred during parsing',
        query,
      );
      setErrorAction(true);
      if (setErrorMessage)
        setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    query,
    setErrorAction,
    setErrorMessage,
    setParsedRecipe,
    addRecipe,
    handleError,
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
        {/* Mode Toggle Button - Switches between URL and Image input */}
        <div className="flex justify-center mb-3">
          <button
            type="button"
            onClick={toggleInputMode}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#d9d9d9] rounded-full hover:border-[#4F46E5] transition-all duration-200 text-sm font-albert text-stone-600"
          >
            {inputMode === 'url' ? (
              <>
                <ImageIcon className="w-4 h-4" />
                <span>Switch to Image Upload</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Switch to URL Input</span>
              </>
            )}
          </button>
        </div>

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
                bg-stone-100 rounded-[9999px] border border-[#d9d9d9] 
                transition-all duration-300 ease-in-out
                hover:border-[#4F46E5] hover:border-opacity-80
                ${isFocused ? 'shadow-sm border-[#4F46E5] border-opacity-60' : ''}
              `}
            >
              <div className="flex items-center px-4 py-4 relative">
                {/* Search Icon */}
                <Search className="w-4 h-4 text-stone-600 flex-shrink-0" />

              {/* Input */}
              <div className="flex-1 ml-2 relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    isFocused
                      ? query && !isUrl(query)
                        ? 'Search recipes...'
                        : 'Try entering a recipe URL'
                      : 'Try entering a recipe URL'
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  className={`
                    w-full bg-transparent font-albert text-[14px] text-stone-600 
                    placeholder:text-stone-500 focus:outline-none border-none
                    transition-all duration-300 ease-in-out
                    ${isFocused ? 'text-left' : 'text-center'}
                  `}
                  disabled={loading}
                />
              </div>

              {/* Clear Button */}
              {query && (
                <button
                  type="button"
                  onClick={clearInput}
                  className="ml-2 p-1 hover:bg-stone-200 rounded-full transition-all duration-200 flex-shrink-0"
                  disabled={loading}
                >
                  <X className="w-4 h-4 text-stone-600" />
                </button>
              )}

              {/* Parse Button (for URLs) */}
              {query && isUrl(query) && (
                <button
                  type="submit"
                  className="ml-2 bg-[#FFA423] hover:bg-[#FF9500] text-white font-albert text-[12px] px-3 py-1.5 rounded-full transition-colors duration-200 flex-shrink-0"
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

            {/* Image Upload Button or Preview */}
            {!imagePreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full bg-stone-100 rounded-2xl border-2 border-dashed border-[#d9d9d9] hover:border-[#4F46E5] transition-all duration-300 p-12 flex flex-col items-center justify-center gap-3"
              >
                <Upload className="w-12 h-12 text-stone-400" />
                <div className="text-center">
                  <p className="font-albert text-stone-600 font-medium">
                    Click to upload recipe image
                  </p>
                  <p className="font-albert text-sm text-stone-500 mt-1">
                    PNG, JPG, or WEBP (max 10MB)
                  </p>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                {/* Image Preview */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-[#d9d9d9]">
                  <img
                    src={imagePreview}
                    alt="Recipe preview"
                    className="w-full h-auto max-h-96 object-contain bg-stone-50"
                  />
                  {/* Remove Image Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200"
                    disabled={loading}
                  >
                    <X className="w-5 h-5 text-stone-600" />
                  </button>
                </div>

                {/* Parse Button */}
                <button
                  type="button"
                  onClick={handleImageParse}
                  disabled={loading}
                  className="w-full bg-[#FFA423] hover:bg-[#FF9500] text-white font-albert font-medium text-base px-6 py-4 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Parse Recipe from Image
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search Results Dropdown - Only show in URL mode */}
        {inputMode === 'url' && showDropdown && searchResults.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#d9d9d9] rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
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
          </div>
        )}
      </div>
    </>
  );
}

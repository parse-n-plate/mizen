'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeRecipeFromUrl, type DecodeResult } from '@/lib/urlEncoder';
import { useRecipe, type ParsedRecipe } from '@/contexts/RecipeContext';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { toast } from 'sonner';
import { ArrowLeft, Clock, Share2, BookmarkPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { convertTextFractionsToSymbols } from '@/lib/utils';

// Helper to format time display
const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

export default function SharedRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setParsedRecipe } = useRecipe();
  const { addRecipe, recentRecipes, toggleBookmark } = useParsedRecipes();

  const [decodeResult, setDecodeResult] = useState<DecodeResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Decode recipe from URL on mount
  useEffect(() => {
    const encoded = searchParams.get('d');

    if (!encoded) {
      setDecodeResult({ success: false, error: 'invalid' });
      setIsLoading(false);
      return;
    }

    const result = decodeRecipeFromUrl(encoded);
    setDecodeResult(result);
    setIsLoading(false);
  }, [searchParams]);

  // Handle saving recipe to local storage
  const handleSaveRecipe = async () => {
    if (!decodeResult?.recipe) return;

    setIsSaving(true);

    try {
      const recipe = decodeResult.recipe;
      const recipeUrl = recipe.sourceUrl || `shared:${slug}`;

      // Add to recent recipes (this persists to localStorage)
      // The addRecipe function generates the id and parsedAt automatically
      const recipeToSave = {
        title: recipe.title || 'Untitled Recipe',
        summary: recipe.summary || '',
        url: recipeUrl,
        sourceUrl: recipe.sourceUrl,
        author: recipe.author,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        totalTimeMinutes: recipe.totalTimeMinutes,
        cuisine: recipe.cuisine,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
      };

      addRecipe(recipeToSave);

      // Get the newly added recipe's ID from localStorage
      // (it's the most recent one with matching URL)
      const stored = localStorage.getItem('recentRecipes');
      if (stored) {
        const recipes = JSON.parse(stored);
        const newRecipe = recipes.find((r: { url: string }) => r.url === recipeUrl);
        if (newRecipe?.id) {
          // Bookmark the recipe so it appears in Saved Recipes
          toggleBookmark(newRecipe.id);

          // Set as current recipe with the ID
          setParsedRecipe({ ...recipe, id: newRecipe.id });
        } else {
          setParsedRecipe(recipe);
        }
      } else {
        setParsedRecipe(recipe);
      }

      toast.success('Recipe saved to your collection!');

      // Navigate to the full recipe page
      router.push('/parsed-recipe-page');
    } catch (error) {
      console.error('Failed to save recipe:', error);
      toast.error('Failed to save recipe. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle opening recipe without saving
  const handleOpenRecipe = () => {
    if (!decodeResult?.recipe) return;

    // Set as current recipe (this will persist to localStorage via context)
    setParsedRecipe(decodeResult.recipe);

    // Navigate to the full recipe page
    router.push('/parsed-recipe-page');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-stone-200" />
          <div className="h-4 w-32 bg-stone-200 rounded" />
        </div>
      </div>
    );
  }

  // Error states
  if (!decodeResult?.success) {
    return <ErrorView error={decodeResult?.error || 'invalid'} expiresAt={decodeResult?.expiresAt} />;
  }

  const recipe = decodeResult.recipe!;

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-albert text-sm">Back to Home</span>
          </button>
        </div>
      </div>

      {/* Shared badge */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
          <Share2 className="w-4 h-4 text-amber-600" />
          <span className="font-albert text-sm text-amber-700 font-medium">
            Shared Recipe
          </span>
        </div>
      </div>

      {/* Recipe Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Title and metadata */}
          <div className="space-y-4">
            <h1 className="font-domine text-3xl md:text-4xl text-stone-900 font-bold leading-tight">
              {recipe.title}
            </h1>

            {recipe.author && (
              <p className="font-albert text-lg text-stone-500">
                <span className="text-stone-400">by</span> {recipe.author}
              </p>
            )}

            {recipe.summary && (
              <p className="font-albert text-lg text-stone-600 italic leading-relaxed">
                {recipe.summary}
              </p>
            )}

            {/* Time and servings badges */}
            <div className="flex flex-wrap gap-3 pt-2">
              {recipe.prepTimeMinutes && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg">
                  <Clock className="w-4 h-4 text-stone-400" />
                  <span className="font-albert text-sm text-stone-600">
                    {formatTime(recipe.prepTimeMinutes)} prep
                  </span>
                </div>
              )}
              {recipe.cookTimeMinutes && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg">
                  <Clock className="w-4 h-4 text-stone-400" />
                  <span className="font-albert text-sm text-stone-600">
                    {formatTime(recipe.cookTimeMinutes)} cook
                  </span>
                </div>
              )}
              {recipe.servings && (
                <div className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg">
                  <span className="font-albert text-sm text-stone-600">
                    {recipe.servings} servings
                  </span>
                </div>
              )}
            </div>

            {/* Cuisine tags */}
            {recipe.cuisine && recipe.cuisine.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipe.cuisine.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full font-albert text-sm"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Save to My Recipes CTA */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-50 rounded-full">
                <BookmarkPlus className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-albert text-lg font-semibold text-stone-900">
                  Save this recipe
                </h3>
                <p className="font-albert text-stone-500 mt-1">
                  Add to your collection to cook it later, adjust servings, and track your progress.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveRecipe}
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-stone-900 text-white font-albert font-medium rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save to My Recipes'}
              </button>
              <button
                onClick={handleOpenRecipe}
                className="py-3 px-4 border border-stone-300 text-stone-700 font-albert font-medium rounded-lg hover:bg-stone-50 transition-colors"
              >
                Just View
              </button>
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-4">
            <h2 className="font-domine text-2xl text-stone-900 font-semibold">
              Ingredients
            </h2>
            {recipe.ingredients.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-3">
                {group.groupName && group.groupName !== 'Main' && (
                  <h3 className="font-albert text-lg font-medium text-stone-700 mt-4">
                    {group.groupName}
                  </h3>
                )}
                <ul className="space-y-2">
                  {group.ingredients.map((ing, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 font-albert text-stone-700"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-2 flex-shrink-0" />
                      <span>
                        {ing.amount && (
                          <span className="font-medium">
                            {convertTextFractionsToSymbols(ing.amount)}
                          </span>
                        )}{' '}
                        {ing.units && <span>{ing.units}</span>}{' '}
                        {ing.ingredient}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h2 className="font-domine text-2xl text-stone-900 font-semibold">
              Instructions
            </h2>
            <ol className="space-y-6">
              {recipe.instructions.map((step, idx) => {
                const isString = typeof step === 'string';
                const title = isString ? `Step ${idx + 1}` : step.title || `Step ${idx + 1}`;
                const detail = isString ? step : step.detail;

                return (
                  <li key={idx} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-900 text-white font-albert font-medium flex items-center justify-center text-sm">
                      {idx + 1}
                    </span>
                    <div className="flex-1 pt-1">
                      {!isString && step.title && (
                        <h4 className="font-albert font-semibold text-stone-900 mb-1">
                          {title}
                        </h4>
                      )}
                      <p className="font-albert text-stone-700 leading-relaxed">
                        {convertTextFractionsToSymbols(detail)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Bottom CTA */}
          <div className="pt-4 pb-8">
            <button
              onClick={handleSaveRecipe}
              disabled={isSaving}
              className="w-full py-4 px-4 bg-stone-900 text-white font-albert font-medium text-lg rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save to My Recipes'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Error view component
function ErrorView({
  error,
  expiresAt,
}: {
  error: 'expired' | 'invalid' | 'corrupted';
  expiresAt?: number;
}) {
  const router = useRouter();

  const errorContent = {
    expired: {
      title: 'This link has expired',
      description: expiresAt
        ? `This shared recipe link expired on ${new Date(expiresAt).toLocaleDateString()}.`
        : 'Shared recipe links expire after 30 days.',
      suggestion: 'Ask the person who shared this recipe to send you a new link.',
    },
    invalid: {
      title: 'Invalid recipe link',
      description: "This doesn't appear to be a valid shared recipe link.",
      suggestion: 'Make sure you copied the complete URL, including the ?d= parameter.',
    },
    corrupted: {
      title: 'Could not load recipe',
      description: 'The recipe data appears to be corrupted or incomplete.',
      suggestion: 'Ask the person who shared this recipe to send you a new link.',
    },
  };

  const content = errorContent[error];

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
          <Share2 className="w-8 h-8 text-stone-400" />
        </div>

        <h1 className="font-domine text-2xl text-stone-900 font-bold mb-3">
          {content.title}
        </h1>

        <p className="font-albert text-stone-600 mb-2">{content.description}</p>

        <p className="font-albert text-stone-500 text-sm mb-8">
          {content.suggestion}
        </p>

        <button
          onClick={() => router.push('/')}
          className="w-full py-3 px-4 bg-stone-900 text-white font-albert font-medium rounded-lg hover:bg-stone-800 transition-colors"
        >
          Go to Home
        </button>
      </motion.div>
    </div>
  );
}

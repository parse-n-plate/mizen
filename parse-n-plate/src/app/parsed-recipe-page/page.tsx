'use client'
import { useRecipe } from '@/contexts/RecipeContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ParsedRecipePage() {
  const { parsedRecipe, clearRecipe } = useRecipe();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give a moment for context to load from localStorage
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!parsedRecipe) {
        router.push('/');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [parsedRecipe, router]);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!parsedRecipe) {
    return <div className="p-4">No recipe data found. Redirecting...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {parsedRecipe.title || 'Parsed Recipe'}
        </h1>
        <button
          onClick={() => {
            clearRecipe();
            router.push('/');
          }}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Parse Another Recipe
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ingredients Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4 text-green-600">
            Ingredients
          </h2>
          <ul className="space-y-2">
            {Array.isArray(parsedRecipe.ingredients) &&
              parsedRecipe.ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-gray-500 text-sm">•</span>
                <span>{typeof ingredient === 'string' ? ingredient : JSON.stringify(ingredient)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">
            Instructions
          </h2>
          <ol className="space-y-3">
            {Array.isArray(parsedRecipe.instructions) &&
              parsedRecipe.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {index + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

'use client';

import SearchForm from '@/components/ui/search-form';
import RecentRecipesList from '@/components/RecentRecipesList';
import HomepageSkeleton from '@/components/ui/homepage-skeleton';
import ErrorDisplay from '@/components/ui/error-display';
import { useState } from 'react';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';

export default function Home() {
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { isLoaded } = useParsedRecipes();

  const handleRetry = () => {
    setError(false);
    setErrorMessage('');
  };

  if (!isLoaded) {
    return <HomepageSkeleton />;
  }

  return (
    <div className="bg-[#fbf7f2] min-h-screen">
      <div className="transition-opacity duration-300 ease-in-out opacity-100">
        {/* Main Content Container */}
        <div className="max-w-md mx-auto px-4 pt-28 pb-16">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="font-domine text-[36px] text-black leading-none mb-5">
              What are you
              <br />
              cookin&apos; up today?
            </h1>
            <SearchForm
              setErrorAction={setError}
              setErrorMessage={setErrorMessage}
            />

            {/* Error Display - positioned below search input */}
            {error && errorMessage && (
              <div className="mt-5">
                <ErrorDisplay message={errorMessage} onRetry={handleRetry} />
              </div>
            )}
          </div>

          {/* Recent Recipes Section */}
          <div className="space-y-4">
            <h2 className="font-domine text-[20px] text-black leading-none">
              Recipes you&apos;ve parsed
            </h2>
            <RecentRecipesList />
          </div>
        </div>
      </div>
    </div>
  );
}

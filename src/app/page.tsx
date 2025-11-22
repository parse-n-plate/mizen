'use client';

import SearchForm from '@/components/ui/search-form';
import RecentRecipesList from '@/components/RecentRecipesList';
import HomepageSkeleton from '@/components/ui/homepage-skeleton';
import ErrorDisplay from '@/components/ui/error-display';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';

function HomeContent() {
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { isLoaded } = useParsedRecipes();
  const searchParams = useSearchParams();
  const [initialUrl, setInitialUrl] = useState('');

  // Handle URL parameter from navbar
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      setInitialUrl(urlParam);
    }
  }, [searchParams]);

  const handleRetry = () => {
    setError(false);
    setErrorMessage('');
  };

  if (!isLoaded) {
    return <HomepageSkeleton />;
  }

  return (
    <div className="bg-[#f1f1f1] min-h-screen relative">
      {/* Background gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255,164,36,0.1) 0%, rgba(253,193,58,0.05) 25%, rgba(251,222,79,0.03) 50%, rgba(252,231,123,0.02) 75%, rgba(255,255,255,0) 100%)',
        }}
      />

      <div className="transition-opacity duration-300 ease-in-out opacity-100 relative z-10">
        {/* Main Content Container */}
        <div className="max-w-md mx-auto px-8 pt-28 pb-16">
          {/* Hero Section */}
          <div className="mb-16">
            {/* New hero text and subtitle */}
            <div className="text-center mb-6">
              <h1 className="font-domine text-[48px] text-black leading-[1.1] mb-3">
                Clean recipes,
                <br />
                fast cooking
              </h1>
              <p className="font-albert text-[14px] text-stone-950 leading-[1.4]">
                Instantly transform any recipe URL
                <br />
                into a simplified, ad-free format.
              </p>
            </div>

            {/* Search Form */}
            <SearchForm
              setErrorAction={setError}
              setErrorMessage={setErrorMessage}
              initialUrl={initialUrl}
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

export default function Home() {
  return (
    <Suspense fallback={<HomepageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

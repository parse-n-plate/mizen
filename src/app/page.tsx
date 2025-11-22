'use client';

import SearchForm from '@/components/ui/search-form';
import RecentRecipesList from '@/components/RecentRecipesList';
import HomepageSkeleton from '@/components/ui/homepage-skeleton';
import ErrorDisplay from '@/components/ui/error-display';
import CuisineFilters from '@/components/ui/cuisine-filters';
import FeaturedRecipesSection from '@/components/ui/featured-recipes-section';
import FooterCTA from '@/components/ui/footer-cta';
import PotIcon from '@/components/ui/pot-icon';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';

/**
 * Landing Page Component
 * 
 * Updated to match Figma design with:
 * - Hero section with logo, headline, subtitle, and CTA buttons
 * - Cuisine filter pills
 * - Featured recipes section (using mock data)
 * - Footer CTA section
 * - Recent Recipes section (existing functionality preserved)
 * 
 * Responsive design for both mobile and desktop.
 */
function HomeContent() {
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
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
    <div className="bg-stone-50 min-h-screen w-full">
      <div className="flex flex-col gap-6 items-start pb-14 pt-12 px-4 md:px-8 lg:px-0 w-full max-w-[1440px] mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col gap-6 items-center justify-center w-full px-4">
          {/* Logo and Brand Name */}
          <div className="flex gap-3 items-center">
            <PotIcon />
            <p className="font-domine leading-[1.1] text-[20px] md:text-[24px] text-black whitespace-nowrap">
              Parse & Plate
            </p>
          </div>

          {/* Main Headline */}
          <div className="font-domine leading-[1.1] text-[32px] md:text-[48px] lg:text-[64px] text-black text-center">
            <p className="mb-0">Clean recipes,</p>
            <p>fast cooking.</p>
          </div>

          {/* Subtitle */}
          <p className="font-albert leading-[1.4] text-[14px] md:text-[16px] text-center text-stone-900 max-w-lg px-4">
            Spend less time on ad-filled recipes and more time cooking.
          </p>

          {/* Hero CTA Buttons */}
          {/* Buttons removed per user request */}
        </div>

        {/* Search Form Section - Keep existing functionality */}
        <div className="w-full max-w-md mx-auto px-4">
          <SearchForm
            setErrorAction={setError}
            setErrorMessage={setErrorMessage}
            initialUrl={initialUrl}
          />

          {/* Error Display */}
          {error && errorMessage && (
            <div className="mt-5">
              <ErrorDisplay message={errorMessage} onRetry={handleRetry} />
            </div>
          )}
        </div>

        {/* Main Content Section */}
        <div className="relative shrink-0 w-full">
          <div className="size-full">
            <div className="flex flex-col gap-6 items-start lg:px-[200px] py-0 w-full">
              {/* Cuisine Filters */}
              <CuisineFilters
                selectedCuisine={selectedCuisine}
                onCuisineChange={setSelectedCuisine}
              />

              {/* Featured Recipes Section */}
              <FeaturedRecipesSection selectedCuisine={selectedCuisine} />

              {/* Recent Recipes Section - Existing functionality */}
              <div className="w-full space-y-4 pt-6 border-t border-stone-200">
                <h2 className="font-domine text-[20px] md:text-[24px] text-black leading-none">
                  Recipes you&apos;ve parsed
                </h2>
                <RecentRecipesList />
              </div>

              {/* Footer CTA */}
              <FooterCTA />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export wrapped with Suspense for useSearchParams
export default function Home() {
  return (
    <Suspense fallback={<HomepageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

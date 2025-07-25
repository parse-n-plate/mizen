'use client';

import SearchForm from '@/components/ui/search-form';
import RecentRecipesList from '@/components/RecentRecipesList';
import HomepageSkeleton from '@/components/ui/homepage-skeleton';
import { useState } from 'react';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';

export default function Home() {
  const [error, setError] = useState(false);
  const { isLoaded } = useParsedRecipes();

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
              What are you cookin&apos; up today?
            </h1>
            <SearchForm setErrorAction={setError} />

            {/* Error Card - positioned below search input */}
            {error && (
              <div className="mt-5">
                <div className="bg-[#ffb3b5] rounded-lg p-4">
                  <p className="font-albert text-[16px] text-[#7a2d2d] leading-[1.4]">
                    Please enter a valid URL.
                  </p>
                </div>
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

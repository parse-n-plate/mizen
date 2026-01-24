'use client';

import PPLogo from '@/components/ui/Navbar/pplogo';
import InlineSearch from '@/components/ui/Navbar/inline-search';
import Link from 'next/link';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';

export default function Navbar() {
  const { bookmarkedRecipeIds, isLoaded } = useParsedRecipes();
  const hasSavedRecipes = bookmarkedRecipeIds.length > 0;

  return (
    <div className="bg-white px-4 md:px-6 py-3 md:py-4 sticky top-0 z-[10000] border-b border-stone-200">
      <div className="max-w-6xl mx-auto flex items-center gap-4 md:gap-6">
        {/* Left: Logo */}
        <div className="flex items-center flex-shrink-0">
          <Link 
            href="/" 
            className="group transition-all duration-300 ease-in-out"
          >
            <PPLogo />
          </Link>
        </div>

        {/* Center: Inline Search */}
        <div className="flex-1 max-w-md mx-auto">
          <InlineSearch />
        </div>

        {/* Right: Saved Recipes Link */}
        {isLoaded && (
          <div className="flex items-center flex-shrink-0">
            <Link
              href="/saved-recipes"
              className="relative p-2 rounded-full transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
              aria-label="View saved recipes"
            >
              <Bookmark
                className={`w-5 h-5 transition-colors ${
                  hasSavedRecipes
                    ? 'fill-[#78716C] text-[#78716C]'
                    : 'fill-[#D6D3D1] text-[#D6D3D1]'
                }`}
              />
              {/* Badge indicator when there are saved recipes */}
              {hasSavedRecipes && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#78716C] rounded-full" />
              )}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

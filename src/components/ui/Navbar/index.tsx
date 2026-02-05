'use client';

import PPLogo from '@/components/ui/Navbar/pplogo';
import InlineSearch from '@/components/ui/Navbar/inline-search';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';

export default function Navbar() {
  const { bookmarkedRecipeIds, isLoaded } = useParsedRecipes();
  const hasSavedRecipes = bookmarkedRecipeIds.length > 0;
  const pathname = usePathname();
  const isOnSavedRecipesPage = pathname === '/cookbook';

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
              href="/cookbook"
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 border border-stone-200 ${
                isOnSavedRecipesPage
                  ? 'bg-stone-200'
                  : 'hover:bg-stone-100'
              }`}
              aria-label="View Cookbook"
              aria-current={isOnSavedRecipesPage ? 'page' : undefined}
            >
              <Bookmark
                className={`w-4 h-4 transition-colors ${
                  isOnSavedRecipesPage
                    ? 'fill-[#0C0A09] text-[#0C0A09]'
                    : hasSavedRecipes
                    ? 'fill-[#78716C] text-[#78716C]'
                    : 'fill-[#A8A29E] text-[#A8A29E]'
                }`}
              />
              {/* Text label - visible on all screen sizes for clarity */}
              <span className={`font-albert text-sm font-medium transition-colors ${
                isOnSavedRecipesPage
                  ? 'text-stone-900'
                  : hasSavedRecipes
                  ? 'text-stone-600'
                  : 'text-stone-400'
              }`}>
                Cookbook
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

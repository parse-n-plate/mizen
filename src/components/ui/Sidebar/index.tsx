'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { Plus, PanelLeftClose, PanelLeft } from 'lucide-react';
import Image from 'next/image';
import Magnifer from '@solar-icons/react/csr/search/Magnifer';
import ClockCircle from '@solar-icons/react/csr/time/ClockCircle';
import Book from '@solar-icons/react/csr/school/Book';
import SettingsIcon from '@solar-icons/react/csr/settings/Settings';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import History from '@solar-icons/react/csr/time/History';
import type { ParsedRecipe } from '@/lib/storage';

/**
 * Sidebar Component
 *
 * A collapsible sidebar navigation for the Mizen app.
 */
export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAllSaved, setShowAllSaved] = useState(false);
  const { recentRecipes, getBookmarkedRecipes, isLoaded, getRecipeById } = useParsedRecipes();
  const { setParsedRecipe } = useRecipe();
  const router = useRouter();
  const pathname = usePathname();

  const bookmarkedRecipes = getBookmarkedRecipes();

  const formatTime = (minutes?: number): string => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getDisplayTime = (recipe: ParsedRecipe): string => {
    if (recipe.totalTimeMinutes) return formatTime(recipe.totalTimeMinutes);
    if (recipe.prepTimeMinutes && recipe.cookTimeMinutes) {
      return formatTime(recipe.prepTimeMinutes + recipe.cookTimeMinutes);
    }
    if (recipe.prepTimeMinutes) return formatTime(recipe.prepTimeMinutes);
    if (recipe.cookTimeMinutes) return formatTime(recipe.cookTimeMinutes);
    return '';
  };

  const handleRecipeClick = (recipeId: string) => {
    try {
      const fullRecipe = getRecipeById(recipeId);
      if (fullRecipe && fullRecipe.ingredients && fullRecipe.instructions) {
        setParsedRecipe({
          id: fullRecipe.id,
          title: fullRecipe.title,
          ingredients: fullRecipe.ingredients,
          instructions: fullRecipe.instructions,
          author: fullRecipe.author,
          sourceUrl: fullRecipe.sourceUrl || fullRecipe.url,
          summary: fullRecipe.description || fullRecipe.summary,
          cuisine: fullRecipe.cuisine,
          imageData: fullRecipe.imageData,
          imageFilename: fullRecipe.imageFilename,
          prepTimeMinutes: fullRecipe.prepTimeMinutes,
          cookTimeMinutes: fullRecipe.cookTimeMinutes,
          totalTimeMinutes: fullRecipe.totalTimeMinutes,
          servings: fullRecipe.servings,
          plate: fullRecipe.plate,
        });
        router.push('/parsed-recipe-page');
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    }
  };

  const navItems = [
    { icon: Magnifer, label: 'Search', href: '/', action: 'search' },
    { icon: ClockCircle, label: 'Timers', href: '/timers', action: 'timers' },
    { icon: Book, label: 'Cookbook', href: '/saved-recipes', action: 'cookbook' },
    { icon: SettingsIcon, label: 'Settings', href: '/settings', action: 'settings' },
  ];

  const displayedSavedRecipes = showAllSaved
    ? bookmarkedRecipes
    : bookmarkedRecipes.slice(0, 3);

  return (
    <>
      {/* Floating expand button when collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed top-4 left-4 z-50 p-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors shadow-sm"
          aria-label="Expand sidebar"
        >
          <PanelLeft className="w-4 h-4 text-stone-500" />
        </button>
      )}

      <aside
        className={`
          h-screen bg-white border-r border-stone-200 flex flex-col flex-shrink-0 sticky top-0 overflow-hidden
          transition-[width] duration-200 ease-[cubic-bezier(0.645,0.045,0.355,1)]
          ${isCollapsed ? 'w-0 border-r-0' : 'w-72'}
        `}
      >
      {/* Fixed-width inner container - content clips when sidebar shrinks */}
      <div className="w-72 h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-domine text-xl font-semibold text-stone-900">
            Mizen
          </Link>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-lg hover:bg-stone-100 transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4 text-stone-300" />
          </button>
        </div>

        {/* New Recipe Button */}
        <div className="px-4 mb-2">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#0072ff] text-white rounded-lg hover:bg-[#0066e6] transition-colors font-albert font-medium"
            aria-label="New Recipe"
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            <span>New Recipe</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-albert text-sm
                  ${isActive
                    ? 'bg-stone-100 text-stone-900 font-medium'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }
                `}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-stone-200" />

        {/* Scrollable recipes section */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
          {/* Saved Recipes Section */}
          {isLoaded && bookmarkedRecipes.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1.5 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-stone-400" />
                <span className="font-albert text-xs font-medium text-stone-400 uppercase tracking-wider whitespace-nowrap">
                  Saved
                </span>
              </div>
              <div className="space-y-0.5">
                {displayedSavedRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleRecipeClick(recipe.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors text-left group"
                  >
                    <span className="font-albert text-sm text-stone-700 truncate pr-2">
                      {recipe.title}
                    </span>
                    {getDisplayTime(recipe) && (
                      <span className="font-albert text-xs text-stone-400 flex-shrink-0">
                        {getDisplayTime(recipe)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {bookmarkedRecipes.length > 3 && (
                <button
                  onClick={() => setShowAllSaved(!showAllSaved)}
                  className="px-3 py-1.5 font-albert text-xs text-stone-500 hover:text-stone-700 transition-colors"
                >
                  {showAllSaved ? 'Show Less' : 'See More'}
                </button>
              )}
            </div>
          )}

          {/* Recent Recipes Section */}
          {isLoaded && recentRecipes.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1.5 flex items-center gap-2">
                <History className="w-4 h-4 text-stone-400" />
                <span className="font-albert text-xs font-medium text-stone-400 uppercase tracking-wider whitespace-nowrap">
                  Recent
                </span>
              </div>
              <div className="space-y-0.5">
                {recentRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleRecipeClick(recipe.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors text-left group"
                  >
                    <span className="font-albert text-sm text-stone-700 truncate pr-2">
                      {recipe.title}
                    </span>
                    {getDisplayTime(recipe) && (
                      <span className="font-albert text-xs text-stone-400 flex-shrink-0">
                        {getDisplayTime(recipe)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-stone-200">
          <button className="w-full flex items-center gap-3 hover:bg-stone-50 rounded-lg p-2 -m-2 transition-colors">
            <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden">
              <Image
                src="/assets/icons/Fish Logo.svg"
                alt="Profile"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-albert text-sm font-medium text-stone-800 truncate">
                Gage Minamoto
              </div>
              <div className="font-albert text-xs text-stone-500">
                View Profile
              </div>
            </div>
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import PPLogo from '@/components/ui/Navbar/pplogo';
import InlineSearch from '@/components/ui/Navbar/inline-search';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Bookmark from '@solar-icons/react/csr/school/Bookmark';
import { useParsedRecipes } from '@/contexts/ParsedRecipesContext';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import AuthModal from '@/components/auth/AuthModal';

export default function Navbar() {
  const { bookmarkedRecipeIds, isLoaded } = useParsedRecipes();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const hasSavedRecipes = bookmarkedRecipeIds.length > 0;
  const pathname = usePathname();
  const isOnSavedRecipesPage = pathname === '/cookbook';

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  return (
    <div className="bg-white px-4 md:px-6 py-3 md:py-4 sticky top-0 z-[10000] border-b border-stone-200">
      <div className="max-w-6xl mx-auto flex items-center gap-4 md:gap-6">
        <div className="flex items-center flex-shrink-0">
          <Link href="/" className="group transition-all duration-300 ease-in-out">
            <PPLogo />
          </Link>
        </div>

        <div className="flex-1 max-w-md mx-auto">
          <InlineSearch />
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Cookbook Link */}
          {isLoaded && (
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
          )}

          {/* Auth */}
          {!user ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-1.5 bg-stone-900 text-white text-sm font-medium rounded-full hover:bg-stone-800 transition-colors font-albert"
            >
              Login
            </button>
          ) : (
            <div className="flex items-center gap-3 pl-2 border-l border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center border border-stone-200 overflow-hidden flex-shrink-0">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-albert text-xs font-bold text-stone-600">
                      {user.user_metadata?.full_name?.split(' ')[0]?.[0] || user.email?.[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="font-albert text-sm font-medium text-stone-600 hidden sm:block">
                  {user.user_metadata?.full_name?.split(' ')[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-stone-400 hover:text-stone-800 transition-colors font-albert"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useRecipe } from "@/context/RecipeContext";
import { AuthModal } from "@/components/AuthModal";
import { SettingsModal } from "@/components/SettingsModal";


export function TopBar() {
  const { user, loading: authLoading } = useUser();
  const { recipe } = useRecipe();
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const name =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Guest";

  const isRecipePage = pathname === "/recipe";
  const isProfilePage = pathname === "/profile";
  const showBackArrow = isRecipePage || isProfilePage;

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          {/* Left: back arrow or logo */}
          <div className="flex items-center gap-3">
            {showBackArrow ? (
              <Link
                href="/"
                className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
              >
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
              </Link>
            ) : null}

            {isRecipePage && recipe ? (
              <h2 className="truncate font-sans text-sm font-medium text-stone-600 max-w-[200px] sm:max-w-xs">
                {recipe.title}
              </h2>
            ) : (
              <Link href="/" className="font-serif text-lg font-semibold text-stone-900">
                Mizen
              </Link>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {/* User avatar / sign in */}
            {!authLoading && (
              <div className="relative">
                {user ? (
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden hover:ring-2 hover:ring-stone-200 transition-all"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt={name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 font-sans text-xs font-medium text-stone-600">
                        {name[0]?.toUpperCase()}
                      </div>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="font-sans text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    Sign in
                  </button>
                )}

                {/* Dropdown menu */}
                {menuOpen && user && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-xl border border-stone-200 bg-white py-1 shadow-lg shadow-stone-200/50">
                      <div className="border-b border-stone-100 px-3 py-2">
                        <p className="truncate font-sans text-sm font-medium text-stone-900">{name}</p>
                        <p className="truncate font-sans text-xs text-stone-400">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 font-sans text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setSettingsOpen(true);
                        }}
                        className="w-full px-3 py-2 text-left font-sans text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                      >
                        Settings
                      </button>
                      <form action="/api/auth/signout" method="post">
                        <button
                          type="submit"
                          className="w-full px-3 py-2 text-left font-sans text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                          Sign out
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

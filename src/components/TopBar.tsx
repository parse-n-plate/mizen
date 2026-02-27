"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useRecipe } from "@/context/RecipeContext";
import { AuthModal } from "@/components/AuthModal";
import { SettingsModal } from "@/components/SettingsModal";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";


export function TopBar() {
  const { user, loading: authLoading, supabaseDown } = useUser();
  const { recipe, history, setRecipe } = useRecipe();
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recipeSwitcherOpen, setRecipeSwitcherOpen] = useState(false);

  const name =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Guest";

  const isRecipePage = pathname === "/recipe";
  const isProfilePage = pathname === "/profile";
  const isCookbookPage = pathname === "/cookbook";
  const showBackArrow = isRecipePage || isProfilePage || isCookbookPage;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      toast.info(
        "Supabase is not connected. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable accounts and saving.",
        { id: "supabase-status", duration: Infinity, position: "bottom-right" }
      );
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    if (supabaseDown) {
      toast.info(
        "Some features like saving recipes are temporarily unavailable.",
        { id: "supabase-down", duration: Infinity, position: "bottom-right" }
      );
      return;
    }

    toast.dismiss("supabase-down");
  }, [supabaseDown]);

  return (
    <>
      <header className="mx-auto flex h-14 max-w-3xl items-center justify-between pt-4">
          {/* Left: back arrow or logo */}
          <div className="flex items-center gap-3">
            {showBackArrow ? (
              <Link
                href="/"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
              </Link>
            ) : null}

            {isRecipePage && recipe ? (
              user && history.length > 1 ? (
                <div className="relative">
                  <button
                    onClick={() => setRecipeSwitcherOpen(!recipeSwitcherOpen)}
                    className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-xs rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    <span className="truncate font-sans text-sm font-medium text-stone-600 dark:text-stone-400">
                      {recipe.title}
                    </span>
                    <svg
                      className={`h-3.5 w-3.5 flex-shrink-0 text-stone-400 dark:text-stone-500 transition-transform ${recipeSwitcherOpen ? "rotate-180" : ""}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {recipeSwitcherOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setRecipeSwitcherOpen(false)}
                      />
                      <div className="popover-animate absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 py-1 shadow-lg shadow-stone-200/50 dark:shadow-black/30">
                        <p className="px-3 py-1.5 font-sans text-xs font-medium text-stone-400 dark:text-stone-500">
                          Recent recipes
                        </p>
                        {history
                          .filter((entry) => entry.recipe.title !== recipe.title)
                          .map((entry) => (
                            <button
                              key={entry.parsedAt}
                              onClick={() => {
                                setRecipe(entry.recipe);
                                setRecipeSwitcherOpen(false);
                              }}
                              className="w-full px-3 py-2 text-left font-sans text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors truncate"
                            >
                              {entry.recipe.title}
                            </button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <h2 className="truncate font-sans text-sm font-medium text-stone-600 dark:text-stone-400 max-w-[200px] sm:max-w-xs">
                  {recipe.title}
                </h2>
              )
            ) : (
              <Link href="/" className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
                Mizen
              </Link>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1">
            {user && (
              <>
                <Link
                  href="/"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                  aria-label="Search"
                >
                  <svg className="h-[18px] w-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </Link>
                {isSupabaseConfigured && (
                  <Link
                    href="/cookbook"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                    aria-label="Cookbook"
                  >
                    <svg className="h-[18px] w-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                    </svg>
                  </Link>
                )}
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                  aria-label="Settings"
                >
                  <svg className="h-[18px] w-[18px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </>
            )}
            {/* User avatar / sign in + sign up */}
            {!authLoading && isSupabaseConfigured && (
              <div className="relative">
                {user ? (
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden hover:ring-2 hover:ring-stone-300 dark:hover:ring-stone-700 transition-all"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt={name}
                        className="h-8 w-8 rounded-lg"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-200 dark:bg-stone-700 font-sans text-xs font-medium text-stone-600 dark:text-stone-300">
                        {name[0]?.toUpperCase()}
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setAuthMode("login"); setAuthOpen(true); }}
                      className="font-sans text-sm font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
                    >
                      Sign in
                    </button>
                    <button
                      onClick={() => { setAuthMode("signup"); setAuthOpen(true); }}
                      className="rounded-lg bg-stone-900 px-3.5 py-1.5 font-sans text-sm font-medium text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 transition-colors"
                    >
                      Sign up
                    </button>
                  </div>
                )}

                {/* Dropdown menu */}
                {menuOpen && user && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="popover-animate absolute right-0 top-full z-40 mt-2 w-48 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 py-1 shadow-lg shadow-stone-200/50 dark:shadow-black/30">
                      <div className="border-b border-stone-100 dark:border-stone-800 px-3 py-2">
                        <p className="truncate font-sans text-sm font-medium text-stone-900 dark:text-stone-100">{name}</p>
                        <p className="truncate font-sans text-xs text-stone-400 dark:text-stone-500">{user.email}</p>
                      </div>
                      <Link
                        href="/cookbook"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 font-sans text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                      >
                        Cookbook
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 font-sans text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setSettingsOpen(true);
                        }}
                        className="w-full px-3 py-2 text-left font-sans text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                      >
                        Settings
                      </button>
                      <form action="/api/auth/signout" method="post">
                        <button
                          type="submit"
                          className="w-full px-3 py-2 text-left font-sans text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
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
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} initialMode={authMode} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

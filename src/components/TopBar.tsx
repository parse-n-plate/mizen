"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useRecipe } from "@/context/RecipeContext";
import { AuthModal } from "@/components/AuthModal";


export function TopBar() {
  const { user, loading: authLoading } = useUser();
  const { recipe, savedMeta } = useRecipe();
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const name =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Guest";

  const isRecipePage = pathname === "/recipe";
  const isProfilePage = pathname === "/profile";
  const showBackArrow = isRecipePage || isProfilePage;
  const showShare = isRecipePage && savedMeta;

  const shareUrl = savedMeta
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${savedMeta.slug}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            {/* Share button */}
            {showShare && (
              <div className="relative">
                <button
                  onClick={() => setShareOpen(!shareOpen)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-blue)] px-3 py-1.5 font-sans text-xs font-medium text-white transition-opacity hover:opacity-90"
                >
                  <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  Share
                </button>

                {shareOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShareOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-stone-200 bg-white p-4 shadow-lg shadow-stone-200/50">
                      <p className="mb-2 font-sans text-sm font-medium text-stone-700">
                        Share this recipe
                      </p>
                      <p className="mb-3 font-sans text-xs text-stone-400">
                        Anyone with this link can view the recipe.
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                          <p className="truncate font-mono text-xs text-stone-500">
                            {shareUrl}
                          </p>
                        </div>
                        <button
                          onClick={handleCopy}
                          className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-sans text-xs font-medium transition-colors ${
                            copied
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-[var(--color-blue)] text-white hover:opacity-90"
                          }`}
                        >
                          {copied ? (
                            <>
                              <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

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
    </>
  );
}

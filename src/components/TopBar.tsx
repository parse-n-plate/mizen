"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { detectCollectionUrl } from "@/utils/urlPatterns";
import { useUser } from "@/hooks/useUser";
import { useRecipe } from "@/context/RecipeContext";
import { AuthModal } from "@/components/AuthModal";
import { SettingsModal } from "@/components/SettingsModal";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export function TopBar() {
  const { user, loading: authLoading, supabaseDown } = useUser();
  const { recipe, history, setRecipe } = useRecipe();
  const pathname = usePathname();
  const router = useRouter();

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recipeSwitcherOpen, setRecipeSwitcherOpen] = useState(false);

  // Quick-add dropdown
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState<"menu" | "link">("menu");
  const [quickAddUrl, setQuickAddUrl] = useState("");
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const name =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Guest";

  const isRecipePage = pathname === "/recipe";
  const isProfilePage = pathname === "/profile";
  const isCookbookPage = pathname === "/cookbook";
  const showBackArrow = isRecipePage || isProfilePage || isCookbookPage;

  const closeQuickAdd = () => {
    setQuickAddOpen(false);
    setQuickAddMode("menu");
    setQuickAddUrl("");
  };

  const handleQuickAddUrl = async () => {
    const trimmed = quickAddUrl.trim();
    if (!trimmed || quickAddLoading) return;

    const collectionWarning = detectCollectionUrl(trimmed);
    if (collectionWarning) {
      toast.warning(`${collectionWarning} We'll still try parsing it.`);
    }

    setQuickAddLoading(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setRecipe(result.data);
        closeQuickAdd();
        router.push("/recipe");
      } else {
        toast.error(result.error || "Failed to parse recipe");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setQuickAddLoading(false);
    }
  };

  const handleImageFile = async (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are supported.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image is too large (max 10 MB).");
      return;
    }
    closeQuickAdd();
    setQuickAddLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setRecipe(result.data);
        router.push("/recipe");
      } else {
        toast.error(result.error || "Failed to parse recipe");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setQuickAddLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const t = setTimeout(() => {
        toast("Supabase is not connected. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable accounts and saving.", {
          id: "supabase-status",
          duration: Infinity,
        });
      }, 100);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (supabaseDown) {
      toast.info("Some features like saving recipes are temporarily unavailable.", {
        id: "supabase-down",
        duration: Infinity,
      });
      return;
    }
    toast.dismiss("supabase-down");
  }, [supabaseDown]);

  return (
    <>
      <header className="sticky top-0 z-50 flex w-full items-center justify-center bg-white/80 px-6 pt-0 backdrop-blur-md dark:bg-stone-950/80">
        <div className="flex h-14 w-full items-center justify-between">
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
                    <div className="fixed inset-0 z-30" onClick={() => setRecipeSwitcherOpen(false)} />
                    <div className="popover-animate absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 py-1 shadow-lg">
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
              {/* Quick-add dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setQuickAddMode("menu");
                    setQuickAddOpen(!quickAddOpen);
                  }}
                  className="flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 transition-colors"
                  aria-label="Add recipe"
                >
                  {quickAddLoading ? (
                    <svg
                      className="h-[18px] w-[18px] animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <>
                      <svg
                        className="h-[18px] w-[18px]"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                      <span className="font-sans text-sm font-medium">
                        Add Recipe
                      </span>
                    </>
                  )}
                </button>

                {quickAddOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={closeQuickAdd} />
                    <div className="popover-animate absolute right-0 top-full z-40 mt-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg overflow-hidden">
                      {quickAddMode === "menu" ? (
                        <div className="py-1 w-44">
                          <p className="px-3 py-1.5 font-sans text-xs font-medium text-stone-400 dark:text-stone-500">
                            Add recipe
                          </p>
                          <button
                            onClick={() => setQuickAddMode("link")}
                            className="flex w-full items-center gap-2.5 px-3 py-2 font-sans text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                          >
                            <svg className="h-4 w-4 flex-shrink-0 text-stone-400 dark:text-stone-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            Paste a link
                          </button>
                          <button
                            onClick={() => {
                              closeQuickAdd();
                              fileInputRef.current?.click();
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 font-sans text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                          >
                            <svg className="h-4 w-4 flex-shrink-0 text-stone-400 dark:text-stone-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                              <circle cx="9" cy="9" r="2" />
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                            Upload an image
                          </button>
                        </div>
                      ) : (
                        <div className="p-2 w-72">
                          <div className="flex items-center gap-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 px-2.5 py-1.5 focus-within:border-stone-400 dark:focus-within:border-stone-500 transition-colors">
                            <svg className="h-3.5 w-3.5 flex-shrink-0 text-stone-400 dark:text-stone-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            <input
                              autoFocus
                              type="url"
                              value={quickAddUrl}
                              onChange={(e) => setQuickAddUrl(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleQuickAddUrl()}
                              placeholder="https://..."
                              className="flex-1 bg-transparent font-sans text-sm text-stone-700 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none"
                            />
                            <button
                              onClick={handleQuickAddUrl}
                              disabled={!quickAddUrl.trim() || quickAddLoading}
                              className="flex h-5 w-5 items-center justify-center rounded text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 disabled:opacity-30 transition-colors"
                            >
                              <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                    e.target.value = "";
                  }}
                />
              </div>
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
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt={name}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-lg"
                      unoptimized
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
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="popover-animate absolute right-0 top-full z-40 mt-2 w-48 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 py-1 shadow-lg">
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
        </div>
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} initialMode={authMode} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

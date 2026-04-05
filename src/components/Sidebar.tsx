"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useRecipe } from "@/context/RecipeContext";
import { detectCollectionUrl } from "@/utils/urlPatterns";
import { SettingsModal } from "@/components/SettingsModal";
import { BetaAuthModal } from "@/components/BetaAuthModal";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { createClient } from "@/lib/supabase/client";
import HomeSmile from "@solar-icons/react/csr/ui/HomeSmile";
import BookMinimalistic from "@solar-icons/react/csr/school/BookMinimalistic";
import Settings from "@solar-icons/react/csr/settings/Settings";
import ChatRoundDots from "@solar-icons/react/csr/messages/ChatRoundDots";
import Magnifer from "@solar-icons/react/csr/search/Magnifer";
import SidebarMinimalistic from "@solar-icons/react/csr/it/SidebarMinimalistic";
import BookBookmark from "@solar-icons/react/csr/school/BookBookmark";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, loading: authLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const {
    setRecipe,
    loadRecipe,
    history,
    setSavedMeta,
    unsaveHistoryEntry,
    recipe: currentRecipe,
  } = useRecipe();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [recipeCount, setRecipeCount] = useState<number | null>(null);

  // Quick-add state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState<"menu" | "link">("menu");
  const [quickAddUrl, setQuickAddUrl] = useState("");
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

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
    if (!user || !isSupabaseConfigured) return;
    const supabase = createClient();
    if (!supabase) return;
    supabase
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => {
        if (count != null) setRecipeCount(count);
      });
  }, [user]);

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: HomeSmile,
      active: pathname === "/",
    },
    {
      href: "/cookbook",
      label: "Cookbook",
      icon: BookMinimalistic,
      active: pathname === "/cookbook",
      show: isSupabaseConfigured,
    },
  ];

  return (
    <>
      <aside
        className={cn(
          "flex flex-col justify-between shrink-0 w-[240px] transition-[transform,margin,opacity] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
          collapsed
            ? "-translate-x-full -ml-[240px] opacity-0 duration-150"
            : "translate-x-0 ml-0 opacity-100 duration-200"
        )}
      >
        <div className="flex flex-col gap-6 px-4 pt-6 w-[240px]">
          {/* Logo + sidebar toggle */}
          <div className="flex items-center justify-between px-1.5 h-7">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/apple-touch-icon.png"
                alt="Mizen"
                width={24}
                height={24}
                className="shrink-0 rounded"
              />
              <span className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
                Mizen
              </span>
            </Link>
            <button
              onClick={onToggle}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-none"
              aria-label="Collapse sidebar"
            >
              <SidebarMinimalistic size={14} />
            </button>
          </div>

          {/* Search bar */}
          <button
            className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-2 gap-2 w-full hover:border-stone-300 dark:hover:border-stone-600 transition-colors"
            onClick={() => {
              // Focus the home search or trigger ⌘K
              router.push("/");
            }}
          >
            <div className="flex items-center gap-2">
              <Magnifer size={15} className="text-stone-400 dark:text-stone-500 shrink-0" />
              <span className="font-sans text-sm text-stone-400 dark:text-stone-500">
                Search...
              </span>
            </div>
            <kbd className="font-sans text-xs text-stone-400 dark:text-stone-500">⌘K</kbd>
          </button>

          {/* Nav items */}
          <nav className="flex flex-col gap-px">
            {navItems
              .filter((item) => item.show !== false)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-sans text-sm transition-none",
                      item.active
                        ? "bg-stone-200/60 dark:bg-stone-700/35 text-stone-900 dark:text-stone-100 font-medium"
                        : "text-stone-500 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-700/35 hover:text-stone-700 dark:hover:text-stone-300"
                    )}
                  >
                    <Icon
                      size={17}
                      weight={item.active ? "Bold" : undefined}
                      className="shrink-0"
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.label === "Cookbook" && recipeCount != null && (
                      <span className="font-sans text-xs text-stone-400 dark:text-stone-500">
                        {recipeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
          </nav>

          {/* Quick-add recipe */}
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setQuickAddMode("menu");
                  setQuickAddOpen(!quickAddOpen);
                }}
                className="flex w-full h-8 items-center justify-center gap-1.5 rounded-lg px-3 bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 transition-colors"
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
                    <span className="font-sans text-sm font-medium">Add Recipe</span>
                  </>
                )}
              </button>

              {quickAddOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={closeQuickAdd} />
                  <div className="popover-animate absolute left-0 top-full z-40 mt-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg overflow-hidden">
                    {quickAddMode === "menu" ? (
                      <div className="py-1 w-44">
                        <p className="px-3 py-1.5 font-sans text-xs font-medium text-stone-400 dark:text-stone-500">
                          Add recipe
                        </p>
                        <button
                          onClick={() => setQuickAddMode("link")}
                          className="flex w-full items-center gap-2.5 px-3 py-2 font-sans text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                        >
                          <svg
                            className="h-4 w-4 flex-shrink-0 text-stone-400 dark:text-stone-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
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
                          <svg
                            className="h-4 w-4 flex-shrink-0 text-stone-400 dark:text-stone-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
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
                          <svg
                            className="h-3.5 w-3.5 flex-shrink-0 text-stone-400 dark:text-stone-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
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
                            <svg
                              className="h-3.5 w-3.5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
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
          )}

          {/* Recent recipes */}
          {history.length > 0 && (
            <div className="flex flex-col gap-px">
              <p className="px-2.5 pb-1 font-sans text-xs font-medium text-stone-400 dark:text-stone-500">
                Recent
              </p>
              {history.slice(0, 5).map((entry) => {
                const isActive =
                  currentRecipe?.title === entry.recipe.title &&
                  (pathname === "/recipe" ||
                    (entry.savedMeta?.slug && pathname === `/r/${entry.savedMeta.slug}`));
                const isSaved = !!entry.savedMeta;
                return (
                  <button
                    key={entry.parsedAt}
                    onClick={() => {
                      loadRecipe(entry.recipe, entry.savedMeta);
                      router.push(entry.savedMeta?.slug ? `/r/${entry.savedMeta.slug}` : "/recipe");
                    }}
                    className={cn(
                      "group/recent flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-sans text-sm text-left transition-none",
                      isActive
                        ? "bg-stone-200/60 dark:bg-stone-700/35 text-stone-900 dark:text-stone-100"
                        : "text-stone-500 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-700/35 hover:text-stone-700 dark:hover:text-stone-300"
                    )}
                  >
                    <span className="flex-1 truncate">{entry.recipe.title}</span>
                    {isSaved && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Unsave recipe"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await fetch(`/api/recipes/${entry.savedMeta!.id}`, {
                              method: "DELETE",
                            });
                            if (res.ok) {
                              if (isActive) {
                                setSavedMeta(null);
                              } else {
                                unsaveHistoryEntry(entry.recipe.title);
                              }
                              toast.success("Recipe removed");
                            }
                          } catch {
                            toast.error("Failed to remove recipe");
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.currentTarget.click();
                          }
                        }}
                        className="shrink-0 flex items-center justify-center h-5 w-5 rounded hover:bg-stone-300/60 dark:hover:bg-stone-600/40 transition-none"
                      >
                        <BookBookmark
                          size={13}
                          weight="Bold"
                          className="text-stone-400 dark:text-stone-500"
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom section */}
        <div className="flex flex-col px-4 pb-6 w-[240px]">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-sans text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/50 hover:text-stone-700 dark:hover:text-stone-300 transition-none"
          >
            <Settings size={17} className="shrink-0" />
            Settings
          </button>

          <button
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-sans text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/50 hover:text-stone-700 dark:hover:text-stone-300 transition-none"
          >
            <ChatRoundDots size={17} className="shrink-0" />
            Feedback
          </button>

          {user && (
            <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 mt-2">
              {user.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt={name}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full shrink-0"
                  unoptimized
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-700 font-sans text-xs font-medium text-stone-600 dark:text-stone-300 shrink-0">
                  {name[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-sans text-sm text-stone-600 dark:text-stone-300">{name}</span>
            </div>
          )}

          {!authLoading && !user && isSupabaseConfigured && (
            <button
              onClick={() => setAuthOpen(true)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 mt-2 font-sans text-sm font-medium text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </aside>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <BetaAuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} showTrigger={false} />
    </>
  );
}

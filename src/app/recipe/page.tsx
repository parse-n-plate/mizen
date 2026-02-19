"use client";

import { useState } from "react";
import { useRecipe } from "@/context/RecipeContext";
import { useUser } from "@/hooks/useUser";
import { RecipeHeader } from "@/components/RecipeHeader";
import { IngredientList } from "@/components/IngredientList";
import { StepList } from "@/components/StepList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function RecipePage() {
  const { recipe, savedMeta, setSavedMeta } = useRecipe();
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = savedMeta
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${savedMeta.slug}`
    : "";

  const handleSave = async () => {
    if (!recipe || !user || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe }),
      });
      const saved = await res.json();
      if (saved?.id && saved?.slug) {
        setSavedMeta({ id: saved.id, slug: saved.slug });
      }
    } catch {
      // Silent fail
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!recipe) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 px-6">
        <p className="font-sans text-stone-500 dark:text-stone-400">No recipe loaded.</p>
        <Link
          href="/"
          className="font-sans text-sm text-[var(--color-blue)] hover:underline"
        >
          Go back and paste a URL
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#FAFAF9] dark:bg-stone-950 flex flex-col">
      {/* Header section with cream background */}
      <div className="px-6 pt-8 pb-0">
        <div className="max-w-3xl mx-auto w-full pb-8">
          <div className="flex items-start justify-between gap-4">
            <RecipeHeader recipe={recipe} />

            {/* Action buttons — right-aligned */}
            <div className="flex items-center gap-2 flex-shrink-0 pt-1">
              {user && !savedMeta && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 font-sans text-xs font-medium text-stone-600 dark:text-stone-300 transition-colors hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  {saving ? "Saving..." : "Save"}
                </button>
              )}

              {savedMeta && (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 font-sans text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Saved
                  </span>

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
                        <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-lg shadow-stone-200/50 dark:shadow-black/30">
                          <p className="mb-2 font-sans text-sm font-medium text-stone-700 dark:text-stone-200">
                            Share this recipe
                          </p>
                          <p className="mb-3 font-sans text-xs text-stone-400 dark:text-stone-500">
                            Anyone with this link can view the recipe.
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2">
                              <p className="truncate font-mono text-xs text-stone-500 dark:text-stone-400">
                                {shareUrl}
                              </p>
                            </div>
                            <button
                              onClick={handleCopy}
                              className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-sans text-xs font-medium transition-colors ${
                                copied
                                  ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
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
                </>
              )}

              {!user && (
                <span className="font-sans text-xs text-stone-400 dark:text-stone-500">
                  <Link href="/" className="text-[var(--color-blue)] hover:underline">
                    Sign in
                  </Link>{" "}
                  to save
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex-1 flex flex-col px-6">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          <Tabs defaultValue="prep" className="flex-1 flex flex-col">
            <TabsList className="flex items-end w-full relative rounded-none border-b border-stone-200 dark:border-stone-700 bg-transparent p-0 gap-0">
              <TabsTrigger
                value="prep"
                className="folder-tab-trigger h-11 px-8 font-sans text-sm font-medium"
              >
                Prep
              </TabsTrigger>
              <TabsTrigger
                value="cook"
                className="folder-tab-trigger h-11 px-8 font-sans text-sm font-medium"
              >
                Cook
              </TabsTrigger>
            </TabsList>

            {/* Tab content */}
            <div className="bg-white dark:bg-stone-900 rounded-b-lg border border-t-0 border-stone-200 dark:border-stone-700 flex-1">
              <div className="max-w-3xl mx-auto px-6 pt-6 pb-12">
                <TabsContent value="prep" className="space-y-0">
                  <IngredientList groups={recipe.ingredients} />
                </TabsContent>
                <TabsContent value="cook" className="space-y-0">
                  <StepList steps={recipe.instructions} />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

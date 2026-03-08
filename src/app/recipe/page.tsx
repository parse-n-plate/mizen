"use client";

import { useState, useMemo, useEffect, useSyncExternalStore } from "react";
import { useRecipe } from "@/context/RecipeContext";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { RecipeHeader, formatTime } from "@/components/RecipeHeader";
import { PrepSection } from "@/components/PrepSection";
import { StepList } from "@/components/StepList";
import { scaleIngredients, displayAmount, displayText } from "@/utils/ingredientScaler";
import { getNumberFormat } from "@/lib/numberFormat";
import Link from "next/link";

export default function RecipePage() {
  const { recipe, savedMeta, setSavedMeta } = useRecipe();
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [unsaving, setUnsaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"prep" | "cook">("prep");
  const numberFormat = useSyncExternalStore(
    (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); },
    getNumberFormat,
    () => "fractions" as const,
  );

  const originalServings = useMemo(() => recipe?.servings, [recipe?.servings]);
  const [servings, setServings] = useState<number | undefined>(recipe?.servings);

  // Sync servings when recipe object changes (e.g. new parse with same servings count)
  useEffect(() => {
    setServings(recipe?.servings);
  }, [recipe]);

  const scaledIngredients = useMemo(() => {
    if (!recipe || !originalServings || !servings) return recipe?.ingredients ?? [];
    return scaleIngredients(recipe.ingredients, originalServings, servings);
  }, [recipe, originalServings, servings]);

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
        toast.success("Recipe saved");
      }
    } catch {
      toast.error("Saving recipes is temporarily unavailable. Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnsave = async () => {
    if (!savedMeta || unsaving) return;
    setUnsaving(true);
    try {
      const res = await fetch(`/api/recipes/${savedMeta.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSavedMeta(null);
        toast.success("Recipe removed");
      }
    } catch {
      toast.error("Removing recipes is temporarily unavailable. Please try again later.");
    } finally {
      setUnsaving(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (!recipe) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 px-6">
        <p className="font-sans text-stone-500 dark:text-stone-400">No recipe loaded.</p>
        <Link href="/" className="font-sans text-sm text-[var(--color-blue)] hover:underline">
          Go back and paste a URL
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white dark:bg-stone-950 flex flex-col">
      {/* Header section with cream background */}
      <div className="px-6 pt-8 pb-0">
        <div className="max-w-3xl mx-auto w-full pb-8">
          <RecipeHeader
            recipe={recipe}
            servings={servings}
            originalServings={originalServings}
            onServingsChange={setServings}
          />
        </div>
      </div>

      {/* Print-only: linear layout with ingredients + instructions */}
      <div className="hidden print:block px-6">
        <div className="max-w-3xl mx-auto w-full">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
            Ingredients
          </h3>
          {scaledIngredients.map((group) => (
            <div key={group.groupName} className="mb-4">
              <h4 className="font-sans text-sm font-semibold capitalize mb-1">{group.groupName}</h4>
              <ul className="list-disc pl-5 space-y-0.5">
                {group.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm">
                    {ing.ingredient}
                    {(ing.amount || ing.units) && (
                      <span className="text-stone-500 ml-1">
                        — {`${displayAmount(ing.amount, numberFormat)} ${ing.units || ""}`.trim()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 mt-6">
            Instructions
          </h3>
          <ol className="list-decimal pl-5 space-y-3">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="text-sm leading-relaxed">
                <strong>{step.title}</strong>
                <br />
                {displayText(step.detail, numberFormat)}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="flex-1 flex flex-col px-6 print:hidden">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          {/* Desktop: top folder tabs + quick actions (hidden on mobile) */}
          <div className="group/tabs hidden sm:flex items-end w-full relative border-b border-stone-200 dark:border-stone-700 gap-0">
            <button
              onClick={() => setActiveTab("prep")}
              className="folder-tab-trigger h-11 px-8 font-sans text-[14px] font-medium"
              data-state={activeTab === "prep" ? "active" : "inactive"}
            >
              Prep
              {recipe.prepTimeMinutes ? (
                <>
                  <span className="text-stone-300 dark:text-stone-600" aria-hidden>
                    ·
                  </span>
                  <span className="font-normal text-stone-400 dark:text-stone-500">
                    {formatTime(recipe.prepTimeMinutes)}
                  </span>
                </>
              ) : null}
            </button>
            <button
              onClick={() => setActiveTab("cook")}
              className="folder-tab-trigger h-11 px-8 font-sans text-[14px] font-medium"
              data-state={activeTab === "cook" ? "active" : "inactive"}
            >
              Cook
              {recipe.cookTimeMinutes ? (
                <>
                  <span className="text-stone-300 dark:text-stone-600" aria-hidden>
                    ·
                  </span>
                  <span className="font-normal text-stone-400 dark:text-stone-500">
                    {formatTime(recipe.cookTimeMinutes)}
                  </span>
                </>
              ) : null}
            </button>

            {/* Quick actions — right-aligned, revealed on hover */}
            <div className="ml-auto flex items-center gap-1 pb-2 opacity-0 group-hover/tabs:opacity-100 transition-opacity duration-150">
              {/* Save / Share */}
              <div className="flex items-center gap-1">
                {/* Save / Saved */}
                {user && !savedMeta && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    title="Save recipe"
                    className="press-scale inline-flex items-center justify-center h-8 w-8 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                  >
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                )}
                {savedMeta && (
                  <button
                    onClick={handleUnsave}
                    disabled={unsaving}
                    title="Remove from saved"
                    className="press-scale inline-flex items-center justify-center h-8 w-8 rounded-lg text-emerald-500 dark:text-emerald-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                  >
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                )}

                {/* Share / Copy link */}
                {savedMeta && (
                  <div className="relative">
                    <button
                      onClick={handleCopy}
                      title={copied ? "Copied!" : "Copy share link"}
                      className={`press-scale inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${
                        copied
                          ? "text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950"
                          : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                      }`}
                    >
                      {copied ? (
                        <svg
                          className="h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Divider — visible when save actions exist */}
              {user && <div className="h-4 w-px bg-stone-200 dark:bg-stone-700 mx-0.5" />}

              {/* Source link */}
              {recipe.sourceUrl && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View original recipe"
                  className="press-scale inline-flex items-center justify-center h-8 w-8 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}

              {/* Print */}
              <button
                onClick={() => window.print()}
                title="Print recipe"
                className="press-scale inline-flex items-center justify-center h-8 w-8 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect width="12" height="8" x="6" y="14" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content card */}
          <div className="bg-white dark:bg-stone-900 sm:rounded-b-lg rounded-lg sm:rounded-t-none border border-stone-200 dark:border-stone-700 sm:border-t-0 flex-1">
            <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-5 pb-24 sm:pb-6">
              {activeTab === "prep" ? (
                <div key="prep" className="tab-content-animate">
                  <PrepSection ingredients={scaledIngredients} steps={recipe.instructions} />
                </div>
              ) : (
                <div key="cook" className="tab-content-animate">
                  <StepList steps={recipe.instructions} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: fade above bottom tabs */}
      <div className="sm:hidden print:hidden fixed bottom-12 left-0 right-0 z-[19] h-24 pointer-events-none bg-gradient-to-t from-white dark:from-mizen-dark-surface to-transparent" />

      {/* Mobile: fixed bottom folder tabs (hidden on desktop) */}
      <div className="sm:hidden print:hidden fixed bottom-0 left-0 right-0 z-20 pb-[env(safe-area-inset-bottom)] bg-white dark:bg-stone-950">
        <div className="px-6">
          <div className="flex items-start w-full relative border-t border-stone-200 dark:border-stone-700 gap-0">
            <button
              onClick={() => setActiveTab("prep")}
              className="folder-tab-trigger-bottom flex-1 h-12 font-sans text-[14px] font-medium"
              data-state={activeTab === "prep" ? "active" : "inactive"}
            >
              Prep
              {recipe.prepTimeMinutes ? (
                <>
                  <span className="text-stone-300 dark:text-stone-600" aria-hidden>
                    ·
                  </span>
                  <span className="font-normal text-stone-400 dark:text-stone-500">
                    {formatTime(recipe.prepTimeMinutes)}
                  </span>
                </>
              ) : null}
            </button>
            <button
              onClick={() => setActiveTab("cook")}
              className="folder-tab-trigger-bottom flex-1 h-12 font-sans text-[14px] font-medium"
              data-state={activeTab === "cook" ? "active" : "inactive"}
            >
              Cook
              {recipe.cookTimeMinutes ? (
                <>
                  <span className="text-stone-300 dark:text-stone-600" aria-hidden>
                    ·
                  </span>
                  <span className="font-normal text-stone-400 dark:text-stone-500">
                    {formatTime(recipe.cookTimeMinutes)}
                  </span>
                </>
              ) : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useRecipe } from "@/context/RecipeContext";
import { useUser } from "@/hooks/useUser";
import { usePreference } from "@/hooks/usePreference";
import { useIngredientDiff } from "@/hooks/useIngredientDiff";
import {
  annotateIngredientGroups,
  convertIngredientGroups,
  convertInstructionTemperatures,
  getPreferredServings,
} from "@/lib/recipe-preferences";
import { toast } from "sonner";
import { RecipeHeader, formatTime } from "@/components/RecipeHeader";
import { PrepSection } from "@/components/PrepSection";
import { StepList } from "@/components/StepList";
import { scaleIngredients, displayAmount, displayText } from "@/utils/ingredientScaler";
import { detectUnitSystem } from "@/utils/unitConverter";
import { getNumberFormat } from "@/lib/numberFormat";
import {
  getDefaultServings,
  getDietaryProfile,
  getRoundAmounts,
  getSubstitutions,
  getTemperatureUnit,
  getUnitSystem,
  setUnitSystem,
} from "@/lib/preferences";
import Link from "next/link";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { HeartButton } from "@/components/HeartButton";
import { ReportRecipeDialog } from "@/components/ReportRecipeDialog";
import Flag from "@solar-icons/react/csr/ui/Flag";
import ChatRoundDots from "@solar-icons/react/csr/messages/ChatRoundDots";

export default function RecipePage() {
  const router = useRouter();
  const { recipe, savedMeta, setSavedMeta, removeFromHistory } = useRecipe();
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [unsaving, setUnsaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"prep" | "cook">("prep");
  const [mobileVaultOpen, setMobileVaultOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [vaultMounted, setVaultMounted] = useState(false);
  const [vaultExiting, setVaultExiting] = useState(false);
  const numberFormat = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    getNumberFormat,
    () => "fractions" as const
  );

  const originalServings = useMemo(() => recipe?.servings, [recipe?.servings]);
  const [servings, setServings] = useState<number | undefined>(recipe?.servings);
  const roundAmounts = usePreference(getRoundAmounts);
  const defaultServings = usePreference(getDefaultServings);
  const unitSystem = usePreference(getUnitSystem);
  const recipeUnitSystem = useMemo(
    () => (recipe ? detectUnitSystem(recipe.ingredients) : "imperial"),
    [recipe]
  );
  const isConverted = unitSystem !== "original";
  const temperatureUnit = usePreference(getTemperatureUnit);
  const dietaryProfile = usePreference(getDietaryProfile);
  const substitutions = usePreference(getSubstitutions);

  useEffect(() => {
    setServings(getPreferredServings(recipe?.servings, defaultServings));
  }, [defaultServings, recipe?.servings]);

  const preparedIngredients = useMemo(() => {
    if (!recipe) return [];

    return annotateIngredientGroups(recipe.ingredients, dietaryProfile, substitutions);
  }, [dietaryProfile, recipe, substitutions]);

  const scaledIngredients = useMemo(() => {
    if (!recipe) return [];

    const ingredients =
      originalServings && servings
        ? scaleIngredients(preparedIngredients, originalServings, servings, roundAmounts)
        : preparedIngredients;

    return convertIngredientGroups(ingredients, unitSystem);
  }, [originalServings, preparedIngredients, recipe, roundAmounts, servings, unitSystem]);

  const { diffMap, diffGeneration } = useIngredientDiff(
    scaledIngredients,
    unitSystem,
    numberFormat
  );
  const [showDiff, setShowDiff] = useState(false);
  const hasDiff = diffMap.size > 0;
  const prevDiffGenRef = useRef(diffGeneration);
  const [bannerMounted, setBannerMounted] = useState(false);
  const [bannerExiting, setBannerExiting] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Auto-show diff when unit conversion produces changes
  useEffect(() => {
    if (diffGeneration !== prevDiffGenRef.current && hasDiff) {
      setShowDiff(true);
      setBannerDismissed(false); // re-show banner on new conversion
      prevDiffGenRef.current = diffGeneration;
    }
  }, [diffGeneration, hasDiff]);

  const showBanner = hasDiff && !bannerDismissed;

  // Banner enter/exit lifecycle
  useEffect(() => {
    if (showBanner) {
      setBannerExiting(false);
      setBannerMounted(true);
    } else if (bannerMounted) {
      setBannerExiting(true);
      const timer = setTimeout(() => {
        setBannerMounted(false);
        setBannerExiting(false);
      }, 200); // matches exit animation duration
      return () => clearTimeout(timer);
    }
  }, [showBanner]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vault enter/exit lifecycle
  const vaultMountedRef = useRef(false);
  vaultMountedRef.current = vaultMounted;

  useEffect(() => {
    if (mobileVaultOpen) {
      setVaultExiting(false);
      setVaultMounted(true);
    } else if (vaultMountedRef.current) {
      setVaultExiting(true);
      // Fallback: unmount after animation duration if onAnimationEnd doesn't fire
      const timer = setTimeout(() => {
        setVaultMounted(false);
        setVaultExiting(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [mobileVaultOpen]);

  function dismissBanner() {
    setBannerDismissed(true);
  }

  const displayedInstructions = useMemo(() => {
    if (!recipe) return [];
    return convertInstructionTemperatures(recipe.instructions, temperatureUnit);
  }, [recipe, temperatureUnit]);

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

  const handleCopyRecipe = async () => {
    if (!recipe) return;
    const lines: string[] = [recipe.title, ""];

    if (servings) lines.push(`Servings: ${servings}`, "");

    lines.push("Ingredients");
    for (const group of scaledIngredients) {
      if (group.groupName) lines.push(`\n${group.groupName}`);
      for (const ing of group.ingredients) {
        const amt = ing.amount ? displayAmount(ing.amount, numberFormat) : "";
        const parts = [amt, ing.units, ing.ingredient].filter(Boolean).join(" ");
        const line = ing.description ? `${parts}, ${ing.description}` : parts;
        lines.push(`- ${line}`);
      }
    }

    lines.push("", "Instructions");
    displayedInstructions.forEach((step, i) => {
      lines.push(`${i + 1}. ${step.title}`);
      lines.push(displayText(step.detail, numberFormat));
      if (step.tips) lines.push(`Tip: ${step.tips}`);
      lines.push("");
    });

    try {
      await navigator.clipboard.writeText(lines.join("\n").trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Recipe copied");
    } catch {
      toast.error("Failed to copy recipe");
    }
  };

  const handleShare = async () => {
    if (!recipe) return;
    const url = shareUrl || recipe.sourceUrl || "";
    const shareData = {
      title: recipe.title,
      ...(recipe.summary && { text: recipe.summary }),
      ...(url && { url }),
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const text = url || recipe.title;
        await navigator.clipboard.writeText(text);
        toast.success("Link copied to clipboard");
      }
    } catch (err) {
      // User cancelled the share sheet — not an error
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("Failed to share");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this recipe? This can't be undone.")) return;
    try {
      if (savedMeta) {
        await fetch(`/api/recipes/${savedMeta.id}`, { method: "DELETE" });
      }
      removeFromHistory();
      toast.success("Recipe deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete recipe");
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
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <RecipeHeader
                recipe={recipe}
                servings={servings}
                originalServings={originalServings}
                onServingsChange={setServings}
              />
            </div>

            {/* Save heart button */}
            {user && (
              <HeartButton
                isSaved={!!savedMeta}
                saving={saving}
                unsaving={unsaving}
                onSave={handleSave}
                onUnsave={handleUnsave}
              />
            )}
          </div>
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
            {displayedInstructions.map((step, i) => (
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
          <div className="group/tabs hidden sm:flex items-end w-full relative gap-0">
            <button
              onClick={() => setActiveTab("prep")}
              className={`folder-tab-trigger press-scale h-12 px-10 font-sans text-[15px] ${
                activeTab === "prep" ? "font-semibold" : "font-medium"
              }`}
              data-state={activeTab === "prep" ? "active" : "inactive"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/icon-prep.png"
                alt=""
                width={24}
                height={24}
                className="tab-icon-prep h-6 w-6"
              />
              Prep
              {recipe.prepTimeMinutes ? (
                <span className="font-normal text-stone-400 dark:text-stone-500 ml-1.5">
                  {formatTime(recipe.prepTimeMinutes)}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => setActiveTab("cook")}
              className={`folder-tab-trigger press-scale h-12 px-10 font-sans text-[15px] ${
                activeTab === "cook" ? "font-semibold" : "font-medium"
              }`}
              data-state={activeTab === "cook" ? "active" : "inactive"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/icon-cook.svg"
                alt=""
                width={24}
                height={24}
                className="tab-icon-cook h-6 w-6"
              />
              Cook
              {recipe.cookTimeMinutes ? (
                <span className="font-normal text-stone-400 dark:text-stone-500 ml-1.5">
                  {formatTime(recipe.cookTimeMinutes)}
                </span>
              ) : null}
            </button>

            {/* Quick actions — right-aligned */}
            <div className="ml-auto flex items-center gap-1 pb-2">
              {/* Convert units */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      if (isConverted) {
                        setUnitSystem("original");
                      } else {
                        setUnitSystem(recipeUnitSystem === "metric" ? "imperial" : "metric");
                      }
                    }}
                    className={`press-scale inline-flex items-center justify-center h-8 px-2.5 rounded-lg text-xs font-medium font-sans transition-colors ${
                      isConverted
                        ? "text-[var(--color-blue)] bg-blue-50 dark:bg-blue-950 dark:text-blue-400"
                        : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                    }`}
                  >
                    {isConverted
                      ? unitSystem === "metric"
                        ? "Metric"
                        : "Imperial"
                      : recipeUnitSystem === "metric"
                        ? "Metric"
                        : "Imperial"}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isConverted
                    ? "Reset to original units"
                    : `Convert to ${recipeUnitSystem === "metric" ? "imperial" : "metric"}`}
                </TooltipContent>
              </Tooltip>

              {/* Divider */}
              <div className="h-4 w-px bg-stone-200 dark:bg-stone-700 mx-0.5" />

              {/* Copy recipe */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleCopyRecipe}
                    aria-label="Copy recipe"
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
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{copied ? "Copied!" : "Copy recipe"}</TooltipContent>
              </Tooltip>

              {/* Report — ghost button (only for logged-in users) */}
              {user && (
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="press-scale inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-xs font-medium font-sans"
                >
                  <Flag size={14} aria-hidden="true" />
                  Report
                </button>
              )}

              {/* More actions (Print, Share) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="More actions"
                    className="press-scale inline-flex items-center justify-center h-8 w-8 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <circle cx="5" cy="12" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="19" cy="12" r="1.5" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700"
                >
                  <DropdownMenuItem
                    onSelect={() => window.print()}
                    className="text-stone-700 dark:text-stone-300 focus:bg-stone-100 dark:focus:bg-stone-800 focus:text-stone-900 dark:focus:text-stone-50"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
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
                    Print
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={handleShare}
                    className="text-stone-700 dark:text-stone-300 focus:bg-stone-100 dark:focus:bg-stone-800 focus:text-stone-900 dark:focus:text-stone-50"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" x2="12" y1="2" y2="15" />
                    </svg>
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-stone-200 dark:bg-stone-700" />
                  <DropdownMenuItem
                    onSelect={handleDelete}
                    className="text-stone-700 dark:text-stone-300 focus:bg-stone-100 dark:focus:bg-stone-800 focus:text-red-600 dark:focus:text-red-400"
                  >
                    <svg
                      className="h-4 w-4 mr-2 text-red-500 dark:text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content card */}
          <div
            className={`sm:bg-white sm:dark:bg-stone-900 sm:rounded-b-lg ${activeTab === "prep" ? "sm:rounded-tr-lg" : "sm:rounded-t-lg"} sm:border sm:border-stone-200 sm:dark:border-stone-700 flex-1`}
          >
            <div className="max-w-3xl mx-auto sm:px-6 sm:pt-5 pb-24 sm:pb-6">
              {/* Unit conversion banner */}
              {bannerMounted && activeTab === "prep" && (
                <div
                  className={`unit-banner-wrapper ${bannerExiting ? "unit-banner-collapse" : "unit-banner-expand"}`}
                  aria-live="polite"
                >
                  <div className="overflow-hidden">
                    <div
                      className={`flex items-center gap-2 px-3.5 py-2.5 mb-4 rounded-lg bg-[var(--color-blue-light)] border border-[var(--color-blue)]/15 ${bannerExiting ? "unit-banner-exit" : "unit-banner-enter"}`}
                    >
                      <svg
                        className="h-3.5 w-3.5 text-[var(--color-blue)] flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                      <span className="font-sans text-[13px] text-[var(--color-blue)]">
                        Units converted to {unitSystem === "metric" ? "metric" : "imperial"}.
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowDiff((v) => !v)}
                        className="ml-auto font-sans text-xs font-medium text-[var(--color-blue)] hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        {showDiff ? "Hide changes" : "Show changes"}
                      </button>
                      <button
                        type="button"
                        onClick={dismissBanner}
                        aria-label="Dismiss"
                        className="text-[var(--color-blue)] hover:opacity-80 transition-opacity cursor-pointer p-0.5"
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
                          aria-hidden="true"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "prep" ? (
                <div key="prep" className="tab-content-animate">
                  <PrepSection
                    ingredients={scaledIngredients}
                    steps={displayedInstructions}
                    diffMap={showDiff ? diffMap : undefined}
                    diffGeneration={diffGeneration}
                  />
                </div>
              ) : (
                <div key="cook" className="tab-content-animate">
                  <StepList steps={displayedInstructions} />
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
          <div className="flex items-center w-full relative gap-0">
            <button
              onClick={() => setActiveTab("prep")}
              className={`folder-tab-trigger-bottom press-scale flex-1 h-12 font-sans text-[14px] ${
                activeTab === "prep" ? "font-semibold" : "font-medium"
              }`}
              data-state={activeTab === "prep" ? "active" : "inactive"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/icon-prep.png"
                alt=""
                width={24}
                height={24}
                className="tab-icon-prep h-6 w-6"
              />
              Prep
              {recipe.prepTimeMinutes ? (
                <span className="font-normal text-stone-400 dark:text-stone-500 ml-1.5">
                  {formatTime(recipe.prepTimeMinutes)}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => setActiveTab("cook")}
              className={`folder-tab-trigger-bottom press-scale flex-1 h-12 font-sans text-[14px] ${
                activeTab === "cook" ? "font-semibold" : "font-medium"
              }`}
              data-state={activeTab === "cook" ? "active" : "inactive"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/icon-cook.svg"
                alt=""
                width={24}
                height={24}
                className="tab-icon-cook h-6 w-6"
              />
              Cook
              {recipe.cookTimeMinutes ? (
                <span className="font-normal text-stone-400 dark:text-stone-500 ml-1.5">
                  {formatTime(recipe.cookTimeMinutes)}
                </span>
              ) : null}
            </button>

            {/* Mobile quick actions — three-dot menu */}
            <div className="ml-auto shrink-0">
              <button
                type="button"
                onClick={() => setMobileVaultOpen((v) => !v)}
                aria-label="More actions"
                aria-expanded={mobileVaultOpen}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-stone-400 dark:text-stone-500 active:bg-stone-100 dark:active:bg-stone-800 transition-colors"
              >
                <svg
                  className="h-[17px] w-[17px]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile vault — quick actions */}
        {vaultMounted && (
          <div
            className={`${vaultExiting ? "vault-exit" : "vault-animate"} border-t border-stone-200 dark:border-stone-700 px-6 py-3`}
            onAnimationEnd={() => {
              if (vaultExiting) {
                setVaultMounted(false);
                setVaultExiting(false);
              }
            }}
          >
            <div className="flex items-center justify-around">
              {/* Save / Unsave */}
              {user && (
                <button
                  type="button"
                  onClick={savedMeta ? handleUnsave : handleSave}
                  disabled={saving || unsaving}
                  aria-label={savedMeta ? "Remove from saved" : "Save recipe"}
                  className={`flex flex-col items-center gap-1 transition-colors disabled:opacity-50 ${
                    savedMeta
                      ? "text-red-500 dark:text-red-400"
                      : "text-stone-500 dark:text-stone-400 active:text-stone-800 dark:active:text-stone-200"
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={savedMeta ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span className="text-[11px] font-sans font-medium">
                    {savedMeta ? "Saved" : "Save"}
                  </span>
                </button>
              )}

              {/* Unit toggle */}
              <button
                type="button"
                aria-label={
                  isConverted
                    ? "Reset to original units"
                    : `Convert to ${recipeUnitSystem === "metric" ? "imperial" : "metric"}`
                }
                onClick={() => {
                  if (isConverted) {
                    setUnitSystem("original");
                  } else {
                    setUnitSystem(recipeUnitSystem === "metric" ? "imperial" : "metric");
                  }
                }}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isConverted
                    ? "text-[var(--color-blue)]"
                    : "text-stone-500 dark:text-stone-400 active:text-stone-800 dark:active:text-stone-200"
                }`}
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                <span className="text-[11px] font-sans font-medium">
                  {isConverted
                    ? unitSystem === "metric"
                      ? "Metric"
                      : "Imperial"
                    : recipeUnitSystem === "metric"
                      ? "Metric"
                      : "Imperial"}
                </span>
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share"
                className="flex flex-col items-center gap-1 text-stone-500 dark:text-stone-400 active:text-stone-800 dark:active:text-stone-200 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" x2="12" y1="2" y2="15" />
                </svg>
                <span className="text-[11px] font-sans font-medium">Share</span>
              </button>

              {/* Print */}
              <button
                type="button"
                onClick={() => window.print()}
                aria-label="Print"
                className="flex flex-col items-center gap-1 text-stone-500 dark:text-stone-400 active:text-stone-800 dark:active:text-stone-200 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect width="12" height="8" x="6" y="14" />
                </svg>
                <span className="text-[11px] font-sans font-medium">Print</span>
              </button>

              {/* Copy link (only when saved) */}
              {savedMeta && (
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={copied ? "Link copied" : "Copy link"}
                  className={`flex flex-col items-center gap-1 transition-colors ${
                    copied
                      ? "text-emerald-500 dark:text-emerald-400"
                      : "text-stone-500 dark:text-stone-400 active:text-stone-800 dark:active:text-stone-200"
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span className="text-[11px] font-sans font-medium">
                    {copied ? "Copied!" : "Copy link"}
                  </span>
                </button>
              )}

              {/* Feedback */}
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setReportOpen(true);
                    setMobileVaultOpen(false);
                    setVaultExiting(true);
                  }}
                  aria-label="Send feedback"
                  className="flex flex-col items-center gap-1 text-stone-500 dark:text-stone-400 active:text-stone-800 dark:active:text-stone-200 transition-colors"
                >
                  <ChatRoundDots size={20} aria-hidden="true" />
                  <span className="text-[11px] font-sans font-medium">Feedback</span>
                </button>
              )}

              {/* Delete */}
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Delete recipe"
                className="flex flex-col items-center gap-1 text-stone-500 dark:text-stone-400 hover:text-red-500 dark:hover:text-red-400 active:text-red-700 dark:active:text-red-300 transition-colors"
              >
                <svg
                  className="h-5 w-5 text-red-500 dark:text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
                <span className="text-[11px] font-sans font-medium">Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report recipe dialog */}
      <ReportRecipeDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        recipe={recipe}
        userEmail={user?.email || ""}
        activeTab={activeTab}
        unitSystem={unitSystem}
      />
    </div>
  );
}

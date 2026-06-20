"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useRecipe } from "@/context/RecipeContext";
import type { ParsedRecipe } from "@/lib/types";
import { useUser } from "@/hooks/useUser";
import { usePreference } from "@/hooks/usePreference";
import { useIngredientDiff } from "@/hooks/useIngredientDiff";
import { useTabScrollMemory } from "@/hooks/useTabScrollMemory";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  annotateIngredientGroups,
  convertIngredientGroups,
  convertInstructionTemperatures,
  getPreferredServings,
} from "@/lib/recipe-preferences";
import { toast } from "sonner";
import { RecipeHeader } from "@/components/RecipeHeader";
import { RecipeDesktopTabsBar } from "@/components/RecipeDesktopTabsBar";
import { ServingsAdjuster } from "@/components/ServingsAdjuster";
import { PrepSection } from "@/components/PrepSection";
import { StepList } from "@/components/StepList";
import { MobileNavShell, type MobileNavItem } from "@/components/MobileBottomNav";
import { scaleIngredients, displayAmount, displayText } from "@/utils/ingredientScaler";
import { detectUnitSystem } from "@/utils/unitConverter";
import { getNumberFormat } from "@/lib/numberFormat";
import { feedbackFeaturesEnabled } from "@/lib/features";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { UnitSystemSelect } from "@/components/ui/unit-system-select";
import { HeartButton } from "@/components/HeartButton";
import { ReportRecipeDialog } from "@/components/ReportRecipeDialog";
import { EditRecipeDrawer } from "@/components/EditRecipeDrawer";
import AltArrowLeft from "@solar-icons/react/csr/arrows/AltArrowLeft";
import Ruler from "@solar-icons/react/csr/tools/Ruler";
import Eye from "@solar-icons/react/csr/security/Eye";
import EyeClosed from "@solar-icons/react/csr/security/EyeClosed";
import {
  Copy,
  EllipsisVertical,
  MessageSquare,
  Pencil,
  Printer,
  Share2,
  Trash2,
  UsersRound,
} from "lucide-react";

export default function RecipePage() {
  const router = useRouter();
  const { recipe, savedMeta, setSavedMeta, removeFromHistory, updateRecipe } = useRecipe();
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [unsaving, setUnsaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"prep" | "cook">("prep");
  useTabScrollMemory(activeTab);
  const isPhoneViewport = useIsMobile();
  const [reportOpen, setReportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [mobileServingsOpen, setMobileServingsOpen] = useState(false);
  const [mobileUnitsOpen, setMobileUnitsOpen] = useState(false);
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
  const canAdjustServings = !!(originalServings && originalServings > 0);
  const mobileFooterStackHeight = "4.75rem";
  const mobileServingsGap = "0.75rem";
  const mobileServingsOffset = `calc(${mobileFooterStackHeight} + ${mobileServingsGap} + env(safe-area-inset-bottom))`;
  const roundAmounts = usePreference(getRoundAmounts);
  const defaultServings = usePreference(getDefaultServings);
  const unitSystem = usePreference(getUnitSystem);
  const recipeUnitSystem = useMemo(
    () => (recipe ? detectUnitSystem(recipe.ingredients) : "imperial"),
    [recipe]
  );
  const isConverted = unitSystem !== "original";
  const unitOptions = useMemo(
    () => [
      {
        value: "original" as const,
        label: `Original (${recipeUnitSystem === "metric" ? "Metric" : "Imperial"})`,
        meta: "source",
      },
      { value: "metric" as const, label: "Metric", meta: "g / ml" },
      { value: "imperial" as const, label: "Imperial", meta: "oz / cup" },
    ],
    [recipeUnitSystem]
  );
  const temperatureUnit = usePreference(getTemperatureUnit);
  const dietaryProfile = usePreference(getDietaryProfile);
  const substitutions = usePreference(getSubstitutions);

  const handleStepClick = useCallback((stepNumber: number) => {
    setActiveTab("cook");
    requestAnimationFrame(() => {
      document
        .getElementById(`step-${stepNumber}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

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

  const handleToggleMobileServings = () => {
    if (!canAdjustServings) return;
    setMobileServingsOpen((open) => !open);
  };

  const handleDelete = (e: Event) => {
    e.preventDefault();
    setTimeout(async () => {
      if (!window.confirm("Delete this recipe? This can't be undone.")) return;
      try {
        if (savedMeta) {
          const res = await fetch(`/api/recipes/${savedMeta.id}`, { method: "DELETE" });
          if (!res.ok) {
            toast.error("Failed to delete recipe");
            return;
          }
        }
        removeFromHistory();
        toast.success("Recipe deleted");
        router.push("/");
      } catch {
        toast.error("Failed to delete recipe");
      }
    });
  };

  const handleEditSave = async (
    updated: ParsedRecipe
  ): Promise<{ ok: boolean; error?: string }> => {
    if (savedMeta) {
      try {
        const res = await fetch(`/api/recipes/${savedMeta.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe: updated }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return { ok: false, error: data.error || "Failed to save changes. Please try again." };
        }
      } catch {
        return { ok: false, error: "Failed to save changes. Please try again." };
      }
    }
    updateRecipe(updated);
    toast.success("Recipe updated");
    return { ok: true };
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

  const openMobileUnits = () => {
    setMobileServingsOpen(false);
    setMobileUnitsOpen(true);
  };

  const handleMobileUnitChange = (next: "original" | "metric" | "imperial") => {
    setUnitSystem(next);
    setMobileUnitsOpen(false);
  };

  const recipeMobileNavItems: MobileNavItem[] = [
    {
      id: "prep",
      type: "button",
      label: "Prep",
      active: activeTab === "prep",
      pressed: activeTab === "prep",
      onClick: () => setActiveTab("prep"),
      icon: (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/assets/icon-prep.png" alt="" className="h-6 w-6" aria-hidden="true" />
      ),
    },
    {
      id: "cook",
      type: "button",
      label: "Cook",
      active: activeTab === "cook",
      pressed: activeTab === "cook",
      onClick: () => setActiveTab("cook"),
      icon: (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/assets/icon-cook.svg" alt="" className="h-6 w-6" aria-hidden="true" />
      ),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col pb-6">
      {/* Header section with cream background */}
      <div className="pt-4 md:pt-6 pb-0">
        <div className="max-w-[800px] duration-[220ms] group-data-[sidebar-collapsed=true]/shell:max-w-[1040px] group-data-[sidebar-collapsed=true]/shell:duration-[180ms] transition-[max-width] ease-[cubic-bezier(0.165,0.84,0.44,1)] motion-reduce:transition-none px-6 md:px-3 w-full pb-5 md:pb-8">
          {/* Mobile back button */}
          <div className="md:hidden flex items-center gap-2 mb-3.5 -ml-1 min-w-0">
            <Link
              href="/cookbook"
              aria-label="Back to Cookbook"
              className="shrink-0 inline-flex items-center text-[var(--color-text-muted)] active:text-[var(--color-text-body)]"
            >
              <AltArrowLeft className="size-4" />
            </Link>
            <div className="ml-auto flex items-center gap-1">
              <div
                id="mobile-recipe-search-action"
                className="flex h-9 w-9 items-center justify-center"
              />
              {isPhoneViewport ? (
                <button
                  type="button"
                  aria-label={isConverted ? "Change unit display" : `Convert units`}
                  aria-expanded={mobileUnitsOpen}
                  aria-pressed={isConverted}
                  onClick={openMobileUnits}
                  className={`press-scale inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isConverted || mobileUnitsOpen
                      ? "bg-[var(--color-blue-light)] text-[var(--color-blue)]"
                      : "text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-300"
                  }`}
                >
                  <Ruler size={18} weight={isConverted ? "Bold" : undefined} aria-hidden="true" />
                </button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={isConverted ? "Change unit display" : `Convert units`}
                      aria-pressed={isConverted}
                      onClick={() => setMobileServingsOpen(false)}
                      className={`press-scale inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                        isConverted
                          ? "bg-[var(--color-blue-light)] text-[var(--color-blue)]"
                          : "text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-300"
                      }`}
                    >
                      <Ruler
                        size={18}
                        weight={isConverted ? "Bold" : undefined}
                        aria-hidden="true"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[244px] rounded-lg border-stone-200 bg-white p-1.5 shadow-[0_10px_24px_rgba(44,42,37,0.12)] dark:border-stone-700 dark:bg-stone-900"
                  >
                    <DropdownMenuRadioGroup
                      value={unitSystem}
                      onValueChange={(value) =>
                        setUnitSystem(value as "original" | "metric" | "imperial")
                      }
                    >
                      {unitOptions.map((option, index) => (
                        <DropdownMenuRadioItem
                          key={option.value}
                          value={option.value}
                          className={`text-stone-700 dark:text-stone-300 ${
                            index === 0 ? "h-[38px]" : "h-9"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate">{option.label}</span>
                          <span className="shrink-0 text-xs font-normal text-stone-500 dark:text-stone-400">
                            {option.meta}
                          </span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {canAdjustServings && (
                <button
                  type="button"
                  onClick={handleToggleMobileServings}
                  aria-label="Adjust servings"
                  aria-expanded={mobileServingsOpen}
                  className={`press-scale inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                    mobileServingsOpen
                      ? "bg-[var(--color-blue-light)] text-[var(--color-blue)]"
                      : "text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-300"
                  }`}
                >
                  <UsersRound className="h-[18px] w-[18px]" aria-hidden="true" />
                </button>
              )}
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

          <div className="flex items-start gap-6">
            <div className="flex-1 min-w-0">
              <RecipeHeader
                recipe={recipe}
                servings={servings}
                originalServings={originalServings}
                onServingsChange={setServings}
                isServingsOpen={mobileServingsOpen}
                onServingsOpenChange={setMobileServingsOpen}
                showSwitcher
              />
            </div>

            {/* Save heart button */}
            {user && (
              <div className="hidden md:block">
                <HeartButton
                  isSaved={!!savedMeta}
                  saving={saving}
                  unsaving={unsaving}
                  onSave={handleSave}
                  onUnsave={handleUnsave}
                />
              </div>
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
      <div className="flex-1 flex flex-col md:pb-6 print:hidden">
        <div className="max-w-[800px] duration-[220ms] group-data-[sidebar-collapsed=true]/shell:max-w-[1040px] group-data-[sidebar-collapsed=true]/shell:duration-[180ms] transition-[max-width] ease-[cubic-bezier(0.165,0.84,0.44,1)] motion-reduce:transition-none px-6 md:px-3 w-full flex-1 flex flex-col">
          <RecipeDesktopTabsBar
            recipe={recipe}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isConverted={isConverted}
            recipeUnitSystem={recipeUnitSystem}
            unitSystem={unitSystem}
            onUnitSystemChange={setUnitSystem}
            copied={copied}
            onCopyRecipe={handleCopyRecipe}
            onShare={handleShare}
            onDelete={handleDelete}
            onEdit={() => setEditOpen(true)}
            showReport={feedbackFeaturesEnabled && !!user}
            onReport={() => setReportOpen(true)}
          />

          {/* Content card */}
          <div
            className={`md:bg-white md:dark:bg-stone-900 md:rounded-b-lg ${activeTab === "prep" ? "md:rounded-tr-lg" : "md:rounded-t-lg"} md:border md:border-stone-200 md:dark:border-stone-700 flex-1`}
          >
            <div className="md:px-6 md:pt-5 pb-[calc(7.25rem+env(safe-area-inset-bottom)+1rem)] md:pb-6">
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
                        className="ml-auto inline-flex items-center gap-1 font-sans text-xs font-medium text-[var(--color-blue)] hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        {showDiff ? (
                          <EyeClosed size={14} aria-hidden="true" />
                        ) : (
                          <Eye size={14} aria-hidden="true" />
                        )}
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
                    equipment={recipe?.equipment}
                    diffMap={showDiff ? diffMap : undefined}
                    diffGeneration={diffGeneration}
                    onStepClick={handleStepClick}
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

      {canAdjustServings && (
        <div
          className="md:hidden print:hidden pointer-events-none fixed inset-x-0 z-30 px-6"
          style={{ bottom: mobileServingsOffset }}
        >
          <div className="pointer-events-auto mx-auto w-full max-w-[20.5rem]">
            <ServingsAdjuster
              servings={servings!}
              originalServings={originalServings!}
              onServingsChange={setServings}
              isOpen={mobileServingsOpen}
              panelClassName="mt-0 border-[var(--color-border-light)]/90 bg-[var(--color-surface)] shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
            />
          </div>
        </div>
      )}

      <Drawer open={mobileUnitsOpen} onOpenChange={setMobileUnitsOpen}>
        <DrawerContent
          aria-describedby="mobile-unit-display-description"
          className="md:hidden px-4 pb-[calc(env(safe-area-inset-bottom)+1.375rem)] pt-0 dark:bg-stone-950"
        >
          <div className="mx-auto flex w-full max-w-[22rem] flex-col gap-4">
            <div className="flex flex-col gap-1">
              <DrawerTitle className="font-sans text-base font-semibold text-stone-900 dark:text-stone-100">
                Unit display
              </DrawerTitle>
              <DrawerDescription
                id="mobile-unit-display-description"
                className="font-sans text-[13px] leading-5 text-stone-500 dark:text-stone-400"
              >
                Choose how ingredient amounts display in this recipe.
              </DrawerDescription>
            </div>
            <UnitSystemSelect
              value={unitSystem}
              options={unitOptions}
              density="mobile"
              onValueChange={handleMobileUnitChange}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Mobile: soft content fade above the floating nav */}
      <div className="md:hidden print:hidden fixed bottom-0 left-0 right-0 z-[19] h-28 pointer-events-none bg-gradient-to-t from-white/90 via-white/45 to-transparent dark:from-stone-950/80 dark:via-stone-950/35 dark:to-transparent" />

      <MobileNavShell
        items={recipeMobileNavItems}
        showLabels
        actionSlot={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More recipe actions"
                className="press-scale inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-light)]/80 bg-[var(--color-surface)] text-[var(--color-text-heading)] shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-blue)] dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              >
                <EllipsisVertical className="h-5 w-5" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700"
            >
              <DropdownMenuItem
                onSelect={() => setEditOpen(true)}
                className="text-stone-700 dark:text-stone-300 focus:bg-stone-100 dark:focus:bg-stone-800 focus:text-stone-900 dark:focus:text-stone-50"
              >
                Edit
                <Pencil className="ml-auto h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleCopyRecipe}
                className="text-stone-700 dark:text-stone-300 focus:bg-stone-100 dark:focus:bg-stone-800 focus:text-stone-900 dark:focus:text-stone-50"
              >
                Copy
                <Copy className="ml-auto h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleShare}
                className="text-stone-700 dark:text-stone-300 focus:bg-stone-100 dark:focus:bg-stone-800 focus:text-stone-900 dark:focus:text-stone-50"
              >
                Share
                <Share2 className="ml-auto h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => window.print()}
                className="text-stone-700 dark:text-stone-300 focus:bg-stone-100 dark:focus:bg-stone-800 focus:text-stone-900 dark:focus:text-stone-50"
              >
                Print
                <Printer className="ml-auto h-4 w-4" />
              </DropdownMenuItem>
              {feedbackFeaturesEnabled && user && (
                <DropdownMenuItem
                  onSelect={() => setReportOpen(true)}
                  className="text-stone-700 dark:text-stone-300 focus:bg-stone-100 dark:focus:bg-stone-800 focus:text-stone-900 dark:focus:text-stone-50"
                >
                  Feedback
                  <MessageSquare className="ml-auto h-4 w-4" />
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-stone-200 dark:bg-stone-700" />
              <DropdownMenuItem
                onSelect={handleDelete}
                className="text-stone-700 dark:text-stone-300 focus:bg-stone-100 dark:focus:bg-stone-800 focus:text-red-600 dark:focus:text-red-400"
              >
                Delete
                <Trash2 className="ml-auto h-4 w-4 text-red-500 dark:text-red-400" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <EditRecipeDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        recipe={recipe}
        onSave={handleEditSave}
      />

      {/* Report recipe dialog */}
      {feedbackFeaturesEnabled && (
        <ReportRecipeDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          recipe={recipe}
          userEmail={user?.email || ""}
          activeTab={activeTab}
          unitSystem={unitSystem}
        />
      )}
    </div>
  );
}

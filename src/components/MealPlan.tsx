"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Popover } from "radix-ui";
import { toast } from "sonner";
import AltArrowLeft from "@solar-icons/react/csr/arrows/AltArrowLeft";
import AltArrowRight from "@solar-icons/react/csr/arrows/AltArrowRight";
import ArrowDown from "@solar-icons/react/csr/arrows/ArrowDown";
import AddCircle from "@solar-icons/react/csr/ui/AddCircle";
import MenuDots from "@solar-icons/react/csr/ui/MenuDots";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { HeartButton } from "@/components/HeartButton";
import { RecipeSourceIcon, getSourceKind } from "@/components/RecipeSourceIcon";
import { MOBILE_NAV_CONTENT_BOTTOM_PAD } from "@/components/MobileBottomNav";
import { useRecipe } from "@/context/RecipeContext";
import {
  addDays,
  dateKey,
  parseDate,
  startOfWeek,
  weekTitle,
  type MealPlanEntry,
} from "@/lib/meal-plan";
import type { SavedRecipe } from "@/lib/types";
import { cn } from "@/lib/utils";

const buttonClass =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-stone-200 bg-white px-3 font-sans text-sm text-stone-700 transition-none hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800";

function RecipePicker({
  date,
  recipes,
  plannedIds,
  disabled,
  saving,
  onAdd,
}: {
  date: string;
  recipes: SavedRecipe[];
  plannedIds: string[];
  disabled: boolean;
  saving: boolean;
  onAdd: (recipe: SavedRecipe, date: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  return (
    <Popover.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        setQuery("");
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          className={buttonClass}
          disabled={disabled || saving}
          aria-label={`Add recipe for ${parseDate(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
        >
          <AddCircle size={16} aria-hidden="true" />
          {saving ? "Adding…" : "Add recipe"}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900"
          aria-label="Choose a saved recipe"
        >
          <Command>
            <CommandInput
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Find a saved recipe…"
              aria-label="Find a saved recipe"
            />
            <CommandList>
              <CommandEmpty>
                {recipes.length ? "No recipes found." : "Save a recipe to start planning."}
              </CommandEmpty>
              <CommandGroup heading="Saved recipes">
                {recipes.map((recipe) => (
                  <CommandItem
                    key={recipe.id}
                    value={recipe.id}
                    keywords={[recipe.recipe.title, recipe.source_url ?? ""]}
                    disabled={saving || plannedIds.includes(recipe.id)}
                    onSelect={async () => {
                      if (await onAdd(recipe, date)) setOpen(false);
                    }}
                  >
                    <span className="flex-1 truncate">{recipe.recipe.title}</span>
                    {plannedIds.includes(recipe.id) && (
                      <span className="text-xs text-stone-500">Planned</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            {!recipes.length && (
              <Link
                href="/#search"
                className="block border-t border-stone-200 p-3 text-center text-sm text-[var(--color-blue)]"
              >
                Save your first recipe
              </Link>
            )}
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function sourceDomain(recipe: SavedRecipe): string | null {
  try {
    return new URL(recipe.source_url || recipe.recipe.sourceUrl || "").hostname.replace(
      /^www\./,
      ""
    );
  } catch {
    return null;
  }
}

const subscribeToHydration = () => () => {};

export function MealPlan() {
  // Wait for the browser before choosing a week in the user's local time zone.
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
  return hydrated ? (
    <MealPlanContent />
  ) : (
    <div className="mx-auto w-full max-w-3xl px-6 pt-6">
      <h1 className="font-serif text-[30px] font-bold">Meal plan</h1>
      <p role="status" className="mt-6 text-sm text-stone-500">
        Loading your meal plan…
      </p>
    </div>
  );
}

function MealPlanContent() {
  const [today, setToday] = useState(() => dateKey(new Date()));
  const [week, setWeek] = useState(() => dateKey(startOfWeek(new Date())));
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [recipesReady, setRecipesReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipeError, setRecipeError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [todayBelow, setTodayBelow] = useState(false);
  const [scrollRequested, setScrollRequested] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLElement>(null);
  const { setRecipe, setSavedMeta } = useRecipe();
  const router = useRouter();
  const weekStart = parseDate(week);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const currentWeek = dateKey(startOfWeek(parseDate(today)));
  const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  // Refresh the current-day marker after midnight and when returning to the app.
  useEffect(() => {
    const update = () => setToday(dateKey(new Date()));
    const timer = window.setInterval(update, 60_000);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setRecipesReady(false);
    setRecipeError(false);
    fetch("/api/recipes", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data: SavedRecipe[]) => {
        if (!Array.isArray(data)) throw new Error();
        setRecipes(data);
        setRecipesReady(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setRecipeError(true);
      });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setEntries([]);
    scrollRef.current?.scrollTo({ top: 0 });
    fetch(`/api/meal-plan?week=${week}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data: MealPlanEntry[]) => {
        if (!Array.isArray(data)) throw new Error();
        setEntries(data);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Could not load your meal plan. Please try again.");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [week, revision]);

  useEffect(() => {
    const viewport = scrollRef.current;
    const target = todayRef.current;
    if (!viewport || !target || loading) {
      setTodayBelow(false);
      return;
    }
    const update = () =>
      setTodayBelow(
        target.getBoundingClientRect().top >= viewport.getBoundingClientRect().bottom - 40
      );
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    observer.observe(target);
    viewport.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", update);
    };
  }, [week, today, loading, entries, recipesReady]);

  function scrollToToday() {
    const viewport = scrollRef.current;
    const target = todayRef.current;
    if (!viewport || !target) return;
    viewport.scrollTo({
      top:
        viewport.scrollTop +
        target.getBoundingClientRect().top -
        viewport.getBoundingClientRect().top,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    target.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!scrollRequested || loading || !recipesReady || week !== currentWeek) return;
    scrollToToday();
    setScrollRequested(false);
  }, [scrollRequested, loading, recipesReady, week, currentWeek]);

  async function addMeal(recipe: SavedRecipe, date: string) {
    if (savingDate) return false;
    setSavingDate(date);
    try {
      const response = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.id, date }),
      });
      if (!response.ok) throw new Error();
      const entry = (await response.json()) as MealPlanEntry;
      setEntries((previous) =>
        previous.some((item) => item.id === entry.id) ? previous : [...previous, entry]
      );
      toast.success(`${recipe.recipe.title} added to your meal plan`);
      return true;
    } catch {
      toast.error("Could not add this recipe. Please try again.");
      return false;
    } finally {
      setSavingDate(null);
    }
  }

  async function removeMeal(entry: MealPlanEntry) {
    if (removingId) return;
    setRemovingId(entry.id);
    try {
      const response = await fetch("/api/meal-plan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id }),
      });
      if (!response.ok) throw new Error();
      setEntries((previous) => previous.filter((item) => item.id !== entry.id));
      toast.success("Recipe removed from meal plan");
    } catch {
      toast.error("Could not remove this recipe. Please try again.");
    } finally {
      setRemovingId(null);
    }
  }

  function openRecipe(recipe: SavedRecipe) {
    setRecipe(recipe.recipe);
    setSavedMeta({ id: recipe.id, slug: recipe.slug, isFavorite: recipe.is_favorite });
    router.push("/recipe");
  }

  async function toggleFavorite(recipe: SavedRecipe) {
    if (favoriteId) return;
    setFavoriteId(recipe.id);
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !recipe.is_favorite }),
      });
      if (!response.ok) throw new Error();
      const updated = (await response.json()) as SavedRecipe;
      setRecipes((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      toast.error("Could not update your favorite. Please try again.");
    } finally {
      setFavoriteId(null);
    }
  }

  return (
    <div className="relative mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col px-6">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 pb-6 pt-6">
        <div className="min-w-0 flex-1 basis-52">
          <h1
            className="font-serif text-[30px] font-bold leading-[1.3] text-stone-900 dark:text-stone-50"
            aria-live="polite"
          >
            {weekTitle(weekStart)}
          </h1>
          <p className="mt-2 font-sans text-xs leading-[18px] text-stone-500">Meal plan</p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            className={cn(buttonClass, "w-8 px-0")}
            aria-label="Previous week"
            disabled={!!savingDate || !!removingId}
            onClick={() => {
              setScrollRequested(false);
              setWeek(dateKey(addDays(weekStart, -7)));
            }}
          >
            <AltArrowLeft size={16} />
          </button>
          <button
            type="button"
            className={cn(buttonClass, "w-8 px-0")}
            aria-label="Next week"
            disabled={!!savingDate || !!removingId}
            onClick={() => {
              setScrollRequested(false);
              setWeek(dateKey(addDays(weekStart, 7)));
            }}
          >
            <AltArrowRight size={16} />
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={!!savingDate || !!removingId}
            onClick={() => {
              setWeek(currentWeek);
              setScrollRequested(true);
            }}
          >
            Today
          </button>
        </div>
      </header>
      <div
        ref={scrollRef}
        className={cn(
          "-mx-3 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-y-contain px-3",
          MOBILE_NAV_CONTENT_BOTTOM_PAD,
          "md:pb-20"
        )}
        aria-label="Weekly meal plan"
        aria-busy={loading || !recipesReady}
      >
        {error || recipeError ? (
          <div
            role="alert"
            className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900"
          >
            <p className="text-sm text-stone-600 dark:text-stone-300">
              {error || "Could not load your saved recipes. Please try again."}
            </p>
            <button
              className={cn(buttonClass, "mt-4")}
              onClick={() => setRevision((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        ) : loading || !recipesReady ? (
          <p role="status" className="text-sm text-stone-500">
            Loading your meal plan…
          </p>
        ) : (
          days.map((day) => {
            const key = dateKey(day);
            const isToday = key === today;
            const meals = entries.filter(
              (entry) => entry.planned_date === key && recipesById.has(entry.recipe_id)
            );
            const picker = (
              <RecipePicker
                key={`${week}-${key}`}
                date={key}
                recipes={recipes}
                plannedIds={meals.map((meal) => meal.recipe_id)}
                disabled={loading || !recipesReady || !!error || !!savingDate}
                saving={savingDate === key}
                onAdd={addMeal}
              />
            );
            return (
              <section
                key={key}
                ref={isToday ? todayRef : undefined}
                tabIndex={-1}
                className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue)]"
                aria-labelledby={`day-${key}`}
              >
                <div className="mb-2 flex min-h-7 items-center justify-between gap-3">
                  <h2
                    id={`day-${key}`}
                    className={cn(
                      "flex items-center gap-3 font-sans text-sm font-medium",
                      isToday ? "text-[var(--color-blue)]" : "text-stone-700 dark:text-stone-300"
                    )}
                  >
                    {day.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                    {isToday && (
                      <span className="rounded-md bg-blue-50 px-3 py-1 text-xs dark:bg-blue-950">
                        Today
                      </span>
                    )}
                  </h2>
                  {meals.length > 0 && picker}
                </div>
                {!meals.length ? (
                  <div className="flex min-h-[76px] items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
                    <p className="font-sans text-sm text-stone-500">No recipes planned</p>
                    {picker}
                  </div>
                ) : (
                  meals.map((entry) => {
                    const recipe = recipesById.get(entry.recipe_id)!;
                    const domain = sourceDomain(recipe);
                    return (
                      <div
                        key={entry.id}
                        className="group -mx-3 flex min-h-16 items-center justify-between gap-3 rounded-[14px] px-3 py-3 hover:bg-stone-200/60 focus-within:bg-stone-200/60 dark:hover:bg-stone-700/35 dark:focus-within:bg-stone-700/35"
                      >
                        <button
                          type="button"
                          onClick={() => openRecipe(recipe)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue)]"
                        >
                          <RecipeSourceIcon domain={domain} kind={getSourceKind(recipe)} />
                          <span className="flex min-w-0 flex-col items-start sm:flex-row sm:items-baseline">
                            <span className="max-w-full truncate font-serif text-base font-semibold leading-snug text-stone-900 dark:text-stone-50">
                              {recipe.recipe.title}
                            </span>
                            <span className="max-w-full truncate text-xs text-stone-400 sm:ml-2 sm:shrink-0 sm:text-[13px]">
                              {domain || "Saved recipe"}
                            </span>
                          </span>
                        </button>
                        <div
                          className={cn(
                            "flex shrink-0 items-center focus-within:opacity-100",
                            !recipe.is_favorite && "sm:opacity-0 sm:group-hover:opacity-100"
                          )}
                        >
                          <HeartButton
                            isFavorite={recipe.is_favorite}
                            saving={favoriteId === recipe.id && !recipe.is_favorite}
                            unsaving={favoriteId === recipe.id && recipe.is_favorite}
                            onSave={() => void toggleFavorite(recipe)}
                            onUnsave={() => void toggleFavorite(recipe)}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-md text-stone-400 transition-none hover:bg-stone-300 focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] dark:hover:bg-stone-600"
                                aria-label={`Actions for ${recipe.recipe.title}`}
                              >
                                <MenuDots size={16} weight="Bold" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => openRecipe(recipe)}>
                                Open recipe
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!!removingId}
                                onSelect={() => void removeMeal(entry)}
                                className="text-red-600"
                              >
                                Remove from meal plan
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })
                )}
              </section>
            );
          })
        )}
      </div>
      {todayBelow && !error && !recipeError && (
        <button
          type="button"
          onClick={scrollToToday}
          className={cn(
            buttonClass,
            "absolute bottom-[calc(8rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-full shadow-sm md:bottom-10"
          )}
        >
          <ArrowDown size={16} />
          Scroll to today
        </button>
      )}
    </div>
  );
}

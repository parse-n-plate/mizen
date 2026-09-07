"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "@/components/Search";
import { CookbookList } from "@/components/CookbookList";
import { useRecipe } from "@/context/RecipeContext";
import type { SavedRecipe } from "@/lib/types";

function HomeCollection() {
  const searchParams = useSearchParams();
  const onlyFavorites = searchParams.get("view") === "favorites";
  const { error, isLoading } = useRecipe();
  const [recipes, setRecipes] = useState<SavedRecipe[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/recipes", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load recipes");
        const data: SavedRecipe[] = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid recipe list");
        setRecipes(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    const focusSearch = () => {
      if (window.location.hash !== "#search") return;
      const section = document.getElementById("search");
      section?.scrollIntoView({ block: "center" });
      section?.querySelector("input")?.focus();
    };
    focusSearch();
    window.addEventListener("hashchange", focusSearch);
    return () => window.removeEventListener("hashchange", focusSearch);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pt-8 pb-36 sm:pb-12">
      <section id="search" aria-label="Add a recipe" className="scroll-mt-6">
        <Search fullWidth />
        {isLoading && (
          <p role="status" className="mt-3 text-sm text-stone-500">
            Adding your recipe...
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-500">
            {error}
          </p>
        )}
      </section>
      <section aria-label="Saved recipes" className="flex flex-col gap-5">
        <nav
          aria-label="Recipe filters"
          className="flex w-full gap-6 border-b border-stone-200 dark:border-stone-800"
        >
          {[
            { label: "All recipes", href: "/", active: !onlyFavorites },
            { label: "Favorites", href: "/?view=favorites", active: onlyFavorites },
          ].map((filter) => (
            <Link
              key={filter.label}
              href={filter.href}
              scroll={false}
              aria-current={filter.active ? "page" : undefined}
              className={`-mb-px border-b-2 px-0 pb-3 pt-1 font-sans text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-blue)] ${filter.active ? "border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-100" : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-900 dark:text-stone-400 dark:hover:border-stone-600 dark:hover:text-stone-100"}`}
            >
              {filter.label}
            </Link>
          ))}
        </nav>
        {loadError ? (
          <div
            role="alert"
            className="rounded-xl border border-stone-200 p-6 dark:border-stone-700"
          >
            <p className="text-sm">We couldn’t load your recipes. Please try again.</p>
            <button
              type="button"
              className="mt-3 text-sm font-medium underline"
              onClick={() => {
                setLoadError(false);
                setAttempt((value) => value + 1);
              }}
            >
              Try again
            </button>
          </div>
        ) : recipes === null ? (
          <p role="status" className="py-8 text-sm text-stone-500">
            Loading your recipes...
          </p>
        ) : (
          <CookbookList initialRecipes={recipes} onlyFavorites={onlyFavorites} />
        )}
      </section>
    </div>
  );
}

export function HomeLibrary() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-6 text-sm text-stone-500">
          Loading your recipes...
        </p>
      }
    >
      <HomeCollection />
    </Suspense>
  );
}

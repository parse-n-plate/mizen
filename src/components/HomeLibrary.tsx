"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { Search } from "@/components/Search";
import { CookbookList } from "@/components/CookbookList";
import { MOBILE_NAV_CONTENT_BOTTOM_PAD } from "@/components/MobileBottomNav";
import { useRecipe } from "@/context/RecipeContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import type { SavedRecipe } from "@/lib/types";

function HomeCollection() {
  const searchParams = useSearchParams();
  const onlyFavorites = searchParams.get("view") === "favorites";
  const { error, isLoading } = useRecipe();
  const [recipes, setRecipes] = useState<SavedRecipe[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [mobileLayoutBox, setMobileLayoutBox] = useState<{ height: number; top: number } | null>(
    null
  );

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
    if (!isMobile) return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const syncLayoutBox = () => {
      setMobileLayoutBox({ height: viewport.height, top: viewport.offsetTop });
    };

    syncLayoutBox();
    viewport.addEventListener("resize", syncLayoutBox);
    viewport.addEventListener("scroll", syncLayoutBox);
    return () => {
      viewport.removeEventListener("resize", syncLayoutBox);
      viewport.removeEventListener("scroll", syncLayoutBox);
    };
  }, [isMobile]);

  useEffect(() => {
    const focusSearch = () => {
      if (window.location.hash !== "#search") return;
      const section = document.getElementById("search");
      const input = section?.querySelector("input");
      input?.focus({ preventScroll: true });
    };
    focusSearch();
    window.addEventListener("hashchange", focusSearch);
    return () => window.removeEventListener("hashchange", focusSearch);
  }, []);

  return (
    <div
      className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col px-6"
      style={
        isMobile && mobileLayoutBox
          ? {
              height: mobileLayoutBox.height,
              maxHeight: mobileLayoutBox.height,
              marginTop: mobileLayoutBox.top,
            }
          : undefined
      }
    >
      <section
        id="search"
        aria-label="Add a recipe"
        className="shrink-0 scroll-mt-6 bg-[#FAFAF9] pb-8 pt-8 dark:bg-stone-950"
      >
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
      <section
        aria-label="Saved recipes"
        className={cn(
          "-mx-3 flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3",
          MOBILE_NAV_CONTENT_BOTTOM_PAD,
          "sm:pb-12"
        )}
      >
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
          <EmptyState
            variant="loadError"
            alert
            onAction={() => {
              setLoadError(false);
              setAttempt((value) => value + 1);
            }}
          />
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

"use client";

import { Search } from "@/components/Search";
import { RecentRecipes } from "@/components/RecentRecipes";
import { GettingStarted } from "@/components/GettingStarted";
import { useRecipe } from "@/context/RecipeContext";
import { useUser } from "@/hooks/useUser";

export default function HomePage() {
  const { error, isLoading } = useRecipe();
  const { user, loading: authLoading } = useUser();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-6">
        <div className="page-fade-in-up w-full max-w-2xl space-y-8 text-center">
          <h1 className="font-serif text-[clamp(40px,8vw,72px)] font-bold leading-[1.1] text-stone-900 dark:text-stone-100">
            Clean recipes,
            <br />
            calm cooking.
          </h1>
          <p className="page-fade-in-up page-fade-delay-1 mx-auto max-w-md font-sans text-lg text-stone-500 dark:text-stone-400">
            Paste a recipe URL. We strip the clutter and give you a clean,
            focused cooking experience.
          </p>
        </div>

        <div className="page-fade-in-up page-fade-delay-2 mt-10 w-full flex justify-center">
          <Search />
        </div>

        {isLoading && (
          <p className="mt-6 font-sans text-sm text-stone-400 dark:text-stone-500 animate-pulse">
            Parsing recipe...
          </p>
        )}

        {error && (
          <p className="mt-6 max-w-md text-center font-sans text-sm text-red-500">
            {error}
          </p>
        )}

        <div className="mt-12 w-full flex justify-center">
          {!authLoading && (user ? <RecentRecipes /> : <GettingStarted />)}
        </div>
      </main>
    </div>
  );
}

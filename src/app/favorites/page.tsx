import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { redirect, unstable_rethrow } from "next/navigation";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { FavoritesEmptyState } from "@/components/FavoritesEmptyState";
import { CookbookList } from "@/components/CookbookList";
import type { SavedRecipe } from "@/lib/types";

export default async function FavoritesPage() {
  if (!isSupabaseConfigured) redirect("/");

  let recipes: SavedRecipe[] = [];
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Supabase unavailable");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/");

    const { data, error } = await supabase
      .from("recipes")
      .select("id, slug, recipe, source_url, created_at, updated_at, is_favorite")
      .eq("user_id", user.id)
      .eq("is_favorite", true)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    recipes = (data as SavedRecipe[]) || [];
  } catch (error) {
    unstable_rethrow(error);
    logger.error({ err: error }, "Failed to load favorites");
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6" role="alert">
        <h1 className="font-serif text-3xl leading-10 font-normal">Favorites</h1>
        <FavoritesEmptyState unavailable />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="px-6 pt-6 pb-0">
        <div className="max-w-3xl mx-auto w-full pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl font-normal sm:text-4xl">Favorites</h1>
              <p className="mt-2 font-sans text-sm text-stone-500">
                {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} favorited
              </p>
            </div>
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-stone-300 sm:inline-flex"
            >
              <span className="text-base leading-none">+</span>
              Add Recipe
            </Link>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col px-6">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          <div
            className={
              recipes.length === 0
                ? "flex-1"
                : "flex-1 rounded-3xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
            }
          >
            <div className={recipes.length === 0 ? "pb-24 sm:pb-6" : "p-6"}>
              <CookbookList initialRecipes={recipes} onlyFavorites />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

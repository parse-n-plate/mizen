import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { redirect } from "next/navigation";
import { CookbookGrid } from "@/components/CookbookGrid";
import type { SavedRecipe } from "@/lib/types";

export default async function CookbookPage() {
  if (!isSupabaseConfigured) {
    redirect("/");
  }

  let recipes: SavedRecipe[] = [];
  try {
    const supabase = await createClient();
    if (!supabase) {
      throw new Error("Supabase unavailable");
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/");
    }

    const { data, error } = await supabase
      .from("recipes")
      .select("id, slug, recipe, source_url, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      throw error;
    }
    recipes = (data as SavedRecipe[]) || [];
  } catch {
    redirect("/");
  }

  const count = recipes.length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-cream">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="page-fade-in-up mb-8">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">
            Cookbook
          </h1>
          <p className="mt-2 font-sans text-sm text-stone-400 dark:text-stone-500">
            {count} {count === 1 ? "recipe" : "recipes"} saved
          </p>
        </div>

        <div className="page-fade-in-up page-fade-delay-1">
          <CookbookGrid initialRecipes={recipes} />
        </div>
      </div>
    </div>
  );
}

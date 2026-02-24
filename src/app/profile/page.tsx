import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { redirect } from "next/navigation";
import { RecipeList } from "@/components/RecipeList";
import type { SavedRecipe } from "@/lib/types";

export default async function ProfilePage() {
  if (!isSupabaseConfigured) {
    redirect("/");
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase!.auth.getUser();

    if (!user) {
      redirect("/");
    }

    const { data: recipes } = await supabase!
      .from("recipes")
      .select("id, slug, recipe, source_url, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
    const email = user.email || "";
    const avatarUrl = user.user_metadata?.avatar_url;

    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-white dark:bg-stone-950">
        <div className="mx-auto max-w-lg px-6 py-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="h-16 w-16 rounded-full"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 font-serif text-2xl font-bold text-stone-600 dark:text-stone-300">
                  {name[0]}
                </div>
              )}
              <div>
                <h1 className="font-serif text-2xl font-bold">{name}</h1>
                <p className="font-sans text-sm text-stone-500 dark:text-stone-400">{email}</p>
              </div>
            </div>

            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="font-sans text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>

          <div className="mt-10">
            <h2 className="font-serif text-lg font-semibold">Saved Recipes</h2>
            <RecipeList initialRecipes={(recipes as SavedRecipe[]) || []} />
          </div>
        </div>
      </div>
    );
  } catch {
    redirect("/");
  }
}

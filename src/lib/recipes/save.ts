import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedRecipe, SavedRecipe } from "@/lib/types";

export function slugifyRecipeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function upsertRecipeForUser(
  supabase: SupabaseClient,
  userId: string,
  recipe: ParsedRecipe
): Promise<SavedRecipe> {
  const sourceUrl = recipe.sourceUrl || null;

  if (sourceUrl) {
    const { data: existing, error: lookupError } = await supabase
      .from("recipes")
      .select("id, slug")
      .eq("user_id", userId)
      .eq("source_url", sourceUrl)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing) {
      const { data, error } = await supabase
        .from("recipes")
        .update({ recipe, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .eq("user_id", userId)
        .select("id, slug, recipe, source_url, created_at, updated_at")
        .single();

      if (error) throw error;
      return data as SavedRecipe;
    }
  }

  const titleSlug = slugifyRecipeTitle(recipe.title) || "recipe";
  const slug = `${titleSlug}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await supabase
    .from("recipes")
    .insert({ user_id: userId, slug, recipe, source_url: sourceUrl })
    .select("id, slug, recipe, source_url, created_at, updated_at")
    .single();

  if (error) throw error;
  return data as SavedRecipe;
}

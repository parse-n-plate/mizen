import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { notFound } from "next/navigation";
import { RecipeHeader } from "@/components/RecipeHeader";
import { RecipeTabs } from "@/components/RecipeTabs";
import type { ParsedRecipe } from "@/lib/types";

export default async function SharedRecipePage({ params }: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured) {
    notFound();
  }

  let recipe: ParsedRecipe | null = null;
  try {
    const { slug } = await params;
    const supabase = await createClient();
    if (!supabase) {
      throw new Error("Supabase unavailable");
    }

    const { data, error } = await supabase
      .from("recipes")
      .select("recipe")
      .eq("slug", slug)
      .single();

    if (error || !data) notFound();
    recipe = data.recipe as ParsedRecipe;
  } catch {
    notFound();
  }

  if (!recipe) {
    notFound();
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#FAFAF9] dark:bg-stone-950">
      {/* Header section with cream background */}
      <div className="px-6 pt-6 pb-0">
        <div className="max-w-3xl mx-auto w-full pb-8">
          <RecipeHeader recipe={recipe} />
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex-1 flex flex-col px-6">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          <RecipeTabs recipe={recipe} />
        </div>
      </div>
    </div>
  );
}

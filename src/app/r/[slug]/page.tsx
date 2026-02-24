import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { notFound } from "next/navigation";
import { RecipeHeader, formatTime } from "@/components/RecipeHeader";
import { PrepSection } from "@/components/PrepSection";
import { StepList } from "@/components/StepList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ParsedRecipe } from "@/lib/types";

export default async function SharedRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isSupabaseConfigured) {
    notFound();
  }

  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase!
      .from("recipes")
      .select("recipe")
      .eq("slug", slug)
      .single();

    if (error || !data) notFound();

    const recipe = data.recipe as ParsedRecipe;

    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#FAFAF9] dark:bg-stone-950 flex flex-col">
        {/* Header section with cream background */}
        <div className="px-6 pt-6 pb-0">
          <div className="max-w-3xl mx-auto w-full pb-8">
            <RecipeHeader recipe={recipe} />
          </div>
        </div>

        {/* Tabs navigation */}
        <div className="flex-1 flex flex-col px-6">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
            <Tabs defaultValue="prep" className="flex-1 flex flex-col">
              <TabsList className="flex items-end w-full relative rounded-none border-b border-stone-200 dark:border-stone-700 bg-transparent p-0 gap-0">
                <TabsTrigger
                  value="prep"
                  className="folder-tab-trigger h-11 px-5 sm:px-8 font-sans text-sm font-medium"
                >
                  Prep
                  {recipe.prepTimeMinutes ? (
                    <>
                      <span className="text-stone-300 dark:text-stone-600" aria-hidden>·</span>
                      <span className="font-normal text-stone-400 dark:text-stone-500">{formatTime(recipe.prepTimeMinutes)}</span>
                    </>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger
                  value="cook"
                  className="folder-tab-trigger h-11 px-5 sm:px-8 font-sans text-sm font-medium"
                >
                  Cook
                  {recipe.cookTimeMinutes ? (
                    <>
                      <span className="text-stone-300 dark:text-stone-600" aria-hidden>·</span>
                      <span className="font-normal text-stone-400 dark:text-stone-500">{formatTime(recipe.cookTimeMinutes)}</span>
                    </>
                  ) : null}
                </TabsTrigger>
              </TabsList>

              {/* Tab content */}
              <div className="bg-white dark:bg-stone-900 rounded-b-lg border border-t-0 border-stone-200 dark:border-stone-700 flex-1">
                <div className="max-w-3xl mx-auto px-6 pt-6 pb-12">
                  <TabsContent value="prep" className="space-y-0">
                    <PrepSection ingredients={recipe.ingredients} steps={recipe.instructions} />
                  </TabsContent>
                  <TabsContent value="cook" className="space-y-0">
                    <StepList steps={recipe.instructions} />
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { notFound } from "next/navigation";
import { RecipeHeader } from "@/components/RecipeHeader";
import { formatTime } from "@/lib/format-time";
import { PrepSection } from "@/components/PrepSection";
import { StepList } from "@/components/StepList";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ParsedRecipe } from "@/lib/types";

export default async function SharedRecipePage({ params }: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured) {
    notFound();
  }

  const { slug } = await params;
  let recipe: ParsedRecipe | null = null;
  try {
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
    <div className="min-h-[calc(100vh-3.5rem)] bg-white dark:bg-stone-950 flex flex-col">
      {/* Header section */}
      <div className="px-6 pt-6 pb-0">
        <div className="max-w-3xl mx-auto w-full pb-8">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <RecipeHeader recipe={recipe} />
            </div>
            <ShareLinkButton slug={slug} title={recipe.title} summary={recipe.summary} />
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex-1 flex flex-col px-6">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          <Tabs defaultValue="prep" className="flex-1 flex flex-col">
            <TabsList className="flex items-end w-full relative rounded-none border-b border-stone-200 dark:border-stone-700 bg-transparent p-0 gap-0">
              <TabsTrigger
                value="prep"
                className="folder-tab-trigger h-11 px-5 sm:px-8 font-sans text-[14px] font-medium"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/icon-prep.png"
                  alt=""
                  width={24}
                  height={24}
                  className="tab-icon-prep h-6 w-6"
                />
                Prep
                {recipe.prepTimeMinutes ? (
                  <>
                    <span className="text-stone-300 dark:text-stone-600" aria-hidden>
                      ·
                    </span>
                    <span className="font-normal text-stone-400 dark:text-stone-500">
                      {formatTime(recipe.prepTimeMinutes)}
                    </span>
                  </>
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="cook"
                className="folder-tab-trigger h-11 px-5 sm:px-8 font-sans text-[14px] font-medium"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/icon-cook.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="tab-icon-cook h-6 w-6"
                />
                Cook
                {recipe.cookTimeMinutes ? (
                  <>
                    <span className="text-stone-300 dark:text-stone-600" aria-hidden>
                      ·
                    </span>
                    <span className="font-normal text-stone-400 dark:text-stone-500">
                      {formatTime(recipe.cookTimeMinutes)}
                    </span>
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
}

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { RecipeHeader } from "@/components/RecipeHeader";
import { IngredientList } from "@/components/IngredientList";
import { StepList } from "@/components/StepList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ParsedRecipe } from "@/lib/types";

export default async function SharedRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recipes")
    .select("recipe")
    .eq("slug", slug)
    .single();

  if (error || !data) notFound();

  const recipe = data.recipe as ParsedRecipe;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#FAFAF9] flex flex-col">
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
            <TabsList className="flex items-end w-full relative rounded-none border-b border-stone-200 bg-transparent p-0 gap-0">
              <TabsTrigger
                value="prep"
                className="folder-tab-trigger h-11 px-8 font-sans text-sm font-medium"
              >
                Prep
              </TabsTrigger>
              <TabsTrigger
                value="cook"
                className="folder-tab-trigger h-11 px-8 font-sans text-sm font-medium"
              >
                Cook
              </TabsTrigger>
            </TabsList>

            {/* Tab content */}
            <div className="bg-white rounded-b-lg border border-t-0 border-stone-200 flex-1">
              <div className="max-w-3xl mx-auto px-6 pt-6 pb-12">
                <TabsContent value="prep" className="space-y-0">
                  <IngredientList groups={recipe.ingredients} />
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

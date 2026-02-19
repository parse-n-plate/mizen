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
    <div className="min-h-[calc(100vh-3.5rem)] bg-white">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <RecipeHeader recipe={recipe} />

        <div className="mt-8">
          <Tabs defaultValue="prep">
            <TabsList className="w-full justify-start gap-0 rounded-none border-b border-stone-200 bg-transparent p-0">
              <TabsTrigger
                value="prep"
                className="folder-tab-trigger h-11 px-5 font-sans text-sm font-medium"
              >
                Prep
              </TabsTrigger>
              <TabsTrigger
                value="cook"
                className="folder-tab-trigger h-11 px-5 font-sans text-sm font-medium"
              >
                Cook
              </TabsTrigger>
            </TabsList>
            <TabsContent value="prep" className="pt-6">
              <IngredientList groups={recipe.ingredients} />
            </TabsContent>
            <TabsContent value="cook" className="pt-6">
              <StepList steps={recipe.instructions} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

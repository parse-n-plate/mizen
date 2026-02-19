"use client";

import { useRecipe } from "@/context/RecipeContext";
import { useUser } from "@/hooks/useUser";
import { RecipeHeader } from "@/components/RecipeHeader";
import { IngredientList } from "@/components/IngredientList";
import { StepList } from "@/components/StepList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function RecipePage() {
  const { recipe } = useRecipe();
  const { user } = useUser();

  if (!recipe) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 px-6">
        <p className="font-sans text-stone-500">No recipe loaded.</p>
        <Link
          href="/"
          className="font-sans text-sm text-[var(--color-blue)] hover:underline"
        >
          Go back and paste a URL
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <RecipeHeader recipe={recipe} />

        {!user && (
          <div className="mt-4 rounded-xl border border-stone-100 bg-stone-50 px-4 py-3">
            <p className="font-sans text-sm text-stone-500">
              <Link href="/" className="text-[var(--color-blue)] hover:underline">
                Sign in
              </Link>{" "}
              to save this recipe and access it anywhere.
            </p>
          </div>
        )}

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

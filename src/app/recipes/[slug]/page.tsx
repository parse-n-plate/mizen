import { notFound } from "next/navigation";
import Link from "next/link";
import { DemoRecipeView } from "@/components/DemoRecipeView";
import { RecipeHeader } from "@/components/RecipeHeader";
import { getDemoRecipe, getDemoRecipeSlugs } from "@/lib/demo-recipes";

interface DemoRecipePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getDemoRecipeSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: DemoRecipePageProps) {
  const { slug } = await params;
  const recipe = getDemoRecipe(slug);

  if (!recipe) {
    return {
      title: "Recipe | Mizen",
    };
  }

  return {
    title: `${recipe.title} | Mizen`,
    description: recipe.summary ?? "A cleaned-up Mizen recipe example.",
  };
}

export default async function DemoRecipePage({ params }: DemoRecipePageProps) {
  const { slug } = await params;
  const recipe = getDemoRecipe(slug);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#FAFAF9] pb-[calc(7.25rem+env(safe-area-inset-bottom)+1rem)] dark:bg-stone-950 md:pb-0">
      <div className="px-6 pb-0 pt-6">
        <div className="mx-auto w-full max-w-3xl pb-8">
          <div className="-ml-1 mb-3.5 flex min-w-0 items-center gap-2 md:hidden">
            <Link
              href="/links"
              aria-label="Back to links"
              className="inline-flex shrink-0 items-center text-[var(--color-text-muted)] active:text-[var(--color-text-body)]"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <div className="ml-auto flex items-center gap-1">
              <div
                id="mobile-recipe-search-action"
                className="flex h-9 w-9 items-center justify-center"
              />
            </div>
          </div>
          <RecipeHeader recipe={recipe} />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-16">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
          <DemoRecipeView recipe={recipe} />
        </div>
      </div>
    </div>
  );
}

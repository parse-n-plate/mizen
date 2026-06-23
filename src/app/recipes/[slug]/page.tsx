import { notFound } from "next/navigation";
import Link from "next/link";
import { DemoRecipeView } from "@/components/DemoRecipeView";
import { RecipeHeader } from "@/components/RecipeHeader";
import { getFavoriteRecipe } from "@/lib/favorite-recipes";
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
  const favoriteRecipe = getFavoriteRecipe(slug);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] min-w-0 flex-col overflow-x-hidden bg-[#FAFAF9] pb-[calc(7.25rem+env(safe-area-inset-bottom)+1rem)] dark:bg-stone-950 md:pb-0">
      <div className="min-w-0 px-4 pb-0 pt-6 sm:px-6">
        <div className="mx-auto w-full max-w-3xl min-w-0 pb-8">
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
          </div>
          <RecipeHeader recipe={recipe} />
          {favoriteRecipe && (
            <div className="mt-5 rounded-lg border border-[#F4D6A3] bg-[#FFF7E8] px-4 py-3 font-sans text-sm leading-6 text-stone-700 dark:border-amber-700/40 dark:bg-amber-950/25 dark:text-stone-200">
              <span className="font-medium text-stone-900 dark:text-stone-100">
                This recipe was from and posted by
              </span>{" "}
              <Link
                href={favoriteRecipe.authorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--color-blue)] underline decoration-[var(--color-blue)]/30 underline-offset-4 hover:decoration-[var(--color-blue)]"
              >
                {favoriteRecipe.authorName}
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-4 pb-16 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-1 flex-col">
          <DemoRecipeView recipe={recipe} />
        </div>
      </div>
    </div>
  );
}

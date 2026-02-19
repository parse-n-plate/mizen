import type { ParsedRecipe } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface RecipeHeaderProps {
  recipe: ParsedRecipe;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function RecipeHeader({ recipe }: RecipeHeaderProps) {
  const timeItems = [
    recipe.prepTimeMinutes && { label: "Prep", value: formatTime(recipe.prepTimeMinutes) },
    recipe.cookTimeMinutes && { label: "Cook", value: formatTime(recipe.cookTimeMinutes) },
    recipe.totalTimeMinutes && { label: "Total", value: formatTime(recipe.totalTimeMinutes) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-bold leading-tight md:text-4xl">
        {recipe.title}
      </h1>

      {recipe.author && (
        <p className="text-sm text-stone-500">by {recipe.author}</p>
      )}

      {recipe.summary && (
        <p className="text-base italic text-stone-600">{recipe.summary}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {timeItems.map((item) => (
          <Badge
            key={item.label}
            variant="secondary"
            className="gap-1.5 rounded-full px-3 py-1 font-sans text-sm font-normal"
          >
            <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {item.label}: {item.value}
          </Badge>
        ))}
        {recipe.servings && (
          <Badge
            variant="secondary"
            className="gap-1.5 rounded-full px-3 py-1 font-sans text-sm font-normal"
          >
            <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Serves {recipe.servings}
          </Badge>
        )}
      </div>

      {recipe.sourceUrl && (
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-stone-400 hover:text-stone-600 hover:underline"
        >
          {new URL(recipe.sourceUrl).hostname.replace("www.", "")}
        </a>
      )}
    </div>
  );
}

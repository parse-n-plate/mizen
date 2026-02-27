import type { ParsedRecipe } from "@/lib/types";

interface RecipeHeaderProps {
  recipe: ParsedRecipe;
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function Dot() {
  return <span className="text-stone-300 dark:text-stone-600" aria-hidden>·</span>;
}

export function RecipeHeader({ recipe }: RecipeHeaderProps) {
  const showPrepAndCook = !!recipe.prepTimeMinutes || !!recipe.cookTimeMinutes;

  const meta: { label: string; value: string }[] = [];
  if (recipe.totalTimeMinutes && recipe.totalTimeMinutes > 0 && !showPrepAndCook)
    meta.push({ label: "Total", value: formatTime(recipe.totalTimeMinutes) });
  if (recipe.servings && recipe.servings > 0)
    meta.push({ label: "Serves", value: String(recipe.servings) });

  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="font-serif text-2xl font-bold leading-tight md:text-3xl tracking-tight">
        {recipe.title}
      </h1>

      {recipe.summary && (
        <p className="font-sans text-base text-stone-500 dark:text-stone-400 max-w-2xl leading-relaxed">
          {recipe.summary}
        </p>
      )}

      {/* Inline metadata row: author · source · servings (prep/cook times shown on tabs) */}
      <div className="flex items-center gap-1.5 flex-wrap font-sans text-sm text-stone-500 dark:text-stone-400">
        {recipe.author && (
          <>
            <span>{recipe.author}</span>
            {(recipe.sourceUrl || meta.length > 0) && <Dot />}
          </>
        )}

        {recipe.sourceUrl && (
          <>
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors hover:underline underline-offset-4 decoration-stone-300 dark:decoration-stone-600"
            >
              {new URL(recipe.sourceUrl).hostname.replace("www.", "")}
            </a>
            {meta.length > 0 && <Dot />}
          </>
        )}

        {meta.map((m, i) => (
          <span key={m.label} className="flex items-center gap-1.5">
            <span>
              <span className="text-stone-400 dark:text-stone-500">{m.label}</span>{" "}
              <span className="font-medium text-stone-600 dark:text-stone-300">{m.value}</span>
            </span>
            {i < meta.length - 1 && <Dot />}
          </span>
        ))}
      </div>
    </div>
  );
}

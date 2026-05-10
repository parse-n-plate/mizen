"use client";

import AltArrowDown from "@solar-icons/react/csr/arrows/AltArrowDown";
import { useRecipe } from "@/context/RecipeContext";
import type { ParsedRecipe } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RecipeSwitcherProps {
  title: string;
  variant: "compact" | "h1";
}

const H1_CLASSES =
  "font-serif text-3xl font-bold leading-tight md:text-4xl tracking-tight text-pretty";

export function RecipeSwitcher({ title, variant }: RecipeSwitcherProps) {
  const { history, setRecipe } = useRecipe();

  const otherEntries = history.filter((h) => h.recipe.title !== title);
  const hasOthers = otherEntries.length > 0;

  if (variant === "h1") {
    if (!hasOthers) {
      return <h1 className={H1_CLASSES}>{title}</h1>;
    }
    // The mobile h1 stays a plain heading; the dropdown trigger appears only
    // at md+, since the compact variant in the back-button row handles mobile.
    return (
      <>
        <h1 className={`md:hidden ${H1_CLASSES}`}>{title}</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Switch recipe"
              className="group/switcher hidden md:flex items-baseline gap-2 text-left -mx-1 px-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors cursor-pointer"
            >
              <h1 className={H1_CLASSES}>{title}</h1>
              <AltArrowDown className="shrink-0 size-5 md:size-6 text-stone-400 dark:text-stone-500 transition-transform duration-200 group-data-[state=open]/switcher:rotate-180" />
            </button>
          </DropdownMenuTrigger>
          <SwitcherContent entries={otherEntries} onSelect={setRecipe} />
        </DropdownMenu>
      </>
    );
  }

  if (!hasOthers) {
    return (
      <span className="truncate font-sans text-sm text-[var(--color-text-muted)]">{title}</span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Switch recipe"
          className="group/switcher inline-flex items-center gap-1 min-w-0 text-sm text-[var(--color-text-muted)] active:text-[var(--color-text-body)]"
        >
          <span className="truncate">{title}</span>
          <AltArrowDown className="shrink-0 size-3.5 transition-transform duration-200 group-data-[state=open]/switcher:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <SwitcherContent entries={otherEntries} onSelect={setRecipe} />
    </DropdownMenu>
  );
}

function SwitcherContent({
  entries,
  onSelect,
}: {
  entries: { parsedAt: string; recipe: ParsedRecipe }[];
  onSelect: (recipe: ParsedRecipe) => void;
}) {
  return (
    <DropdownMenuContent
      align="start"
      sideOffset={8}
      className="min-w-64 max-w-[calc(100vw-2rem)] p-1"
    >
      <DropdownMenuLabel className="font-sans text-xs uppercase tracking-wider text-stone-400 dark:text-stone-500 font-medium">
        Recent recipes
      </DropdownMenuLabel>
      {entries.map((entry) => (
        <DropdownMenuItem
          key={entry.parsedAt}
          onSelect={() => onSelect(entry.recipe)}
          className="font-sans"
        >
          <span className="truncate">{entry.recipe.title}</span>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  );
}

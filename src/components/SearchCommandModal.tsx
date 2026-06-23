"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Link as LinkIcon, Upload, X } from "lucide-react";
import UndoLeftRound from "@solar-icons/react/csr/arrows-action/UndoLeftRound";
import BookMinimalistic from "@solar-icons/react/csr/school/BookMinimalistic";
import ClockCircle from "@solar-icons/react/csr/time/ClockCircle";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecipe, type HistoryEntry } from "@/context/RecipeContext";
import type { ParsedRecipe, SavedRecipe } from "@/lib/types";

interface SearchCommandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchCommandViewProps {
  active?: boolean;
  onClose?: () => void;
  closeOnNavigate?: boolean;
  showMobileHeader?: boolean;
  showMobileTitle?: boolean;
  showMobileCloseButton?: boolean;
  showDesktopFooter?: boolean;
}

type RecipeResult = {
  key: string;
  recipe: ParsedRecipe;
  savedMeta?: { id: string; slug: string } | null;
  sourceUrl?: string | null;
  date?: string;
};

function looksLikeUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatTime(minutes?: number): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function recipeTime(recipe: ParsedRecipe): string {
  return (
    formatTime(recipe.totalTimeMinutes) ||
    formatTime((recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)) ||
    formatTime(recipe.prepTimeMinutes) ||
    formatTime(recipe.cookTimeMinutes)
  );
}

function sourceLabel(item: RecipeResult): string {
  const url = item.sourceUrl || item.recipe.sourceUrl;
  if (!url) return item.date || "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return item.date || "";
  }
}

function recipeSearchText(item: RecipeResult): string {
  const sourceUrl = item.sourceUrl || item.recipe.sourceUrl || "";
  const sourceHostname = sourceLabel(item);

  return [
    item.recipe.title,
    item.recipe.author,
    item.recipe.summary,
    item.recipe.sourceSiteDescription,
    sourceUrl,
    sourceHostname,
    item.date,
    recipeTime(item.recipe),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function toHistoryResult(entry: HistoryEntry): RecipeResult {
  return {
    key: `history:${entry.parsedAt}:${entry.recipe.title}`,
    recipe: entry.recipe,
    savedMeta: entry.savedMeta,
    sourceUrl: entry.recipe.sourceUrl,
    date: new Date(entry.parsedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  };
}

function toSavedResult(item: SavedRecipe): RecipeResult {
  return {
    key: `saved:${item.id}`,
    recipe: item.recipe,
    savedMeta: { id: item.id, slug: item.slug },
    sourceUrl: item.source_url,
    date: new Date(item.updated_at || item.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  };
}

export function SearchCommandView({
  active = true,
  onClose,
  closeOnNavigate = true,
  showMobileHeader = false,
  showMobileTitle = true,
  showMobileCloseButton = true,
  showDesktopFooter = false,
}: SearchCommandViewProps) {
  const router = useRouter();
  const { history, setRecipe, setSavedMeta } = useRecipe();
  const [search, setSearch] = useState("");
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    fetch("/api/recipes", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setSavedRecipes(data as SavedRecipe[]);
      })
      .catch(() => {
        if (!cancelled) setSavedRecipes([]);
      });

    return () => {
      cancelled = true;
    };
  }, [active]);

  const isUrlInput = search.trim().length > 0 && looksLikeUrl(search);

  const recipes = useMemo(() => {
    const merged: RecipeResult[] = [];
    const seen = new Set<string>();

    for (const item of [...history.map(toHistoryResult), ...savedRecipes.map(toSavedResult)]) {
      const key = `${item.recipe.title.toLowerCase()}|${item.sourceUrl || item.recipe.sourceUrl || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }

    return merged;
  }, [history, savedRecipes]);

  const displayedRecipes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return recipes.slice(0, 4);

    return recipes.filter((item) => recipeSearchText(item).includes(query));
  }, [recipes, search]);

  const handleClose = useCallback(() => {
    setSearch("");
    onClose?.();
  }, [onClose]);

  const closeAndGo = useCallback(
    (href: string) => {
      setSearch("");
      if (closeOnNavigate) onClose?.();
      router.push(href);
    },
    [closeOnNavigate, onClose, router]
  );

  const openRecipe = useCallback(
    (item: RecipeResult) => {
      setRecipe(item.recipe);
      setSavedMeta(item.savedMeta ?? null);
      closeAndGo("/recipe");
    },
    [closeAndGo, setRecipe, setSavedMeta]
  );

  return (
    <>
      {showMobileHeader && (
        <div className="flex items-center justify-between px-3 pt-3 md:hidden">
          {showMobileTitle && (
            <span className="font-sans text-sm font-medium text-muted-foreground">Search</span>
          )}
          {showMobileCloseButton && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label="Close search"
            >
              <X size={18} aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
      <CommandInput
        placeholder="Search or paste a URL"
        value={search}
        onValueChange={setSearch}
        suffix={
          search ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setSearch("")}
              className="shrink-0 text-muted-foreground"
              aria-label="Clear search"
            >
              <X size={16} aria-hidden="true" />
            </Button>
          ) : null
        }
      />
      <CommandList className="max-md:max-h-none max-md:flex-1">
        <CommandEmpty>No results found.</CommandEmpty>

        {isUrlInput ? (
          <CommandGroup heading="Add Recipe">
            <CommandItem
              value={`parse recipe url ${search}`}
              onSelect={() => closeAndGo(`/?url=${encodeURIComponent(search.trim())}`)}
            >
              <LinkIcon className="size-5 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">Parse recipe from URL</p>
                <p className="truncate text-xs text-muted-foreground">{search.trim()}</p>
              </div>
            </CommandItem>
          </CommandGroup>
        ) : !search ? (
          <CommandGroup heading="Add Recipe">
            <CommandItem value="add recipe via url paste link" onSelect={() => closeAndGo("/")}>
              <LinkIcon className="size-5 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Add via URL</p>
                <p className="text-xs text-muted-foreground">Paste a recipe link</p>
              </div>
            </CommandItem>
            <CommandItem
              value="add recipe via image upload photo"
              onSelect={() => closeAndGo("/?action=upload-image")}
            >
              <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Add via Image</p>
                <p className="text-xs text-muted-foreground">Upload a recipe photo</p>
              </div>
            </CommandItem>
          </CommandGroup>
        ) : null}

        {!search && (
          <CommandGroup heading="Navigation">
            <CommandItem
              value="cookbook saved recipes bookmarks"
              onSelect={() => closeAndGo("/cookbook")}
            >
              <BookMinimalistic size={20} className="text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Cookbook</p>
                <p className="text-xs text-muted-foreground">Saved recipes</p>
              </div>
            </CommandItem>
            <CommandItem value="timers cooking timer" disabled>
              <ClockCircle size={20} className="text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Timers</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
              <Badge variant="outline" className="text-muted-foreground">
                Soon
              </Badge>
            </CommandItem>
          </CommandGroup>
        )}

        {displayedRecipes.length > 0 && (
          <CommandGroup heading={search ? "Recipes" : "Recent"}>
            {displayedRecipes.map((item) => {
              const time = recipeTime(item.recipe);
              const meta = [sourceLabel(item), time].filter(Boolean).join(" · ");

              return (
                <CommandItem
                  key={item.key}
                  value={`${item.recipe.title} ${item.recipe.author || ""} ${meta}`}
                  onSelect={() => openRecipe(item)}
                  className="group"
                >
                  <BookOpen className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.recipe.title}</p>
                    {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
                  </div>
                  <div className="hidden shrink-0 items-center gap-1 text-muted-foreground group-data-[selected=true]:flex">
                    <UndoLeftRound size={17} aria-hidden="true" />
                    <span className="text-xs">Open</span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {!search && recipes.length === 0 && (
          <div className="px-4 py-8 text-center font-sans text-sm text-muted-foreground">
            No recent recipes yet.
          </div>
        )}
      </CommandList>
      {showDesktopFooter && (
        <div className="hidden items-center justify-end gap-1 border-t border-border px-4 py-2 md:flex">
          <kbd className="rounded border border-border bg-muted px-2 py-1 font-sans text-xs text-muted-foreground">
            Esc
          </kbd>
          <span className="font-sans text-xs text-muted-foreground">to close</span>
        </div>
      )}
    </>
  );
}

export function SearchCommandModal({ open, onOpenChange }: SearchCommandModalProps) {
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Search recipes"
      description="Find recipes, add recipes, and navigate Mizen"
      showCloseButton={false}
      overlayClassName="bg-transparent"
      className="max-w-[720px] gap-0 rounded-xl border-border bg-popover text-popover-foreground shadow-2xl sm:max-w-[720px]"
    >
      <SearchCommandView
        active={open}
        onClose={() => onOpenChange(false)}
        showMobileHeader
        showDesktopFooter
      />
    </CommandDialog>
  );
}

export function SearchCommandFullScreen({ onClose }: { onClose: () => void }) {
  return (
    <Command className="min-h-dvh rounded-none bg-popover text-popover-foreground">
      <SearchCommandView
        onClose={onClose}
        closeOnNavigate={false}
        showMobileHeader={false}
        showMobileTitle={false}
        showMobileCloseButton={false}
      />
    </Command>
  );
}

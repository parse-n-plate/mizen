"use client";

import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  buildUpdatedRecipe,
  recipeToMarkdown,
  validateRecipeTitle,
  RecipeMarkdownError,
} from "@/lib/recipe-markdown";
import type { ParsedRecipe } from "@/lib/types";

interface EditRecipeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: ParsedRecipe;
  onSave: (updated: ParsedRecipe) => Promise<{ ok: boolean; error?: string }>;
}

export function EditRecipeDrawer({ open, onOpenChange, recipe, onSave }: EditRecipeDrawerProps) {
  const isMobile = useIsMobile();
  const [title, setTitle] = useState(recipe.title);
  const [markdown, setMarkdown] = useState(() => recipeToMarkdown(recipe));
  const [titleError, setTitleError] = useState<string | null>(null);
  const [markdownError, setMarkdownError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-seed the form from the current recipe each time the drawer opens.
  useEffect(() => {
    if (!open) return;
    setTitle(recipe.title);
    setMarkdown(recipeToMarkdown(recipe));
    setTitleError(null);
    setMarkdownError(null);
    setSaveError(null);
    setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-seed on open transition
  }, [open]);

  async function handleSave() {
    if (saving) return;

    const trimmedTitle = title.trim();
    const titleValidationError = validateRecipeTitle(trimmedTitle);
    if (titleValidationError) {
      setTitleError(titleValidationError);
      return;
    }
    setTitleError(null);

    let updated: ParsedRecipe;
    try {
      updated = buildUpdatedRecipe(recipe, trimmedTitle, markdown);
    } catch (err) {
      if (err instanceof RecipeMarkdownError) {
        setMarkdownError(err.message);
        return;
      }
      throw err;
    }
    setMarkdownError(null);

    setSaving(true);
    setSaveError(null);
    const result = await onSave(updated);
    setSaving(false);

    if (result.ok) {
      onOpenChange(false);
    } else {
      setSaveError(result.error || "Failed to save changes. Please try again.");
    }
  }

  function handleCancel() {
    onOpenChange(false);
  }

  const body = (
    <div className="flex flex-col gap-4 px-4 pb-4 sm:px-0 sm:pb-0 overflow-y-auto">
      {saveError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {saveError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-recipe-title" className="font-sans text-sm font-medium">
          Title
        </label>
        <Input
          id="edit-recipe-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) setTitleError(null);
          }}
          aria-invalid={!!titleError}
          autoFocus
        />
        {titleError && (
          <p className="font-sans text-xs text-red-600 dark:text-red-400">{titleError}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-recipe-markdown" className="font-sans text-sm font-medium">
          Recipe
        </label>
        <Textarea
          id="edit-recipe-markdown"
          value={markdown}
          onChange={(e) => {
            setMarkdown(e.target.value);
            if (markdownError) setMarkdownError(null);
          }}
          aria-invalid={!!markdownError}
          rows={16}
          className="font-mono text-sm min-h-[320px]"
        />
        {markdownError && (
          <p className="font-sans text-xs text-red-600 dark:text-red-400">{markdownError}</p>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Edit recipe</DrawerTitle>
            <DrawerDescription>
              Edit the title and content below, then save your changes.
            </DrawerDescription>
          </DrawerHeader>
          {body}
          <DrawerFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-4 max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit recipe</DialogTitle>
          <DialogDescription>
            Edit the title and content below, then save your changes.
          </DialogDescription>
        </DialogHeader>
        {body}
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

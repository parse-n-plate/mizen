"use client";

import { useState } from "react";
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
  RecipeMarkdownError,
  validateRecipeTitle,
} from "@/lib/recipe-markdown";
import type { ParsedRecipe } from "@/lib/types";

interface EditRecipeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: ParsedRecipe;
  onSave: (updated: ParsedRecipe) => Promise<{ ok: boolean; error?: string }>;
}

interface RecipeEditorFields {
  title: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  ingredients: string;
  instructions: string;
  equipment: string;
}

function ingredientsToText(recipe: ParsedRecipe): string {
  const singleMainGroup =
    recipe.ingredients.length === 1 && recipe.ingredients[0].groupName.toLowerCase() === "main";
  const lines: string[] = [];
  recipe.ingredients.forEach((group) => {
    if (!singleMainGroup) lines.push(`### ${group.groupName}`, "");
    group.ingredients.forEach((ingredient) => {
      const quantity = [ingredient.amount, ingredient.units].filter(Boolean).join(" ");
      const name = quantity ? `**${quantity}** ${ingredient.ingredient}` : ingredient.ingredient;
      lines.push(`- ${ingredient.description ? `${name} — ${ingredient.description}` : name}`);
    });
    lines.push("");
  });
  return lines.join("\n").trim();
}

function instructionsToText(recipe: ParsedRecipe): string {
  const lines: string[] = [];
  recipe.instructions.forEach((step, index) => {
    lines.push(`${index + 1}. ${step.title ? `**${step.title}** — ` : ""}${step.detail}`);
    if (step.tips) lines.push(`   *Tip: ${step.tips}*`);
  });
  return lines.join("\n");
}

function equipmentToText(recipe: ParsedRecipe): string {
  return (recipe.equipment ?? []).map((item) => `- ${item.name}`).join("\n");
}

function editorFields(recipe: ParsedRecipe): RecipeEditorFields {
  return {
    title: recipe.title,
    description: recipe.summary ?? "",
    servings: recipe.servings?.toString() ?? "",
    prepTime: recipe.prepTimeMinutes?.toString() ?? "",
    cookTime: recipe.cookTimeMinutes?.toString() ?? "",
    ingredients: ingredientsToText(recipe),
    instructions: instructionsToText(recipe),
    equipment: equipmentToText(recipe),
  };
}

function recipeMarkdownFromFields(fields: RecipeEditorFields): string {
  const lines: string[] = [];
  if (fields.description.trim()) {
    lines.push(
      ...fields.description
        .trim()
        .split("\n")
        .map((line) => `> ${line}`),
      ""
    );
  }

  const metadata: string[] = [];
  if (fields.servings.trim()) metadata.push(`**Servings:** ${fields.servings.trim()}`);
  if (fields.prepTime.trim()) metadata.push(`**Prep:** ${fields.prepTime.trim()} min`);
  if (fields.cookTime.trim()) metadata.push(`**Cook:** ${fields.cookTime.trim()} min`);
  if (metadata.length) lines.push(metadata.join(" | "), "");

  lines.push(
    "## Ingredients",
    "",
    fields.ingredients.trim(),
    "",
    "## Instructions",
    "",
    fields.instructions.trim()
  );
  if (fields.equipment.trim()) lines.push("", "## Equipment", "", fields.equipment.trim());
  return `${lines.join("\n").trim()}\n`;
}

function validateNumber(value: string, label: string, positive = false): string | null {
  if (!value.trim()) return null;
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 0 || (positive && numeric === 0)) {
    return `${label} must be ${positive ? "a positive" : "a non-negative"} whole number.`;
  }
  return null;
}

export function EditRecipeDrawer({ open, onOpenChange, recipe, onSave }: EditRecipeDrawerProps) {
  const isMobile = useIsMobile();
  const [fields, setFields] = useState(() => editorFields(recipe));
  const [formError, setFormError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [openedRecipe, setOpenedRecipe] = useState<ParsedRecipe | null>(open ? recipe : null);

  if (open && openedRecipe !== recipe) {
    setOpenedRecipe(recipe);
    setFields(editorFields(recipe));
    setFormError(null);
    setSaveError(null);
    setSaving(false);
  } else if (!open && openedRecipe) {
    setOpenedRecipe(null);
  }

  const setField = (field: keyof RecipeEditorFields, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    if (formError) setFormError(null);
  };

  async function handleSave() {
    if (saving) return;

    const validationError =
      validateRecipeTitle(fields.title.trim()) ||
      validateNumber(fields.servings, "Servings", true) ||
      validateNumber(fields.prepTime, "Prep time") ||
      validateNumber(fields.cookTime, "Cook time");
    if (validationError) {
      setFormError(validationError);
      return;
    }

    let updated: ParsedRecipe;
    try {
      updated = buildUpdatedRecipe(recipe, fields.title.trim(), recipeMarkdownFromFields(fields));
    } catch (error) {
      if (error instanceof RecipeMarkdownError) {
        setFormError(error.message);
        return;
      }
      throw error;
    }

    setSaving(true);
    setSaveError(null);
    const result = await onSave(updated);
    setSaving(false);
    if (result.ok) onOpenChange(false);
    else setSaveError(result.error || "Failed to save changes. Please try again.");
  }

  const body = (
    <div className="-mx-1 flex flex-col gap-5 overflow-y-auto px-5 pb-4 sm:px-1 sm:pb-0">
      {(formError || saveError) && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {formError || saveError}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="edit-recipe-title" className="font-sans text-sm font-medium">
          Title
        </label>
        <Input
          id="edit-recipe-title"
          value={fields.title}
          onChange={(event) => setField("title", event.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="edit-recipe-description" className="font-sans text-sm font-medium">
          Description
        </label>
        <Textarea
          id="edit-recipe-description"
          value={fields.description}
          onChange={(event) => setField("description", event.target.value)}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <label htmlFor="edit-recipe-servings" className="font-sans text-xs font-medium">
            Servings
          </label>
          <Input
            id="edit-recipe-servings"
            inputMode="numeric"
            value={fields.servings}
            onChange={(event) => setField("servings", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="edit-recipe-prep" className="font-sans text-xs font-medium">
            Prep time (min)
          </label>
          <Input
            id="edit-recipe-prep"
            inputMode="numeric"
            value={fields.prepTime}
            onChange={(event) => setField("prepTime", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="edit-recipe-cook" className="font-sans text-xs font-medium">
            Cook time (min)
          </label>
          <Input
            id="edit-recipe-cook"
            inputMode="numeric"
            value={fields.cookTime}
            onChange={(event) => setField("cookTime", event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="edit-recipe-ingredients" className="font-sans text-sm font-medium">
          Ingredients
        </label>
        <Textarea
          id="edit-recipe-ingredients"
          value={fields.ingredients}
          onChange={(event) => setField("ingredients", event.target.value)}
          rows={10}
          className="font-mono text-sm"
        />
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Use one bullet per ingredient. Optional groups use <code>### Group name</code>.
        </p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="edit-recipe-instructions" className="font-sans text-sm font-medium">
          Instructions
        </label>
        <Textarea
          id="edit-recipe-instructions"
          value={fields.instructions}
          onChange={(event) => setField("instructions", event.target.value)}
          rows={10}
          className="font-mono text-sm"
        />
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Use numbered steps, for example <code>1. Preheat the oven.</code>
        </p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="edit-recipe-equipment" className="font-sans text-sm font-medium">
          Equipment
        </label>
        <Textarea
          id="edit-recipe-equipment"
          value={fields.equipment}
          onChange={(event) => setField("equipment", event.target.value)}
          rows={4}
          className="font-mono text-sm"
          placeholder="- Large skillet"
        />
        <p className="text-xs text-stone-500 dark:text-stone-400">Use one bullet per item.</p>
      </div>
    </div>
  );

  const footer = (
    <>
      <Button
        variant="outline"
        className={isMobile ? "flex-1" : undefined}
        onClick={() => onOpenChange(false)}
        disabled={saving}
      >
        Cancel
      </Button>
      <Button className={isMobile ? "flex-1" : undefined} onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </>
  );

  if (isMobile)
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Edit recipe</DrawerTitle>
            <DrawerDescription>Edit each recipe section, then save your changes.</DrawerDescription>
          </DrawerHeader>
          {body}
          <DrawerFooter className="flex-row gap-2">{footer}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit recipe</DialogTitle>
          <DialogDescription>Edit each recipe section, then save your changes.</DialogDescription>
        </DialogHeader>
        {body}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
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
import { validateRecipeTitle } from "@/lib/recipe-markdown";
import type { Ingredient, InstructionStep, ParsedRecipe } from "@/lib/types";

interface EditRecipeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: ParsedRecipe;
  onSave: (updated: ParsedRecipe) => Promise<{ ok: boolean; error?: string }>;
}

function cloneRecipe(recipe: ParsedRecipe): ParsedRecipe {
  return {
    ...recipe,
    ingredients: recipe.ingredients.map((group) => ({
      ...group,
      ingredients: group.ingredients.map((ingredient) => ({ ...ingredient })),
    })),
    instructions: recipe.instructions.map((step) => ({ ...step })),
    equipment: recipe.equipment?.map((item) => ({ ...item, stepNumbers: [...item.stepNumbers] })),
  };
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function ActionButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:pointer-events-none disabled:opacity-35 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
    >
      {label.startsWith("Move up") ? (
        <ChevronUp className="h-4 w-4" />
      ) : label.startsWith("Move down") ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}

export function EditRecipeDrawer({ open, onOpenChange, recipe, onSave }: EditRecipeDrawerProps) {
  const isMobile = useIsMobile();
  const [draft, setDraft] = useState(() => cloneRecipe(recipe));
  const [formError, setFormError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [openedRecipe, setOpenedRecipe] = useState<ParsedRecipe | null>(open ? recipe : null);

  if (open && openedRecipe !== recipe) {
    setOpenedRecipe(recipe);
    setDraft(cloneRecipe(recipe));
    setFormError(null);
    setSaveError(null);
    setSaving(false);
  } else if (!open && openedRecipe) {
    setOpenedRecipe(null);
  }

  const update = (updater: (current: ParsedRecipe) => ParsedRecipe) => {
    setDraft((current) => updater(current));
    if (formError) setFormError(null);
  };

  const updateIngredient = (
    groupIndex: number,
    ingredientIndex: number,
    field: keyof Ingredient,
    value: string
  ) => {
    update((current) => ({
      ...current,
      ingredients: current.ingredients.map((group, currentGroupIndex) =>
        currentGroupIndex !== groupIndex
          ? group
          : {
              ...group,
              ingredients: group.ingredients.map((ingredient, currentIngredientIndex) =>
                currentIngredientIndex === ingredientIndex
                  ? { ...ingredient, [field]: value }
                  : ingredient
              ),
            }
      ),
    }));
  };

  const updateStep = (index: number, field: keyof InstructionStep, value: string) => {
    update((current) => ({
      ...current,
      instructions: current.instructions.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value || undefined } : step
      ),
    }));
  };

  const moveInstruction = (from: number, to: number) => {
    update((current) => {
      if (to < 0 || to >= current.instructions.length) return current;
      const sourceOrder = current.instructions.map((_, index) => index);
      const reorderedSources = moveItem(sourceOrder, from, to);
      const newStepNumberForOld = new Map(
        reorderedSources.map((oldIndex, newIndex) => [oldIndex + 1, newIndex + 1])
      );
      return {
        ...current,
        instructions: moveItem(current.instructions, from, to),
        equipment: current.equipment?.map((item) => ({
          ...item,
          stepNumbers: item.stepNumbers.map((number) => newStepNumberForOld.get(number) ?? number),
        })),
      };
    });
  };

  const removeInstruction = (index: number) => {
    update((current) => ({
      ...current,
      instructions: current.instructions.filter((_, stepIndex) => stepIndex !== index),
      equipment: current.equipment?.map((item) => ({
        ...item,
        stepNumbers: item.stepNumbers
          .filter((number) => number !== index + 1)
          .map((number) => (number > index + 1 ? number - 1 : number)),
      })),
    }));
  };

  const toggleEquipmentStep = (equipmentIndex: number, stepNumber: number) => {
    update((current) => ({
      ...current,
      equipment: (current.equipment ?? []).map((item, index) => {
        if (index !== equipmentIndex) return item;
        const selected = item.stepNumbers.includes(stepNumber);
        return {
          ...item,
          stepNumbers: selected
            ? item.stepNumbers.filter((number) => number !== stepNumber)
            : [...item.stepNumbers, stepNumber].sort((a, b) => a - b),
        };
      }),
    }));
  };

  function validateDraft(): string | null {
    const titleError = validateRecipeTitle(draft.title.trim());
    if (titleError) return titleError;
    if (draft.servings !== undefined && (!Number.isInteger(draft.servings) || draft.servings <= 0))
      return "Servings must be a positive whole number.";
    if (
      draft.prepTimeMinutes !== undefined &&
      (!Number.isFinite(draft.prepTimeMinutes) || draft.prepTimeMinutes < 0)
    )
      return "Prep time cannot be negative.";
    if (
      draft.cookTimeMinutes !== undefined &&
      (!Number.isFinite(draft.cookTimeMinutes) || draft.cookTimeMinutes < 0)
    )
      return "Cook time cannot be negative.";
    if (
      !draft.ingredients.some((group) =>
        group.ingredients.some((ingredient) => ingredient.ingredient.trim())
      )
    )
      return "Add at least one named ingredient.";
    if (!draft.instructions.some((step) => step.detail?.trim()))
      return "Add at least one instruction with details.";
    if (draft.equipment?.some((item) => !item.name.trim()))
      return "Equipment names cannot be empty.";
    return null;
  }

  async function handleSave() {
    if (saving) return;
    const validationError = validateDraft();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    const normalized: ParsedRecipe = {
      ...draft,
      title: draft.title.trim(),
      summary: draft.summary?.trim() || undefined,
      ingredients: draft.ingredients
        .map((group) => ({
          ...group,
          groupName: group.groupName.trim() || "Main",
          ingredients: group.ingredients.filter((item) => item.ingredient.trim()),
        }))
        .filter((group) => group.ingredients.length),
      instructions: draft.instructions.filter((step) => step.detail?.trim()),
      equipment:
        draft.equipment
          ?.map((item) => ({ ...item, name: item.name.trim() }))
          .filter((item) => item.name) || undefined,
    };
    setSaving(true);
    setSaveError(null);
    const result = await onSave(normalized);
    setSaving(false);
    if (result.ok) onOpenChange(false);
    else setSaveError(result.error || "Failed to save changes. Please try again.");
  }

  const setNumber = (field: "servings" | "prepTimeMinutes" | "cookTimeMinutes", value: string) => {
    const number = Number(value);
    update((current) => ({
      ...current,
      [field]: value === "" || !Number.isFinite(number) ? undefined : number,
    }));
  };

  const body = (
    <div className="-mx-1 flex flex-col gap-6 overflow-y-auto px-5 pb-4 sm:px-1 sm:pb-0">
      {(formError || saveError) && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {formError || saveError}
        </div>
      )}

      <section className="space-y-3">
        <h3 className="font-sans text-sm font-semibold">Recipe details</h3>
        <div className="space-y-1.5">
          <label htmlFor="edit-recipe-title" className="font-sans text-sm font-medium">
            Title
          </label>
          <Input
            id="edit-recipe-title"
            value={draft.title}
            onChange={(event) => update((current) => ({ ...current, title: event.target.value }))}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="edit-recipe-description" className="font-sans text-sm font-medium">
            Description
          </label>
          <Textarea
            id="edit-recipe-description"
            value={draft.summary ?? ""}
            onChange={(event) => update((current) => ({ ...current, summary: event.target.value }))}
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
              type="number"
              min="1"
              step="1"
              value={draft.servings ?? ""}
              onChange={(event) => setNumber("servings", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-recipe-prep" className="font-sans text-xs font-medium">
              Prep (min)
            </label>
            <Input
              id="edit-recipe-prep"
              type="number"
              min="0"
              value={draft.prepTimeMinutes ?? ""}
              onChange={(event) => setNumber("prepTimeMinutes", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-recipe-cook" className="font-sans text-xs font-medium">
              Cook (min)
            </label>
            <Input
              id="edit-recipe-cook"
              type="number"
              min="0"
              value={draft.cookTimeMinutes ?? ""}
              onChange={(event) => setNumber("cookTimeMinutes", event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-sm font-semibold">Ingredients</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              update((current) => ({
                ...current,
                ingredients: [
                  ...current.ingredients,
                  {
                    groupName: "New group",
                    ingredients: [{ amount: "", units: "", ingredient: "" }],
                  },
                ],
              }))
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add group
          </Button>
        </div>
        {draft.ingredients.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="space-y-3 rounded-lg border border-stone-200 p-3 dark:border-stone-700"
          >
            <div className="flex items-center gap-1">
              <Input
                aria-label={`Ingredient group ${groupIndex + 1} name`}
                value={group.groupName}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    ingredients: current.ingredients.map((item, index) =>
                      index === groupIndex ? { ...item, groupName: event.target.value } : item
                    ),
                  }))
                }
                className="h-8 font-medium"
              />
              <ActionButton
                label={`Move up ingredient group ${groupIndex + 1}`}
                onClick={() =>
                  update((current) => ({
                    ...current,
                    ingredients: moveItem(current.ingredients, groupIndex, groupIndex - 1),
                  }))
                }
                disabled={groupIndex === 0}
              />
              <ActionButton
                label={`Move down ingredient group ${groupIndex + 1}`}
                onClick={() =>
                  update((current) => ({
                    ...current,
                    ingredients: moveItem(current.ingredients, groupIndex, groupIndex + 1),
                  }))
                }
                disabled={groupIndex === draft.ingredients.length - 1}
              />
              <ActionButton
                label={`Delete ingredient group ${groupIndex + 1}`}
                onClick={() =>
                  update((current) => ({
                    ...current,
                    ingredients: current.ingredients.filter((_, index) => index !== groupIndex),
                  }))
                }
              />
            </div>
            {group.ingredients.map((ingredient, ingredientIndex) => (
              <div
                key={ingredientIndex}
                className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,0.8fr)_minmax(0,1.5fr)_auto] gap-1.5"
              >
                <Input
                  aria-label={`Ingredient ${ingredientIndex + 1} amount`}
                  placeholder="Amount"
                  value={ingredient.amount}
                  onChange={(event) =>
                    updateIngredient(groupIndex, ingredientIndex, "amount", event.target.value)
                  }
                />
                <Input
                  aria-label={`Ingredient ${ingredientIndex + 1} unit`}
                  placeholder="Unit"
                  value={ingredient.units}
                  onChange={(event) =>
                    updateIngredient(groupIndex, ingredientIndex, "units", event.target.value)
                  }
                />
                <Input
                  aria-label={`Ingredient ${ingredientIndex + 1} name`}
                  placeholder="Ingredient"
                  value={ingredient.ingredient}
                  onChange={(event) =>
                    updateIngredient(groupIndex, ingredientIndex, "ingredient", event.target.value)
                  }
                />
                <div className="flex items-center">
                  <ActionButton
                    label={`Move up ingredient ${ingredientIndex + 1}`}
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        ingredients: current.ingredients.map((item, index) =>
                          index === groupIndex
                            ? {
                                ...item,
                                ingredients: moveItem(
                                  item.ingredients,
                                  ingredientIndex,
                                  ingredientIndex - 1
                                ),
                              }
                            : item
                        ),
                      }))
                    }
                    disabled={ingredientIndex === 0}
                  />
                  <ActionButton
                    label={`Move down ingredient ${ingredientIndex + 1}`}
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        ingredients: current.ingredients.map((item, index) =>
                          index === groupIndex
                            ? {
                                ...item,
                                ingredients: moveItem(
                                  item.ingredients,
                                  ingredientIndex,
                                  ingredientIndex + 1
                                ),
                              }
                            : item
                        ),
                      }))
                    }
                    disabled={ingredientIndex === group.ingredients.length - 1}
                  />
                  <ActionButton
                    label={`Delete ingredient ${ingredientIndex + 1}`}
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        ingredients: current.ingredients.map((item, index) =>
                          index === groupIndex
                            ? {
                                ...item,
                                ingredients: item.ingredients.filter(
                                  (_, itemIndex) => itemIndex !== ingredientIndex
                                ),
                              }
                            : item
                        ),
                      }))
                    }
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    aria-label={`Ingredient ${ingredientIndex + 1} description`}
                    placeholder="Description (optional)"
                    value={ingredient.description ?? ""}
                    onChange={(event) =>
                      updateIngredient(
                        groupIndex,
                        ingredientIndex,
                        "description",
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                update((current) => ({
                  ...current,
                  ingredients: current.ingredients.map((item, index) =>
                    index === groupIndex
                      ? {
                          ...item,
                          ingredients: [
                            ...item.ingredients,
                            { amount: "", units: "", ingredient: "" },
                          ],
                        }
                      : item
                  ),
                }))
              }
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add ingredient
            </Button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-sm font-semibold">Instructions</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              update((current) => ({
                ...current,
                instructions: [...current.instructions, { title: "", detail: "" }],
              }))
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add step
          </Button>
        </div>
        {draft.instructions.map((step, index) => (
          <div
            key={index}
            className="space-y-2 rounded-lg border border-stone-200 p-3 dark:border-stone-700"
          >
            <div className="flex items-center gap-1">
              <span className="w-5 shrink-0 text-sm font-medium text-stone-500">{index + 1}</span>
              <Input
                aria-label={`Step ${index + 1} title`}
                placeholder="Step title (optional)"
                value={step.title ?? ""}
                onChange={(event) => updateStep(index, "title", event.target.value)}
              />
              <ActionButton
                label={`Move up instruction ${index + 1}`}
                onClick={() => moveInstruction(index, index - 1)}
                disabled={index === 0}
              />
              <ActionButton
                label={`Move down instruction ${index + 1}`}
                onClick={() => moveInstruction(index, index + 1)}
                disabled={index === draft.instructions.length - 1}
              />
              <ActionButton
                label={`Delete instruction ${index + 1}`}
                onClick={() => removeInstruction(index)}
              />
            </div>
            <Textarea
              aria-label={`Step ${index + 1} details`}
              placeholder="Instruction details"
              value={step.detail ?? ""}
              onChange={(event) => updateStep(index, "detail", event.target.value)}
              rows={3}
            />
            <Input
              aria-label={`Step ${index + 1} tip`}
              placeholder="Tip (optional)"
              value={step.tips ?? ""}
              onChange={(event) => updateStep(index, "tips", event.target.value)}
            />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-sm font-semibold">Equipment</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              update((current) => ({
                ...current,
                equipment: [...(current.equipment ?? []), { name: "", stepNumbers: [] }],
              }))
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add equipment
          </Button>
        </div>
        {(draft.equipment ?? []).map((item, equipmentIndex) => (
          <div
            key={equipmentIndex}
            className="space-y-3 rounded-lg border border-stone-200 p-3 dark:border-stone-700"
          >
            <div className="flex items-center gap-1">
              <Input
                aria-label={`Equipment ${equipmentIndex + 1} name`}
                placeholder="Equipment name"
                value={item.name}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    equipment: (current.equipment ?? []).map((entry, index) =>
                      index === equipmentIndex ? { ...entry, name: event.target.value } : entry
                    ),
                  }))
                }
              />
              <ActionButton
                label={`Move up equipment ${equipmentIndex + 1}`}
                onClick={() =>
                  update((current) => ({
                    ...current,
                    equipment: moveItem(
                      current.equipment ?? [],
                      equipmentIndex,
                      equipmentIndex - 1
                    ),
                  }))
                }
                disabled={equipmentIndex === 0}
              />
              <ActionButton
                label={`Move down equipment ${equipmentIndex + 1}`}
                onClick={() =>
                  update((current) => ({
                    ...current,
                    equipment: moveItem(
                      current.equipment ?? [],
                      equipmentIndex,
                      equipmentIndex + 1
                    ),
                  }))
                }
                disabled={equipmentIndex === (draft.equipment?.length ?? 0) - 1}
              />
              <ActionButton
                label={`Delete equipment ${equipmentIndex + 1}`}
                onClick={() =>
                  update((current) => ({
                    ...current,
                    equipment: (current.equipment ?? []).filter(
                      (_, index) => index !== equipmentIndex
                    ),
                  }))
                }
              />
            </div>
            <fieldset>
              <legend className="mb-1.5 text-xs font-medium text-stone-600 dark:text-stone-400">
                Used in steps
              </legend>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {draft.instructions.map((step, stepIndex) => (
                  <label
                    key={stepIndex}
                    className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300"
                  >
                    <input
                      type="checkbox"
                      checked={item.stepNumbers.includes(stepIndex + 1)}
                      onChange={() => toggleEquipmentStep(equipmentIndex, stepIndex + 1)}
                    />
                    Step {stepIndex + 1}
                    {step.title ? `: ${step.title}` : ""}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        ))}
      </section>
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
            <DrawerDescription>Make changes to your recipe, then save them.</DrawerDescription>
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
          <DialogDescription>Make changes to your recipe, then save them.</DialogDescription>
        </DialogHeader>
        {body}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

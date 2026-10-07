import type { IngredientGroup, InstructionStep, ParsedRecipe, PrepNote } from "@/lib/types";

export function prepNoteKey(note: PrepNote): string {
  // Content identity survives reordering and invalidates completion when a task changes.
  return JSON.stringify([
    note.action.trim().toLowerCase(),
    note.timing?.trim().toLowerCase() ?? "",
    note.requirement,
    note.phase,
  ]);
}

export function sortPrepNotes(notes: PrepNote[]): PrepNote[] {
  const unique = new Map(notes.map((note) => [prepNoteKey(note), note]));
  return [...unique.values()].sort(
    (a, b) =>
      Number(b.phase === "advance") - Number(a.phase === "advance") ||
      (b.leadTimeMinutes ?? 0) - (a.leadTimeMinutes ?? 0) ||
      Number(b.requirement === "required") - Number(a.requirement === "required")
  );
}

function instructionIdentityText(step: InstructionStep | string): string {
  if (typeof step === "string") return step.trim();
  const detail = step.detail?.trim();
  if (detail) return detail;
  const legacyText = (step as InstructionStep & { text?: string }).text;
  const text = typeof legacyText === "string" ? legacyText.trim() : "";
  if (text) return text;
  return step.title?.trim() ?? "";
}

/** Stable snapshot for hashing text/image recipes (no source URL). */
export function prepRecipeContentSnapshot(recipe: ParsedRecipe) {
  const ingredients = recipe.ingredients.map((group: IngredientGroup) => ({
    groupName: group.groupName.trim(),
    ingredients: group.ingredients.map((ing) => ({
      amount: ing.amount ?? "",
      units: ing.units ?? "",
      ingredient: ing.ingredient.trim(),
    })),
  }));

  return {
    title: recipe.title.trim(),
    ingredients,
    instructions: recipe.instructions.map(instructionIdentityText),
  };
}

export function prepRecipeIdentity(recipe: ParsedRecipe): string {
  // Shared, imported, and saved views use the original recipe, never scaled ingredients.
  const sourceUrl = recipe.sourceUrl?.trim();
  if (sourceUrl) return sourceUrl;
  return JSON.stringify(prepRecipeContentSnapshot(recipe));
}

/** Identity used before stable snapshots, for reading existing completion. */
export function legacyPrepRecipeIdentity(recipe: ParsedRecipe): string {
  return (
    recipe.sourceUrl?.trim() ||
    JSON.stringify({
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions.map((step) => step.detail),
    })
  );
}

export async function hashRecipeIdentity(identity: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

import type { ParsedRecipe, PrepNote } from "@/lib/types";

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

export function prepRecipeIdentity(recipe: ParsedRecipe): string {
  // Shared, imported, and saved views use the original recipe, never scaled ingredients.
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

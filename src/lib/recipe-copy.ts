import type { IngredientGroup, InstructionStep, ParsedRecipe } from "@/lib/types";

export interface RecipeCopyData {
  recipe: Pick<
    ParsedRecipe,
    "title" | "summary" | "servings" | "prepTimeMinutes" | "cookTimeMinutes" | "equipment"
  >;
  ingredients: IngredientGroup[];
  instructions: InstructionStep[];
}

/** Formats the visible recipe as Markdown that can be pasted into an AI chat. */
export function recipeToCopyMarkdown({
  recipe,
  ingredients,
  instructions,
}: RecipeCopyData): string {
  const lines = [`# ${recipe.title}`];

  if (recipe.summary) lines.push("", recipe.summary);

  const metadata: string[] = [];
  if (recipe.servings) metadata.push(`Servings: ${recipe.servings}`);
  if (recipe.prepTimeMinutes !== undefined)
    metadata.push(`Prep time: ${recipe.prepTimeMinutes} min`);
  if (recipe.cookTimeMinutes !== undefined)
    metadata.push(`Cook time: ${recipe.cookTimeMinutes} min`);
  if (metadata.length) lines.push("", metadata.join(" | "));

  if (recipe.equipment?.length) {
    lines.push("", "## Equipment", "");
    recipe.equipment.forEach((item) => lines.push(`- ${item.name}`));
  }

  lines.push("", "## Ingredients", "");
  const showGroupNames =
    ingredients.length > 1 || ingredients[0]?.groupName.toLowerCase() !== "main";
  ingredients.forEach((group) => {
    if (showGroupNames) lines.push(`### ${group.groupName}`, "");
    group.ingredients.forEach((ingredient) => {
      const amount = [ingredient.amount, ingredient.units].filter(Boolean).join(" ");
      const item = [amount, ingredient.ingredient].filter(Boolean).join(" ");
      lines.push(`- ${ingredient.description ? `${item} (${ingredient.description})` : item}`);
    });
    if (showGroupNames) lines.push("");
  });

  lines.push("## Instructions", "");
  instructions.forEach((step, index) => {
    const heading = step.title ? `**${step.title}** ` : "";
    lines.push(`${index + 1}. ${heading}${step.detail}`.trim());
    if (step.tips) lines.push(`   - Tip: ${step.tips}`);
  });

  return `${lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()}\n`;
}

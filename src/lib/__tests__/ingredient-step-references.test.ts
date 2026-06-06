import { describe, expect, it } from "vitest";
import { matchIngredientReferences } from "@/lib/ingredient-step-references";
import type { IngredientGroup, InstructionStep } from "@/lib/types";

const groups: IngredientGroup[] = [
  {
    groupName: "Main",
    ingredients: [
      { amount: "2", units: "cups", ingredient: "all-purpose flour" },
      { amount: "1", units: "cup", ingredient: "unsalted butter" },
      { amount: "1", units: "cup", ingredient: "brown sugar" },
      { amount: "1", units: "tsp", ingredient: "fine sea salt" },
    ],
  },
];

function step(detail: string, ingredients?: string[]): InstructionStep {
  return {
    title: "Test step",
    detail,
    ingredients,
  };
}

describe("matchIngredientReferences", () => {
  it("matches ingredients mentioned in step detail", () => {
    const result = matchIngredientReferences(
      step("Whisk the flour, brown sugar, and salt together."),
      groups
    );

    expect(result.map((reference) => reference.ingredient.ingredient)).toEqual([
      "all-purpose flour",
      "brown sugar",
      "fine sea salt",
    ]);
    expect(result.map((reference) => reference.amountLabel)).toEqual(["2 cups", "1 cup", "1 tsp"]);
  });

  it("suppresses the full amount when a step uses part of an ingredient", () => {
    const result = matchIngredientReferences(
      step("Reserve half the butter for finishing."),
      groups
    );

    expect(result).toHaveLength(1);
    expect(result[0].ingredient.ingredient).toBe("unsalted butter");
    expect(result[0].usage).toBe("partial");
    expect(result[0].amountLabel).toBe("partial");
  });

  it("uses extracted step ingredient hints when the text omits the ingredient name", () => {
    const result = matchIngredientReferences(
      step("Mix the wet ingredients until smooth.", ["unsalted butter"]),
      groups
    );

    expect(result).toHaveLength(1);
    expect(result[0].ingredient.ingredient).toBe("unsalted butter");
    expect(result[0].start).toBeUndefined();
  });

  it("avoids low-confidence single-word matches when multiple ingredients share a phrase", () => {
    const ambiguousGroups: IngredientGroup[] = [
      {
        groupName: "Main",
        ingredients: [
          { amount: "2", units: "cups", ingredient: "all-purpose flour" },
          { amount: "1", units: "cup", ingredient: "bread flour" },
        ],
      },
    ];

    expect(matchIngredientReferences(step("Add the flour."), ambiguousGroups)).toEqual([]);
  });
});

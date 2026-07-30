import { describe, it, expect } from "vitest";
import {
  recipeToMarkdown,
  parseRecipeMarkdown,
  buildUpdatedRecipe,
  validateRecipeTitle,
  RecipeMarkdownError,
} from "../recipe-markdown";
import type { ParsedRecipe } from "../types";

const sampleRecipe: ParsedRecipe = {
  title: "Garlic Butter Chicken",
  summary: "Juicy seared chicken thighs in a garlicky butter sauce.",
  servings: 4,
  prepTimeMinutes: 10,
  cookTimeMinutes: 20,
  ingredients: [
    {
      groupName: "Sauce",
      ingredients: [
        {
          amount: "2",
          units: "tbsp",
          ingredient: "soy sauce",
          description: "adds umami depth",
          substitutions: ["tamari"],
        },
        { amount: "as needed", units: "", ingredient: "salt" },
      ],
    },
    {
      groupName: "Main",
      ingredients: [{ amount: "1", units: "lb", ingredient: "chicken thighs" }],
    },
  ],
  instructions: [
    {
      title: "Sear the chicken",
      detail: "Heat oil in a large skillet over medium-high heat and sear until golden.",
      tips: "Pat chicken dry first for better browning.",
      imageUrl: "https://example.com/step1.jpg",
      timeMinutes: 5,
    },
    {
      title: "Make the sauce",
      detail: "Combine soy sauce and butter in the same pan.",
    },
  ],
  equipment: [{ name: "large skillet", stepNumbers: [1, 2] }],
};

describe("recipeToMarkdown + parseRecipeMarkdown round-trip", () => {
  it("recovers the same structured fields from serialized markdown", () => {
    const markdown = recipeToMarkdown(sampleRecipe);
    const parsed = parseRecipeMarkdown(markdown);

    expect(parsed.summary).toBe(sampleRecipe.summary);
    expect(parsed.servings).toBe(4);
    expect(parsed.prepTimeMinutes).toBe(10);
    expect(parsed.cookTimeMinutes).toBe(20);

    expect(parsed.ingredients).toEqual([
      {
        groupName: "Sauce",
        ingredients: [
          { amount: "2", units: "tbsp", ingredient: "soy sauce", description: "adds umami depth" },
          { amount: "as needed", units: "", ingredient: "salt" },
        ],
      },
      {
        groupName: "Main",
        ingredients: [{ amount: "1", units: "lb", ingredient: "chicken thighs" }],
      },
    ]);

    expect(parsed.instructions).toEqual([
      {
        title: "Sear the chicken",
        detail: "Heat oil in a large skillet over medium-high heat and sear until golden.",
        tips: "Pat chicken dry first for better browning.",
      },
      {
        title: "Make the sauce",
        detail: "Combine soy sauce and butter in the same pan.",
      },
    ]);

    expect(parsed.equipment).toEqual([{ name: "large skillet", stepNumbers: [] }]);
  });

  it("parses plain ingredient quantities from user-added bullets", () => {
    const parsed = parseRecipeMarkdown(`
## Ingredients

- 2 cups flour
- 1 1/2 tsp salt - fine sea salt

## Instructions

1. Whisk together.
`);

    expect(parsed.ingredients[0].ingredients).toEqual([
      { amount: "2", units: "cups", ingredient: "flour" },
      { amount: "1 1/2", units: "tsp", ingredient: "salt", description: "fine sea salt" },
    ]);
  });
});

describe("buildUpdatedRecipe", () => {
  it("merges edits while preserving fields markdown doesn't expose", () => {
    const markdown = recipeToMarkdown(sampleRecipe);
    const updated = buildUpdatedRecipe(sampleRecipe, "Garlic Butter Chicken Thighs", markdown);

    expect(updated.title).toBe("Garlic Butter Chicken Thighs");
    // step image/timing preserved via detail-text match even though markdown doesn't carry it
    expect(updated.instructions[0].imageUrl).toBe("https://example.com/step1.jpg");
    expect(updated.instructions[0].timeMinutes).toBe(5);
    // ingredient substitutions preserved via name match
    expect(updated.ingredients[0].ingredients[0].substitutions).toEqual(["tamari"]);
    // equipment step refs preserved via name match
    expect(updated.equipment?.[0].stepNumbers).toEqual([1, 2]);
  });

  it("reflects a genuine text edit", () => {
    const markdown = recipeToMarkdown(sampleRecipe).replace(
      "Heat oil in a large skillet over medium-high heat and sear until golden.",
      "Heat oil in a large skillet over high heat and sear until deeply golden."
    );
    const updated = buildUpdatedRecipe(sampleRecipe, sampleRecipe.title, markdown);
    expect(updated.instructions[0].detail).toBe(
      "Heat oil in a large skillet over high heat and sear until deeply golden."
    );
    // no longer matches any original step by text, so per-step extras are dropped for that step
    expect(updated.instructions[0].imageUrl).toBeUndefined();
  });

  it("throws RecipeMarkdownError when ingredients are missing", () => {
    expect(() =>
      buildUpdatedRecipe(sampleRecipe, "Title", "## Instructions\n\n1. Do something")
    ).toThrow(RecipeMarkdownError);
  });

  it("throws RecipeMarkdownError when instructions are missing", () => {
    expect(() =>
      buildUpdatedRecipe(sampleRecipe, "Title", "## Ingredients\n\n- 1 cup flour")
    ).toThrow(RecipeMarkdownError);
  });
});

describe("validateRecipeTitle", () => {
  it("rejects empty or whitespace-only titles", () => {
    expect(validateRecipeTitle("")).toBeTruthy();
    expect(validateRecipeTitle("   ")).toBeTruthy();
  });

  it("rejects overly long titles", () => {
    expect(validateRecipeTitle("a".repeat(201))).toBeTruthy();
  });

  it("accepts a normal title", () => {
    expect(validateRecipeTitle("Garlic Butter Chicken")).toBeNull();
  });
});

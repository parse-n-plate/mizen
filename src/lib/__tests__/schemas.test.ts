import { describe, it, expect } from "vitest";
import { CoreRecipeSchema, IngredientSchema } from "../schemas/recipe";

describe("IngredientSchema", () => {
  it("accepts a valid ingredient with defaults", () => {
    const result = IngredientSchema.safeParse({ ingredient: "flour" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe("");
      expect(result.data.units).toBe("");
    }
  });

  it("rejects an ingredient with empty name", () => {
    const result = IngredientSchema.safeParse({ ingredient: "" });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields", () => {
    const result = IngredientSchema.safeParse({
      ingredient: "flour",
      amount: "2",
      units: "cups",
      description: "sifted",
      substitutions: ["almond flour"],
    });
    expect(result.success).toBe(true);
  });
});

describe("CoreRecipeSchema", () => {
  const validRecipe = {
    title: "Spaghetti",
    ingredients: [{ groupName: "Main", ingredients: [{ ingredient: "pasta" }] }],
    instructions: [{ detail: "Boil water" }],
  };

  it("accepts a valid minimal recipe", () => {
    expect(CoreRecipeSchema.safeParse(validRecipe).success).toBe(true);
  });

  it("rejects a recipe with empty title", () => {
    const result = CoreRecipeSchema.safeParse({ ...validRecipe, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a recipe with no ingredient groups", () => {
    const result = CoreRecipeSchema.safeParse({ ...validRecipe, ingredients: [] });
    expect(result.success).toBe(false);
  });

  it("accepts servings as number", () => {
    expect(CoreRecipeSchema.safeParse({ ...validRecipe, servings: 4 }).success).toBe(true);
  });

  it("accepts servings as string", () => {
    expect(CoreRecipeSchema.safeParse({ ...validRecipe, servings: "4 servings" }).success).toBe(
      true
    );
  });

  it("accepts instructions as strings", () => {
    const result = CoreRecipeSchema.safeParse({
      ...validRecipe,
      instructions: ["Boil water", "Add pasta"],
    });
    expect(result.success).toBe(true);
  });
});

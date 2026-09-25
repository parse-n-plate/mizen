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

  it("accepts coerced instruction and serving shapes from extraction", () => {
    expect(
      CoreRecipeSchema.safeParse({
        ...validRecipe,
        servings: "4 servings",
        instructions: ["Boil water", "Add pasta"],
      }).success
    ).toBe(true);
  });
});

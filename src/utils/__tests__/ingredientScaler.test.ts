import { describe, it, expect } from "vitest";
import { parseAmount, formatAmount, scaleIngredient, scaleIngredients } from "../ingredientScaler";
import type { Ingredient, IngredientGroup } from "@/lib/types";

describe("parseAmount", () => {
  it("parses integers", () => {
    expect(parseAmount("2")).toBe(2);
  });

  it("parses decimals", () => {
    expect(parseAmount("2.5")).toBe(2.5);
  });

  it('parses "1/2"', () => {
    expect(parseAmount("1/2")).toBeCloseTo(0.5);
  });

  it('parses "1 1/2"', () => {
    expect(parseAmount("1 1/2")).toBeCloseTo(1.5);
  });

  it('parses "3/4"', () => {
    expect(parseAmount("3/4")).toBeCloseTo(0.75);
  });

  it("parses unicode ½", () => {
    expect(parseAmount("½")).toBeCloseTo(0.5);
  });

  it("parses unicode 1 ½", () => {
    expect(parseAmount("1 ½")).toBeCloseTo(1.5);
  });

  it("parses unicode ¼", () => {
    expect(parseAmount("¼")).toBeCloseTo(0.25);
  });

  it("parses unicode 2⅓", () => {
    expect(parseAmount("2⅓")).toBeCloseTo(2 + 1 / 3);
  });

  it("returns null for empty string", () => {
    expect(parseAmount("")).toBeNull();
  });

  it('returns null for "to taste"', () => {
    expect(parseAmount("to taste")).toBeNull();
  });

  it('returns null for "as needed"', () => {
    expect(parseAmount("as needed")).toBeNull();
  });

  it("returns null for ranges like 2-3", () => {
    expect(parseAmount("2-3")).toBeNull();
  });

  it("returns null for em dash ranges", () => {
    expect(parseAmount("2–3")).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(parseAmount("some")).toBeNull();
  });

  it("returns null for amounts with trailing units", () => {
    expect(parseAmount("1 cup")).toBeNull();
  });

  it("returns null for invalid fractions", () => {
    expect(parseAmount("1/0")).toBeNull();
  });
});

describe("formatAmount", () => {
  it("formats 0", () => {
    expect(formatAmount(0)).toBe("0");
  });

  it("formats whole numbers", () => {
    expect(formatAmount(2)).toBe("2");
  });

  it("formats 0.5 as ½", () => {
    expect(formatAmount(0.5)).toBe("½");
  });

  it("formats 1.5 as 1½", () => {
    expect(formatAmount(1.5)).toBe("1½");
  });

  it("formats 0.25 as ¼", () => {
    expect(formatAmount(0.25)).toBe("¼");
  });

  it("formats 0.75 as ¾", () => {
    expect(formatAmount(0.75)).toBe("¾");
  });

  it("formats 1/3 as ⅓", () => {
    expect(formatAmount(1 / 3)).toBe("⅓");
  });

  it("formats 2/3 as ⅔", () => {
    expect(formatAmount(2 / 3)).toBe("⅔");
  });

  it("formats very small number as < ⅛", () => {
    expect(formatAmount(0.001)).toBe("< ⅛");
  });

  it("rounds near-whole numbers up", () => {
    expect(formatAmount(1.99)).toBe("2");
  });
});

describe("scaleIngredient", () => {
  const baseIngredient: Ingredient = {
    amount: "1",
    units: "cup",
    ingredient: "flour",
  };

  it("doubles a simple amount", () => {
    const result = scaleIngredient(baseIngredient, 2);
    expect(result.amount).toBe("2");
  });

  it("halves a simple amount", () => {
    const result = scaleIngredient({ ...baseIngredient, amount: "2" }, 0.5);
    expect(result.amount).toBe("1");
  });

  it("scales a fraction", () => {
    const result = scaleIngredient({ ...baseIngredient, amount: "½" }, 2);
    expect(result.amount).toBe("1");
  });

  it("scales a dash range by 2", () => {
    const rangeIng: Ingredient = { amount: "2-3", units: "cups", ingredient: "water" };
    const result = scaleIngredient(rangeIng, 2);
    expect(result.amount).toBe("4-6");
  });

  it('scales a "to" range by 2', () => {
    const rangeIng: Ingredient = { amount: "2 to 3", units: "cups", ingredient: "water" };
    const result = scaleIngredient(rangeIng, 2);
    expect(result.amount).toBe("4 to 6");
  });

  it("leaves unparseable amounts unchanged", () => {
    const ing: Ingredient = { amount: "to taste", units: "", ingredient: "salt" };
    const result = scaleIngredient(ing, 2);
    expect(result.amount).toBe("to taste");
  });

  it("returns ingredient unchanged when amount is empty and ingredient cannot be parsed", () => {
    const ing: Ingredient = { amount: "", units: "", ingredient: "salt" };
    expect(scaleIngredient(ing, 2)).toEqual(ing);
  });

  it("preserves units embedded in amount strings when rounding", () => {
    const ing: Ingredient = { amount: "2.25 cups", units: "", ingredient: "flour" };
    const result = scaleIngredient(ing, 1, true);

    expect(result).toEqual({
      amount: "2½",
      units: "cups",
      ingredient: "flour",
    });
  });

  it("preserves units embedded in ranged amount strings", () => {
    const ing: Ingredient = { amount: "2 to 3 tbsp", units: "", ingredient: "olive oil" };
    const result = scaleIngredient(ing, 2);

    expect(result).toEqual({
      amount: "4 to 6",
      units: "tbsp",
      ingredient: "olive oil",
    });
  });
});

describe("scaleIngredients", () => {
  const groups: IngredientGroup[] = [
    {
      groupName: "Main",
      ingredients: [
        { amount: "2", units: "cups", ingredient: "flour" },
        { amount: "1", units: "tsp", ingredient: "salt" },
      ],
    },
  ];

  it("returns same reference when scale factor is 1", () => {
    expect(scaleIngredients(groups, 4, 4)).toBe(groups);
  });

  it("doubles all ingredients", () => {
    const result = scaleIngredients(groups, 4, 8);
    expect(result[0].ingredients[0].amount).toBe("4");
    expect(result[0].ingredients[1].amount).toBe("2");
  });

  it("handles zero originalServings by treating as 1", () => {
    const result = scaleIngredients(groups, 0, 2);
    expect(result[0].ingredients[0].amount).toBe("4");
  });
});

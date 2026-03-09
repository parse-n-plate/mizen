import { describe, it, expect } from "vitest";
import { parseAmount, formatAmount, normalizeAmount, normalizeDecimalsInText, displayAmount, displayText, scaleIngredient, scaleIngredients } from "../ingredientScaler";
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

describe("normalizeAmount", () => {
  it('converts "0.33333334326744" to "⅓"', () => {
    expect(normalizeAmount("0.33333334326744")).toBe("⅓");
  });

  it('converts "0.5" to "½"', () => {
    expect(normalizeAmount("0.5")).toBe("½");
  });

  it('converts "0.25" to "¼"', () => {
    expect(normalizeAmount("0.25")).toBe("¼");
  });

  it('converts "0.75" to "¾"', () => {
    expect(normalizeAmount("0.75")).toBe("¾");
  });

  it('converts "0.666" to "⅔"', () => {
    expect(normalizeAmount("0.666")).toBe("⅔");
  });

  it('converts "1.5" to "1½"', () => {
    expect(normalizeAmount("1.5")).toBe("1½");
  });

  it('converts "1.333" to "1⅓"', () => {
    expect(normalizeAmount("1.333")).toBe("1⅓");
  });

  it('leaves "½" unchanged', () => {
    expect(normalizeAmount("½")).toBe("½");
  });

  it('leaves "1/2" unchanged', () => {
    expect(normalizeAmount("1/2")).toBe("1/2");
  });

  it('leaves "2" unchanged', () => {
    expect(normalizeAmount("2")).toBe("2");
  });

  it('leaves "2-3" unchanged', () => {
    expect(normalizeAmount("2-3")).toBe("2-3");
  });

  it('leaves "as needed" unchanged', () => {
    expect(normalizeAmount("as needed")).toBe("as needed");
  });

  it("leaves empty string unchanged", () => {
    expect(normalizeAmount("")).toBe("");
  });
});

describe("normalizeDecimalsInText", () => {
  it("converts inline decimals to fractions", () => {
    expect(normalizeDecimalsInText("Add 0.333 cup of sugar")).toBe("Add ⅓ cup of sugar");
  });

  it("converts 0.5 in text", () => {
    expect(normalizeDecimalsInText("Use 0.5 tsp vanilla")).toBe("Use ½ tsp vanilla");
  });

  it("leaves text without decimals unchanged", () => {
    expect(normalizeDecimalsInText("Mix for 2 minutes")).toBe("Mix for 2 minutes");
  });

  it("handles multiple decimals in text", () => {
    expect(normalizeDecimalsInText("Add 0.25 cup sugar and 0.5 tsp salt")).toBe("Add ¼ cup sugar and ½ tsp salt");
  });
});

describe("displayAmount", () => {
  it("shows fractions in fraction mode", () => {
    expect(displayAmount("½", "fractions")).toBe("½");
  });

  it("converts to decimal in decimal mode", () => {
    expect(displayAmount("½", "decimals")).toBe("0.5");
  });

  it("converts ⅓ to decimal", () => {
    expect(displayAmount("⅓", "decimals")).toBe("0.33");
  });

  it("converts 1/2 to fraction", () => {
    expect(displayAmount("1/2", "fractions")).toBe("½");
  });

  it("converts 1/2 to decimal", () => {
    expect(displayAmount("1/2", "decimals")).toBe("0.5");
  });

  it('passes through "as needed"', () => {
    expect(displayAmount("as needed", "fractions")).toBe("as needed");
    expect(displayAmount("as needed", "decimals")).toBe("as needed");
  });

  it("handles ranges in decimal mode", () => {
    expect(displayAmount("2-3", "decimals")).toBe("2-3");
  });

  it("handles empty string", () => {
    expect(displayAmount("", "fractions")).toBe("");
    expect(displayAmount("", "decimals")).toBe("");
  });
});

describe("displayText", () => {
  it("shows fractions in fraction mode", () => {
    expect(displayText("Add ⅓ cup sugar", "fractions")).toBe("Add ⅓ cup sugar");
  });

  it("converts fractions to decimals in decimal mode", () => {
    expect(displayText("Add ⅓ cup sugar", "decimals")).toBe("Add 0.33 cup sugar");
  });

  it("converts ½ to 0.5 in decimal mode", () => {
    expect(displayText("Use ½ tsp vanilla", "decimals")).toBe("Use 0.5 tsp vanilla");
  });

  it("converts mixed numbers in decimal mode", () => {
    expect(displayText("Add 1⅓ cups flour", "decimals")).toBe("Add 1.33 cups flour");
  });

  it("converts inline decimals to fractions in fraction mode", () => {
    expect(displayText("Add 0.333 cup sugar", "fractions")).toBe("Add ⅓ cup sugar");
  });

  it("leaves plain text unchanged", () => {
    expect(displayText("Stir well", "fractions")).toBe("Stir well");
    expect(displayText("Stir well", "decimals")).toBe("Stir well");
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

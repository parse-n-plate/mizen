import { describe, expect, it } from "vitest";
import {
  annotateIngredientGroups,
  applySubstitutionsToGroups,
  convertIngredientGroups,
  convertInstructionTemperatures,
  countApplicableSubstitutions,
  getPreferredServings,
} from "@/lib/recipe-preferences";
import type { IngredientGroup, InstructionStep } from "@/lib/types";

describe("convertIngredientGroups", () => {
  it("converts imperial ingredients to metric", () => {
    const groups: IngredientGroup[] = [
      {
        groupName: "main",
        ingredients: [{ amount: "2", units: "cups", ingredient: "flour" }],
      },
    ];

    expect(convertIngredientGroups(groups, "metric")).toEqual([
      {
        groupName: "main",
        ingredients: [{ amount: "480", units: "mL", ingredient: "flour" }],
      },
    ]);
  });

  it("converts metric ingredients to imperial", () => {
    const groups: IngredientGroup[] = [
      {
        groupName: "main",
        ingredients: [{ amount: "500", units: "g", ingredient: "beef" }],
      },
    ];

    expect(convertIngredientGroups(groups, "imperial")).toEqual([
      {
        groupName: "main",
        ingredients: [{ amount: "1", units: "lb", ingredient: "beef" }],
      },
    ]);
  });
});

describe("annotateIngredientGroups", () => {
  it("adds dietary alerts and personal substitutions", () => {
    const groups: IngredientGroup[] = [
      {
        groupName: "main",
        ingredients: [
          {
            amount: "1",
            units: "cup",
            ingredient: "whole milk",
            substitutions: ["oat milk"],
          },
        ],
      },
    ];

    expect(
      annotateIngredientGroups(groups, ["Dairy-free", "Vegan"], [
        { from: "milk", to: "almond milk" },
      ])
    ).toEqual([
      {
        groupName: "main",
        ingredients: [
          {
            amount: "1",
            units: "cup",
            ingredient: "whole milk",
            alerts: ["Dairy-free", "Vegan"],
            substitutions: ["oat milk", "almond milk"],
          },
        ],
      },
    ]);
  });
});

describe("convertInstructionTemperatures", () => {
  it("converts Fahrenheit instructions to Celsius", () => {
    const steps: InstructionStep[] = [
      { title: "Bake", detail: "Bake at 350°F for 30 minutes.", tips: "Hold at 375°F if needed." },
    ];

    expect(convertInstructionTemperatures(steps, "c")).toEqual([
      {
        title: "Bake",
        detail: "Bake at 175°C for 30 minutes.",
        tips: "Hold at 190°C if needed.",
      },
    ]);
  });
});

describe("countApplicableSubstitutions", () => {
  it("counts ingredients that match at least one substitution", () => {
    const groups: IngredientGroup[] = [
      {
        groupName: "main",
        ingredients: [
          { amount: "1", units: "cup", ingredient: "whole milk" },
          { amount: "2", units: "tbsp", ingredient: "butter" },
          { amount: "1", units: "tsp", ingredient: "salt" },
        ],
      },
    ];

    expect(
      countApplicableSubstitutions(groups, [
        { from: "milk", to: "oat milk" },
        { from: "butter", to: "olive oil" },
      ])
    ).toBe(2);
  });

  it("returns 0 when no substitutions match", () => {
    const groups: IngredientGroup[] = [
      {
        groupName: "main",
        ingredients: [{ amount: "1", units: "tsp", ingredient: "salt" }],
      },
    ];

    expect(countApplicableSubstitutions(groups, [{ from: "milk", to: "oat milk" }])).toBe(0);
  });

  it("skips substitutions with empty from or to", () => {
    const groups: IngredientGroup[] = [
      {
        groupName: "main",
        ingredients: [{ amount: "1", units: "cup", ingredient: "milk" }],
      },
    ];

    expect(countApplicableSubstitutions(groups, [{ from: "milk", to: "" }])).toBe(0);
    expect(countApplicableSubstitutions(groups, [{ from: "", to: "oat milk" }])).toBe(0);
  });
});

describe("applySubstitutionsToGroups", () => {
  it("performs case-insensitive substring replacement", () => {
    const groups: IngredientGroup[] = [
      {
        groupName: "main",
        ingredients: [{ amount: "1", units: "cup", ingredient: "Whole Milk" }],
      },
    ];

    expect(applySubstitutionsToGroups(groups, [{ from: "milk", to: "oat milk" }])).toEqual([
      {
        groupName: "main",
        ingredients: [{ amount: "1", units: "cup", ingredient: "Whole oat milk" }],
      },
    ]);
  });

  it("returns unchanged groups when nothing matches", () => {
    const groups: IngredientGroup[] = [
      {
        groupName: "main",
        ingredients: [{ amount: "1", units: "tsp", ingredient: "salt" }],
      },
    ];

    const result = applySubstitutionsToGroups(groups, [{ from: "milk", to: "oat milk" }]);
    expect(result[0].ingredients[0]).toBe(groups[0].ingredients[0]);
  });

  it("skips substitutions with empty from or to", () => {
    const groups: IngredientGroup[] = [
      {
        groupName: "main",
        ingredients: [{ amount: "1", units: "cup", ingredient: "milk" }],
      },
    ];

    expect(applySubstitutionsToGroups(groups, [{ from: "", to: "oat milk" }])[0].ingredients[0].ingredient).toBe("milk");
    expect(applySubstitutionsToGroups(groups, [{ from: "milk", to: "" }])[0].ingredients[0].ingredient).toBe("milk");
  });

  it("applies multiple substitutions to different ingredients", () => {
    const groups: IngredientGroup[] = [
      {
        groupName: "main",
        ingredients: [
          { amount: "1", units: "cup", ingredient: "milk" },
          { amount: "2", units: "tbsp", ingredient: "butter" },
        ],
      },
    ];

    expect(
      applySubstitutionsToGroups(groups, [
        { from: "milk", to: "oat milk" },
        { from: "butter", to: "vegan butter" },
      ])
    ).toEqual([
      {
        groupName: "main",
        ingredients: [
          { amount: "1", units: "cup", ingredient: "oat milk" },
          { amount: "2", units: "tbsp", ingredient: "vegan butter" },
        ],
      },
    ]);
  });
});

describe("getPreferredServings", () => {
  it("uses the saved default when a recipe includes servings", () => {
    expect(getPreferredServings(6, 4)).toBe(4);
  });

  it("preserves missing source servings", () => {
    expect(getPreferredServings(undefined, 4)).toBeUndefined();
  });
});

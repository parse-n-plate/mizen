import { describe, expect, it } from "vitest";
import {
  annotateIngredientGroups,
  applySubstitutionsToGroups,
  convertIngredientGroups,
  convertInstructionTemperatures,
  convertInstructionUnits,
  countApplicableSubstitutions,
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
      annotateIngredientGroups(
        groups,
        ["Dairy-free", "Vegan"],
        [{ from: "milk", to: "almond milk" }]
      )
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

describe("convertInstructionUnits", () => {
  it("converts imperial quantities in step details and tips using ingredient conversion logic", () => {
    const steps: InstructionStep[] = [
      {
        title: "Mix",
        detail: "Stir in 2 cups flour and 1 tbsp oil.",
        tips: "Reserve 1/2 cup water.",
      },
    ];

    expect(convertInstructionUnits(steps, "metric")).toEqual([
      {
        title: "Mix",
        detail: "Stir in 480 mL flour and 15 mL oil.",
        tips: "Reserve 120 mL water.",
      },
    ]);
  });

  it("converts metric quantities across multiple cooking steps", () => {
    const steps: InstructionStep[] = [
      { title: "Shape", detail: "Divide the 500 g dough." },
      { title: "Finish", detail: "Brush with 30 mL oil." },
    ];

    expect(convertInstructionUnits(steps, "imperial")).toEqual([
      { title: "Shape", detail: "Divide the 1 lb dough." },
      { title: "Finish", detail: "Brush with 2 tbsp oil." },
    ]);
  });

  it("uses one converted unit for quantity ranges", () => {
    const steps: InstructionStep[] = [
      { title: "Adjust", detail: "Add 1-2 cups stock and simmer." },
    ];

    expect(convertInstructionUnits(steps, "metric")[0].detail).toBe(
      "Add 240-480 mL stock and simmer."
    );
  });

  it("leaves package sizes and already-targeted units unchanged", () => {
    const steps: InstructionStep[] = [
      {
        title: "Add",
        detail: "Add one 14 oz can of tomatoes and 250 mL stock.",
      },
    ];

    expect(convertInstructionUnits(steps, "metric")[0].detail).toBe(
      "Add one 14 oz can of tomatoes and 250 mL stock."
    );
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

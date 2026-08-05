import { describe, expect, it } from "vitest";
import { recipeToCopyMarkdown } from "../recipe-copy";

describe("recipeToCopyMarkdown", () => {
  it("includes the structured details useful in an AI chat", () => {
    expect(
      recipeToCopyMarkdown({
        recipe: {
          title: "Lemon Pasta",
          summary: "A bright weeknight pasta.",
          servings: 2,
          prepTimeMinutes: 10,
          cookTimeMinutes: 15,
          equipment: [{ name: "large skillet", stepNumbers: [2] }],
        },
        ingredients: [
          {
            groupName: "Sauce",
            ingredients: [{ amount: "1", units: "cup", ingredient: "cream", description: "cold" }],
          },
        ],
        instructions: [
          { title: "Finish the sauce", detail: "Simmer until glossy.", tips: "Stir often." },
        ],
      })
    ).toBe(
      "# Lemon Pasta\n\nA bright weeknight pasta.\n\nServings: 2 | Prep time: 10 min | Cook time: 15 min\n\n## Equipment\n\n- large skillet\n\n## Ingredients\n\n### Sauce\n\n- 1 cup cream (cold)\n\n## Instructions\n\n1. **Finish the sauce** Simmer until glossy.\n   - Tip: Stir often.\n"
    );
  });
});

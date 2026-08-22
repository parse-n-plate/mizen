import { beforeEach, describe, expect, it, vi } from "vitest";

const { createCompletion } = vi.hoisted(() => ({
  createCompletion: vi.fn(),
}));

vi.mock("@/lib/groq", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/groq")>();

  return {
    ...original,
    getGroqClient: () => ({
      chat: {
        completions: {
          create: createCompletion,
        },
      },
    }),
  };
});

import { GROQ_TEXT_MODEL } from "@/lib/groq";
import { parseRecipeFromText } from "@/utils/parseRecipe";

describe("parseRecipeFromText", () => {
  beforeEach(() => {
    createCompletion.mockReset();
  });

  it("uses the supported Groq text model", async () => {
    createCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "Tomato Toast",
              ingredients: [
                {
                  groupName: "Main",
                  ingredients: [{ ingredient: "bread" }, { ingredient: "tomato" }],
                },
              ],
              instructions: [{ detail: "Toast the bread and add the tomato." }],
            }),
          },
        },
      ],
    });

    const result = await parseRecipeFromText("Toast bread and top with tomato.");

    expect(result.success).toBe(true);
    expect(createCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        model: GROQ_TEXT_MODEL,
      })
    );
  });
});

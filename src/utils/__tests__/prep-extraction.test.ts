import { beforeEach, describe, expect, it, vi } from "vitest";
const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/groq", async (original) => ({
  ...(await original<object>()),
  getGroqClient: () => ({ chat: { completions: { create } } }),
}));
import { parseRecipeFromText } from "@/utils/parseRecipe";

const prepNotes = [
  { action: "Soak beans", phase: "advance", requirement: "required", timing: "Overnight" },
];
const recipe = {
  title: "Beans",
  ingredients: [
    { groupName: "Main", ingredients: [{ amount: "1", units: "cup", ingredient: "beans" }] },
  ],
  instructions: [{ title: "Cook beans", detail: "Soak overnight, then cook beans." }],
  prepNotes,
};
beforeEach(() => {
  vi.stubEnv("GROQ_API_KEY", "test-key");
  vi.restoreAllMocks();
  create.mockReset();
  create.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(recipe) } }] });
});
describe("AI prep note extraction", () => {
  it("omits malformed notes without failing the recipe import", async () => {
    create.mockResolvedValue({
      choices: [
        { message: { content: JSON.stringify({ ...recipe, prepNotes: [{ action: "" }] }) } },
      ],
    });
    const result = await parseRecipeFromText("Cook a cup of beans.");
    expect(result.success).toBe(true);
    expect(result.data?.prepNotes).toBeUndefined();
  });
});

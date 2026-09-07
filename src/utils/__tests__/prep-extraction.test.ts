import { beforeEach, describe, expect, it, vi } from "vitest";
const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/groq", async (original) => ({
  ...(await original<object>()),
  getGroqClient: () => ({ chat: { completions: { create } } }),
}));
import { parseRecipeFromImage, parseRecipeFromText, parseRecipeFromUrl } from "@/utils/parseRecipe";

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
describe("AI prep note propagation", () => {
  it("retains notes in text and image imports", async () => {
    expect(
      (await parseRecipeFromText("Soak a cup of beans overnight, then cook them.")).data?.prepNotes
    ).toEqual(prepNotes);
    expect((await parseRecipeFromImage("data:image/png;base64,AA==")).data?.prepNotes).toEqual(
      prepNotes
    );
  });
  it("retains JSON-LD enrichment notes", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            `<script type="application/ld+json">${JSON.stringify({ "@type": "Recipe", name: "Beans", recipeIngredient: ["1 cup beans"], recipeInstructions: ["Soak overnight, then cook beans."] })}</script><main><h1>Beans</h1><p>Soak a cup of beans overnight, then cook them until tender.</p></main>`
          )
        )
    );
    const result = await parseRecipeFromUrl("https://example.com/beans");
    expect(result.data?.prepNotes).toEqual(prepNotes);
    vi.unstubAllGlobals();
  });
  it("retains notes in full HTML extraction when JSON-LD is absent", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            "<main><h1>Beans</h1><p>Soak one cup of beans overnight, then cook them until tender.</p></main>"
          )
        )
    );
    expect((await parseRecipeFromUrl("https://example.com/beans")).data?.prepNotes).toEqual(
      prepNotes
    );
    vi.unstubAllGlobals();
  });
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

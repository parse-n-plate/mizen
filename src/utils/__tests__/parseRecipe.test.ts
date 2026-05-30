import * as cheerio from "cheerio";
import { afterEach, describe, expect, it, vi } from "vitest";
import { __test__ } from "@/utils/parseRecipe";
import type { InstructionStep } from "@/lib/types";

vi.mock("@/lib/groq", () => ({
  getGroqClient: () => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "Fragment Soup",
                  ingredients: [
                    {
                      groupName: "Main",
                      ingredients: [{ amount: "1", units: "cup", ingredient: "water" }],
                    },
                  ],
                  instructions: [{ title: "Step 1", detail: "Simmer." }],
                }),
              },
            },
          ],
        }),
      },
    },
  }),
  extractJsonFromAiResponse: (text: string) => JSON.parse(text),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("parseRecipe image handling", () => {
  it("extracts multiple image URLs from JSON-LD instruction arrays", () => {
    const $ = cheerio.load(`
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Recipe",
          "name": "Test Recipe",
          "recipeIngredient": ["1 cup flour"],
          "recipeInstructions": [
            {
              "@type": "HowToStep",
              "text": "Mix everything together thoroughly.",
              "image": [
                "https://cdn.example.com/step-1a.jpg",
                { "url": "https://cdn.example.com/step-1b.jpg" }
              ]
            }
          ]
        }
      </script>
    `);

    const recipe = __test__.extractFromJsonLd($);

    expect(recipe).not.toBeNull();
    expect(recipe?.instructions).toHaveLength(1);
    expect(recipe?.instructions[0].imageUrl).toBe("https://cdn.example.com/step-1a.jpg");
    expect(recipe?.instructions[0].imageUrls).toEqual([
      "https://cdn.example.com/step-1a.jpg",
      "https://cdn.example.com/step-1b.jpg",
    ]);
  });

  it("extracts per-step image groups from HTML fallback", () => {
    const images = __test__.extractStepImagesFromHtml(`
      <section class="recipe-instructions">
        <ol>
          <li>
            <p>Step 1</p>
            <img src="https://cdn.example.com/step-1a.jpg" />
            <img data-src="https://cdn.example.com/step-1b.jpg" />
          </li>
          <li>
            <p>Step 2</p>
          </li>
          <li>
            <p>Step 3</p>
            <img src="https://cdn.example.com/step-3.jpg" />
          </li>
        </ol>
      </section>
    `);

    expect(images).toEqual([
      ["https://cdn.example.com/step-1a.jpg", "https://cdn.example.com/step-1b.jpg"],
      [],
      ["https://cdn.example.com/step-3.jpg"],
    ]);
  });

  it("fills missing step images from HTML fallback without overwriting existing JSON-LD images", () => {
    const instructions: InstructionStep[] = [
      {
        title: "Step 1",
        detail: "Mix thoroughly.",
        imageUrl: "https://cdn.example.com/json-ld-step-1.jpg",
        imageUrls: ["https://cdn.example.com/json-ld-step-1.jpg"],
      },
      {
        title: "Step 2",
        detail: "Bake until golden.",
      },
    ];

    __test__.mergeStepImages(instructions, [
      ["https://cdn.example.com/html-step-1.jpg"],
      ["https://cdn.example.com/html-step-2a.jpg", "https://cdn.example.com/html-step-2b.jpg"],
    ]);

    expect(instructions).toEqual([
      {
        title: "Step 1",
        detail: "Mix thoroughly.",
        imageUrl: "https://cdn.example.com/json-ld-step-1.jpg",
        imageUrls: ["https://cdn.example.com/json-ld-step-1.jpg"],
      },
      {
        title: "Step 2",
        detail: "Bake until golden.",
      },
    ]);

    const missingImagesOnly: InstructionStep[] = [
      { title: "Step 1", detail: "Mix thoroughly." },
      { title: "Step 2", detail: "Bake until golden." },
    ];

    __test__.mergeStepImages(missingImagesOnly, [
      ["https://cdn.example.com/html-step-1.jpg"],
      ["https://cdn.example.com/html-step-2a.jpg", "https://cdn.example.com/html-step-2b.jpg"],
    ]);

    expect(missingImagesOnly).toEqual([
      {
        title: "Step 1",
        detail: "Mix thoroughly.",
        imageUrl: "https://cdn.example.com/html-step-1.jpg",
        imageUrls: ["https://cdn.example.com/html-step-1.jpg"],
      },
      {
        title: "Step 2",
        detail: "Bake until golden.",
        imageUrl: "https://cdn.example.com/html-step-2a.jpg",
        imageUrls: [
          "https://cdn.example.com/html-step-2a.jpg",
          "https://cdn.example.com/html-step-2b.jpg",
        ],
      },
    ]);
  });

  it("encodes special characters when requesting the Jina Reader fallback", async () => {
    const targetUrl = "https://recipes.example/path?name=tomato soup#ingredients";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue("recipe markdown"),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await __test__.parseViaJinaReader(targetUrl);

    expect(result?.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(`https://r.jina.ai/${encodeURIComponent(targetUrl)}`, {
      headers: { Accept: "text/plain" },
      signal: expect.any(AbortSignal),
    });
  });
});

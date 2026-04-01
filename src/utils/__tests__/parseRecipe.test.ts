import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { __test__ } from "@/utils/parseRecipe";
import type { InstructionStep } from "@/lib/types";

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
});

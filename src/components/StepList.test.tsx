/* @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StepList } from "@/components/StepList";
import type { IngredientGroup, InstructionStep } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element */
vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => (
    <img alt={alt} src={src} {...props} />
  ),
}));
/* eslint-enable @typescript-eslint/no-unused-vars, @next/next/no-img-element */

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ImageLightbox", () => ({
  ImageLightbox: ({ src, alt }: { src: string; alt: string }) => (
    <div data-testid="lightbox" data-src={src} aria-label={alt} />
  ),
}));

class MockImage {
  naturalWidth = 1200;
  naturalHeight = 800;
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;

  set src(_: string) {
    queueMicrotask(() => this.onload?.());
  }
}

describe("StepList", () => {
  let container: HTMLDivElement;
  let root: Root;
  const originalImage = globalThis.Image;
  const reactActEnv = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };

  async function render(steps: InstructionStep[], ingredientGroups?: IngredientGroup[]) {
    await act(async () => {
      root.render(<StepList steps={steps} ingredientGroups={ingredientGroups} />);
      await Promise.resolve();
    });
  }

  beforeEach(() => {
    reactActEnv.IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    globalThis.Image = MockImage as unknown as typeof Image;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    globalThis.Image = originalImage;
    delete reactActEnv.IS_REACT_ACT_ENVIRONMENT;
    vi.clearAllMocks();
  });

  it("shows the photo toggle only when at least one step has images", async () => {
    await render([{ title: "Step 1", detail: "Stir until combined." }]);
    expect(container.querySelector('button[aria-label="Hide photos"]')).toBeNull();

    await render([
      {
        title: "Step 1",
        detail: "Stir until combined.",
        imageUrls: ["https://cdn.example.com/step-1.jpg"],
      },
    ]);

    expect(container.querySelector('button[aria-label="Hide photos"]')).not.toBeNull();
  });

  it("persists the photo visibility preference when toggled", async () => {
    await render([
      {
        title: "Step 1",
        detail: "Stir until combined.",
        imageUrls: ["https://cdn.example.com/step-1.jpg"],
      },
    ]);

    const toggle = container.querySelector('button[aria-label="Hide photos"]');
    expect(toggle).not.toBeNull();

    await act(async () => {
      toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(localStorage.getItem("show-step-images")).toBe("false");
    expect(container.querySelector('button[aria-label="Show photos"]')).not.toBeNull();
  });

  it("opens the clicked step image in the lightbox for multi-image steps", async () => {
    await render([
      {
        title: "Step 1",
        detail: "Stir until combined.",
        imageUrls: ["https://cdn.example.com/step-1a.jpg", "https://cdn.example.com/step-1b.jpg"],
      },
    ]);

    const secondImage = container.querySelector('img[alt="Step 1, photo 2"]');
    expect(secondImage).not.toBeNull();

    await act(async () => {
      secondImage?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    const lightbox = container.querySelector('[data-testid="lightbox"]');
    expect(lightbox?.getAttribute("data-src")).toBe("https://cdn.example.com/step-1b.jpg");
  });

  it("renders matched ingredient amounts inline", async () => {
    await render(
      [{ title: "Step 1", detail: "Fold the flour into the butter." }],
      [
        {
          groupName: "Main",
          ingredients: [
            { amount: "2", units: "cups", ingredient: "all-purpose flour" },
            { amount: "1", units: "cup", ingredient: "unsalted butter" },
          ],
        },
      ]
    );

    expect(container.querySelector('[aria-label="Ingredients in this step"]')).toBeNull();
    expect(container.textContent).toContain("2 cupsflour");
    expect(container.textContent).toContain("1 cupbutter");
  });

  it("renders matched ingredients as interactive inline pills", async () => {
    await render(
      [{ title: "Step 1", detail: "Fold the flour into the butter." }],
      [
        {
          groupName: "Main",
          ingredients: [
            { amount: "2", units: "cups", ingredient: "all-purpose flour" },
            { amount: "1", units: "cup", ingredient: "unsalted butter" },
          ],
        },
      ]
    );

    const inlineReference = container.querySelector(
      'button[title="all-purpose flour"]'
    ) as HTMLElement | null;
    expect(inlineReference).not.toBeNull();
    expect(inlineReference?.tagName).toBe("BUTTON");
    expect(inlineReference?.className).toContain("rounded-lg");
  });

  it("opens ingredient details from a step ingredient pill", async () => {
    await render(
      [{ title: "Step 1", detail: "Season the dough.", ingredients: ["kosher salt"] }],
      [
        {
          groupName: "Main",
          ingredients: [
            {
              amount: "1",
              units: "tsp",
              ingredient: "kosher salt",
              description: "Use less if using fine salt.",
            },
          ],
        },
      ]
    );

    const ingredientPill = container.querySelector(
      '[aria-label="Ingredients in this step"] button'
    );
    expect(ingredientPill).not.toBeNull();

    await act(async () => {
      ingredientPill?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain("kosher salt");
    expect(document.body.textContent).toContain("Kosher Salt");
    expect(document.body.textContent).toContain("1 tsp");
    expect(document.body.textContent).toContain("This recipe lists 1 tsp of kosher salt");
    expect(document.body.textContent).toContain("Use less if using fine salt.");
    expect(document.body.textContent).toContain("Step 1:");
  });

  it("does not repeat an amount already written before an inline ingredient", async () => {
    await render(
      [{ title: "Step 1", detail: "Add 2 cups water." }],
      [
        {
          groupName: "Main",
          ingredients: [{ amount: "2", units: "cups", ingredient: "water" }],
        },
      ]
    );

    const matches = container.textContent?.match(/2 cups/g) ?? [];
    expect(matches).toHaveLength(1);
    expect(container.textContent).toContain("Add 2 cupswater.");
  });
});

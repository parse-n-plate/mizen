/* @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StepList } from "@/components/StepList";
import type { InstructionStep } from "@/lib/types";

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

  async function render(steps: InstructionStep[]) {
    await act(async () => {
      root.render(<StepList steps={steps} />);
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

  it("hides step images when the photo visibility preference is disabled", async () => {
    localStorage.setItem("show-step-images", "false");

    await render([
      {
        title: "Step 1",
        detail: "Stir until combined.",
        imageUrls: ["https://cdn.example.com/step-1.jpg"],
      },
    ]);

    expect(container.querySelector("[data-open='false'] img[alt='Step 1']")).not.toBeNull();
  });
});

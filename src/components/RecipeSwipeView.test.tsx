/* @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecipeSwipeView } from "@/components/RecipeSwipeView";

class MockResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ contentRect: { width: 400 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver
    );
    void target;
  }
  unobserve() {}
  disconnect() {}
}

describe("RecipeSwipeView", () => {
  let container: HTMLDivElement;
  let root: Root;
  const originalResizeObserver = globalThis.ResizeObserver;
  const reactActEnv = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };

  beforeEach(() => {
    reactActEnv.IS_REACT_ACT_ENVIRONMENT = true;
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    globalThis.ResizeObserver = originalResizeObserver;
    delete reactActEnv.IS_REACT_ACT_ENVIRONMENT;
    vi.clearAllMocks();
  });

  it("only mounts the active panel when swipe is disabled", async () => {
    await act(async () => {
      root.render(
        <RecipeSwipeView
          activeTab="prep"
          onTabChange={() => {}}
          enableSwipe={false}
          prep={<div data-testid="prep-content">Prep</div>}
          cook={<div data-testid="cook-content">Cook</div>}
        />
      );
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="prep-content"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="cook-content"]')).toBeNull();
  });

  it("keeps both panels mounted when swipe is enabled, so the inactive one can slide into view", async () => {
    await act(async () => {
      root.render(
        <RecipeSwipeView
          activeTab="prep"
          onTabChange={() => {}}
          enableSwipe={true}
          prep={<div data-testid="prep-content">Prep</div>}
          cook={<div data-testid="cook-content">Cook</div>}
        />
      );
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="prep-content"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="cook-content"]')).not.toBeNull();
  });

  it("re-renders the cook panel as active when activeTab switches", async () => {
    const renderWithTab = async (tab: "prep" | "cook") => {
      await act(async () => {
        root.render(
          <RecipeSwipeView
            activeTab={tab}
            onTabChange={() => {}}
            enableSwipe={false}
            prep={<div data-testid="prep-content">Prep</div>}
            cook={<div data-testid="cook-content">Cook</div>}
          />
        );
        await Promise.resolve();
      });
    };

    await renderWithTab("prep");
    expect(container.querySelector('[data-testid="cook-content"]')).toBeNull();

    await renderWithTab("cook");
    expect(container.querySelector('[data-testid="prep-content"]')).toBeNull();
    expect(container.querySelector('[data-testid="cook-content"]')).not.toBeNull();
  });
});

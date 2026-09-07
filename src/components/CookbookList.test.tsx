/* @vitest-environment jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import type { SavedRecipe } from "@/lib/types";
import { CookbookList } from "./CookbookList";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/context/RecipeContext", () => ({
  useRecipe: () => ({ setRecipe: vi.fn(), setSavedMeta: vi.fn() }),
}));
vi.mock("@/components/FavoritesEmptyState", () => ({
  FavoritesEmptyState: () => <p>No favorites</p>,
}));
vi.mock("@/components/HeartButton", () => ({
  HeartButton: ({
    isFavorite,
    onSave,
    onUnsave,
  }: {
    isFavorite: boolean;
    onSave: () => void;
    onUnsave: () => void;
  }) => <button onClick={isFavorite ? onUnsave : onSave}>Toggle favorite</button>,
}));

it("removes an unfavorited recipe from Favorites while retaining it in All recipes", async () => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const recipe = {
    id: "saved-1",
    slug: "soup",
    recipe: { title: "Soup" },
    is_favorite: true,
    created_at: new Date().toISOString(),
  } as SavedRecipe;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...recipe, is_favorite: false }) })
  );
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    await act(async () => root.render(<CookbookList initialRecipes={[recipe]} onlyFavorites />));
    expect(container.textContent).toContain("Soup");
    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent === "Toggle favorite")!
        .click();
    });
    expect(container.textContent).toContain("No favorites");
    await act(async () => root.render(<CookbookList initialRecipes={[recipe]} />));
    expect(container.textContent).toContain("Soup");
    expect(fetch).toHaveBeenCalledWith(
      "/api/recipes/saved-1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ isFavorite: false }) })
    );
  } finally {
    await act(async () => root.unmount());
    vi.unstubAllGlobals();
  }
});

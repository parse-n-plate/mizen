/* @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { formatResetTime } from "@/components/Search";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/ImageLightbox", () => ({
  ImageLightbox: () => null,
}));

vi.mock("@/context/RecipeContext", () => ({
  useRecipe: () => ({ setRecipe: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("formatResetTime", () => {
  it('returns "tomorrow" for invalid dates without throwing', () => {
    expect(formatResetTime("not an ISO date")).toBe("tomorrow");
  });
});

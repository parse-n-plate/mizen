import { describe, expect, it } from "vitest";
import { isNormalWebUrl, parseExtensionSaveRequest } from "@/lib/extension-save";
import { slugifyRecipeTitle } from "@/lib/recipes/save";

describe("extension save request", () => {
  it.each(["https://example.com/recipe", "http://recipes.example.com/pasta?servings=4"])(
    "accepts a normal web URL: %s",
    (url) => {
      expect(isNormalWebUrl(url)).toBe(true);
    }
  );

  it.each([
    "chrome://extensions",
    "file:///tmp/recipe.html",
    "javascript:alert(1)",
    "http://localhost:3000/recipe",
    "http://127.0.0.1/recipe",
    "http://192.168.1.4/recipe",
    "http://[::1]/recipe",
    "http://[fd00::1]/recipe",
    "http://[fe80::1]/recipe",
    "https://user:secret@example.com/recipe",
  ])("rejects a non-public page URL: %s", (url) => {
    expect(isNormalWebUrl(url)).toBe(false);
  });

  it("requires both the URL and captured page title", () => {
    expect(parseExtensionSaveRequest({ url: "https://example.com/recipe" })).toBeNull();
    expect(
      parseExtensionSaveRequest({ url: "https://example.com/recipe", title: "Pasta" })
    ).toEqual({ url: "https://example.com/recipe", title: "Pasta" });
  });
});

describe("recipe slug", () => {
  it("creates a stable URL-safe title segment", () => {
    expect(slugifyRecipeTitle("Gochujang & Lime Chicken!")).toBe("gochujang-lime-chicken");
  });
});

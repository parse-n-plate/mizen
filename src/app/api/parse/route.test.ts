import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { createClient } from "@/lib/supabase/server";
import { checkAndIncrementParseUsage, extractClientIp, hashIp } from "@/lib/rateLimit";
import { parseRecipeFromUrl } from "@/utils/parseRecipe";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/rateLimit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rateLimit")>("@/lib/rateLimit");
  return {
    ...actual,
    checkAndIncrementParseUsage: vi.fn(),
    hashIp: vi.fn(actual.hashIp),
  };
});

vi.mock("@/utils/parseRecipe", () => ({
  parseRecipeFromUrl: vi.fn(),
  parseRecipeFromImage: vi.fn(),
  parseRecipeFromText: vi.fn(),
}));

describe("/api/parse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(null);
    vi.mocked(parseRecipeFromUrl).mockResolvedValue({
      success: true,
      data: {
        title: "Soup",
        ingredients: [
          { groupName: "Main", ingredients: [{ amount: "1", units: "", ingredient: "water" }] },
        ],
        instructions: [{ title: "Step 1", detail: "Simmer." }],
      },
      method: "json-ld",
    });
  });

  it("does not hash a shared unknown value for anonymous requests with no IP headers", async () => {
    vi.mocked(checkAndIncrementParseUsage).mockResolvedValue({
      ok: "skipped",
      usage: null,
      reason: "missing_identifier",
    });

    const response = await POST(
      new Request("https://example.com/api/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://recipes.example/soup" }),
      })
    );

    expect(response.status).toBe(200);
    expect(extractClientIp).toBeDefined();
    expect(hashIp).not.toHaveBeenCalled();
    expect(checkAndIncrementParseUsage).toHaveBeenCalledWith({
      userId: null,
      ipHash: null,
      limit: 3,
    });
  });

  it("fails closed when the rate-limit backend is unavailable", async () => {
    vi.mocked(checkAndIncrementParseUsage).mockResolvedValue({
      ok: "skipped",
      usage: null,
      reason: "admin_unavailable",
    });

    const response = await POST(
      new Request("https://example.com/api/parse", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "203.0.113.10",
        },
        body: JSON.stringify({ url: "https://recipes.example/soup" }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      success: false,
      error: "Rate limit unavailable. Please try again later.",
      method: "none",
    });
    expect(parseRecipeFromUrl).not.toHaveBeenCalled();
  });
});

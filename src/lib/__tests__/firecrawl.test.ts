import { afterEach, describe, expect, it, vi } from "vitest";
import { scrapeDocumentUrl } from "@/lib/firecrawl";

const originalApiKey = process.env.FIRECRAWL_API_KEY;

afterEach(() => {
  process.env.FIRECRAWL_API_KEY = originalApiKey;
  vi.unstubAllGlobals();
});

describe("scrapeDocumentUrl", () => {
  it("sends public documents to Firecrawl and returns markdown", async () => {
    process.env.FIRECRAWL_API_KEY = "fc-test";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { markdown: "# Recipe" } }), {
        status: 200,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(scrapeDocumentUrl("https://example.com/recipe.pdf")).resolves.toBe("# Recipe");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.firecrawl.dev/v2/scrape",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer fc-test" }),
      })
    );
  });

  it("requires a server-side Firecrawl API key", async () => {
    delete process.env.FIRECRAWL_API_KEY;

    await expect(scrapeDocumentUrl("https://example.com/recipe.pdf")).rejects.toThrow(
      "FIRECRAWL_API_KEY"
    );
  });
});

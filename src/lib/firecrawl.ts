const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v2";

type FirecrawlResponse = {
  success?: boolean;
  data?: { markdown?: unknown };
  error?: unknown;
};

function getApiKey(): string {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("Document parsing is unavailable because FIRECRAWL_API_KEY is not configured.");
  }
  return apiKey;
}

async function readMarkdown(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as FirecrawlResponse | null;
  const error = typeof payload?.error === "string" ? payload.error : null;

  if (!response.ok || !payload?.success) {
    throw new Error(error || `Firecrawl could not parse this document (${response.status}).`);
  }

  if (typeof payload.data?.markdown !== "string" || payload.data.markdown.trim().length === 0) {
    throw new Error("Firecrawl returned no readable document content.");
  }

  return payload.data.markdown;
}

async function firecrawlFetch(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    return await fetch(`${FIRECRAWL_API_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        ...init.headers,
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Document parsing timed out. Please try a smaller document.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function parseDocumentFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, file.name || "document");
  formData.append(
    "options",
    JSON.stringify({
      formats: ["markdown"],
      onlyMainContent: true,
      parsers: [{ type: "pdf", mode: "auto" }],
    })
  );

  return readMarkdown(
    await firecrawlFetch("/parse", {
      method: "POST",
      body: formData,
    })
  );
}

export async function scrapeDocumentUrl(url: string): Promise<string> {
  return readMarkdown(
    await firecrawlFetch("/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, timeout: 30_000 }),
    })
  );
}

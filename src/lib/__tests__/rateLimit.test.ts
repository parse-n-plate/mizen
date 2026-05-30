import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkAndIncrementParseUsage, extractClientIp } from "@/lib/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe("rateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no client IP headers are present", () => {
    const request = new Request("https://example.com/api/parse");

    expect(extractClientIp(request)).toBeNull();
  });

  it("uses the first forwarded IP when present", () => {
    const request = new Request("https://example.com/api/parse", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });

    expect(extractClientIp(request)).toBe("203.0.113.10");
  });

  it("skips anonymous requests without an identifier instead of using a shared bucket", async () => {
    const result = await checkAndIncrementParseUsage({
      userId: null,
      ipHash: null,
      limit: 3,
    });

    expect(result).toEqual({ ok: "skipped", usage: null, reason: "missing_identifier" });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("reports unavailable rate-limit storage explicitly", async () => {
    vi.mocked(createAdminClient).mockReturnValue(null);

    const result = await checkAndIncrementParseUsage({
      userId: null,
      ipHash: "hashed-ip",
      limit: 3,
    });

    expect(result).toEqual({ ok: "skipped", usage: null, reason: "admin_unavailable" });
  });
});

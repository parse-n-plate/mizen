import { describe, expect, it, vi, beforeEach } from "vitest";
import { type NextRequest, NextResponse } from "next/server";
import { proxy, shouldRedirectOAuthRootCallback } from "./proxy";
import { updateSession } from "@/lib/supabase/middleware";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(),
}));

const createRequest = (url: string, method = "GET") => {
  const nextUrl = new URL(url);
  return {
    method,
    nextUrl: Object.assign(nextUrl, {
      clone: () => new URL(nextUrl.toString()),
    }),
  } as unknown as Pick<NextRequest, "nextUrl" | "method">;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("shouldRedirectOAuthRootCallback", () => {
  it("returns true for GET / with code and state", () => {
    expect(
      shouldRedirectOAuthRootCallback(createRequest("https://example.com/?code=abc&state=xyz"))
    ).toBe(true);
  });

  it("returns false when state is missing", () => {
    expect(shouldRedirectOAuthRootCallback(createRequest("https://example.com/?code=abc"))).toBe(
      false
    );
  });

  it("returns false for non-root paths", () => {
    expect(
      shouldRedirectOAuthRootCallback(
        createRequest("https://example.com/auth/callback?code=abc&state=xyz")
      )
    ).toBe(false);
  });

  it("returns false for non-GET methods", () => {
    expect(
      shouldRedirectOAuthRootCallback(
        createRequest("https://example.com/?code=abc&state=xyz", "POST")
      )
    ).toBe(false);
  });
});

describe("proxy", () => {
  it("redirects root OAuth callback traffic to /auth/callback preserving query params", async () => {
    const request = createRequest("https://example.com/?code=abc&state=xyz");

    const response = await proxy(request as never);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.com/auth/callback?code=abc&state=xyz"
    );
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("delegates to updateSession when request is not an OAuth root callback", async () => {
    const request = createRequest("https://example.com/cookbook");
    const delegatedResponse = NextResponse.next();
    vi.mocked(updateSession).mockResolvedValue(delegatedResponse);

    const response = await proxy(request as never);

    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession).toHaveBeenCalledWith(request);
    expect(response).toBe(delegatedResponse);
  });
});

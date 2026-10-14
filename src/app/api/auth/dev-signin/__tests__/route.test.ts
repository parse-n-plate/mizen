import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { client, signIn, admin, limit } = vi.hoisted(() => ({
  client: vi.fn(),
  signIn: vi.fn(),
  admin: vi.fn(),
  limit: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: client }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: admin }));
import { GET, POST } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
  for (const name of [
    "VERCEL",
    "VERCEL_ENV",
    "VERCEL_TARGET_ENV",
    "PREVIEW_DEV_AUTH_ENABLED",
    "PREVIEW_DEV_AUTH_PROJECT_REF",
    "PREVIEW_DEV_AUTH_EMAIL",
    "PREVIEW_DEV_AUTH_PASSWORD",
    "DEV_AUTH_EMAIL",
    "DEV_AUTH_PASSWORD",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]) {
    vi.stubEnv(name, undefined);
  }
  vi.stubEnv("NODE_ENV", "production");
  client.mockResolvedValue({ auth: { signInWithPassword: signIn } });
  signIn.mockResolvedValue({ error: null });
  admin.mockReturnValue({ rpc: limit });
  limit.mockResolvedValue({ data: 0, error: null });
});
afterEach(() => vi.unstubAllEnvs());

function configurePreview() {
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("PREVIEW_DEV_AUTH_ENABLED", "true");
  vi.stubEnv("PREVIEW_DEV_AUTH_PROJECT_REF", "abcdefghijklmnopqrst");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdefghijklmnopqrst.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "staging-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "staging-server-key");
  vi.stubEnv("PREVIEW_DEV_AUTH_EMAIL", "preview@example.com");
  vi.stubEnv("PREVIEW_DEV_AUTH_PASSWORD", "preview-test-password");
}

function request(headers: Record<string, string> = {}, origin = "https://preview.example") {
  return new Request(`${origin}/api/auth/dev-signin`, {
    method: "POST",
    headers: { origin, ...headers },
  });
}

describe("dev sign-in API", () => {
  it("blocks production before creating an auth client even with preview credentials", async () => {
    configurePreview();
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await (await GET()).json()).toEqual({ enabled: false });
    expect((await POST(request())).status).toBe(404);
    expect(client).not.toHaveBeenCalled();
    expect(admin).not.toHaveBeenCalled();
  });

  it("keeps unconfigured previews unavailable", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(await (await GET()).json()).toEqual({ enabled: false });
    expect((await POST(request())).status).toBe(404);
    expect(client).not.toHaveBeenCalled();
  });

  it("reports availability without exposing credentials and prevents caching", async () => {
    configurePreview();
    const response = await GET();
    expect(await response.json()).toEqual({ enabled: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(client).not.toHaveBeenCalled();
  });

  it("uses only preview credentials and returns no session or password in the response", async () => {
    configurePreview();
    vi.stubEnv("DEV_AUTH_EMAIL", "personal@example.com");
    vi.stubEnv("DEV_AUTH_PASSWORD", "personal-password");
    const response = await POST(request());
    expect(signIn).toHaveBeenCalledWith({
      email: "preview@example.com",
      password: "preview-test-password",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(limit).toHaveBeenCalledWith("consume_preview_dev_signin_attempt", {
      p_account_key: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(JSON.stringify(limit.mock.calls)).not.toContain("preview@example.com");
    expect(JSON.stringify(limit.mock.calls)).not.toContain("preview-test-password");
  });

  it("preserves the local shortcut", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_AUTH_EMAIL", "local@example.com");
    vi.stubEnv("DEV_AUTH_PASSWORD", "local-password");
    expect((await POST(request())).status).toBe(200);
    expect(signIn).toHaveBeenCalledWith({ email: "local@example.com", password: "local-password" });
    expect(admin).not.toHaveBeenCalled();
  });

  it("reports missing local credentials without attempting sign-in", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect((await POST(request())).status).toBe(500);
    expect(client).not.toHaveBeenCalled();
  });

  it("handles invalid test credentials without returning provider details", async () => {
    configurePreview();
    signIn.mockResolvedValue({ error: { message: "internal test-account details" } });
    const response = await POST(request());
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain("internal test-account details");
  });

  it("handles a missing auth client or network failure", async () => {
    configurePreview();
    client.mockResolvedValueOnce(null);
    expect((await POST(request())).status).toBe(503);
    signIn.mockRejectedValueOnce(new Error("unreachable"));
    expect((await POST(request())).status).toBe(503);
  });
  it.each([
    "https://untrusted.example",
    "null",
    "https://preview.example.evil.test",
    "http://preview.example",
  ])("rejects an untrusted origin %s before checking limits or signing in", async (origin) => {
    configurePreview();
    const response = await POST(request({ origin }));
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(admin).not.toHaveBeenCalled();
    expect(client).not.toHaveBeenCalled();
  });

  it("rejects a missing origin", async () => {
    configurePreview();
    expect(
      (await POST(new Request("https://preview.example/api/auth/dev-signin", { method: "POST" })))
        .status
    ).toBe(403);
    expect(admin).not.toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
  });

  it.each(["cross-site", "same-site", "none"])(
    "rejects conflicting browser fetch metadata %s",
    async (fetchSite) => {
      configurePreview();
      expect((await POST(request({ "sec-fetch-site": fetchSite }))).status).toBe(403);
      expect(admin).not.toHaveBeenCalled();
      expect(signIn).not.toHaveBeenCalled();
    }
  );

  it("allows same-origin browser requests and reserves their attempt before signing in", async () => {
    configurePreview();
    expect((await POST(request({ "sec-fetch-site": "same-origin" }))).status).toBe(200);
    expect(limit.mock.invocationCallOrder[0]).toBeLessThan(signIn.mock.invocationCallOrder[0]);
  });

  it("returns a retry interval without attempting auth when the shared account is limited", async () => {
    configurePreview();
    limit.mockResolvedValue({ data: 27, error: null });
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("27");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(client).not.toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
  });

  it.each([null, "0", -1, 61, 0.5])(
    "fails closed on an invalid throttle result %j",
    async (data) => {
      configurePreview();
      limit.mockResolvedValue({ data, error: null });
      expect((await POST(request())).status).toBe(503);
      expect(client).not.toHaveBeenCalled();
    }
  );

  it("fails closed if the server client, migration, or database is unavailable", async () => {
    configurePreview();
    admin.mockReturnValueOnce(null);
    expect((await POST(request())).status).toBe(503);
    limit.mockResolvedValueOnce({ data: null, error: { message: "private backend details" } });
    const failedMigration = await POST(request());
    expect(failedMigration.status).toBe(503);
    expect(await failedMigration.text()).not.toContain("private backend details");
    limit.mockRejectedValueOnce(new Error("private backend details"));
    expect((await POST(request())).status).toBe(503);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("shares the same limit across deployment hostnames and ignores spoofed client identity", async () => {
    configurePreview();
    await POST(request({ "x-forwarded-for": "192.0.2.1" }));
    await POST(request({ "x-forwarded-for": "192.0.2.2" }, "https://another-preview.example"));
    expect(limit.mock.calls[0]).toEqual(limit.mock.calls[1]);
  });

  it("checks local browser origin without requiring a staging limit", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_AUTH_EMAIL", "local@example.com");
    vi.stubEnv("DEV_AUTH_PASSWORD", "local-password");
    expect((await POST(request({}, "http://localhost:3000"))).status).toBe(200);
    expect(
      (await POST(request({ origin: "http://localhost:3001" }, "http://localhost:3000"))).status
    ).toBe(403);
    expect(admin).not.toHaveBeenCalled();
  });
});

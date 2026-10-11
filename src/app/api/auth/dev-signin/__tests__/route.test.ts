import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { client, signIn } = vi.hoisted(() => ({ client: vi.fn(), signIn: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: client }));
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
  ]) {
    vi.stubEnv(name, undefined);
  }
  vi.stubEnv("NODE_ENV", "production");
  client.mockResolvedValue({ auth: { signInWithPassword: signIn } });
  signIn.mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());

function configurePreview() {
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("PREVIEW_DEV_AUTH_ENABLED", "true");
  vi.stubEnv("PREVIEW_DEV_AUTH_PROJECT_REF", "abcdefghijklmnopqrst");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdefghijklmnopqrst.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "staging-public-key");
  vi.stubEnv("PREVIEW_DEV_AUTH_EMAIL", "preview@example.com");
  vi.stubEnv("PREVIEW_DEV_AUTH_PASSWORD", "preview-test-password");
}

describe("dev sign-in API", () => {
  it("blocks production before creating an auth client even with preview credentials", async () => {
    configurePreview();
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await (await GET()).json()).toEqual({ enabled: false });
    expect((await POST()).status).toBe(404);
    expect(client).not.toHaveBeenCalled();
  });

  it("keeps unconfigured previews unavailable", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(await (await GET()).json()).toEqual({ enabled: false });
    expect((await POST()).status).toBe(404);
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
    const response = await POST();
    expect(signIn).toHaveBeenCalledWith({
      email: "preview@example.com",
      password: "preview-test-password",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("preserves the local shortcut", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_AUTH_EMAIL", "local@example.com");
    vi.stubEnv("DEV_AUTH_PASSWORD", "local-password");
    expect((await POST()).status).toBe(200);
    expect(signIn).toHaveBeenCalledWith({ email: "local@example.com", password: "local-password" });
  });

  it("reports missing local credentials without attempting sign-in", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect((await POST()).status).toBe(500);
    expect(client).not.toHaveBeenCalled();
  });

  it("handles invalid test credentials without returning provider details", async () => {
    configurePreview();
    signIn.mockResolvedValue({ error: { message: "internal test-account details" } });
    const response = await POST();
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain("internal test-account details");
  });

  it("handles a missing auth client or network failure", async () => {
    configurePreview();
    client.mockResolvedValueOnce(null);
    expect((await POST()).status).toBe(503);
    signIn.mockRejectedValueOnce(new Error("unreachable"));
    expect((await POST()).status).toBe(503);
  });
});

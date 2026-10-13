import { describe, expect, it } from "vitest";
import { getDevAuthMode, PRODUCTION_SUPABASE_PROJECT_REF } from "../dev-auth";

const projectRef = "abcdefghijklmnopqrst";
const preview: Record<string, string | undefined> = {
  NODE_ENV: "production",
  VERCEL: "1",
  VERCEL_ENV: "preview",
  PREVIEW_DEV_AUTH_ENABLED: "true",
  PREVIEW_DEV_AUTH_PROJECT_REF: projectRef,
  NEXT_PUBLIC_SUPABASE_URL: `https://${projectRef}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "staging-public-key",
  SUPABASE_SERVICE_ROLE_KEY: "staging-server-key",
  PREVIEW_DEV_AUTH_EMAIL: "test@example.com",
  PREVIEW_DEV_AUTH_PASSWORD: "test-only-password",
};

describe("dev login environment restrictions", () => {
  it("supports an explicitly configured preview built in production mode", () => {
    expect(getDevAuthMode(preview)).toBe("preview");
    expect(getDevAuthMode({ ...preview, VERCEL_TARGET_ENV: "staging" })).toBe("preview");
    expect(
      getDevAuthMode({
        ...preview,
        NEXT_PUBLIC_SUPABASE_URL: `${preview.NEXT_PUBLIC_SUPABASE_URL}/`,
      })
    ).toBe("preview");
  });

  it.each([
    { VERCEL_ENV: "production" },
    { VERCEL_TARGET_ENV: "production" },
    { VERCEL_ENV: "production", NODE_ENV: "development" },
    { VERCEL_ENV: undefined },
    { VERCEL_ENV: "development", NODE_ENV: "development" },
    { PREVIEW_DEV_AUTH_ENABLED: "false" },
    { PREVIEW_DEV_AUTH_ENABLED: "TRUE" },
  ])("blocks deployment overrides %j", (overrides) => {
    expect(getDevAuthMode({ ...preview, ...overrides })).toBeNull();
  });

  it.each([
    "PREVIEW_DEV_AUTH_ENABLED",
    "PREVIEW_DEV_AUTH_PROJECT_REF",
    "PREVIEW_DEV_AUTH_EMAIL",
    "PREVIEW_DEV_AUTH_PASSWORD",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ])("keeps incomplete preview setup disabled when %s is missing", (key) => {
    expect(getDevAuthMode({ ...preview, [key]: undefined })).toBeNull();
  });

  it("rejects the production database even if explicitly selected", () => {
    expect(
      getDevAuthMode({
        ...preview,
        PREVIEW_DEV_AUTH_PROJECT_REF: PRODUCTION_SUPABASE_PROJECT_REF,
        NEXT_PUBLIC_SUPABASE_URL: `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`,
      })
    ).toBeNull();
  });

  it.each([
    `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`,
    `http://${projectRef}.supabase.co`,
    `https://${projectRef}.supabase.co.evil.example`,
    `https://${projectRef}.supabase.co?target=production`,
    "https://custom-auth.example.com",
  ])("rejects a Supabase URL that does not match the staging project: %s", (url) => {
    expect(getDevAuthMode({ ...preview, NEXT_PUBLIC_SUPABASE_URL: url })).toBeNull();
  });

  it("preserves local development but refuses a deployed development build", () => {
    expect(getDevAuthMode({ NODE_ENV: "development" })).toBe("local");
    expect(getDevAuthMode({ NODE_ENV: "development", VERCEL: "1" })).toBeNull();
    expect(getDevAuthMode({ NODE_ENV: "production" })).toBeNull();
    expect(getDevAuthMode({ NODE_ENV: "test" })).toBeNull();
  });
});

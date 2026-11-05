import { describe, expect, it } from "vitest";
import { isMotionTuningBuild } from "@/lib/motion-tuning";

describe("isMotionTuningBuild", () => {
  it("allows Vercel preview and staging builds", () => {
    expect(isMotionTuningBuild({ VERCEL_ENV: "preview" })).toBe(true);
    expect(isMotionTuningBuild({ VERCEL_ENV: "preview", VERCEL_TARGET_ENV: "staging" })).toBe(true);
  });

  it("never allows production", () => {
    expect(isMotionTuningBuild({ VERCEL_ENV: "production" })).toBe(false);
    expect(isMotionTuningBuild({ VERCEL_ENV: "preview", VERCEL_TARGET_ENV: "production" })).toBe(
      false
    );
  });

  it("is off for builds outside Vercel", () => {
    expect(isMotionTuningBuild({})).toBe(false);
    expect(isMotionTuningBuild({ NODE_ENV: "production" })).toBe(false);
  });
});

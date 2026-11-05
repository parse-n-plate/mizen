/**
 * Whether a build may show Dialkit motion-tuning panels.
 *
 * Read at build time by next.config.ts and inlined as MIZEN_MOTION_TUNING, so
 * production builds compile the panels out entirely. Allowed for Vercel
 * preview/staging builds only; never when Vercel says the target is production.
 * Local `next dev` is handled separately via NODE_ENV.
 */
export function isMotionTuningBuild(env: Readonly<Record<string, string | undefined>>): boolean {
  if (env.VERCEL_ENV === "production" || env.VERCEL_TARGET_ENV === "production") return false;
  return env.VERCEL_ENV === "preview";
}

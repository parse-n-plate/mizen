// Keep the production project blocked even if preview settings are misconfigured.
export const PRODUCTION_SUPABASE_PROJECT_REF = "caalzsewxononwiqlklv";

export function getDevAuthMode(
  env: Readonly<Record<string, string | undefined>> = {
    ...process.env,
    // Match the build-time public configuration used by the Supabase clients.
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
): "local" | "preview" | null {
  if (env.VERCEL_ENV === "production" || env.VERCEL_TARGET_ENV === "production") return null;

  if (env.NODE_ENV === "development" && !env.VERCEL && !env.VERCEL_ENV && !env.VERCEL_TARGET_ENV) {
    return "local";
  }

  if (env.VERCEL_ENV !== "preview" || env.PREVIEW_DEV_AUTH_ENABLED !== "true") return null;

  const projectRef = env.PREVIEW_DEV_AUTH_PROJECT_REF;
  if (
    !projectRef ||
    !/^[a-z]{20}$/.test(projectRef) ||
    projectRef === PRODUCTION_SUPABASE_PROJECT_REF ||
    env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") !== `https://${projectRef}.supabase.co` ||
    !env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !env.SUPABASE_SERVICE_ROLE_KEY ||
    !env.PREVIEW_DEV_AUTH_EMAIL ||
    !env.PREVIEW_DEV_AUTH_PASSWORD
  ) {
    return null;
  }

  return "preview";
}

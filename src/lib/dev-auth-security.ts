import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export function isSameOriginDevSignIn(request: Request): boolean {
  if (request.headers.get("origin") !== new URL(request.url).origin) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  return fetchSite === null || fetchSite === "same-origin";
}

export async function consumePreviewDevSignInAttempt(): Promise<number> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Preview sign-in limit is unavailable");

  // One shared bucket per test account, regardless of deployment or request headers.
  const accountKey = createHash("sha256")
    .update(
      `${process.env.PREVIEW_DEV_AUTH_PROJECT_REF}:${process.env.PREVIEW_DEV_AUTH_EMAIL!.trim().toLowerCase()}`
    )
    .digest("hex");
  const { data, error } = await admin.rpc("consume_preview_dev_signin_attempt", {
    p_account_key: accountKey,
  });
  if (error || !Number.isInteger(data) || data < 0 || data > 60) {
    throw new Error("Preview sign-in limit is unavailable");
  }
  return data;
}

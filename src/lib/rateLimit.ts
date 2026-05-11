import { createHmac } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "rateLimit" });

export const PARSE_LIMIT_AUTHED = 10;
export const PARSE_LIMIT_ANON = 3;

export type ParseUsage = {
  used: number;
  limit: number;
  resetAt: string;
  anonymous: boolean;
};

export type RateLimitResult =
  | { ok: true; usage: ParseUsage }
  | { ok: false; usage: ParseUsage }
  // Storage is unreachable — caller decides whether to fail open or closed.
  | { ok: "skipped"; usage: null };

export function extractClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return null;
}

let warnedMissingSalt = false;
export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_IP_SALT;
  if (!salt) {
    if (!warnedMissingSalt) {
      log.warn("RATE_LIMIT_IP_SALT is not set — IPs will be hashed with a static fallback");
      warnedMissingSalt = true;
    }
  }
  return createHmac("sha256", salt ?? "mizen-rate-limit-default-salt")
    .update(ip)
    .digest("hex");
}

export async function checkAndIncrementParseUsage({
  userId,
  ipHash,
  limit,
}: {
  userId: string | null;
  ipHash: string | null;
  limit: number;
}): Promise<RateLimitResult> {
  if ((userId === null) === (ipHash === null)) {
    throw new Error("Exactly one of userId or ipHash must be provided");
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return { ok: "skipped", usage: null };
  }

  const { data, error } = await supabase.rpc("increment_parse_usage", {
    p_user_id: userId,
    p_ip_hash: ipHash,
    p_limit: limit,
  });

  if (error || !data) {
    log.error({ err: error }, "increment_parse_usage RPC failed");
    return { ok: "skipped", usage: null };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: "skipped", usage: null };

  const usage: ParseUsage = {
    used: row.used,
    limit: row.limit,
    resetAt: new Date(row.reset_at).toISOString(),
    anonymous: userId === null,
  };

  return row.allowed ? { ok: true, usage } : { ok: false, usage };
}

import { z } from "zod";

const ExtensionSaveRequestSchema = z.object({
  url: z.string().trim().min(1).max(2_048),
  title: z.string().trim().min(1).max(500),
});

export type ExtensionSaveRequest = z.infer<typeof ExtensionSaveRequestSchema>;

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 0
  );
}

function isPrivateIpv6(hostname: string): boolean {
  if (!hostname.includes(":")) return false;

  const normalized = hostname.toLowerCase();
  const firstGroup = normalized.split(":", 1)[0];
  const firstValue = Number.parseInt(firstGroup || "0", 16);

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    (Number.isInteger(firstValue) &&
      ((firstValue >= 0xfc00 && firstValue <= 0xfdff) ||
        (firstValue >= 0xfe80 && firstValue <= 0xfebf)))
  );
}

export function isNormalWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) return false;
    if (hostname.endsWith(".local") || isPrivateIpv4(hostname) || isPrivateIpv6(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function parseExtensionSaveRequest(value: unknown): ExtensionSaveRequest | null {
  const result = ExtensionSaveRequestSchema.safeParse(value);
  if (!result.success || !isNormalWebUrl(result.data.url)) return null;
  return result.data;
}

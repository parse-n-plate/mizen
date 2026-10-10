export function isPublicLegalPage(pathname: string): boolean {
  return pathname === "/privacy" || pathname === "/terms";
}

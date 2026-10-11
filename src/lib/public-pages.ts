export const PUBLIC_PAGE_PATHS = [
  "/get-started",
  "/changelog",
  "/links",
  "/privacy",
  "/terms",
  "/homepage",
  "/faq",
] as const;

export function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGE_PATHS.some((path) => path === pathname);
}

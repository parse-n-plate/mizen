export const PUBLIC_PAGE_PATHS = ["/privacy", "/terms"] as const;

export function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGE_PATHS.some((path) => path === pathname);
}

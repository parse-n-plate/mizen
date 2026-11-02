export const PUBLIC_PAGE_PATHS = ["/privacy", "/terms", "/faq", "/links"] as const;

export function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGE_PATHS.some((path) => path === pathname);
}

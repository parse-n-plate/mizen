export const BRAND_GUIDELINES_GROUPS = [
  {
    title: "Identity",
    items: [
      { title: "Overview", slug: "overview" },
      { title: "Logo", slug: "logo" },
      { title: "Color", slug: "color" },
      { title: "Typography", slug: "typography" },
    ],
  },
  {
    title: "Expression",
    items: [{ title: "Voice", slug: "voice" }],
  },
  {
    title: "Resources",
    items: [{ title: "Assets", slug: "assets" }],
  },
] as const;

export type BrandGuidelinesSlug = (typeof BRAND_GUIDELINES_GROUPS)[number]["items"][number]["slug"];

export const BRAND_GUIDELINES_SLUGS = BRAND_GUIDELINES_GROUPS.flatMap((group) =>
  group.items.map((item) => item.slug)
);

export function getBrandGuidelinesPath(slug: BrandGuidelinesSlug) {
  return slug === "overview" ? "/design-system/brand" : `/design-system/brand/${slug}`;
}

export function isBrandGuidelinesSlug(value: string): value is BrandGuidelinesSlug {
  return BRAND_GUIDELINES_SLUGS.includes(value as BrandGuidelinesSlug);
}

export function getAdjacentBrandGuidelinesSlugs(slug: BrandGuidelinesSlug) {
  const index = BRAND_GUIDELINES_SLUGS.indexOf(slug);
  return {
    previous: index > 0 ? BRAND_GUIDELINES_SLUGS[index - 1] : null,
    next: index < BRAND_GUIDELINES_SLUGS.length - 1 ? BRAND_GUIDELINES_SLUGS[index + 1] : null,
  };
}

export const DESIGN_SYSTEM_GROUPS = [
  {
    title: "Foundations",
    items: [
      { title: "Overview", slug: "overview" },
      { title: "Tokens", slug: "tokens" },
      { title: "Typography", slug: "typography" },
      { title: "Spacing", slug: "spacing" },
      { title: "Iconography", slug: "iconography" },
    ],
  },
  {
    title: "UI primitives",
    items: [
      { title: "Buttons", slug: "buttons" },
      { title: "Cards", slug: "cards" },
      { title: "Badges", slug: "badges" },
      { title: "Inputs", slug: "inputs" },
      { title: "Selection controls", slug: "selection-controls" },
      { title: "Tabs", slug: "tabs" },
      { title: "Menus", slug: "menus" },
      { title: "Command palette", slug: "command-palette" },
      { title: "Dialogs", slug: "dialogs" },
      { title: "Drawers", slug: "drawers" },
      { title: "Tooltips", slug: "tooltips" },
      { title: "Toasts", slug: "toasts" },
      { title: "Avatars", slug: "avatars" },
      { title: "Loading", slug: "loading" },
      { title: "Separators", slug: "separators" },
    ],
  },
  {
    title: "Product components",
    items: [
      { title: "Recipe cards", slug: "recipe-cards" },
      { title: "Recipe header", slug: "recipe-header" },
      { title: "Recipe tabs", slug: "recipe-tabs" },
      { title: "Recipe actions", slug: "recipe-actions" },
      { title: "Ingredients", slug: "ingredients" },
      { title: "Steps", slug: "steps" },
      { title: "Equipment", slug: "equipment" },
      { title: "Servings", slug: "servings" },
      { title: "Search", slug: "search" },
      { title: "Navigation", slug: "navigation" },
      { title: "Settings", slug: "settings" },
      { title: "Auth", slug: "auth" },
      { title: "Media", slug: "media" },
      { title: "Release notices", slug: "release-notices" },
      { title: "Splash screen", slug: "splash-screen" },
    ],
  },
  {
    title: "Patterns",
    items: [
      { title: "Import flow", slug: "import-flow" },
      { title: "Recipe view", slug: "recipe-view" },
      { title: "Cookbook", slug: "cookbook" },
      { title: "Feedback", slug: "feedback" },
    ],
  },
] as const;

export type DesignSystemSlug = (typeof DESIGN_SYSTEM_GROUPS)[number]["items"][number]["slug"];

export const DESIGN_SYSTEM_SLUGS = DESIGN_SYSTEM_GROUPS.flatMap((group) =>
  group.items.map((item) => item.slug)
);

export function getDesignSystemPath(slug: DesignSystemSlug) {
  return slug === "overview" ? "/design-system" : `/design-system/${slug}`;
}

export function isDesignSystemSlug(value: string): value is DesignSystemSlug {
  return DESIGN_SYSTEM_SLUGS.includes(value as DesignSystemSlug);
}

export function getAdjacentDesignSystemSlugs(slug: DesignSystemSlug) {
  const index = DESIGN_SYSTEM_SLUGS.indexOf(slug);
  return {
    previous: index > 0 ? DESIGN_SYSTEM_SLUGS[index - 1] : null,
    next: index < DESIGN_SYSTEM_SLUGS.length - 1 ? DESIGN_SYSTEM_SLUGS[index + 1] : null,
  };
}

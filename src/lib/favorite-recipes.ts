export type FavoriteRecipeSlug = "banana-bread-cookies" | "kimchi-ragu";

export type FavoriteRecipe = {
  slug: FavoriteRecipeSlug;
  title: string;
  href: `/recipes/${FavoriteRecipeSlug}`;
  url: string;
  domain: string;
  authorName: string;
  authorUrl: string;
  avatar: string;
  avatarAlt: string;
};

export const favoriteRecipes: FavoriteRecipe[] = [
  {
    slug: "banana-bread-cookies",
    title: "Banana Bread Cookies",
    href: "/recipes/banana-bread-cookies",
    url: "https://mizen.recipes/recipes/banana-bread-cookies",
    domain: "flouringkitchen.com",
    authorName: "Mary at Flouring Kitchen",
    authorUrl: "https://flouringkitchen.com/banana-bread-cookies/#recipe",
    avatar: "/assets/avatars/Michelle_Avatar_2026.jpg",
    avatarAlt: "Michelle",
  },
  {
    slug: "kimchi-ragu",
    title: "Kimchi Ragu",
    href: "/recipes/kimchi-ragu",
    url: "https://mizen.recipes/recipes/kimchi-ragu",
    domain: "shychef.com",
    authorName: "Shy Chef",
    authorUrl: "https://shychef.com/kimchi-ragu",
    avatar: "/assets/avatars/Gage_Avatar_2026.jpg",
    avatarAlt: "Gage",
  },
];

export function getFavoriteRecipe(slug: string): FavoriteRecipe | undefined {
  return favoriteRecipes.find((recipe) => recipe.slug === slug);
}

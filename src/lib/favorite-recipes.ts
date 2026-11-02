export type FavoriteRecipe = {
  title: string;
  domain: string;
  authorName: string;
  authorUrl: string;
  avatar: string;
  avatarAlt: string;
};

export const favoriteRecipes: FavoriteRecipe[] = [
  {
    title: "Banana Bread Cookies",
    domain: "flouringkitchen.com",
    authorName: "Mary at Flouring Kitchen",
    authorUrl: "https://flouringkitchen.com/banana-bread-cookies/#recipe",
    avatar: "/assets/avatars/Michelle_Avatar_2026.jpg",
    avatarAlt: "Michelle",
  },
  {
    title: "Kimchi Ragu",
    domain: "shychef.com",
    authorName: "Shy Chef",
    authorUrl: "https://shychef.com/kimchi-ragu",
    avatar: "/assets/avatars/Gage_Avatar_2026.jpg",
    avatarAlt: "Gage",
  },
];

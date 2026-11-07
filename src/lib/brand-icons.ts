/**
 * Mizen's illustrated brand icons. These are the same assets the product uses
 * (landing hero, recipe tabs, splash screen), gathered in one place so brand
 * surfaces such as the design-system Assets page and the X post templates pull
 * from a single list.
 *
 * The kitchen set in /assets/brand-icons/ is cut from the splash screen's
 * sprite sheets (/assets/splash/*.png), which the splash screen still uses.
 */

export type BrandIconId =
  | "book"
  | "pot"
  | "knife"
  | "pan"
  | "fish"
  | "cutting-board"
  | "egg-timer"
  | "egg"
  | "measuring-cup"
  | "plate"
  | "rolling-pin"
  | "ruler"
  | "saucepan"
  | "skillet-eggs"
  | "tomato"
  | "whisk"
  | "wooden-spoon";

export type BrandIcon = {
  id: BrandIconId;
  name: string;
  src: string;
  /** Width ÷ height of the artwork, so it can be sized by height. */
  aspect: number;
  /** Where the asset already appears in the product. */
  usage: string;
};

export const BRAND_ICONS: readonly BrandIcon[] = [
  {
    id: "book",
    name: "Recipe book",
    src: "/assets/hero-book.svg",
    aspect: 243.611 / 172.926,
    usage: "Landing page headline",
  },
  {
    id: "pot",
    name: "Pot",
    src: "/assets/hero-pot.svg",
    aspect: 248 / 204,
    usage: "Landing page headline",
  },
  {
    id: "knife",
    name: "Prep knife",
    src: "/assets/icon-prep.png",
    aspect: 1,
    usage: "Prep tab",
  },
  {
    id: "pan",
    name: "Cook pan",
    src: "/assets/icon-cook.svg",
    aspect: 1,
    usage: "Cook tab",
  },
  {
    id: "fish",
    name: "Mizen fish",
    src: "/assets/icons/Fish%20Logo.svg",
    aspect: 387 / 338,
    usage: "App icon mark",
  },
  {
    id: "cutting-board",
    name: "Cutting board",
    src: "/assets/brand-icons/cutting-board.png",
    aspect: 259 / 264,
    usage: "Splash screen set",
  },
  {
    id: "egg-timer",
    name: "Egg timer",
    src: "/assets/brand-icons/egg-timer.png",
    aspect: 212 / 262,
    usage: "Splash screen set",
  },
  {
    id: "egg",
    name: "Egg",
    src: "/assets/brand-icons/egg.png",
    aspect: 289 / 360,
    usage: "Splash screen set",
  },
  {
    id: "measuring-cup",
    name: "Measuring cup",
    src: "/assets/brand-icons/measuring-cup.png",
    aspect: 267 / 208,
    usage: "Splash screen set",
  },
  {
    id: "plate",
    name: "Plate",
    src: "/assets/brand-icons/plate.png",
    aspect: 360 / 188,
    usage: "Splash screen set",
  },
  {
    id: "rolling-pin",
    name: "Rolling pin",
    src: "/assets/brand-icons/rolling-pin.png",
    aspect: 270 / 247,
    usage: "Splash screen set",
  },
  {
    id: "ruler",
    name: "Ruler",
    src: "/assets/brand-icons/ruler.png",
    aspect: 130 / 360,
    usage: "Splash screen set",
  },
  {
    id: "saucepan",
    name: "Saucepan",
    src: "/assets/brand-icons/saucepan.png",
    aspect: 285 / 214,
    usage: "Splash screen set",
  },
  {
    id: "skillet-eggs",
    name: "Skillet with eggs",
    src: "/assets/brand-icons/skillet-eggs.png",
    aspect: 263 / 250,
    usage: "Splash screen set",
  },
  {
    id: "tomato",
    name: "Tomato",
    src: "/assets/brand-icons/tomato.png",
    aspect: 340 / 360,
    usage: "Splash screen set",
  },
  {
    id: "whisk",
    name: "Whisk",
    src: "/assets/brand-icons/whisk.png",
    aspect: 244 / 271,
    usage: "Splash screen set",
  },
  {
    id: "wooden-spoon",
    name: "Wooden spoon",
    src: "/assets/brand-icons/wooden-spoon.png",
    aspect: 259 / 271,
    usage: "Splash screen set",
  },
];

export const BRAND_ICONS_BY_ID = Object.fromEntries(
  BRAND_ICONS.map((icon) => [icon.id, icon])
) as Record<BrandIconId, BrandIcon>;

/**
 * Colors for the logged-out sunset homepage, shared by the page's own
 * backgrounds and by the mobile Safari edge-color system (the two fixed edge
 * strips, the html/body backgrounds, and the theme-color meta tag).
 *
 * The page paints its backgrounds from CSS variables built here
 * (`sunsetPaletteStyle`), and `computeSunsetEdgeColors` samples those same
 * layers at the top and bottom of the viewport. Change a color in one place
 * and both the page and Safari's toolbars follow.
 *
 * Technique: https://joshpuckett.me/seamless-mobile-safari
 */

import type { CSSProperties } from "react";

export type Rgb = readonly [number, number, number];

export const SUNSET_PALETTE = {
  light: {
    base: "#ffffff",
    skyMid: "#b2e3fe",
    skyEnd: "#7cc4f9",
  },
  dark: {
    base: "#0c0a09", // stone-950; dark mode is a flat color
  },
} as const;

/** Light-mode sky: transparent → skyMid at 33% → skyEnd at the bottom. */
export const SKY_MID_STOP = 0.33;

function hexToRgb(hex: string): Rgb {
  const value = parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b]
    .map((channel) =>
      Math.round(Math.min(255, Math.max(0, channel)))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

function over(base: Rgb, color: Rgb, alpha: number): Rgb {
  return [
    base[0] + (color[0] - base[0]) * alpha,
    base[1] + (color[1] - base[1]) * alpha,
    base[2] + (color[2] - base[2]) * alpha,
  ];
}

/**
 * CSS variables for the sunset page root. The page's Tailwind classes read
 * these, so the visible backgrounds and the sampled edge colors share values.
 */
export const sunsetPaletteStyle = {
  "--sunset-base-light": SUNSET_PALETTE.light.base,
  "--sunset-base-dark": SUNSET_PALETTE.dark.base,
  "--sunset-sky": `linear-gradient(to bottom, transparent, ${SUNSET_PALETTE.light.skyMid} ${
    SKY_MID_STOP * 100
  }%, ${SUNSET_PALETTE.light.skyEnd})`,
} as CSSProperties;

/** An element box in viewport coordinates (as from getBoundingClientRect). */
export type Box = { top: number; height: number; width: number };

export type EdgeColorInput = {
  theme: "light" | "dark";
  /** Visible viewport height (Safari's toolbar changes this as it collapses). */
  viewportHeight: number;
  /** The landing page root, used to keep samples on the page. */
  page: Box;
  /** The light-mode sky gradient layer. */
  sky?: Box | null;
};

export type EdgeColors = { top: string; bottom: string };

function skyColorAt(y: number, sky: Box, base: Rgb): Rgb {
  if (sky.height <= 0 || y < sky.top) return base;
  const t = Math.min(1, (y - sky.top) / sky.height);
  const mid = hexToRgb(SUNSET_PALETTE.light.skyMid);
  if (t <= SKY_MID_STOP) return over(base, mid, t / SKY_MID_STOP);
  const end = hexToRgb(SUNSET_PALETTE.light.skyEnd);
  return over(mid, end, (t - SKY_MID_STOP) / (1 - SKY_MID_STOP));
}

function colorAt(y: number, input: EdgeColorInput): Rgb {
  if (input.theme === "dark") return hexToRgb(SUNSET_PALETTE.dark.base);
  const base = hexToRgb(SUNSET_PALETTE.light.base);
  return input.sky ? skyColorAt(y, input.sky, base) : base;
}

/**
 * The page colors currently showing at the top and bottom edges of the
 * viewport. Samples are clamped to the page so rubber-band overscroll keeps
 * the nearest real color.
 */
export function computeSunsetEdgeColors(input: EdgeColorInput): EdgeColors {
  const pageTop = input.page.top;
  const pageBottom = input.page.top + input.page.height - 1;
  const clamp = (y: number) => Math.min(Math.max(y, pageTop), Math.max(pageTop, pageBottom));

  return {
    top: toHex(colorAt(clamp(0), input)),
    bottom: toHex(colorAt(clamp(input.viewportHeight - 1), input)),
  };
}

/**
 * Edge colors for a typical phone at the top of the page, used before the
 * page has been measured (first paint), so Safari picks the right bar colors
 * as soon as it loads. The hook refines them once the page is on screen.
 */
function firstPaintColors(theme: "light" | "dark"): EdgeColors {
  const width = 390;
  const height = 844;
  const page = { top: 0, height: height * 4, width };
  return computeSunsetEdgeColors({
    theme,
    viewportHeight: height,
    page,
    sky: { top: page.height - 1380, height: 1380, width },
  });
}

export const SUNSET_FIRST_PAINT_COLORS = {
  light: firstPaintColors("light"),
  dark: firstPaintColors("dark"),
} as const;

/** Attribute on <html> that turns on the edge strips and edge backgrounds. */
export const SUNSET_EDGES_ATTRIBUTE = "data-sunset-edges";

/**
 * Inline <head> script. On `/` with no Supabase session cookie (signed out),
 * it turns the edge system on before first paint: edge strips visible,
 * html/body backgrounds, theme-color and viewport-fit=cover. Original meta
 * values are kept in `data-original-content` so leaving the page can restore
 * them. Signed-in visitors are untouched; if the session turns out to be
 * stale, the hook turns the system on once the sunset page mounts.
 */
export const sunsetEdgesHeadScript = `(function(){try{
if(location.pathname!=="/")return;
if(/(?:^|;\\s*)sb-[^=]*-auth-token/.test(document.cookie))return;
var d=document.documentElement,dark=d.classList.contains("dark");
var c=dark?${JSON.stringify(SUNSET_FIRST_PAINT_COLORS.dark)}:${JSON.stringify(SUNSET_FIRST_PAINT_COLORS.light)};
d.setAttribute("${SUNSET_EDGES_ATTRIBUTE}","true");
d.style.setProperty("--edge-top-background",c.top);
d.style.setProperty("--edge-bottom-background",c.bottom);
var m=document.querySelectorAll('meta[name="theme-color"]');
for(var i=0;i<m.length;i++){if(m[i].dataset.originalContent==null)m[i].dataset.originalContent=m[i].content;m[i].content=c.top}
var v=document.querySelector('meta[name="viewport"]');
if(v&&v.content.indexOf("viewport-fit")<0){v.dataset.originalContent=v.content;v.content+=", viewport-fit=cover"}
}catch(e){}})()`;

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
    base: "#0c0a09", // stone-950
    wash: "#18a1f7", // rgb(24 161 247)
  },
} as const;

/** Light-mode sky: transparent → skyMid at 33% → skyEnd at the bottom. */
export const SKY_MID_STOP = 0.33;

export type WashShape = {
  /** Peak opacity of the wash color at the ellipse center. */
  alpha: number;
  /** Center as a fraction of the element box (0 = left/top, 1 = right/bottom). */
  centerX: number;
  centerY: number;
  /** Horizontal radius as a fraction of the element width. */
  radiusX: number;
  /** Vertical radius as a fraction of the element height, or a pixel value. */
  radiusY: { fraction: number } | { px: number };
  /** Where the wash reaches full transparency, as a fraction of the radius. */
  stop: number;
};

/** Dark-mode blue washes. Keys match the elements they paint. */
export const SUNSET_WASHES = {
  heroTop: {
    alpha: 0.22,
    centerX: 0.5,
    centerY: 0,
    radiusX: 0.9,
    radiusY: { fraction: 0.6 },
    stop: 0.7,
  },
  heroBottom: {
    alpha: 0.16,
    centerX: 0.5,
    centerY: 1,
    radiusX: 0.6,
    radiusY: { fraction: 1 },
    stop: 0.7,
  },
  note: {
    alpha: 0.16,
    centerX: 0.5,
    centerY: 0,
    radiusX: 0.6,
    radiusY: { px: 420 },
    stop: 0.7,
  },
} as const satisfies Record<string, WashShape>;

export type SunsetWashKey = keyof typeof SUNSET_WASHES;

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

function rgbList(hex: string) {
  return hexToRgb(hex).join(" ");
}

function washGradient(shape: WashShape) {
  const ry = "px" in shape.radiusY ? `${shape.radiusY.px}px` : `${shape.radiusY.fraction * 100}%`;
  return `radial-gradient(ellipse ${shape.radiusX * 100}% ${ry} at ${shape.centerX * 100}% ${
    shape.centerY * 100
  }%, rgb(${rgbList(SUNSET_PALETTE.dark.wash)} / ${shape.alpha}), transparent ${shape.stop * 100}%)`;
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
  "--sunset-wash-hero-top": washGradient(SUNSET_WASHES.heroTop),
  "--sunset-wash-hero-bottom": washGradient(SUNSET_WASHES.heroBottom),
  "--sunset-wash-note": washGradient(SUNSET_WASHES.note),
} as CSSProperties;

/** An element box in viewport coordinates (as from getBoundingClientRect). */
export type Box = { top: number; height: number; width: number };

export type EdgeColorInput = {
  theme: "light" | "dark";
  /** Visible viewport height (Safari's toolbar changes this as it collapses). */
  viewportHeight: number;
  viewportWidth: number;
  /** The landing page root, used to keep samples on the page. */
  page: Box;
  /** The light-mode sky gradient layer. */
  sky?: Box | null;
  /** The dark-mode wash layers. */
  washes?: Partial<Record<SunsetWashKey, Box | null>>;
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

const HORIZONTAL_SAMPLES = 24;

/**
 * Average opacity of a wash across the full viewport width at height `y`.
 * Safari paints its toolbar with one color, so the strip uses the average.
 */
function washAlphaAt(y: number, box: Box, shape: WashShape, viewportWidth: number): number {
  if (y < box.top || y > box.top + box.height || box.width <= 0) return 0;
  const rx = shape.radiusX * box.width;
  const ry = "px" in shape.radiusY ? shape.radiusY.px : shape.radiusY.fraction * box.height;
  if (rx <= 0 || ry <= 0) return 0;
  const cx = shape.centerX * box.width;
  const dy = (y - (box.top + shape.centerY * box.height)) / ry;
  const width = Math.min(viewportWidth, box.width);
  let total = 0;
  for (let i = 0; i < HORIZONTAL_SAMPLES; i++) {
    const x = ((i + 0.5) / HORIZONTAL_SAMPLES) * width;
    const r = Math.hypot((x - cx) / rx, dy);
    if (r < shape.stop) total += shape.alpha * (1 - r / shape.stop);
  }
  return total / HORIZONTAL_SAMPLES;
}

function colorAt(y: number, input: EdgeColorInput): Rgb {
  if (input.theme === "light") {
    const base = hexToRgb(SUNSET_PALETTE.light.base);
    return input.sky ? skyColorAt(y, input.sky, base) : base;
  }

  let color = hexToRgb(SUNSET_PALETTE.dark.base);
  const wash = hexToRgb(SUNSET_PALETTE.dark.wash);
  for (const key of Object.keys(SUNSET_WASHES) as SunsetWashKey[]) {
    const box = input.washes?.[key];
    if (!box) continue;
    const alpha = washAlphaAt(y, box, SUNSET_WASHES[key], input.viewportWidth);
    if (alpha > 0) color = over(color, wash, alpha);
  }
  return color;
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

/** Starting colors before anything has been measured. */
export function defaultSunsetEdgeColors(theme: "light" | "dark"): EdgeColors {
  const base = SUNSET_PALETTE[theme].base;
  return { top: base, bottom: base };
}

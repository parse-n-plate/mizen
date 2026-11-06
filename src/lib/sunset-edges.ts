/**
 * One set of color values for the logged-out sunset homepage background.
 *
 * The page paints its sky from these layers, and the Safari edge strips
 * (see SafariEdgeColors) repaint the exact same layers, offset to wherever
 * the page currently sits behind the status bar and the bottom toolbar. The
 * solid `theme-color` and html/body backgrounds are sampled from the same
 * data, so every surface agrees.
 */

type Rgba = readonly [r: number, g: number, b: number, a: number];
type Stop = { color: Rgba; at: number };
type Length = `${number}%` | `${number}px`;

export type EdgeLayer =
  | { kind: "linear"; stops: readonly Stop[] }
  | { kind: "radial"; rx: Length; ry: Length; at: "top" | "bottom"; stops: readonly Stop[] };

export type EdgeTheme = "light" | "dark";

const SKY_MID: Rgba = [178, 227, 254, 1]; // #B2E3FE
const SKY_LOW: Rgba = [124, 196, 249, 1]; // #7CC4F9
const BLUE = (alpha: number): Rgba => [24, 161, 247, alpha];

export const SUNSET_BASE: Record<EdgeTheme, string> = {
  light: "#ffffff",
  // Tailwind's stone-950.
  dark: "#0c0a09",
};

/** Light mode: the sky that fills the bottom of the page. */
export const SUNSET_LIGHT_SKY: EdgeLayer = {
  kind: "linear",
  stops: [
    { color: [SKY_MID[0], SKY_MID[1], SKY_MID[2], 0], at: 0 },
    { color: SKY_MID, at: 0.33 },
    { color: SKY_LOW, at: 1 },
  ],
};

/** Dark mode: blue wash at the top of the hero. */
export const SUNSET_DARK_HERO: EdgeLayer = {
  kind: "radial",
  rx: "90%",
  ry: "60%",
  at: "top",
  stops: [
    { color: BLUE(0.22), at: 0 },
    { color: BLUE(0), at: 0.7 },
  ],
};

/** Dark mode: glow along the bottom of the hero. */
export const SUNSET_DARK_HERO_FLOOR: EdgeLayer = {
  kind: "radial",
  rx: "60%",
  ry: "100%",
  at: "bottom",
  stops: [
    { color: BLUE(0.16), at: 0 },
    { color: BLUE(0), at: 0.7 },
  ],
};

/** Dark mode: wash behind the top of the note. */
export const SUNSET_DARK_NOTE: EdgeLayer = {
  kind: "radial",
  rx: "60%",
  ry: "420px",
  at: "top",
  stops: [
    { color: BLUE(0.16), at: 0 },
    { color: BLUE(0), at: 0.7 },
  ],
};

function stopCss({ color: [r, g, b, a], at }: Stop) {
  return `rgb(${r} ${g} ${b} / ${a}) ${+(at * 100).toFixed(2)}%`;
}

export function edgeLayerCss(layer: EdgeLayer): string {
  const stops = layer.stops.map(stopCss).join(", ");
  if (layer.kind === "linear") return `linear-gradient(to bottom, ${stops})`;
  const y = layer.at === "top" ? "0%" : "100%";
  return `radial-gradient(ellipse ${layer.rx} ${layer.ry} at 50% ${y}, ${stops})`;
}

type Box = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};
export type PlacedLayer = { layer: EdgeLayer; css: string; rect: Box };

/**
 * A CSS `background` value that repaints the given layers inside a strip.
 * Offsets are anchored to the strip's top (for `.edge-top`) or bottom (for
 * `.edge-bottom`) edge so the strip's taller fade pseudo-element, which shares
 * that edge, lines up with the page too.
 */
export function stripBackground(
  layers: readonly PlacedLayer[],
  base: string,
  strip: Box,
  anchor: "top" | "bottom"
): string {
  // CSS lists the top-most background layer first; `layers` is in paint order.
  const parts = [...layers].reverse().map(({ css, rect }) => {
    const x = Math.round(rect.left - strip.left);
    const y =
      anchor === "top"
        ? `top ${Math.round(rect.top - strip.top)}px`
        : `bottom ${Math.round(strip.bottom - rect.bottom)}px`;
    return `${css} left ${x}px ${y} / ${Math.round(rect.width)}px ${Math.round(rect.height)}px no-repeat`;
  });
  parts.push(base);
  return parts.join(", ");
}

function resolve(length: Length, size: number) {
  const value = parseFloat(length);
  return length.endsWith("%") ? (value / 100) * size : value;
}

/** Premultiplied color of a gradient at position `t` along its line. */
function colorAt(stops: readonly Stop[], t: number): Rgba {
  const premul = (c: Rgba): Rgba => [c[0] * c[3], c[1] * c[3], c[2] * c[3], c[3]];
  if (t <= stops[0].at) return premul(stops[0].color);
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    if (t <= b.at) {
      const k = b.at === a.at ? 1 : (t - a.at) / (b.at - a.at);
      const pa = premul(a.color);
      const pb = premul(b.color);
      return [0, 1, 2, 3].map((j) => pa[j] + (pb[j] - pa[j]) * k) as unknown as Rgba;
    }
  }
  return premul(stops[stops.length - 1].color);
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(rgb: readonly number[]) {
  return `#${rgb
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

/**
 * The solid color the page shows at viewport point (x, y), from the same
 * layers the strips paint. Used for `theme-color` and the html/body
 * backgrounds, which can only take a single color.
 */
export function sampleEdgeColor(
  layers: readonly PlacedLayer[],
  base: string,
  x: number,
  y: number
): string {
  let out: number[] = hexToRgb(base);
  for (const { layer, rect } of layers) {
    const lx = x - rect.left;
    const ly = y - rect.top;
    if (lx < 0 || ly < 0 || lx > rect.width || ly > rect.height) continue;
    let t: number;
    if (layer.kind === "linear") {
      t = rect.height ? ly / rect.height : 0;
    } else {
      const rx = resolve(layer.rx, rect.width) || 1;
      const ry = resolve(layer.ry, rect.height) || 1;
      const cy = layer.at === "top" ? 0 : rect.height;
      t = Math.hypot((lx - rect.width / 2) / rx, (ly - cy) / ry);
    }
    const [r, g, b, a] = colorAt(layer.stops, t);
    out = [r + out[0] * (1 - a), g + out[1] * (1 - a), b + out[2] * (1 - a)];
  }
  return rgbToHex(out);
}

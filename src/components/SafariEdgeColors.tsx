"use client";

import { useEffect, type RefObject } from "react";
import {
  edgeLayerCss,
  sampleEdgeColor,
  stripBackground,
  type EdgeLayer,
  type EdgeTheme,
  type PlacedLayer,
} from "@/lib/sunset-edges";

export type EdgeLayerSource = {
  ref: RefObject<HTMLElement | null>;
  theme: EdgeTheme;
  layer: EdgeLayer;
};

type Props = {
  /** Background layers in paint order (bottom-most first). */
  layers: readonly EdgeLayerSource[];
  base: Record<EdgeTheme, string>;
};

const VIEWPORT_FIT = "viewport-fit=cover";

/**
 * Matches mobile Safari's status bar and bottom toolbar to the page edges
 * (https://joshpuckett.me/seamless-mobile-safari):
 *
 * - two fixed, aria-hidden `.edge-top` / `.edge-bottom` strips appended to
 *   <body> (outside any transformed ancestor) that repaint the page
 *   background behind each edge,
 * - html background = top color, body background = bottom color,
 * - `theme-color` = top color,
 * - `viewport-fit=cover` while this is mounted.
 *
 * Everything is recalculated together on scroll, resize, Safari toolbar
 * changes, restored scroll positions, and theme changes, and every shared
 * document change is undone on unmount so none of it leaks into the app.
 */
export function SafariEdgeColors({ layers, base }: Props) {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const top = document.createElement("div");
    const bottom = document.createElement("div");
    top.className = "edge-top";
    bottom.className = "edge-bottom";
    for (const strip of [top, bottom]) {
      strip.setAttribute("aria-hidden", "true");
      body.appendChild(strip);
    }

    const prevHtmlBg = root.style.backgroundColor;
    const prevBodyBg = body.style.backgroundColor;

    let metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
    const prevMetas = metas.map((meta) => ({
      meta,
      content: meta.content,
      media: meta.getAttribute("media"),
    }));
    let createdMeta: HTMLMetaElement | null = null;
    if (metas.length === 0) {
      createdMeta = document.createElement("meta");
      createdMeta.name = "theme-color";
      document.head.appendChild(createdMeta);
      metas = [createdMeta];
    }
    // The page's theme follows the `.dark` class (which can differ from the OS
    // setting), so every theme-color tag gets the live color, without media.
    for (const meta of metas) meta.removeAttribute("media");

    const viewportMeta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const prevViewport = viewportMeta?.content ?? null;
    if (viewportMeta && !viewportMeta.content.includes("viewport-fit")) {
      viewportMeta.content = `${viewportMeta.content}, ${VIEWPORT_FIT}`;
    }

    let last = "";
    const apply = () => {
      frame = 0;
      const theme: EdgeTheme = root.classList.contains("dark") ? "dark" : "light";
      const placed: PlacedLayer[] = [];
      for (const source of layers) {
        const el = source.ref.current;
        if (source.theme !== theme || !el) continue;
        placed.push({
          layer: source.layer,
          css: edgeLayerCss(source.layer),
          rect: el.getBoundingClientRect(),
        });
      }
      const topRect = top.getBoundingClientRect();
      const bottomRect = bottom.getBoundingClientRect();
      const x = window.innerWidth / 2;
      const color = base[theme];
      const topColor = sampleEdgeColor(placed, color, x, topRect.top);
      const bottomColor = sampleEdgeColor(placed, color, x, bottomRect.bottom - 1);
      const topBg = stripBackground(placed, color, topRect, "top");
      const bottomBg = stripBackground(placed, color, bottomRect, "bottom");

      const key = `${topColor}|${bottomColor}|${topBg}|${bottomBg}`;
      if (key === last) return;
      last = key;
      top.style.setProperty("--edge-top-background", topBg);
      bottom.style.setProperty("--edge-bottom-background", bottomBg);
      root.style.backgroundColor = topColor;
      body.style.backgroundColor = bottomColor;
      for (const meta of metas) if (meta.content !== topColor) meta.content = topColor;
    };

    let frame = 0;
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();

    const vv = window.visualViewport;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    window.addEventListener("pageshow", schedule);
    vv?.addEventListener("resize", schedule);
    vv?.addEventListener("scroll", schedule);

    // Theme toggles flip the class on <html>.
    const themeObserver = new MutationObserver(schedule);
    themeObserver.observe(root, { attributes: true, attributeFilter: ["class"] });

    // Layout shifts (fonts, images, auth state) move the background layers.
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(body);
    for (const source of layers) if (source.ref.current) resizeObserver.observe(source.ref.current);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.removeEventListener("pageshow", schedule);
      vv?.removeEventListener("resize", schedule);
      vv?.removeEventListener("scroll", schedule);
      themeObserver.disconnect();
      resizeObserver.disconnect();

      top.remove();
      bottom.remove();
      root.style.backgroundColor = prevHtmlBg;
      body.style.backgroundColor = prevBodyBg;
      for (const { meta, content, media } of prevMetas) {
        meta.content = content;
        if (media !== null) meta.setAttribute("media", media);
      }
      createdMeta?.remove();
      if (viewportMeta && prevViewport !== null) viewportMeta.content = prevViewport;
    };
  }, [layers, base]);

  return null;
}

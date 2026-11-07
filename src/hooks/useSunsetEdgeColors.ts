"use client";

import { useEffect, type RefObject } from "react";
import {
  computeSunsetEdgeColors,
  SUNSET_EDGES_ATTRIBUTE,
  type Box,
  type EdgeColors,
} from "@/lib/sunset-edge-colors";

export type SunsetEdgeRefs = {
  page: RefObject<HTMLElement | null>;
  sky: RefObject<HTMLElement | null>;
};

function box(element: HTMLElement | null): Box | null {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { top: rect.top, height: rect.height, width: rect.width };
}

function visibleViewportHeight() {
  // Safari's toolbar grows and shrinks the visual viewport as you scroll.
  const vv = window.visualViewport;
  return vv ? vv.offsetTop + vv.height : window.innerHeight;
}

/** Remember a meta tag's value once, so it can be put back later. */
function rememberOriginal(meta: HTMLMetaElement) {
  if (meta.dataset.originalContent == null) meta.dataset.originalContent = meta.content;
}

function restoreOriginal(meta: HTMLMetaElement) {
  if (meta.dataset.originalContent == null) return;
  meta.content = meta.dataset.originalContent;
  delete meta.dataset.originalContent;
}

/**
 * Keeps mobile Safari's status bar and bottom toolbar tinted to match the
 * visible top and bottom edges of the sunset homepage.
 *
 * The head script in the root layout usually turns the edge system on before
 * first paint; this hook turns it on too (in case it didn't run), keeps the
 * colors current, and turns everything off on unmount so none of it leaks into
 * the signed-in app or other routes.
 */
export function useSunsetEdgeColors(refs: SunsetEdgeRefs) {
  useEffect(() => {
    const html = document.documentElement;

    html.setAttribute(SUNSET_EDGES_ATTRIBUTE, "true");

    const themeMetas = Array.from(
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    );
    themeMetas.forEach(rememberOriginal);

    // Let the page draw behind the status bar and home indicator.
    const viewportMeta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (viewportMeta && !viewportMeta.content.includes("viewport-fit")) {
      rememberOriginal(viewportMeta);
      viewportMeta.content = `${viewportMeta.content}, viewport-fit=cover`;
    }

    // Calculate once, apply everywhere: both strips and the html/body
    // backgrounds read these variables (see globals.css), plus theme-color.
    let last: EdgeColors | null = null;
    const apply = ({ top, bottom }: EdgeColors) => {
      html.style.setProperty("--edge-top-background", top);
      html.style.setProperty("--edge-bottom-background", bottom);
      for (const meta of themeMetas) meta.content = top;
    };

    let frame = 0;
    const update = () => {
      frame = 0;
      const page = box(refs.page.current);
      if (!page) return;
      const next = computeSunsetEdgeColors({
        theme: html.classList.contains("dark") ? "dark" : "light",
        viewportHeight: visibleViewportHeight(),
        page,
        sky: box(refs.sky.current),
      });
      if (last && last.top === next.top && last.bottom === next.bottom) return;
      last = next;
      apply(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();

    // Scrolling, restored scroll positions (incl. back/forward cache),
    // rotation and resizing.
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    window.addEventListener("pageshow", schedule);
    window.addEventListener("load", schedule);

    // Safari's toolbar expanding/collapsing changes the visual viewport only.
    const vv = window.visualViewport;
    vv?.addEventListener("resize", schedule);
    vv?.addEventListener("scroll", schedule);

    // Content height changes (fonts, images, note entrance) move the layers.
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    if (refs.page.current) resizeObserver?.observe(refs.page.current);

    // Theme toggles flip the `dark` class on <html>.
    const themeObserver = new MutationObserver(schedule);
    themeObserver.observe(html, { attributes: true, attributeFilter: ["class"] });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.removeEventListener("pageshow", schedule);
      window.removeEventListener("load", schedule);
      vv?.removeEventListener("resize", schedule);
      vv?.removeEventListener("scroll", schedule);
      resizeObserver?.disconnect();
      themeObserver.disconnect();

      html.removeAttribute(SUNSET_EDGES_ATTRIBUTE);
      html.style.removeProperty("--edge-top-background");
      html.style.removeProperty("--edge-bottom-background");
      document
        .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"], meta[name="viewport"]')
        .forEach(restoreOriginal);
    };
    // Refs are stable objects; the effect runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

"use client";

import { useEffect, type RefObject } from "react";
import {
  computeSunsetEdgeColors,
  type Box,
  type EdgeColors,
  type SunsetWashKey,
} from "@/lib/sunset-edge-colors";

export type SunsetEdgeRefs = {
  page: RefObject<HTMLElement | null>;
  sky: RefObject<HTMLElement | null>;
  washes: Record<SunsetWashKey, RefObject<HTMLElement | null>>;
};

const VIEWPORT_FIT_COVER = "viewport-fit=cover";

function box(element: HTMLElement | null): Box | null {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { top: rect.top, height: rect.height, width: rect.width };
}

function visibleViewport() {
  const vv = window.visualViewport;
  return {
    // Safari's toolbar grows and shrinks the visual viewport as you scroll.
    height: vv ? vv.offsetTop + vv.height : window.innerHeight,
    width: vv ? vv.width : window.innerWidth,
  };
}

/**
 * Keeps mobile Safari's status bar and bottom toolbar tinted to match the
 * visible top and bottom edges of the sunset homepage.
 *
 * While mounted it owns a few shared document settings: the edge-strip CSS
 * variables, the html/body background colors, the theme-color meta tags and
 * `viewport-fit=cover`. Everything is restored on unmount so none of it leaks
 * into the signed-in app or other routes.
 */
export function useSunsetEdgeColors(refs: SunsetEdgeRefs) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // --- Save shared document state so it can be restored on unmount.
    const original = {
      htmlBackground: html.style.backgroundColor,
      bodyBackground: body.style.backgroundColor,
      edgeTop: html.style.getPropertyValue("--edge-top-background"),
      edgeBottom: html.style.getPropertyValue("--edge-bottom-background"),
    };

    let themeMetas = Array.from(
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    );
    const originalThemeContents = themeMetas.map((meta) => meta.content);
    let createdThemeMeta: HTMLMetaElement | null = null;
    if (themeMetas.length === 0) {
      createdThemeMeta = document.createElement("meta");
      createdThemeMeta.name = "theme-color";
      document.head.appendChild(createdThemeMeta);
      themeMetas = [createdThemeMeta];
    }

    // --- Let the page draw behind the status bar and home indicator.
    let viewportMeta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const originalViewport = viewportMeta?.content ?? null;
    let createdViewportMeta = false;
    if (!viewportMeta) {
      viewportMeta = document.createElement("meta");
      viewportMeta.name = "viewport";
      viewportMeta.content = "width=device-width, initial-scale=1";
      document.head.appendChild(viewportMeta);
      createdViewportMeta = true;
    }
    if (!viewportMeta.content.includes("viewport-fit")) {
      viewportMeta.content = `${viewportMeta.content}, ${VIEWPORT_FIT_COVER}`;
    }

    // --- Calculate once, apply everywhere.
    let last: EdgeColors | null = null;

    const apply = ({ top, bottom }: EdgeColors) => {
      html.style.setProperty("--edge-top-background", top);
      html.style.setProperty("--edge-bottom-background", bottom);
      html.style.backgroundColor = top;
      body.style.backgroundColor = bottom;
      for (const meta of themeMetas) meta.content = top;
    };

    const update = () => {
      frame = 0;
      const page = box(refs.page.current);
      if (!page) return;
      const viewport = visibleViewport();
      const next = computeSunsetEdgeColors({
        theme: html.classList.contains("dark") ? "dark" : "light",
        viewportHeight: viewport.height,
        viewportWidth: viewport.width,
        page,
        sky: box(refs.sky.current),
        washes: {
          heroTop: box(refs.washes.heroTop.current),
          heroBottom: box(refs.washes.heroBottom.current),
          note: box(refs.washes.note.current),
        },
      });
      if (last && last.top === next.top && last.bottom === next.bottom) return;
      last = next;
      apply(next);
    };

    let frame = 0;
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

      html.style.backgroundColor = original.htmlBackground;
      body.style.backgroundColor = original.bodyBackground;
      if (original.edgeTop) html.style.setProperty("--edge-top-background", original.edgeTop);
      else html.style.removeProperty("--edge-top-background");
      if (original.edgeBottom) {
        html.style.setProperty("--edge-bottom-background", original.edgeBottom);
      } else {
        html.style.removeProperty("--edge-bottom-background");
      }

      if (createdThemeMeta) createdThemeMeta.remove();
      else themeMetas.forEach((meta, i) => (meta.content = originalThemeContents[i]));

      if (createdViewportMeta) viewportMeta?.remove();
      else if (viewportMeta && originalViewport !== null) viewportMeta.content = originalViewport;
    };
    // Refs are stable objects; the effect runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

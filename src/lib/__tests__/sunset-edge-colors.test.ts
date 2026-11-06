import { describe, expect, it } from "vitest";
import { computeSunsetEdgeColors, SUNSET_PALETTE } from "../sunset-edge-colors";

const viewport = { viewportHeight: 800, viewportWidth: 390 };

describe("computeSunsetEdgeColors", () => {
  it("returns the plain page color when the sky is below the viewport (light)", () => {
    expect(
      computeSunsetEdgeColors({
        theme: "light",
        ...viewport,
        page: { top: 0, height: 4000, width: 390 },
        sky: { top: 2620, height: 1380, width: 390 },
      })
    ).toEqual({ top: SUNSET_PALETTE.light.base, bottom: SUNSET_PALETTE.light.base });
  });

  it("matches the deepest sky color at the bottom of the page (light)", () => {
    // Scrolled to the very end: page bottom sits at the viewport bottom.
    const colors = computeSunsetEdgeColors({
      theme: "light",
      ...viewport,
      page: { top: -3200, height: 4000, width: 390 },
      sky: { top: -580, height: 1380, width: 390 },
    });
    expect(colors.bottom).toBe(SUNSET_PALETTE.light.skyEnd);
    // The top edge is partway into the sky, so it is tinted but not white.
    expect(colors.top).not.toBe(SUNSET_PALETTE.light.base);
  });

  it("clamps overscroll to the nearest page color", () => {
    const colors = computeSunsetEdgeColors({
      theme: "light",
      ...viewport,
      page: { top: -3300, height: 4000, width: 390 }, // rubber-banded past the end
      sky: { top: -680, height: 1380, width: 390 },
    });
    expect(colors.bottom).toBe(SUNSET_PALETTE.light.skyEnd);
  });

  it("tints the dark top edge with the hero wash and leaves plain areas alone", () => {
    const atTop = computeSunsetEdgeColors({
      theme: "dark",
      ...viewport,
      page: { top: 0, height: 4000, width: 390 },
      washes: {
        heroTop: { top: 0, height: 800, width: 390 },
        heroBottom: { top: 608, height: 192, width: 390 },
        note: { top: 800, height: 3200, width: 390 },
      },
    });
    expect(atTop.top).not.toBe(SUNSET_PALETTE.dark.base);
    // Bottom of the hero carries a softer wash.
    expect(atTop.bottom).not.toBe(SUNSET_PALETTE.dark.base);

    const midNote = computeSunsetEdgeColors({
      theme: "dark",
      ...viewport,
      page: { top: -2000, height: 4000, width: 390 },
      washes: {
        heroTop: { top: -2000, height: 800, width: 390 },
        heroBottom: { top: -1392, height: 192, width: 390 },
        note: { top: -1200, height: 3200, width: 390 },
      },
    });
    expect(midNote).toEqual({ top: SUNSET_PALETTE.dark.base, bottom: SUNSET_PALETTE.dark.base });
  });
});

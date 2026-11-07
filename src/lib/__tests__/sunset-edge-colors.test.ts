import { describe, expect, it } from "vitest";
import { computeSunsetEdgeColors, SUNSET_PALETTE } from "../sunset-edge-colors";

const viewport = { viewportHeight: 800 };

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

  it("uses the flat dark page color at both edges (dark)", () => {
    expect(
      computeSunsetEdgeColors({
        theme: "dark",
        ...viewport,
        page: { top: -3200, height: 4000, width: 390 },
        sky: { top: -580, height: 1380, width: 390 },
      })
    ).toEqual({ top: SUNSET_PALETTE.dark.base, bottom: SUNSET_PALETTE.dark.base });
  });
});

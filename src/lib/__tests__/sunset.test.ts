import { describe, expect, it } from "vitest";
import { SUNSET_NOTE, SUNSET_NOTE_SIGNATURE, type SunsetNoteSegment } from "@/lib/sunset";

const text = (segments: SunsetNoteSegment[]) =>
  segments.map((s) => (typeof s === "string" ? s : s.text)).join("");

describe("SUNSET_NOTE", () => {
  it("matches the requested copy word for word, paragraph by paragraph", () => {
    expect(SUNSET_NOTE.map(text)).toEqual([
      "Mizen started to improve our frustrations with the online recipe experience, which has devolved into intentionally long reads to allow cooks to be bombarded with pop-up ads.",
      "We set out to create a better cooking experience for home cooks. The name comes from mise en place and zen, which pretty much sums up how we wanted cooking at home to feel. From prep to plate, we hope Mizen made cooking calm, organized, and playful.",
      "We couldn’t have done it without the help of many friends and family who tested and contributed to the build, as well as Negi’s first-ever project.",
      "The project is sunsetting. Now, Negi will continue building projects that we hope will help people to continue doing what they love.",
      "Until then, keep cooking \u{1F9D1}\u{1F3FC}‍\u{1F373}!",
    ]);
  });

  it("italicizes only mise en place and zen", () => {
    const emphasized = SUNSET_NOTE.flat()
      .filter((s) => typeof s !== "string" && "emphasis" in s)
      .map((s) => (s as { text: string }).text);
    expect(emphasized).toEqual(["mise en place", "zen"]);
  });

  it("signs as Gage & Michelle without the old em dash", () => {
    expect(text(SUNSET_NOTE_SIGNATURE)).toBe("Gage & Michelle");
  });
});

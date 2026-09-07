import { describe, expect, it } from "vitest";
import { PrepNotesSchema } from "@/lib/schemas/recipe";
import { prepNoteKey, sortPrepNotes, hashRecipeIdentity } from "@/lib/prep-notes";
import type { PrepNote } from "@/lib/types";

const setup: PrepNote = { action: "Preheat to 350°F", phase: "same-day", requirement: "required" };
const advance: PrepNote = {
  action: "Thaw chicken",
  phase: "advance",
  requirement: "required",
  timing: "24 hours before",
  leadTimeMinutes: 1440,
};

describe("prep notes", () => {
  it("keeps unknown timing unlabeled and discards malformed optional enrichment", () => {
    expect(PrepNotesSchema.parse([setup])).toEqual([setup]);
    expect(PrepNotesSchema.parse([])).toEqual([]);
    expect(PrepNotesSchema.parse([{ action: "" }])).toBeUndefined();
    expect(PrepNotesSchema.parse([{ ...setup, requirement: "maybe" }])).toBeUndefined();
  });
  it("prioritizes advance tasks and retains all relevant items without mutating input", () => {
    const notes = [
      setup,
      ...Array.from({ length: 6 }, (_, i) => ({
        ...advance,
        action: `Task ${i}`,
        leadTimeMinutes: i * 60,
      })),
    ];
    expect(sortPrepNotes(notes)).toHaveLength(7);
    expect(sortPrepNotes(notes)[0].action).toBe("Task 5");
    expect(notes[0]).toBe(setup);
    expect(sortPrepNotes([setup, setup])).toHaveLength(1);
  });
  it("preserves identity across reordering and invalidates edited tasks", async () => {
    expect(prepNoteKey(advance)).toBe(prepNoteKey({ ...advance }));
    expect(prepNoteKey(advance)).not.toBe(prepNoteKey({ ...advance, timing: "48 hours before" }));
    expect(await hashRecipeIdentity("recipe-a")).toMatch(/^[a-f0-9]{64}$/);
    expect(await hashRecipeIdentity("recipe-a")).not.toBe(await hashRecipeIdentity("recipe-b"));
  });
});

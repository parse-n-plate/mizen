import { describe, expect, it } from "vitest";
import {
  addDays,
  calendarDateSchema,
  dateKey,
  parseDate,
  startOfWeek,
  weekTitle,
} from "../meal-plan";

describe("meal plan calendar dates", () => {
  it("starts on Monday even when today is Sunday", () => {
    expect(dateKey(startOfWeek(parseDate("2026-10-11")))).toBe("2026-10-05");
    expect(dateKey(startOfWeek(parseDate("2026-10-12")))).toBe("2026-10-12");
  });
  it("keeps all seven calendar dates across daylight saving and year boundaries", () => {
    for (const start of ["2026-03-02", "2026-10-26", "2026-12-28"]) {
      const days = Array.from({ length: 7 }, (_, index) =>
        dateKey(addDays(parseDate(start), index))
      );
      expect(new Set(days).size).toBe(7);
      expect(days[0]).toBe(start);
      expect(dateKey(addDays(addDays(parseDate(start), 7), -7))).toBe(start);
    }
    expect(dateKey(addDays(parseDate("2026-12-28"), 6))).toBe("2027-01-03");
  });
  it("formats weeks within a month and across month and year boundaries", () => {
    expect(weekTitle(parseDate("2026-10-05"))).toBe("October 5–11, 2026");
    expect(weekTitle(parseDate("2026-09-28"))).toBe("September 28–October 4, 2026");
    expect(weekTitle(parseDate("2026-12-28"))).toBe("December 28, 2026–January 3, 2027");
  });
  it("rejects impossible dates instead of rolling them into another month", () => {
    for (const date of [
      "2026-02-29",
      "2026-04-31",
      "2026-00-10",
      "2026-10-00",
      "2026-13-01",
      "10/10/2026",
    ]) {
      expect(calendarDateSchema.safeParse(date).success).toBe(false);
    }
    expect(calendarDateSchema.safeParse("2028-02-29").success).toBe(true);
  });
});

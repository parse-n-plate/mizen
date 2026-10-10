import { z } from "zod";

/** Calendar dates stay local; UTC conversion shifts days in some time zones. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseDate(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((key) => dateKey(parseDate(key)) === key, "Invalid calendar date");

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfWeek(date: Date): Date {
  return addDays(parseDate(dateKey(date)), -((date.getDay() + 6) % 7));
}

export function weekTitle(start: Date): string {
  const end = addDays(start, 6);
  const month = (date: Date) => date.toLocaleDateString("en-US", { month: "long" });
  if (start.getFullYear() !== end.getFullYear()) {
    return `${month(start)} ${start.getDate()}, ${start.getFullYear()}–${month(end)} ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${month(start)} ${start.getDate()}–${start.getMonth() === end.getMonth() ? "" : `${month(end)} `}${end.getDate()}, ${end.getFullYear()}`;
}

export interface MealPlanEntry {
  id: string;
  recipe_id: string;
  planned_date: string;
  created_at: string;
}

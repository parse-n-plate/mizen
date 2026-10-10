import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthRetryableFetchError } from "@supabase/supabase-js";
const { getUser, redirect } = vi.hoisted(() => ({
  getUser: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`Redirect: ${path}`);
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser } }) }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/components/MealPlan", () => ({ MealPlan: () => null }));
import MealPlanPage from "../page";
beforeEach(() => vi.clearAllMocks());
describe("Meal Plan page", () => {
  it("renders the retryable view if auth cannot reach Supabase", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError("fetch failed", 0),
    });
    expect(await MealPlanPage()).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });
  it("keeps signed-out users behind authentication", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(MealPlanPage()).rejects.toThrow("Redirect: /?signin=1");
  });
});

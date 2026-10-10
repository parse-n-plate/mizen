import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AuthRetryableFetchError } from "@supabase/supabase-js";
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { getUser } }) }));
vi.mock("../is-configured", () => ({ isSupabaseConfigured: true }));
import { updateSession } from "../middleware";
const request = () => new NextRequest("http://localhost:3000/meal-plan");
beforeEach(() => vi.clearAllMocks());
describe("Meal Plan session routing", () => {
  it("keeps connection failures on Meal Plan instead of treating them as signed out", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError("fetch failed", 0),
    });
    const response = await updateSession(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
  it("still redirects genuinely signed-out users", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await updateSession(request());
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/?signin=1");
  });
  it("lets authenticated users open Meal Plan", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "owner" } }, error: null });
    expect((await updateSession(request())).status).toBe(200);
  });
});

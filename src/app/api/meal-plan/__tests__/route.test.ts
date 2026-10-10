import { beforeEach, describe, expect, it, vi } from "vitest";
const { client } = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: client }));
import { AuthRetryableFetchError } from "@supabase/supabase-js";
import { GET, POST, DELETE } from "../route";
const recipeId = "d0b2e1f4-aeb9-4e85-a80d-3f9b6c8b5c17";
const entryId = "fc6db85c-2032-4a39-84e5-b91c2d4caf05";
const entry = { id: entryId, recipe_id: recipeId, planned_date: "2026-10-10" };
const query = {
  select: vi.fn(),
  eq: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  order: vi.fn(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
};
const from = vi.fn(() => query);
function request(method: string, body: unknown) {
  return new Request("http://localhost/api/meal-plan", { method, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.resetAllMocks();
  for (const method of ["select", "eq", "gte", "lte", "order", "upsert", "delete"] as const)
    query[method].mockReturnValue(query);
  from.mockReturnValue(query);
  client.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: { id: "owner" } }, error: null }) },
    from,
  });
});
describe("meal plan API", () => {
  it("rejects invalid calendar dates and non-Monday week ranges", async () => {
    expect((await POST(request("POST", { recipeId, date: "2026-02-30" }))).status).toBe(400);
    expect((await GET(new Request("http://localhost/api/meal-plan?week=2026-10-10"))).status).toBe(
      400
    );
    expect(client).not.toHaveBeenCalled();
  });
  it("requires a signed-in user for reads and writes", async () => {
    client.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: null } }) } });
    expect((await POST(request("POST", { recipeId, date: "2026-10-10" }))).status).toBe(401);
    expect((await DELETE(request("DELETE", { id: entryId }))).status).toBe(401);
    expect((await GET(new Request("http://localhost/api/meal-plan?week=2026-10-05"))).status).toBe(
      401
    );
    expect(from).not.toHaveBeenCalled();
  });
  it("returns a retryable service failure when authentication is offline", async () => {
    client.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: new AuthRetryableFetchError("fetch failed", 0),
        }),
      },
    });
    const response = await GET(new Request("http://localhost/api/meal-plan?week=2026-10-05"));
    expect(response.status).toBe(503);
    expect(from).not.toHaveBeenCalled();
  });
  it("cannot schedule another user's recipe", async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await POST(request("POST", { recipeId, date: "2026-10-10" }))).status).toBe(404);
    expect(query.eq.mock.calls).toEqual([
      ["id", recipeId],
      ["user_id", "owner"],
    ]);
    expect(query.upsert).not.toHaveBeenCalled();
  });
  it("schedules only for the authenticated user and keeps duplicate requests idempotent", async () => {
    query.maybeSingle
      .mockResolvedValueOnce({ data: { id: recipeId }, error: null })
      .mockResolvedValueOnce({ data: entry, error: null });
    const response = await POST(
      request("POST", { recipeId, date: "2026-10-10", user_id: "other" })
    );
    expect(response.status).toBe(201);
    expect(query.upsert).toHaveBeenCalledWith(
      { user_id: "owner", recipe_id: recipeId, planned_date: "2026-10-10" },
      { onConflict: "user_id,recipe_id,planned_date", ignoreDuplicates: true }
    );
    expect(await response.json()).toEqual(entry);
  });
  it("returns the existing meal for a duplicate submission", async () => {
    query.maybeSingle
      .mockResolvedValueOnce({ data: { id: recipeId }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    query.single.mockResolvedValue({ data: entry, error: null });
    expect(await (await POST(request("POST", { recipeId, date: "2026-10-10" }))).json()).toEqual(
      entry
    );
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
  });
  it("loads only the owner's selected seven days without caching", async () => {
    query.order.mockReturnValueOnce(query).mockResolvedValueOnce({ data: [entry], error: null });
    const response = await GET(new Request("http://localhost/api/meal-plan?week=2026-10-05"));
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
    expect(query.gte).toHaveBeenCalledWith("planned_date", "2026-10-05");
    expect(query.lte).toHaveBeenCalledWith("planned_date", "2026-10-11");
    expect(await response.json()).toEqual([entry]);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("scopes removal to the owner and reports storage failures", async () => {
    query.eq.mockReturnValueOnce(query).mockResolvedValueOnce({ error: null });
    expect((await DELETE(request("DELETE", { id: entryId }))).status).toBe(200);
    expect(query.eq.mock.calls).toEqual([
      ["user_id", "owner"],
      ["id", entryId],
    ]);
    query.maybeSingle.mockResolvedValue({ error: { message: "offline" } });
    expect((await POST(request("POST", { recipeId, date: "2026-10-10" }))).status).toBe(503);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
const { client } = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: client }));
import { GET, PUT } from "../route";
const key = "a".repeat(64);
const upsert = vi.fn();
const eq = vi.fn();
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ upsert, select }));
beforeEach(() => {
  vi.clearAllMocks();
  client.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: { id: "owner" } } }) },
    from,
  });
  upsert.mockResolvedValue({ error: null });
});
function put(body: unknown) {
  return PUT(
    new Request("http://localhost/api/prep-notes", { method: "PUT", body: JSON.stringify(body) })
  );
}
describe("prep completion API", () => {
  it("rejects malformed data before querying storage", async () => {
    expect((await put({ recipeKey: "bad" })).status).toBe(400);
    expect(client).not.toHaveBeenCalled();
  });
  it("requires authentication", async () => {
    client.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: null } }) } });
    expect((await put({ recipeKey: key, noteKey: "task", completed: true })).status).toBe(401);
    expect(
      (await GET(new Request(`http://localhost/api/prep-notes?recipeKey=${key}`))).status
    ).toBe(401);
  });
  it("writes only the authenticated user's individual task", async () => {
    expect(
      (await put({ recipeKey: key, noteKey: "task", completed: false, user_id: "other" })).status
    ).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      { user_id: "owner", recipe_key: key, note_key: "task", completed: false },
      { onConflict: "user_id,recipe_key,note_key" }
    );
  });
  it("reads only this user's recipe and prevents caching", async () => {
    eq.mockReturnValueOnce({ eq }).mockResolvedValueOnce({
      data: [{ note_key: "task", completed: true }],
      error: null,
    });
    const response = await GET(new Request(`http://localhost/api/prep-notes?recipeKey=${key}`));
    expect(await response.json()).toEqual({ task: true });
    expect(eq.mock.calls).toEqual([
      ["user_id", "owner"],
      ["recipe_key", key],
    ]);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("returns a retryable failure when persistence fails", async () => {
    upsert.mockResolvedValue({ error: { message: "offline" } });
    expect((await put({ recipeKey: key, noteKey: "task", completed: true })).status).toBe(503);
  });
});

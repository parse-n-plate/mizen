import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  order: vi.fn(),
  log: vi.fn(),
  redirectError: new Error("NEXT_REDIRECT"),
}));
vi.mock("@/lib/supabase/is-configured", () => ({ isSupabaseConfigured: true }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    const query = {
      select: () => query,
      eq: () => query,
      order: mocks.order,
    };
    return { auth: { getUser: mocks.getUser }, from: () => query };
  },
}));
vi.mock("next/navigation", () => ({
  redirect: () => {
    throw mocks.redirectError;
  },
  unstable_rethrow: (error: unknown) => {
    if (error === mocks.redirectError) throw error;
  },
}));
vi.mock("@/lib/logger", () => ({ logger: { error: mocks.log } }));
vi.mock("@/components/FavoritesEmptyState", () => ({ FavoritesEmptyState: () => null }));
vi.mock("@/components/CookbookList", () => ({ CookbookList: () => null }));
vi.mock("next/link", () => ({ default: () => null }));

import FavoritesPage from "./page";

describe("Favorites page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.order.mockResolvedValue({ data: [], error: null });
  });

  it("shows an error instead of redirecting home when the database query fails", async () => {
    const error = { code: "42703", message: "column recipes.is_favorite does not exist" };
    mocks.order.mockResolvedValue({ data: null, error });
    const page = await FavoritesPage();
    expect(page.props.role).toBe("alert");
    expect(mocks.log).toHaveBeenCalledWith({ err: error }, "Failed to load favorites");
  });

  it("preserves the sign-in redirect", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    await expect(FavoritesPage()).rejects.toBe(mocks.redirectError);
    expect(mocks.order).not.toHaveBeenCalled();
    expect(mocks.log).not.toHaveBeenCalled();
  });

  it("renders a successful favorites query without an error", async () => {
    const page = await FavoritesPage();
    expect(page.props.role).toBeUndefined();
    expect(mocks.log).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect }));

import FavoritesPage from "./page";

describe("Favorites compatibility route", () => {
  it("opens the Favorites filter in Home", () => {
    FavoritesPage();
    expect(redirect).toHaveBeenCalledWith("/?view=favorites");
  });
});

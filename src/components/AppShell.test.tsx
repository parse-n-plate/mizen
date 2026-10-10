import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

const { route, useUser } = vi.hoisted(() => ({
  route: { pathname: "/privacy" },
  useUser: vi.fn(() => {
    throw new Error("Public legal pages must not need an auth session");
  }),
}));

vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("@/hooks/useUser", () => ({ useUser }));
vi.mock("@/context/RecipeContext", () => ({
  RecipeProvider: () => {
    throw new Error("Public legal pages must not mount the recipe provider");
  },
}));
vi.mock("@/components/Sidebar", () => ({ Sidebar: () => null }));
vi.mock("@/components/MobileBottomNav", () => ({ MobileBottomNav: () => null }));
vi.mock("@/components/MobileScreenTransition", () => ({ MobileScreenTransition: () => null }));
vi.mock("@/components/SearchCommandModal", () => ({ SearchCommandModal: () => null }));
vi.mock("@/components/SplashScreen", () => ({ SplashScreen: () => null }));

describe("public legal pages", () => {
  it.each(["/privacy", "/terms"])("renders %s outside the session and recipe flow", (pathname) => {
    route.pathname = pathname;
    const html = renderToStaticMarkup(
      <AppShell>
        <main>Public document</main>
      </AppShell>
    );
    expect(html).toBe("<main>Public document</main>");
    expect(useUser).not.toHaveBeenCalled();
  });
});

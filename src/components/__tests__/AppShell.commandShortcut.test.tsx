// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { auth } = vi.hoisted(() => ({
  auth: { user: { id: "user-1" } as { id: string } | null, loading: false },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/useUser", () => ({
  useUser: () => auth,
}));

vi.mock("@/context/RecipeContext", () => ({
  RecipeProvider: ({ children }: { children: React.ReactNode }) => children,
  useRecipe: () => ({
    history: [],
    isLoading: false,
    setError: vi.fn(),
    setIsLoading: vi.fn(),
    setRecipe: vi.fn(),
    setSavedMeta: vi.fn(),
  }),
}));

vi.mock("@/components/Sidebar", () => ({
  Sidebar: () => <aside />,
}));

vi.mock("@/components/MobileBottomNav", () => ({
  MobileBottomNav: () => null,
}));

vi.mock("@/components/MobileScreenTransition", () => ({
  MobileScreenTransition: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/SplashScreen", () => ({
  SplashScreen: () => null,
}));

vi.mock("@solar-icons/react/csr/it/SidebarMinimalistic", () => ({
  default: () => null,
}));

import { AppShell } from "../AppShell";

let host: HTMLDivElement;
let root: Root;

function palette() {
  return document.querySelector("[role='dialog']");
}

function searchField() {
  return document.querySelector<HTMLInputElement>("[cmdk-input]");
}

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

async function press(target: EventTarget, init: KeyboardEventInit) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  await act(async () => {
    target.dispatchEvent(event);
  });
  return event;
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  Element.prototype.scrollIntoView = () => {};
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("[]", { status: 200 }))
  );
  auth.user = { id: "user-1" };
  auth.loading = false;
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("Command+K search palette", () => {
  it("opens when closed and closes again from the focused search field", async () => {
    await act(async () => {
      root.render(
        <AppShell>
          <input aria-label="Recipe title" />
        </AppShell>
      );
    });

    expect(palette()).toBeNull();

    const openEvent = await press(window, { key: "k", metaKey: true });
    await settle();
    expect(openEvent.defaultPrevented).toBe(true);
    expect(palette()).not.toBeNull();

    const field = searchField();
    expect(field).not.toBeNull();
    field?.focus();

    const closeEvent = await press(field ?? window, { key: "k", metaKey: true });
    await settle();
    expect(closeEvent.defaultPrevented).toBe(true);
    expect(palette()).toBeNull();
  });

  it("toggles with Ctrl+K, including an uppercase K, and ignores repeats and other shortcuts", async () => {
    await act(async () => {
      root.render(
        <AppShell>
          <p>Library</p>
        </AppShell>
      );
    });

    await press(window, { key: "K", ctrlKey: true });
    await settle();
    expect(palette()).not.toBeNull();

    const field = searchField() ?? window;
    await press(field, { key: "k", ctrlKey: true, repeat: true });
    await settle();
    expect(palette()).not.toBeNull();

    await press(field, { key: "k", ctrlKey: true });
    await settle();
    expect(palette()).toBeNull();

    await press(window, { key: "j", ctrlKey: true });
    await press(window, { key: "k", altKey: true });
    await settle();
    expect(palette()).toBeNull();
  });

  it("does not open from another text field, and still closes when the palette is open", async () => {
    await act(async () => {
      root.render(
        <AppShell>
          <textarea aria-label="Notes" />
        </AppShell>
      );
    });

    const notes = host.querySelector("textarea")!;
    notes.focus();
    const ignored = await press(notes, { key: "k", ctrlKey: true });
    await settle();
    expect(ignored.defaultPrevented).toBe(false);
    expect(palette()).toBeNull();

    notes.blur();
    await press(window, { key: "k", ctrlKey: true });
    await settle();
    expect(palette()).not.toBeNull();

    notes.focus();
    await press(notes, { key: "k", metaKey: true });
    await settle();
    expect(palette()).toBeNull();
  });
});

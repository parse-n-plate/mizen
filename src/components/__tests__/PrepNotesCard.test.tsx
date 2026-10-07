// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { auth } = vi.hoisted(() => ({
  auth: { user: null as null | { id: string }, loading: false },
}));
vi.mock("@/hooks/useUser", () => ({ useUser: () => auth }));
import { PrepNotesCard } from "../PrepNotesCard";
import {
  hashRecipeIdentity,
  legacyPrepRecipeIdentity,
  prepNoteKey,
  prepRecipeIdentity,
} from "@/lib/prep-notes";
import type { ParsedRecipe, PrepNote } from "@/lib/types";
const notes: PrepNote[] = [
  { action: "Preheat oven", phase: "same-day", requirement: "required" },
  {
    action: "Thaw chicken",
    phase: "advance",
    requirement: "required",
    timing: "24 hours before",
    leadTimeMinutes: 1440,
  },
  { action: "Prepare sauce", phase: "advance", requirement: "recommended" },
];
let host: HTMLDivElement;
let root: Root;
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}
async function mount(identity = "test-recipe", legacyIdentity?: string) {
  await act(async () =>
    root.render(
      <PrepNotesCard
        notes={notes}
        recipeIdentity={identity}
        legacyRecipeIdentity={legacyIdentity}
      />
    )
  );
  await settle();
}
async function click(element: Element) {
  await act(async () => (element as HTMLElement).click());
  await settle();
}
function preview() {
  return host.querySelector("button")!;
}
function checks() {
  return [...host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("crypto", webcrypto);
  auth.user = null;
  auth.loading = false;
  localStorage.clear();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
describe("Prep notes checklist", () => {
  it.each([true, false])("queues refreshes during a slow save (success: %s)", async (success) => {
    auth.user = { id: "user-a" };
    const server: Record<string, boolean> = {};
    let finishSave!: () => void;
    const fetchMock = vi.fn(async (_url, options) => {
      if (options?.method === "PUT") {
        const body = JSON.parse(options.body);
        await new Promise<void>((resolve) => {
          finishSave = () => {
            if (success) server[body.noteKey] = body.completed;
            resolve();
          };
        });
        if (!success) return new Response("", { status: 503 });
      }
      return new Response(JSON.stringify(server));
    });
    vi.stubGlobal("fetch", fetchMock);
    await mount();
    await click(preview());
    await click(checks()[0]);
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));
      window.dispatchEvent(new Event("storage"));
    });
    await settle();
    expect(checks()[0].checked).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => finishSave());
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(success ? 3 : 2);
    expect(checks()[0].checked).toBe(success);
    expect(checks()[0].disabled).toBe(false);
    if (!success) expect(host.textContent).toContain("Could not save progress");
  });

  it.each([false, true])(
    "preserves old completion and newer undo across reloads (signed in: %s)",
    async (signedIn) => {
      const recipe = {
        title: "Chicken",
        ingredients: [
          {
            groupName: "Main",
            ingredients: [
              { amount: "1", units: "lb", ingredient: "chicken", description: "frozen" },
            ],
          },
        ],
        instructions: [{ title: "Cook", detail: "Cook the chicken" }],
      } as ParsedRecipe;
      const identity = prepRecipeIdentity(recipe);
      const legacyIdentity = legacyPrepRecipeIdentity(recipe);
      const key = await hashRecipeIdentity(identity);
      const oldKey = await hashRecipeIdentity(legacyIdentity);
      expect(key).not.toBe(oldKey);
      const task = prepNoteKey(notes[1]);
      if (signedIn) {
        auth.user = { id: "user-a" };
        const server: Record<string, Record<string, boolean>> = { [oldKey]: { [task]: true } };
        vi.stubGlobal(
          "fetch",
          vi.fn(async (url, options) => {
            if (options?.method === "PUT") {
              const body = JSON.parse(options.body);
              server[body.recipeKey] = {
                ...server[body.recipeKey],
                [body.noteKey]: body.completed,
              };
              return new Response("{}");
            }
            const readKey = new URL(url, "http://localhost").searchParams.get("recipeKey")!;
            return new Response(JSON.stringify(server[readKey] ?? {}));
          })
        );
      } else {
        localStorage.setItem(`mizen-prep-v1:guest:${oldKey}`, JSON.stringify({ [task]: true }));
      }
      await mount(identity, legacyIdentity);
      await click(preview());
      expect(checks()[0].checked).toBe(true);
      await click(checks()[0]);
      expect(checks()[0].checked).toBe(false);
      await act(async () => root.unmount());
      root = createRoot(host);
      await mount(identity, legacyIdentity);
      await click(preview());
      expect(checks()[0].checked).toBe(false);
    }
  );
  it("shows priority, every task, labels, and collapses on completion with an undo path", async () => {
    await mount();
    expect(preview().querySelector('[aria-label="3 prep items"]')).not.toBeNull();
    expect(preview().textContent).toContain("Thaw chicken · 24 hours before");
    await click(preview());
    expect(checks()).toHaveLength(3);
    expect(host.textContent).toContain("Before cooking");
    expect(host.textContent).toContain("Optional");
    for (let i = 0; i < 3; i++) await click(checks()[i]);
    expect(preview().getAttribute("aria-expanded")).toBe("false");
    expect(host.textContent).toContain("All prep complete");
    await click(preview());
    await click(checks()[0]);
    expect(preview().getAttribute("aria-expanded")).toBe("true");
    expect(checks()[0].checked).toBe(false);
    await act(async () => root.unmount());
    root = createRoot(host);
    await mount();
    await click(preview());
    expect(checks().map((item) => item.checked)).toEqual([false, true, true]);
  });
  it("persists signed-in changes across mounts and refreshes another device's changes on focus", async () => {
    auth.user = { id: "user-a" };
    const server: Record<string, boolean> = {};
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, options) => {
        if (options?.method === "PUT") {
          const body = JSON.parse(options.body);
          server[body.noteKey] = body.completed;
        }
        return new Response(JSON.stringify(server));
      })
    );
    await mount();
    await click(preview());
    await click(checks()[0]);
    expect(server[prepNoteKey(notes[1])]).toBe(true);
    await act(async () => root.unmount());
    root = createRoot(host);
    await mount();
    await click(preview());
    expect(checks()[0].checked).toBe(true);
    server[prepNoteKey(notes[0])] = true;
    await act(async () => window.dispatchEvent(new Event("focus")));
    await settle();
    expect(checks()[2].checked).toBe(true);
  });
  it("rolls back a failed write and isolates a newly selected account", async () => {
    auth.user = { id: "user-a" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, options) =>
        options?.method === "PUT" ? new Response("", { status: 503 }) : new Response("{}")
      )
    );
    await mount();
    await click(preview());
    await click(checks()[0]);
    expect(checks()[0].checked).toBe(false);
    expect(host.textContent).toContain("Could not save progress");
    auth.user = { id: "user-b" };
    await mount();
    await click(preview());
    expect(checks().every((item) => !item.checked)).toBe(true);
  });
});

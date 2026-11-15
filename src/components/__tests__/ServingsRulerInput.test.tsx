/* @vitest-environment jsdom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAgent } from "@ui-sdk/react/agent";
import { ServingsRulerInput } from "@/components/ServingsRulerInput";

declare global {
  var __UI_SDK_STRICT__: boolean | undefined;
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.__UI_SDK_STRICT__ = true;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const agent = createAgent();

let container: HTMLDivElement;
let root: Root;
let onCommit: ReturnType<typeof vi.fn<(servings: number) => void>>;

function input() {
  return container.querySelector<HTMLInputElement>('[data-slot="number-input-control"]')!;
}

function button(name: string) {
  return container.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
}

async function press(key: string, init: KeyboardEventInit = {}) {
  for (const type of ["keydown", "keyup"]) {
    await act(async () => {
      input().dispatchEvent(
        new KeyboardEvent(type, { key, bubbles: true, cancelable: true, ...init })
      );
    });
  }
}

beforeEach(async () => {
  onCommit = vi.fn<(servings: number) => void>();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<ServingsRulerInput originalServings={4} onServingsCommit={onCommit} />);
  });
  act(() => input().focus());
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("ServingsRulerInput", () => {
  it("labels the input and both step buttons", () => {
    const label = container.querySelector("label")!;
    expect(label.textContent).toBe("Servings");
    expect(label.htmlFor).toBe(input().id);
    expect(input().value).toBe("4");
    expect(button("Fewer servings")).not.toBeNull();
    expect(button("More servings")).not.toBeNull();
    expect(button("More servings").getAttribute("aria-controls")).toBe(input().id);
  });

  it("keeps the step buttons out of the tab order", () => {
    expect(button("Fewer servings").tabIndex).toBe(-1);
    expect(button("More servings").tabIndex).toBe(-1);
    expect(input().tabIndex).toBe(0);
  });

  it("steps with ArrowUp and ArrowDown and commits on key up", async () => {
    await press("ArrowUp");
    expect(input().value).toBe("5");
    expect(onCommit).toHaveBeenLastCalledWith(5);
    await press("ArrowDown");
    await press("ArrowDown");
    expect(input().value).toBe("3");
    expect(onCommit).toHaveBeenLastCalledWith(3);
    expect(container.textContent).toContain("Ingredients scale ×0.75 from 4.");
  });

  it("uses the large step for Shift+Arrow and Page keys", async () => {
    await press("ArrowUp", { shiftKey: true });
    expect(input().value).toBe("9");
    await press("PageUp");
    expect(input().value).toBe("14");
    await press("PageDown");
    expect(input().value).toBe("9");
  });

  it("jumps to the bounds with Home and End and disables the matching button", async () => {
    await press("Home");
    expect(input().value).toBe("1");
    expect(button("Fewer servings").hasAttribute("data-disabled")).toBe(true);
    await press("ArrowDown");
    expect(input().value).toBe("1");

    await press("End");
    expect(input().value).toBe("99");
    expect(button("More servings").hasAttribute("data-disabled")).toBe(true);
    expect(button("Fewer servings").hasAttribute("data-disabled")).toBe(false);
  });

  async function type(text: string) {
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(input(), text);
      input().dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  it("commits a typed value on Enter", async () => {
    await type("7");
    await press("Enter");
    expect(input().value).toBe("7");
    expect(onCommit).toHaveBeenLastCalledWith(7);
  });

  it("clamps a typed value above the maximum on Enter", async () => {
    await type("120");
    await press("Enter");
    expect(input().value).toBe("99");
    expect(container.textContent).toContain("Ingredients scale ×24.75 from 4.");
  });

  // ui-sdk 0.1.0-beta.3: a controlled NumberInput skips onValueCommit when a typed value is clamped.
  it.fails("reports the clamped value as a commit", async () => {
    await type("120");
    await press("Enter");
    expect(onCommit).toHaveBeenLastCalledWith(99);
  });

  it("lets an agent find and set servings by name", async () => {
    const entries = agent
      .snapshot()
      .filter((entry) => !entry.offPage && entry.component !== "more");
    for (const entry of entries) {
      expect(entry.label, `${entry.component} ${entry.ref} has no name`).toBeTruthy();
    }
    expect(entries.map((entry) => entry.label)).toContain("Servings");

    let result: Awaited<ReturnType<typeof agent.act>> | undefined;
    await act(async () => {
      result = await agent.act({ steps: [{ ref: "Servings", action: "setValue", args: [8] }] });
    });
    expect(result!.ok, result!.error?.message).toBe(true);
    expect(input().value).toBe("8");
    expect(container.textContent).toContain("Ingredients scale ×2 from 4.");
  });
});

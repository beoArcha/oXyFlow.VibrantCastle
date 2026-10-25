import React, { useState } from "react";
import { describe, it, expect, afterEach } from "bun:test";
import {
  withSilencedConsole,
  createMockContext2D,
  createMockCanvas,
  createMockStorageProvider,
  cleanupDom,
  renderIntoDom,
  renderCustomHook,
  getMountedRootsCount,
  resolveTestProvider,
  TestProviders,
  UiTestProviders,
  IntegrationTestProviders,
} from "../index";

describe("Test Utils Architecture & Helpers", () => {
  afterEach(async () => {
    await cleanupDom();
  });

  it("withSilencedConsole suppresses console error and warn during execution", async () => {
    let errorCalled = false;
    let warnCalled = false;

    await withSilencedConsole(() => {
      console.error("Test intentional error message");
      console.warn("Test intentional warn message");
      errorCalled = true;
      warnCalled = true;
    });

    expect(errorCalled).toBe(true);
    expect(warnCalled).toBe(true);
  });

  it("withSilencedConsole restores original console methods even if callback throws", async () => {
    const origError = console.error;

    try {
      await withSilencedConsole(() => {
        throw new Error("Intentional failure");
      });
    } catch {
      // Handled
    }

    expect(console.error).toBe(origError);
  });

  it("createMockContext2D tracks drawImage, rect, and gradient calls with strict types", () => {
    const ctx = createMockContext2D(800, 600);
    ctx.save();
    ctx.fillRect(10, 20, 30, 40);
    ctx.strokeRect(50, 60, 70, 80);
    ctx.restore();

    expect(ctx.getSaveBalance()).toBe(0);
    expect(ctx.getSaveCount()).toBe(1);
    expect(ctx.getRestoreCount()).toBe(1);

    const fillCalls = ctx.getFillRectCalls();
    expect(fillCalls).toHaveLength(1);
    expect(fillCalls[0]).toEqual({ x: 10, y: 20, w: 30, h: 40 });

    const strokeCalls = ctx.getStrokeRectCalls();
    expect(strokeCalls).toHaveLength(1);
    expect(strokeCalls[0]).toEqual({ x: 50, y: 60, w: 70, h: 80 });
  });

  it("createMockCanvas creates typed canvas with getContext returning MockContext2D", () => {
    const { canvas, ctx } = createMockCanvas(400, 300);
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(300);
    expect(canvas.getContext("2d")).toBe(ctx);
    expect(canvas.getContext("webgl")).toBeNull();
  });

  it("createMockStorageProvider implements clean isolated storage without leakage", () => {
    const storage = createMockStorageProvider({ initialKey: "initialVal" });
    expect(storage.getItem("initialKey")).toBe("initialVal");

    storage.setItem("newKey", "newVal");
    expect(storage.getItem("newKey")).toBe("newVal");

    storage.removeItem("initialKey");
    expect(storage.getItem("initialKey")).toBeNull();

    storage.clear();
    expect(storage.getItem("newKey")).toBeNull();
  });

  it("domRegistry tracks multiple mounted roots and cleans them up completely", async () => {
    function SimpleBadge({ text }: { text: string }) {
      return React.createElement("div", { className: "badge" }, text);
    }

    const first = await renderIntoDom(React.createElement(SimpleBadge, { text: "Alpha" }), { mode: "none" });
    const second = await renderIntoDom(React.createElement(SimpleBadge, { text: "Beta" }), { mode: "none" });

    expect(getMountedRootsCount()).toBe(2);
    expect(first.container.textContent).toBe("Alpha");
    expect(second.container.textContent).toBe("Beta");

    await first.unmount();
    expect(getMountedRootsCount()).toBe(1);

    await cleanupDom();
    expect(getMountedRootsCount()).toBe(0);
  });

  it("renderIntoDom dispatches user interaction events cleanly", async () => {
    function InteractiveForm() {
      const [count, setCount] = useState(0);
      const [text, setText] = useState("");

      return React.createElement(
        "div",
        null,
        React.createElement("button", { onClick: () => setCount((c) => c + 1) }, "Increment"),
        React.createElement("span", { "data-testid": "count" }, count),
        React.createElement("input", {
          "data-testid": "input",
          value: text,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value),
        }),
        React.createElement("span", { "data-testid": "output" }, text)
      );
    }

    const { container, click, changeInput } = await renderIntoDom(React.createElement(InteractiveForm), { mode: "none" });
    const btn = container.querySelector("button")!;
    const input = container.querySelector<HTMLInputElement>("[data-testid='input']")!;
    const countSpan = container.querySelector("[data-testid='count']")!;
    const outputSpan = container.querySelector("[data-testid='output']")!;

    expect(countSpan.textContent).toBe("0");
    await click(btn);
    expect(countSpan.textContent).toBe("1");

    await changeInput(input, "Gothic Citadel");
    expect(outputSpan.textContent).toBe("Gothic Citadel");
  });

  it("renderCustomHook renders, tracks state updates, and supports rerender", async () => {
    const { result, rerender } = await renderCustomHook(
      ({ multiplier }: { multiplier: number }) => {
        const [value, setValue] = useState(10);
        return { total: value * multiplier, increment: () => setValue((v) => v + 1) };
      },
      { initialProps: { multiplier: 2 }, mode: "none" }
    );

    expect(result.current.total).toBe(20);

    await rerender({ multiplier: 3 });
    expect(result.current.total).toBe(30);
  });

  it("resolveTestProvider resolves correct wrappers based on mode and options", () => {
    expect(resolveTestProvider("ui")).toBe(UiTestProviders);
    expect(resolveTestProvider("integration")).toBe(IntegrationTestProviders);
    expect(resolveTestProvider("none")).toBeNull();
    expect(resolveTestProvider()).toBe(TestProviders);

    const CustomWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement("section", null, children);
    expect(resolveTestProvider("ui", CustomWrapper)).toBe(CustomWrapper);
  });
});

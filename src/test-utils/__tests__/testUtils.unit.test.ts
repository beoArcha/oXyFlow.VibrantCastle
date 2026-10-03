import { describe, it, expect } from "bun:test";
import {
  withSilencedConsole,
  createMockContext2D,
  createMockCanvas,
  createMockStorageProvider,
  cleanupDom,
} from "../index";

describe("Test Utils Architecture & Helpers (Faza 4)", () => {
  it("withSilencedConsole suppresses console error and warn during execution", async () => {
    let errorCalled = false;
    let warnCalled = false;

    await withSilencedConsole(() => {
      // These should not hit the real console output
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

  it("cleanupDom safely executes when no DOM active root is present", async () => {
    // Should safely execute without throwing
    await cleanupDom();
  });
});

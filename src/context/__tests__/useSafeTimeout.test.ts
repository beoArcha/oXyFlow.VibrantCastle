import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import { useSafeTimeout } from "../hooks/useSafeTimeout";

describe("useSafeTimeout Hook", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("executes scheduled callback after delayMs", async () => {
    const { result, unmount } = await renderCustomHook(() => useSafeTimeout());

    let fired = false;
    await act(async () => {
      result.current.setSafeTimeout(() => {
        fired = true;
      }, 30);
    });

    expect(fired).toBe(false);

    await new Promise((r) => setTimeout(r, 60));
    expect(fired).toBe(true);

    await unmount();
  });

  it("cancels pending timer when clear() is invoked explicitly", async () => {
    const { result, unmount } = await renderCustomHook(() => useSafeTimeout());

    let fired = false;
    await act(async () => {
      result.current.setSafeTimeout(() => {
        fired = true;
      }, 50);
    });

    await act(async () => {
      result.current.clear();
    });

    await new Promise((r) => setTimeout(r, 80));
    expect(fired).toBe(false);

    await unmount();
  });

  it("cancels previous timer when setSafeTimeout is scheduled again", async () => {
    const { result, unmount } = await renderCustomHook(() => useSafeTimeout());

    let firstFired = false;
    let secondFired = false;

    await act(async () => {
      result.current.setSafeTimeout(() => {
        firstFired = true;
      }, 40);
    });

    // Schedule second timer before first finishes
    await new Promise((r) => setTimeout(r, 15));
    await act(async () => {
      result.current.setSafeTimeout(() => {
        secondFired = true;
      }, 40);
    });

    // Wait past first timer duration
    await new Promise((r) => setTimeout(r, 35));
    expect(firstFired).toBe(false);

    // Wait until second timer finishes
    await new Promise((r) => setTimeout(r, 30));
    expect(firstFired).toBe(false);
    expect(secondFired).toBe(true);

    await unmount();
  });

  it("cleans up active timer on unmount preventing memory leaks", async () => {
    const { result, unmount } = await renderCustomHook(() => useSafeTimeout());

    let fired = false;
    await act(async () => {
      result.current.setSafeTimeout(() => {
        fired = true;
      }, 40);
    });

    await unmount();

    await new Promise((r) => setTimeout(r, 60));
    expect(fired).toBe(false);
  });
});

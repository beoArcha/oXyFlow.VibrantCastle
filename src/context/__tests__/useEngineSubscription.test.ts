import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import { useEngineSubscription, EngineSubscribable } from "../hooks/useEngineSubscription";

describe("useEngineSubscription Hook", () => {
  let listeners: Set<() => void>;
  let mockEngine: EngineSubscribable;

  beforeEach(async () => {
    await cleanupDom();
    listeners = new Set();
    mockEngine = {
      registerStateListener: (cb: () => void) => {
        listeners.add(cb);
        return () => {
          listeners.delete(cb);
        };
      },
    };
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("registers listener callback upon mount", async () => {
    let callCount = 0;
    const { unmount } = await renderCustomHook(() =>
      useEngineSubscription(() => {
        callCount++;
      }, mockEngine)
    );

    expect(listeners.size).toBe(1);

    // Trigger listener
    act(() => {
      listeners.forEach((cb) => cb());
    });
    expect(callCount).toBe(1);

    await unmount();
  });

  it("unregisters listener callback upon unmount", async () => {
    const { unmount } = await renderCustomHook(() =>
      useEngineSubscription(() => {}, mockEngine)
    );

    expect(listeners.size).toBe(1);
    await unmount();
    expect(listeners.size).toBe(0);
  });

  it("updates callback reference without re-subscribing", async () => {
    let message = "initial";
    let received = "";

    const { rerender, unmount } = await renderCustomHook<void, { cb: () => void }>(
      ({ cb }) => useEngineSubscription(cb, mockEngine),
      {
        initialProps: {
          cb: () => {
            received = message;
          },
        },
      }
    );

    expect(listeners.size).toBe(1);

    // Update message and re-render with new callback
    message = "updated";
    await rerender({
      cb: () => {
        received = message;
      },
    });

    // Subscriptions shouldn't churn
    expect(listeners.size).toBe(1);

    // Trigger listener
    act(() => {
      listeners.forEach((fn) => fn());
    });
    expect(received).toBe("updated");

    await unmount();
    expect(listeners.size).toBe(0);
  });

  it("handles null or invalid engine gracefully without errors", async () => {
    const invalidEngine = {} as unknown as EngineSubscribable;
    const { unmount } = await renderCustomHook(() =>
      useEngineSubscription(() => {}, invalidEngine)
    );

    expect(listeners.size).toBe(0);
    await unmount();
  });
});

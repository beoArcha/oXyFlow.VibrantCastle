import { act } from "react";
import type { Root } from "react-dom/client";
import type { MountedRootHandle } from "./domTypes";

const mountedRoots = new Set<MountedRootHandle>();

export async function flushMicrotasks(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export function registerRoot(root: Root, container: HTMLElement): MountedRootHandle {
  const handle: MountedRootHandle = { root, container };
  mountedRoots.add(handle);
  return handle;
}

export async function unmountRoot(handle: MountedRootHandle): Promise<void> {
  if (!mountedRoots.has(handle)) {
    return;
  }
  mountedRoots.delete(handle);

  try {
    await act(async () => {
      handle.root.unmount();
      await flushMicrotasks();
    });
  } catch (error: unknown) {
    console.error("[domRegistry] Error unmounting React root:", error);
  } finally {
    try {
      handle.container.remove();
    } catch (error: unknown) {
      console.error("[domRegistry] Error removing container element:", error);
    }
  }
}

export async function cleanupDom(): Promise<void> {
  const handles = Array.from(mountedRoots);
  mountedRoots.clear();

  for (const handle of handles) {
    try {
      await act(async () => {
        handle.root.unmount();
        await flushMicrotasks();
      });
    } catch (error: unknown) {
      console.error("[domRegistry] Error unmounting root during cleanupDom:", error);
    } finally {
      try {
        handle.container.remove();
      } catch (error: unknown) {
        console.error("[domRegistry] Error removing container during cleanupDom:", error);
      }
    }
  }

  if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.clear === "function") {
    try {
      window.localStorage.clear();
    } catch {
      // ignore in environments where clear is restricted
    }
  }

  if (typeof document !== "undefined" && document.body) {
    document.body.innerHTML = "";
  }
}

export function getMountedRootsCount(): number {
  return mountedRoots.size;
}

import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { GlobalWindow } from "happy-dom";
import { TestProviders } from "./testProviders";

let activeRoot: Root | null = null;
let activeContainer: HTMLElement | null = null;

export function setupDomEnvironment() {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const win = new GlobalWindow({ url: "http://localhost:3000" });
  globalThis.window = win as any;
  globalThis.document = win.document as any;
  globalThis.navigator = win.navigator as any;
  globalThis.HTMLElement = win.HTMLElement as any;
  globalThis.HTMLInputElement = win.HTMLInputElement as any;
  globalThis.HTMLButtonElement = win.HTMLButtonElement as any;
  globalThis.HTMLSelectElement = win.HTMLSelectElement as any;
  globalThis.HTMLCanvasElement = win.HTMLCanvasElement as any;
  globalThis.HTMLImageElement = win.HTMLImageElement as any;
  globalThis.Image = win.Image as any;
  globalThis.Element = win.Element as any;
  globalThis.Node = win.Node as any;
  globalThis.Event = win.Event as any;
  globalThis.CustomEvent = win.CustomEvent as any;
  globalThis.MouseEvent = win.MouseEvent as any;
  globalThis.KeyboardEvent = win.KeyboardEvent as any;
  (globalThis as any).ErrorEvent = (win as any).ErrorEvent || globalThis.ErrorEvent;
  (globalThis as any).requestAnimationFrame = win.requestAnimationFrame.bind(win);
  (globalThis as any).cancelAnimationFrame = win.cancelAnimationFrame.bind(win);
  return win;
}

export async function renderIntoDom(ui: React.ReactElement) {
  if (typeof document === "undefined" || !document.body) {
    setupDomEnvironment();
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  activeContainer = container;

  const root = createRoot(container);
  activeRoot = root;

  await act(async () => {
    root.render(<TestProviders>{ui}</TestProviders>);
  });

  return {
    container,
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
      activeRoot = null;
      activeContainer = null;
    },
    click: async (element: Element) => {
      await act(async () => {
        element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      });
    },
    changeInput: async (input: HTMLInputElement, value: string) => {
      await act(async () => {
        input.value = value;
        const reactKey = Object.keys(input).find((k) => k.startsWith("__reactProps"));
        const props = reactKey ? (input as any)[reactKey] : null;
        if (props && typeof props.onChange === "function") {
          props.onChange({ target: input, currentTarget: input, bubbles: true });
        }
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    },
    changeSelect: async (select: HTMLSelectElement, value: string) => {
      await act(async () => {
        select.value = value;
        const reactKey = Object.keys(select).find((k) => k.startsWith("__reactProps"));
        const props = reactKey ? (select as any)[reactKey] : null;
        if (props && typeof props.onChange === "function") {
          props.onChange({ target: select, currentTarget: select, bubbles: true });
        }
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
    },
  };
}

export async function cleanupDom() {
  if (activeRoot) {
    await act(async () => {
      activeRoot?.unmount();
    });
    activeRoot = null;
  }
  if (activeContainer) {
    activeContainer.remove();
    activeContainer = null;
  }
  if (typeof document !== "undefined" && document.body) {
    document.body.innerHTML = "";
  }
}

export interface RenderHookResult<T, P> {
  result: { current: T };
  rerender: (newProps?: P) => Promise<void>;
  unmount: () => Promise<void>;
}

/**
 * Universal hook test runner for bun:test and happy-dom with act wrapping.
 */
export async function renderCustomHook<T, P = void>(
  hookCallback: (props: P) => T,
  initialProps?: P
): Promise<RenderHookResult<T, P>> {
  if (typeof document === "undefined" || !document.body) {
    setupDomEnvironment();
  }

  const result = { current: undefined as unknown as T };

  function TestHookComponent({ hookProps }: { hookProps: P }) {
    result.current = hookCallback(hookProps);
    return null;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(<TestHookComponent hookProps={initialProps as P} />);
  });

  return {
    result,
    rerender: async (newProps?: P) => {
      await act(async () => {
        root.render(<TestHookComponent hookProps={newProps !== undefined ? newProps : (initialProps as P)} />);
      });
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
}


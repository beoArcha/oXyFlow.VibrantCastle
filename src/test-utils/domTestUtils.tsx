import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { GlobalWindow } from "happy-dom";
import { TestProviders } from "./testProviders";
import { createMockContext2D } from "./mockCanvas";

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
  (globalThis as any).ResizeObserver =
    (win as any).ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  if (win.HTMLCanvasElement) {
    const origGetContext = (win.HTMLCanvasElement.prototype as any).getContext;
    (win.HTMLCanvasElement.prototype as any).getContext = function (type: string, ...args: any[]) {
      if (type === "2d") {
        return (
          (this as any)._mockCtx ||
          ((this as any)._mockCtx = createMockContext2D(
            (this as HTMLCanvasElement).width || 300,
            (this as HTMLCanvasElement).height || 150
          ))
        );
      }
      return origGetContext ? origGetContext.apply(this, [type, ...args]) : null;
    };
  }
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

export interface RenderHookOptions<P> {
  initialProps?: P;
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Universal hook test runner for bun:test and happy-dom with act wrapping and optional Provider wrapper.
 */
export async function renderCustomHook<T, P = void>(
  hookCallback: (props: P) => T,
  optionsOrProps?: RenderHookOptions<P> | P
): Promise<RenderHookResult<T, P>> {
  if (typeof document === "undefined" || !document.body) {
    setupDomEnvironment();
  }

  const isOptions =
    optionsOrProps !== null &&
    typeof optionsOrProps === "object" &&
    ("wrapper" in (optionsOrProps as object) || "initialProps" in (optionsOrProps as object));

  const wrapper = isOptions ? (optionsOrProps as RenderHookOptions<P>).wrapper : undefined;
  const initialProps = isOptions
    ? (optionsOrProps as RenderHookOptions<P>).initialProps
    : (optionsOrProps as P);

  const result = { current: undefined as unknown as T };

  function TestHookComponent({ hookProps }: { hookProps: P }) {
    result.current = hookCallback(hookProps);
    return null;
  }

  function renderTree(props: P) {
    const component = <TestHookComponent hookProps={props} />;
    if (wrapper) {
      const WrapperComponent = wrapper;
      return <WrapperComponent>{component}</WrapperComponent>;
    }
    return component;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(renderTree(initialProps as P));
  });

  return {
    result,
    rerender: async (newProps?: P) => {
      await act(async () => {
        root.render(renderTree(newProps !== undefined ? newProps : (initialProps as P)));
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


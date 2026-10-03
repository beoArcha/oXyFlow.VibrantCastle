import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { GlobalWindow } from "happy-dom";
import { TestProviders, UiTestProviders, IntegrationTestProviders } from "./testProviders";
import { createMockContext2D, MockContext2D } from "./mockCanvas";

export interface CanvasMockCarrier {
  _mockCtx?: MockContext2D;
}

export interface ImageMockCarrier {
  _src?: string;
}

export interface ReactPropsCarrier {
  [key: `__reactProps${string}`]: {
    onChange?: (e: { target: unknown; currentTarget: unknown; bubbles: boolean }) => void;
  } | undefined;
}

let activeRoot: Root | null = null;
let activeContainer: HTMLElement | null = null;

class MockFileReader {
  onload: ((e: { target: { result: string | ArrayBuffer | null } }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  readAsText(file: unknown) {
    if (file && typeof (file as { text?: unknown }).text === "function") {
      (file as { text: () => Promise<string> })
        .text()
        .then((text: string) => {
          this.onload?.({ target: { result: text } });
        })
        .catch((err: unknown) => {
          this.onerror?.(err);
        });
    } else {
      const triggerFileLoad = () => {
        this.onload?.({ target: { result: String(file) } });
      };
      if (typeof queueMicrotask === "function") {
        queueMicrotask(triggerFileLoad);
      } else {
        triggerFileLoad();
      }
    }
  }
}

export function setupDomEnvironment() {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const win = new GlobalWindow({ url: "http://localhost:3000" });
  const globalWin = win as unknown as Window & typeof globalThis;

  globalThis.window = globalWin;
  globalThis.document = globalWin.document;
  globalThis.navigator = globalWin.navigator;
  globalThis.HTMLElement = globalWin.HTMLElement;
  globalThis.HTMLInputElement = globalWin.HTMLInputElement;
  globalThis.HTMLButtonElement = globalWin.HTMLButtonElement;
  globalThis.HTMLSelectElement = globalWin.HTMLSelectElement;
  globalThis.HTMLCanvasElement = globalWin.HTMLCanvasElement;
  globalThis.HTMLImageElement = globalWin.HTMLImageElement;
  globalThis.Image = globalWin.Image;
  globalThis.Element = globalWin.Element;
  globalThis.Node = globalWin.Node;
  globalThis.Event = globalWin.Event;
  globalThis.CustomEvent = globalWin.CustomEvent;
  globalThis.MouseEvent = globalWin.MouseEvent;
  globalThis.KeyboardEvent = globalWin.KeyboardEvent;
  globalThis.FileReader = (globalThis.FileReader || MockFileReader) as unknown as typeof FileReader;
  globalThis.ErrorEvent = ((win as unknown as { ErrorEvent?: typeof ErrorEvent }).ErrorEvent || globalThis.ErrorEvent) as typeof ErrorEvent;
  globalThis.requestAnimationFrame = win.requestAnimationFrame.bind(win) as unknown as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = win.cancelAnimationFrame.bind(win) as unknown as typeof cancelAnimationFrame;
  globalThis.ResizeObserver =
    ((win as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver ||
      class {
        observe() { }
        unobserve() { }
        disconnect() { }
      }) as typeof ResizeObserver;

  if (win.HTMLCanvasElement) {
    const canvasProto = win.HTMLCanvasElement.prototype as unknown as HTMLCanvasElement & CanvasMockCarrier;
    const origGetContext = canvasProto.getContext;
    canvasProto.getContext = function (
      this: HTMLCanvasElement & CanvasMockCarrier,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "2d") {
        return (
          this._mockCtx ||
          (this._mockCtx = createMockContext2D(
            this.width || 300,
            this.height || 150
          ))
        ) as unknown as RenderingContext;
      }
      if (origGetContext) {
        return (origGetContext as unknown as (...a: unknown[]) => RenderingContext | null).apply(this, [type, ...args]);
      }
      return null;
    } as unknown as typeof canvasProto.getContext;
  }

  if (win.HTMLImageElement) {
    const imgProto = win.HTMLImageElement.prototype as unknown as HTMLImageElement & ImageMockCarrier;
    const origSrcDescriptor = Object.getOwnPropertyDescriptor(imgProto, "src");
    Object.defineProperty(imgProto, "src", {
      get(this: HTMLImageElement & ImageMockCarrier) {
        return origSrcDescriptor?.get ? origSrcDescriptor.get.call(this) : (this._src ?? "");
      },
      set(this: HTMLImageElement & ImageMockCarrier, value: string) {
        if (origSrcDescriptor?.set) {
          origSrcDescriptor.set.call(this, value);
        } else {
          this._src = value;
        }
        try {
          Object.defineProperty(this, "complete", { value: true, configurable: true });
          Object.defineProperty(this, "naturalWidth", { value: 100, configurable: true });
          Object.defineProperty(this, "naturalHeight", { value: 100, configurable: true });
        } catch {
          // ignore if already defined
        }
        const triggerLoad = () => {
          try {
            if (typeof this.onload === "function") {
              this.onload(new Event("load"));
            }
            this.dispatchEvent(new Event("load"));
          } catch {
            // Ignore load dispatch errors in mock test environment
          }
        };

        if (typeof queueMicrotask === "function") {
          queueMicrotask(triggerLoad);
        } else {
          triggerLoad();
        }
      },
      configurable: true,
      enumerable: true,
    });
  }
  return win;
}

export type TestProviderMode = "ui" | "integration" | "none";

export interface RenderIntoDomOptions {
  wrapper?: React.ComponentType<{ children: React.ReactNode }> | null;
  mode?: TestProviderMode;
}

export async function renderIntoDom(ui: React.ReactElement, options?: RenderIntoDomOptions) {
  if (typeof document === "undefined" || !document.body) {
    setupDomEnvironment();
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  activeContainer = container;

  const root = createRoot(container);
  activeRoot = root;

  let Wrapper: React.ComponentType<{ children: React.ReactNode }> | null;
  if (options?.wrapper !== undefined) {
    Wrapper = options.wrapper;
  } else if (options?.mode === "ui") {
    Wrapper = UiTestProviders;
  } else if (options?.mode === "none") {
    Wrapper = null;
  } else {
    Wrapper = TestProviders;
  }

  await act(async () => {
    root.render(Wrapper ? <Wrapper>{ui}</Wrapper> : ui);
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
    keyDown: async (element: Element, key: string, eventInit?: KeyboardEventInit) => {
      await act(async () => {
        element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...eventInit }));
      });
    },
    changeInput: async (input: HTMLInputElement, value: string) => {
      await act(async () => {
        input.value = value;
        const carrier = input as unknown as ReactPropsCarrier;
        const reactKey = Object.keys(carrier).find((k) => k.startsWith("__reactProps")) as
          | `__reactProps${string}`
          | undefined;
        const props = reactKey ? carrier[reactKey] : undefined;
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
        const carrier = select as unknown as ReactPropsCarrier;
        const reactKey = Object.keys(carrier).find((k) => k.startsWith("__reactProps")) as
          | `__reactProps${string}`
          | undefined;
        const props = reactKey ? carrier[reactKey] : undefined;
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
  wrapper?: React.ComponentType<{ children: React.ReactNode }> | null;
  mode?: TestProviderMode;
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
    ("wrapper" in (optionsOrProps as object) || "initialProps" in (optionsOrProps as object) || "mode" in (optionsOrProps as object));

  let wrapper: React.ComponentType<{ children: React.ReactNode }> | null | undefined = undefined;
  if (isOptions) {
    const opts = optionsOrProps as RenderHookOptions<P>;
    if (opts.wrapper !== undefined) {
      wrapper = opts.wrapper;
    } else if (opts.mode === "ui") {
      wrapper = UiTestProviders;
    } else if (opts.mode === "integration") {
      wrapper = IntegrationTestProviders;
    }
  }

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

/**
 * Executes a synchronous or asynchronous callback while temporarily intercepting and muting
 * console methods (default: error and warn). Useful for negative tests expecting thrown errors.
 */
export async function withSilencedConsole<T>(
  callback: () => Promise<T> | T,
  levels: Array<"error" | "warn" | "info" | "log"> = ["error", "warn"]
): Promise<T> {
  const originals: Partial<Record<"error" | "warn" | "info" | "log", (...args: unknown[]) => void>> = {};

  for (const level of levels) {
    originals[level] = console[level];
    console[level] = () => {};
  }

  try {
    return await callback();
  } finally {
    for (const level of levels) {
      const original = originals[level];
      if (original) {
        console[level] = original;
      }
    }
  }
}

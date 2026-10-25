import { GlobalWindow } from "happy-dom";
import { createMockContext2D } from "../mockCanvas";
import type { CanvasMockCarrier, ImageMockCarrier } from "./domTypes";

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
          if (this.onerror) {
            this.onerror(err);
          } else {
            console.error("[domEnvironment:MockFileReader] Unhandled file reading error:", err);
          }
        });
      return;
    }

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

function patchCanvasPrototype(win: GlobalWindow) {
  if (!win.HTMLCanvasElement) return;
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
        (this._mockCtx = createMockContext2D(this.width || 300, this.height || 150))
      ) as unknown as RenderingContext;
    }
    if (origGetContext) {
      try {
        return (origGetContext as unknown as (...a: unknown[]) => RenderingContext | null).apply(this, [type, ...args]);
      } catch (error: unknown) {
        console.error("[domEnvironment:HTMLCanvasElement] Failed to call original getContext:", error);
        return null;
      }
    }
    return null;
  } as unknown as typeof canvasProto.getContext;
}

function patchImagePrototype(win: GlobalWindow) {
  if (!win.HTMLImageElement) return;
  const imgProto = win.HTMLImageElement.prototype as unknown as HTMLImageElement & ImageMockCarrier;
  const origSrcDescriptor = Object.getOwnPropertyDescriptor(imgProto, "src");

  Object.defineProperty(imgProto, "src", {
    get(this: HTMLImageElement & ImageMockCarrier) {
      return this._src ?? (origSrcDescriptor?.get ? origSrcDescriptor.get.call(this) : "");
    },
    set(this: HTMLImageElement & ImageMockCarrier, value: string) {
      this._src = value;
      try {
        Object.defineProperty(this, "complete", { value: true, configurable: true });
        Object.defineProperty(this, "naturalWidth", { value: 100, configurable: true });
        Object.defineProperty(this, "naturalHeight", { value: 100, configurable: true });
      } catch (error: unknown) {
        console.warn("[domEnvironment:HTMLImageElement] Failed to define Image dimensions properties:", error);
      }

      const triggerLoad = () => {
        try {
          if (typeof this.onload === "function") {
            this.onload(new Event("load"));
          }
          this.dispatchEvent(new Event("load"));
        } catch (error: unknown) {
          console.error("[domEnvironment:HTMLImageElement] Error in load event listener or dispatch:", error);
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

export function setupDomEnvironment(): GlobalWindow {
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
  globalThis.getComputedStyle = globalWin.getComputedStyle.bind(globalWin);
  globalThis.MutationObserver = globalWin.MutationObserver;
  globalThis.requestAnimationFrame = win.requestAnimationFrame.bind(win) as unknown as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = win.cancelAnimationFrame.bind(win) as unknown as typeof cancelAnimationFrame;
  globalThis.ResizeObserver =
    ((win as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver ||
      class {
        observe() { }
        unobserve() { }
        disconnect() { }
      }) as typeof ResizeObserver;

  patchCanvasPrototype(win);
  patchImagePrototype(win);

  return win;
}

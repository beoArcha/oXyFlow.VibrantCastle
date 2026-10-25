import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { setupDomEnvironment } from "./domEnvironment";
import { registerRoot, unmountRoot, flushMicrotasks } from "./domRegistry";
import { resolveTestProvider } from "./providerResolver";
import { dispatchClick, dispatchKeyDown, dispatchInputChange, dispatchSelectChange } from "./domInteraction";
import type { RenderIntoDomOptions } from "./domTypes";

export interface RenderIntoDomResult {
  container: HTMLElement;
  unmount: () => Promise<void>;
  click: (element: Element) => Promise<void>;
  keyDown: (element: Element, key: string, eventInit?: KeyboardEventInit) => Promise<void>;
  changeInput: (input: HTMLInputElement | HTMLTextAreaElement, value: string) => Promise<void>;
  changeSelect: (select: HTMLSelectElement, value: string) => Promise<void>;
}

export async function renderIntoDom(
  ui: React.ReactElement,
  options?: RenderIntoDomOptions
): Promise<RenderIntoDomResult> {
  if (typeof document === "undefined" || !document.body) {
    setupDomEnvironment();
  }

  const container = document.createElement("div");
  document.body.appendChild(container);

  const root = createRoot(container);
  const handle = registerRoot(root, container);

  const Wrapper = resolveTestProvider(options?.mode, options?.wrapper);

  await act(async () => {
    root.render(Wrapper ? <Wrapper>{ui}</Wrapper> : ui);
    await flushMicrotasks();
  });

  return {
    container,
    unmount: () => unmountRoot(handle),
    click: dispatchClick,
    keyDown: dispatchKeyDown,
    changeInput: dispatchInputChange,
    changeSelect: dispatchSelectChange,
  };
}

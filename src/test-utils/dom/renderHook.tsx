import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { setupDomEnvironment } from "./domEnvironment";
import { registerRoot, unmountRoot, flushMicrotasks } from "./domRegistry";
import { resolveTestProvider } from "./providerResolver";
import type { RenderHookOptions, RenderHookResult } from "./domTypes";

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
    ("wrapper" in (optionsOrProps as object) ||
      "initialProps" in (optionsOrProps as object) ||
      "mode" in (optionsOrProps as object));

  const options = isOptions ? (optionsOrProps as RenderHookOptions<P>) : undefined;
  const initialProps = isOptions ? options?.initialProps : (optionsOrProps as P);

  const Wrapper = resolveTestProvider(options?.mode, options?.wrapper);
  const result = { current: undefined as unknown as T };

  function TestHookComponent({ hookProps }: { hookProps: P }) {
    result.current = hookCallback(hookProps);
    return null;
  }

  function renderTree(props: P) {
    const component = <TestHookComponent hookProps={props} />;
    if (Wrapper) {
      return <Wrapper>{component}</Wrapper>;
    }
    return component;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const handle = registerRoot(root, container);

  await act(async () => {
    root.render(renderTree(initialProps as P));
    await flushMicrotasks();
  });

  return {
    result,
    rerender: async (newProps?: P) => {
      await act(async () => {
        root.render(renderTree(newProps !== undefined ? newProps : (initialProps as P)));
        await flushMicrotasks();
      });
    },
    unmount: () => unmountRoot(handle),
  };
}
